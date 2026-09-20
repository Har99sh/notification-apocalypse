import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const host = process.env.PREVIEW_HOST ?? '127.0.0.1'
const port = Number(process.env.PREVIEW_PORT ?? 3000)
const root = join(process.cwd(), '.output', 'public')
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

try {
  if (!(await stat(join(root, 'index.html'))).isFile()) throw new Error()
} catch {
  console.error('Static preview requires .output/public/index.html. Run `npm run generate` first.')
  process.exit(1)
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method ?? '')) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }

  const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${host}`).pathname)
  const relativePath = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '')
  let filePath = join(root, relativePath || 'index.html')

  try {
    const fileStats = await stat(filePath)
    if (fileStats.isDirectory()) filePath = join(filePath, 'index.html')
    if (!(await stat(filePath)).isFile()) throw new Error()
  } catch {
    filePath = join(root, 'index.html')
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
  })
  if (request.method === 'HEAD') response.end()
  else createReadStream(filePath).pipe(response)
})

server.listen(port, host, () => console.log(`Static preview listening at http://${host}:${port}`))

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
