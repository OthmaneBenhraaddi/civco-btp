import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function preserveSanctumHeaders(proxy) {
  proxy.on('proxyReq', (proxyReq, req) => {
    const host = req.headers.host ?? 'localhost:5173'

    if (!proxyReq.getHeader('origin')) {
      proxyReq.setHeader('origin', `http://${host}`)
    }

    if (!proxyReq.getHeader('referer')) {
      proxyReq.setHeader('referer', `http://${host}/`)
    }
  })
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        configure: preserveSanctumHeaders,
      },
      '/sanctum': {
        target: 'http://127.0.0.1:8000',
        configure: preserveSanctumHeaders,
      },
    },
  },
})
