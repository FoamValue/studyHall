import { defineConfig } from '@playwright/test';

// E2E 冒烟配置：目标为 docker compose 起的 nginx(80) 入口，
// 需先 `docker compose up -d` 并导入内容后执行 `npx playwright test`
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost',
    screenshot: 'only-on-failure',
  },
  outputDir: './test-results',
});
