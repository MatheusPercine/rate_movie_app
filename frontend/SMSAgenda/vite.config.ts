import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Encaminha chamadas do front (http://localhost:5173) para o backend hospedado (http://devcac:6011)
      // Evita erro de CORS em desenvolvimento sem precisar alterar o backend imediatamente.
      '/api': {
        target: 'http://devcac:6011',
        changeOrigin: true,
        // se o backend não exige path rewrite, mantém como está
      },
    },
  },
})