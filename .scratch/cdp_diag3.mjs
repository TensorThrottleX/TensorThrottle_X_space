import { spawn } from 'node:child_process'

const CDP_PORT = 9233
const PORT = 3000
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
  const allEvents = []

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      allEvents.push(`[console.${msg.params.type}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '))
    } else if (msg.method === 'Runtime.exceptionThrown') {
      allEvents.push('[EXCEPTION] ' + (msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text))
    } else if (msg.method === 'Log.entryAdded') {
      allEvents.push(`[log.${msg.params.entry.level}] ${msg.params.entry.text}`)
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

  await send('Page.navigate', { url: `http://localhost:${PORT}/universe/anime` })
  await sleep(10000)

  const diag = await evalJs(`
    (() => {
      // Walk the direct body children
      const bodyChildren = [...document.body.children].map((c, i) => ({
        idx: i,
        tag: c.tagName,
        className: c.className?.slice?.(0, 100) || '',
        id: c.id,
        childCount: c.children.length,
        textLen: c.textContent?.length ?? 0,
        firstHTML: c.innerHTML?.slice(0, 300) || '',
      }))

      // Check if there's a deeply nested main
      const allMains = document.querySelectorAll('main')
      const mainInfo = [...allMains].map(m => ({
        className: m.className,
        childCount: m.children.length,
        innerHTMLLen: m.innerHTML.length,
        firstHTML: m.innerHTML.slice(0, 500),
      }))

      // Check for anime-specific elements anywhere
      const animeSpecific = {
        stageEnv: !!document.querySelector('.anime-stage-env'),
        prismPhase: !!document.querySelector('[data-prism-phase]'),
        prismCard: !!document.querySelector('.prism-card'),
        prismWrapper: !!document.querySelector('.prism-wrapper'),
        readingFocus: !!document.querySelector('.tx-reading-focus'),
        // Check for any element with env-blur style
        envBlurStyle: !!document.querySelector('[style*="env-blur"]'),
      }
      
      // Check if window.__NEXT_DATA__ exists (Pages Router) vs RSC
      const nextInfo = {
        hasNextData: typeof window.__NEXT_DATA__ !== 'undefined',
        hasNextHydrated: typeof window.__next_f !== 'undefined',
        nextFLength: Array.isArray(window.__next_f) ? window.__next_f.length : -1,
      }

      return { bodyChildCount: bodyChildren.length, bodyChildren, mainInfo, animeSpecific, nextInfo }
    })()
  `)

  console.log(JSON.stringify({ diag, events: allEvents.slice(0, 30) }, null, 2))
  ws.close()
}

main()
  .catch((err) => { console.error('FATAL', err.message); process.exitCode = 1 })
  .finally(async () => {
    if (chrome) chrome.kill('SIGKILL')
    await sleep(500)
  })
