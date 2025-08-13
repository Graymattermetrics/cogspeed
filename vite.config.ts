import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths' 

// https://vite.dev/config/
export default defineConfig({
  // Add tsconfigPaths() to automatically handle path aliases from tsconfig.json
  // Add tailwindcss() which is the correct plugin for Tailwind CSS v4
  plugins: [tsconfigPaths(), react(), tailwindcss()],
})