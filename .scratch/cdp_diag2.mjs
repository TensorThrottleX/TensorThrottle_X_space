import { spawn } from 'node:child_process'

const CDP_PORT = 9232
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
      consoleEvents.push(`[console.${msg.params.type}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '))
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleEvents.push('[EXCEPTION] ' + (msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text ?? JSON.stringify(msg.params.exceptionDetails)))
    } else if (msg.method === 'Log.entryAdded') {
      consoleEvents.push(`[log.${msg.params.entry.level}] ${msg.params.entry.text} | ${msg.params.entry.url ?? ''}`)
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

  // Enable EVERYTHING before navigation
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })

  // Navigate
  await send('Page.navigate', { url: `http://localhost:${PORT}/universe/anime` })
  await sleep(8000) // extra time for hydration

  // Check DOM state
  const diag = await evalJs(`
    (() => {
      const env = document.querySelector('.anime-stage-env')
      const carousel = document.querySelector('[data-prism-phase]')
      
      // Dig into the main element for content
      const main = document.querySelector('main.app-root')
      const mainChildCount = main ? main.children.length : -1
      const mainHTML = main ? main.innerHTML.slice(0, 1500) : 'NO MAIN'
      
      // Check for error boundaries or Next.js error UI
      const errorBoundary = document.querySelector('[data-nextjs-error]') || 
                            document.querySelector('.nextjs-container-errors-header')
      
      return {
        url: location.href,
        title: document.title,
        bodyLen: document.body.innerHTML.length,
        hasEnvLayer: !!env,
        hasCarousel: !!carousel,
        scrollHeight: document.documentElement.scrollHeight,
        mainChildCount,
        mainHTML,
        hasErrorBoundary: !!errorBoundary,
        // Check all script tags and their load state
        scriptCount: document.querySelectorAll('script[src]').length,
        // Check if React root exists
        reactRootInfo: (() => {
          const root = document.querySelector('[data-reactroot]') || document.querySelector('#__next')
          return root ? { tag: root.tagName, id: root.id, childCount: root.children.length } : null
        })(),
      }
    })()
  `)

  console.log(JSON.stringify({ diag, consoleEvents: consoleEvents.slice(0, 40) }, null, 2))
  ws.close()
}

main()
  .catch((err) => { console.error('FATAL', err.message); process.exitCode = 1 })
  .finally(async () => {
    if (chrome) chrome.kill('SIGKILL')
    await sleep(500)
  })
