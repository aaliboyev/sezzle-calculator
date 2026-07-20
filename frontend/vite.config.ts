/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '..', '')
  if (command === 'serve') {
    for (const key of ['BACKEND_HOST', 'BACKEND_PORT', 'FRONTEND_PORT']) {
      if (!env[key]) throw new Error(`${key} is not set (see .env.example)`)
    }
  }

  return {
    plugins: [react()],
    build: {
      // MathLive and the compute engine are large by nature; splitting them
      // keeps app-code changes from invalidating the big vendor chunks.
      chunkSizeWarningLimit: 2000,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'compute-engine', test: /node_modules[/\\]@cortex-js/ },
              { name: 'mathlive', test: /node_modules[/\\]mathlive/ },
            ],
          },
        },
      },
    },
    server: {
      port: Number(env.FRONTEND_PORT),
      proxy: {
        '/api': `http://${env.BACKEND_HOST}:${env.BACKEND_PORT}`,
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: ['src/main.tsx', 'src/App.tsx', 'src/components/**', 'src/hooks/**'],
      },
    },
  }
})
