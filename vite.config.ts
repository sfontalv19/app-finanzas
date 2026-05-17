import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Para activar PWA:
// 1. Instalar: npm install -D vite-plugin-pwa
// 2. Reemplazar este archivo con el contenido en src/lib/vite.config.pwa.txt (creado más abajo)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
