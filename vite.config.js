import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { ZipArchive } from 'archiver'

// Absolute path to the canonical extension source (single source of truth).
const EXTENSION_DIR = fileURLToPath(new URL('./extention/src', import.meta.url))

// Stream a fresh ZIP of the extension source to an HTTP response.
function serveExtensionZip(res) {
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', 'attachment; filename="amanguard-extension.zip"')
  const archive = new ZipArchive({ zlib: { level: 9 } })
  archive.on('error', () => { res.statusCode = 500; res.end() })
  archive.pipe(res)
  archive.directory(EXTENSION_DIR, false)
  archive.finalize()
}

// Build the ZIP into an in-memory Buffer (for the static build output).
function zipExtensionToBuffer() {
  return new Promise((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } })
    const chunks = []
    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))
    archive.directory(EXTENSION_DIR, false)
    archive.finalize()
  })
}

// Serves the browser extension as a ZIP at GET /extension-download.
// - dev (`vite`) + preview (`vite preview`): a middleware zips extention/src on demand.
// - build (`vite build`): the same ZIP is emitted as the static file `extension-download`
//   at the dist root, so any static host (e.g. nginx) resolves /extension-download too.
function extensionDownload() {
  return {
    name: 'amanguard-extension-download',
    configureServer(server) {
      server.middlewares.use('/extension-download', (req, res) => serveExtensionZip(res))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/extension-download', (req, res) => serveExtensionZip(res))
    },
    async generateBundle() {
      const source = await zipExtensionToBuffer()
      this.emitFile({ type: 'asset', fileName: 'extension-download', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    extensionDownload(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
