import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev 代理：/api 转发到本地后端；test 为 vitest 配置（jsdom 环境）
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'], // 仅组件测试；e2e/ 归 Playwright
  },
});
