import { spawn } from 'node:child_process'

const CDP_PORT = 9234
const PORT = 3422
const CHROME = '/usr/bin/google-chrome'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

let chrome = null

async function main() {
  chrome = spawn(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--disable-extensions', '--mute-audio', '--no-first-run',
    `--remote-debugging-port=${CDP_PORT}`,
    'about:blank',
  ], { stdio: 'pipe' })
  chrome.stderr.on('data', () => {})

  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json`); if (r.ok) break } catch {}
    await sleep(300)
  }

  const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json()
  const page = targets.find(t => t.type === 'page')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let msgId = 0
  const pending = new Map()
  const events = []

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const t = msg.params.type
      if (t === 'error' || t === 'warning') {
        events.push(`[${t}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '))
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      events.push('[EXCEPTION] ' + (msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text))
    }
  }

  await new Promise(r => { ws.onopen = r })

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++msgId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`timeout: ${method}`)) }, 15000)
    pending.set(id, (r) => { clearTimeout(timer); resolve(r) })
    ws.send(JSON.stringify({ id, method, params }))
  })

  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
    if (r.result?.exceptionDetails) {
      return { __error: r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text }
    }
    return r.result?.result?.value
  }

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })

  await send('Page.navigate', { url: `http://localhost:${PORT}/universe/anime` })
  await sleep(3000)

  // Step 1: Bypass the BootLoader by programmatically setting isBooting = false
  // The BootLoader progress runs automatically, but we need to click "Enter the Space" or skip it entirely
  // Strategy: Wait for the boot sequence, then find and click the enter button
  
  console.log('--- Step 1: Wait for BootLoader to reach intro stage ---')
  
  // Wait up to 15s for boot sequence to complete and show the "Enter the Space" button
  for (let i = 0; i < 30; i++) {
    const hasButton = await evalJs(`!!document.querySelector('button')?.textContent?.includes?.('Enter')`)
    if (hasButton) {
      console.log(`  Found "Enter" button after ${i * 500}ms`)
      break
    }
    await sleep(500)
  }

  // Click "Enter the Space" button
  const clicked = await evalJs(`
    (() => {
      const buttons = [...document.querySelectorAll('button')]
      const enterBtn = buttons.find(b => b.textContent.includes('Enter'))
      if (enterBtn) {
        enterBtn.click()
        return 'clicked'
      }
      return 'not found'
    })()
  `)
  console.log(`  Click result: ${clicked}`)

  // Wait for BootLoader exit animation + app mount
  await sleep(3000)

  console.log('--- Step 2: Check anime page DOM ---')
  const diag = await evalJs(`
    (() => {
      const env = document.querySelector('.anime-stage-env')
      const carousel = document.querySelector('[data-prism-phase]')
      const main = document.querySelector('main.app-root')
      const stageEl = document.querySelector('[style*="--env-blur"]')

      return {
        url: location.href,
        title: document.title,
        hasMain: !!main,
        hasEnvLayer: !!env,
        hasCarousel: !!carousel,
        hasStageWithVars: !!stageEl,
        prismCardCount: document.querySelectorAll('.prism-card').length,
        carouselPhase: carousel?.getAttribute('data-prism-phase') ?? null,
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        envStyle: env ? {
          backdropFilter: getComputedStyle(env).backdropFilter || getComputedStyle(env).webkitBackdropFilter,
          backgroundColor: getComputedStyle(env).backgroundColor,
        } : null,
        stageVars: stageEl ? {
          blur: getComputedStyle(stageEl).getPropertyValue('--env-blur'),
          brightness: getComputedStyle(stageEl).getPropertyValue('--env-brightness'),
          overlay: getComputedStyle(stageEl).getPropertyValue('--env-overlay'),
          carouselScale: getComputedStyle(stageEl).getPropertyValue('--carousel-scale'),
          readingOpacity: getComputedStyle(stageEl).getPropertyValue('--reading-opacity'),
        } : null,
        readingFocusPresent: !!document.querySelector('.tx-reading-focus'),
      }
    })()
  `)
  console.log(JSON.stringify(diag, null, 2))

  if (diag.hasEnvLayer && diag.hasCarousel) {
    console.log('\n--- Step 3: Scroll transition test ---')

    // Test at 40% scroll
    const mid = await evalJs(`
      (() => {
        window.scrollTo(0, Math.round(window.innerHeight * 0.4))
        return new Promise(resolve => setTimeout(() => {
          const stage = document.querySelector('[style*="--env-blur"]')
          if (!stage) return resolve(null)
          const cs = getComputedStyle(stage)
          resolve({
            scrollY: window.scrollY,
            blur: cs.getPropertyValue('--env-blur'),
            brightness: cs.getPropertyValue('--env-brightness'),
            overlay: cs.getPropertyValue('--env-overlay'),
            carouselScale: cs.getPropertyValue('--carousel-scale'),
            carouselOpacity: cs.getPropertyValue('--carousel-opacity'),
            readingOpacity: cs.getPropertyValue('--reading-opacity'),
            phase: document.querySelector('[data-prism-phase]')?.getAttribute('data-prism-phase'),
          })
        }, 200))
      })()
    `)
    console.log('At 40% scroll:', JSON.stringify(mid, null, 2))

    // Test at 100% scroll (full reading)
    const full = await evalJs(`
      (() => {
        window.scrollTo(0, window.innerHeight)
        return new Promise(resolve => setTimeout(() => {
          const stage = document.querySelector('[style*="--env-blur"]')
          if (!stage) return resolve(null)
          const cs = getComputedStyle(stage)
          resolve({
            scrollY: window.scrollY,
            blur: cs.getPropertyValue('--env-blur'),
            brightness: cs.getPropertyValue('--env-brightness'),
            overlay: cs.getPropertyValue('--env-overlay'),
            carouselScale: cs.getPropertyValue('--carousel-scale'),
            carouselOpacity: cs.getPropertyValue('--carousel-opacity'),
            readingOpacity: cs.getPropertyValue('--reading-opacity'),
            readingTY: cs.getPropertyValue('--reading-ty'),
            phase: document.querySelector('[data-prism-phase]')?.getAttribute('data-prism-phase'),
            pointerEvents: getComputedStyle(document.querySelector('[data-prism-phase]')).pointerEvents,
          })
        }, 200))
      })()
    `)
    console.log('At 100% scroll:', JSON.stringify(full, null, 2))
  }

  // Reduced motion test
  console.log('\n--- Step 4: Reduced motion ---')
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  await sleep(500)
  const rm = await evalJs(`
    (() => {
      const env = document.querySelector('.anime-stage-env')
      return {
        matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        envFilter: env ? (getComputedStyle(env).backdropFilter || getComputedStyle(env).webkitBackdropFilter) : null,
      }
    })()
  `)
  console.log('Reduced motion:', JSON.stringify(rm, null, 2))

  console.log('\nConsole events:', events.length ? events : 'none')
  ws.close()
}

main()
  .catch((err) => { console.error('FATAL', err.message); process.exitCode = 1 })
  .finally(async () => {
    if (chrome) chrome.kill('SIGKILL')
    await sleep(500)
  })
