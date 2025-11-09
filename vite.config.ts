import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: true, 
    port: parseInt(process.env.PORT ?? '4173', 10),
    allowedHosts: ['capcoder-frontend.onrender.com'],
  },
});