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
    // Sprint 19（M19-3 / Q9）：统一 reducedMotion，4 处路由过渡降级为直切，
    // 避免动画时序干扰既有 81 条用例；新动效用例在 vitest 断言样式值。
    reducedMotion: 'reduce',
  },
  outputDir: './test-results',
});
