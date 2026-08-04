import { spawn } from 'node:child_process'

const CDP_PORT = 9231
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

  // Wait for CDP
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json`)
      if (r.ok) break
    } catch {}
    await sleep(300)
  }

  const targets = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json`)).json()
  const page = targets.find(t => t.type === 'page')
  if (!page) throw new Error('no page target')

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let msgId = 0
  const pending = new Map()
  const consoleEvents = []

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const t = msg.params.type
      if (t === 'error' || t === 'warning') {
        consoleEvents.push(`[${t}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '))
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleEvents.push('[exception] ' + (msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text))
    } else if (msg.method === 'Page.loadEventFired') {
      // noop
    }
  }

  await new Promise((resolve) => { ws.onopen = resolve })

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

  // Navigate
  await send('Page.navigate', { url: `http://localhost:${PORT}/universe/anime` })
  await sleep(6000) // Let hydration + API calls settle

  // Diagnostic: check DOM state
  const diag = await evalJs(`
    (() => {
      const env = document.querySelector('.anime-stage-env')
      const carousel = document.querySelector('[data-prism-phase]')
      const prismCards = document.querySelectorAll('.prism-card')
      const readingFocus = document.querySelector('.tx-reading-focus')
      const stageEl = document.querySelector('[style*="--env-blur"]')
      
      return {
        url: location.href,
        title: document.title,
        bodyLen: document.body.innerHTML.length,
        bodyFirstChars: document.body.innerHTML.slice(0, 800),
        hasEnvLayer: !!env,
        hasCarousel: !!carousel,
        prismCardCount: prismCards.length,
        hasReadingFocus: !!readingFocus,
        hasStageWithVars: !!stageEl,
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        // Check if any divs with aria-hidden exist (env layer candidates)
        ariaHiddenDivs: [...document.querySelectorAll('div[aria-hidden]')].map(d => ({
          className: d.className,
          id: d.id,
          firstStyle: d.getAttribute('style')?.slice(0, 200)
        })).slice(0, 5),
        // Check all data-* attributes on the page
        dataAttrs: [...document.querySelectorAll('[data-prism-phase], [data-phase], [data-scroll]')].map(d => ({
          tag: d.tagName,
          attrs: [...d.attributes].filter(a => a.name.startsWith('data-')).map(a => a.name + '=' + a.value)
        })).slice(0, 5),
        // Check for Next.js hydration markers
        hasNext: !!document.getElementById('__next'),
        hasNextData: !!document.getElementById('__NEXT_DATA__'),
        // Error state — checked server-side
      }
    })()
  `)

  console.log(JSON.stringify({ diag, consoleEvents }, null, 2))
  ws.close()
}

main()
  .catch((err) => { console.error('FATAL', err.message); process.exitCode = 1 })
  .finally(async () => {
    if (chrome) chrome.kill('SIGKILL')
    await sleep(500)
  })
