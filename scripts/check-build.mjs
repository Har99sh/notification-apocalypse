import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

const outputDirectory = join(process.cwd(), '.output', 'public')
const maximumAssetBytes = 5 * 1024 * 1024
const forbiddenSecretMarkers = [
  'sk-proj-',
  'sk-live-',
  'CLOUDFLARE_API_TOKEN=',
  'CLOUDFLARE_ACCOUNT_ID=',
  'CF_API_TOKEN=',
]

async function filesWithin(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesWithin(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

let outputStats
try {
  outputStats = await stat(outputDirectory)
} catch {
  throw new Error('Static output is missing. Run `npm run generate` first.')
}

if (!outputStats.isDirectory()) throw new Error('.output/public is not a directory.')

const indexPath = join(outputDirectory, 'index.html')
try {
  const indexStats = await stat(indexPath)
  if (!indexStats.isFile()) throw new Error()
} catch {
  throw new Error('Static output is invalid: .output/public/index.html is missing.')
}

const files = await filesWithin(outputDirectory)
const oversized = []
const leakedMarkers = []

for (const file of files) {
  const fileStats = await stat(file)
  const displayPath = relative(process.cwd(), file)
  if (fileStats.size > maximumAssetBytes) oversized.push(`${displayPath} (${(fileStats.size / 1024 / 1024).toFixed(2)} MiB)`)

  const contents = await readFile(file)
  const text = contents.toString('utf8')
  for (const marker of forbiddenSecretMarkers) {
    if (text.includes(marker)) leakedMarkers.push(`${displayPath}: ${marker}`)
  }
}

if (oversized.length) throw new Error(`Unexpected assets exceed 5 MiB:\n${oversized.join('\n')}`)
if (leakedMarkers.length) throw new Error(`Potential secret markers found in generated output:\n${leakedMarkers.join('\n')}`)

console.log(`Static build integrity verified: ${files.length} files, index.html present, no oversized assets or secret markers.`)
