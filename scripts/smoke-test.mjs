const rawUrl = process.argv[2]
if (!rawUrl) {
  console.error('Usage: node scripts/smoke-test.mjs <deployment-url>')
  process.exit(2)
}

let baseUrl
try {
  baseUrl = new URL(rawUrl)
  if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error()
} catch {
  console.error('Smoke-test URL must be a valid HTTP or HTTPS URL.')
  process.exit(2)
}

const deadline = Date.now() + 60_000
const expectedHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function verify() {
  const pageUrl = new URL('/', baseUrl)
  const response = await fetch(pageUrl, { redirect: 'follow', signal: AbortSignal.timeout(10_000) })
  if (response.status !== 200) throw new Error(`homepage returned HTTP ${response.status}`)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('text/html')) throw new Error(`homepage content type is ${contentType || 'missing'}, expected HTML`)

  const html = await response.text()
  if (!html.includes('Notification Apocalypse')) throw new Error('homepage does not contain the application title')

  for (const [name, expected] of Object.entries(expectedHeaders)) {
    const actual = response.headers.get(name)
    if (!actual || actual.toLowerCase() !== expected.toLowerCase()) throw new Error(`${name} security header is missing or invalid`)
  }

  const scriptMatch = html.match(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/i)
  if (!scriptMatch?.[1]) throw new Error('homepage does not reference a JavaScript asset')
  const assetUrl = new URL(scriptMatch[1], response.url)
  const assetResponse = await fetch(assetUrl, { redirect: 'follow', signal: AbortSignal.timeout(10_000) })
  if (assetResponse.status !== 200) throw new Error(`main JavaScript asset returned HTTP ${assetResponse.status}`)
}

let attempt = 0
let lastError
while (Date.now() < deadline) {
  attempt += 1
  try {
    await verify()
    console.log(`Smoke test passed for ${baseUrl.origin} after ${attempt} attempt${attempt === 1 ? '' : 's'}.`)
    process.exit(0)
  } catch (error) {
    lastError = error
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    await sleep(Math.min(1_000 * 2 ** Math.min(attempt - 1, 3), remaining))
  }
}

console.error(`Smoke test failed for ${baseUrl.origin}: ${lastError instanceof Error ? lastError.message : 'unknown error'}`)
process.exit(1)
