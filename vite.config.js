// vite.config.js (or .ts)
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Crucial: import the 'path' module

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
