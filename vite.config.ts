import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import svgr from 'vite-plugin-svgr'

export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd())

  return defineConfig({
    base: '/',
    plugins: [
      react(),
      svgr({
        include: ['src/**/*.svg']
      })
    ],
    resolve: {
      alias: {
        '@': '/src'
      }
    },
    server: {
      open: true,
      port: parseInt(env.VITE_PORT || '5173'),
      fs: {
        strict: true,
        allow: ['..']
      }
    },
    build: {
      outDir: 'build'
    },
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        loader: {
          '.js': 'jsx'
        }
      }
    },
    assetsInclude: ['**/*.svg']
  })
}
