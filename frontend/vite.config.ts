/// <reference types="vitest/config" />
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Writes .br and .gz siblings next to text assets so the Go server can send
// them as-is instead of compressing on every request.
function precompress(): Plugin {
  let outDir = ''
  return {
    name: 'precompress',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      for (const name of readdirSync(outDir, { recursive: true, encoding: 'utf8' })) {
        if (!/\.(js|css|html|svg|json)$/.test(name)) continue
        const path = join(outDir, name)
        const data = readFileSync(path)
        if (data.length < 1024) continue
        writeFileSync(`${path}.br`, brotliCompressSync(data, {
          params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY },
        }))
        writeFileSync(`${path}.gz`, gzipSync(data, { level: 9 }))
      }
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '..', '')
  if (command === 'serve') {
    for (const key of ['BACKEND_HOST', 'BACKEND_PORT', 'FRONTEND_PORT']) {
      if (!env[key]) throw new Error(`${key} is not set (see .env.example)`)
    }
  }

  return {
    plugins: [react(), precompress()],
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
