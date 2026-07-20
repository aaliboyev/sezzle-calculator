import { defineConfig } from '@playwright/test'

try {
  process.loadEnvFile('../.env')
} catch {
  // fine when vars already come from the environment
}
const { BACKEND_HOST: host, BACKEND_PORT: backendPort, FRONTEND_PORT: frontendPort } = process.env
if (!host || !backendPort || !frontendPort) {
  throw new Error('BACKEND_HOST, BACKEND_PORT and FRONTEND_PORT must be set (see .env.example)')
}

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: `http://${host}:${frontendPort}`,
  },
  webServer: [
    {
      command: 'go run .',
      cwd: '../backend',
      url: `http://${host}:${backendPort}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      url: `http://${host}:${frontendPort}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
