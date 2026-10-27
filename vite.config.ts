import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served from https://5tanv.github.io/Capiture/ on GitHub Pages.
  base: '/Capiture/',
  plugins: [react(), tailwindcss()],
})
