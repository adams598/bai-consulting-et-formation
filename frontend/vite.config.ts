import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isIntranet = mode === 'intranet'
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      __ENVIRONMENT__: JSON.stringify(mode),
      __IS_INTRANET__: JSON.stringify(isIntranet),
      __IS_PRODUCTION__: JSON.stringify(isProduction),
    },
    build: {
      outDir: isIntranet ? 'dist-admin' : 'dist-formation',
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['lucide-react'],
          },
        },
      },
    },
    server: {
      port: 3001,
      host: true,
    },
    preview: {
      port: 3001,
      host: true,
    },
  }
})
