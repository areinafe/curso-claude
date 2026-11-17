import { defineConfig } from '@playwright/test'

// Requiere datos de prueba: `npm run seed` en la raíz antes de ejecutar.
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    video: 'on',
    trace: 'off'
  },
  webServer: [
    {
      command: 'npm run dev:api',
      cwd: '../..',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true
    },
    {
      command: 'npm run start',
      url: 'http://localhost:4200',
      reuseExistingServer: true,
      timeout: 120_000
    }
  ]
})
