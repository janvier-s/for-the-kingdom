// export-src-to-json.js
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current file and directory (needed in ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Update this to your actual source folder
const SRC_DIR = '/Users/Janvier/Development/for-the-kingdom/kingdom-deliverance/src'
const OUTPUT_FILE = path.join(__dirname, 'src_export.json')

async function walkDir(dir) {
  const result = {}
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result[entry.name] = await walkDir(fullPath)
    } else if (entry.isFile()) {
      result[entry.name] = await fs.readFile(fullPath, 'utf-8')
    }
  }

  return result
}

try {
  const exportData = await walkDir(SRC_DIR)
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(exportData, null, 2), 'utf-8')
  console.log(`✅ Exported to ${OUTPUT_FILE}`)
} catch (err) {
  console.error('❌ Error:', err)
}
