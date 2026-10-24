import { expect, test } from '@playwright/test';

// Sprint 20（v3.1）：数字卡片计数元素重绘——21 张数字图同名同路径重出
// 验收 94：21 张全部可取、image/jpeg、1600×1600

test.describe('Sprint 20 数字卡片资产', () => {
  test('TC-176 21 张新数字图资源与尺寸', async ({ page, request }) => {
    for (let n = 0; n <= 20; n++) {
      const url = `/images/numbers/number-${n}.jpg`;
      const res = await request.get(url);
      expect(res.status(), `${url} HTTP 状态`).toBe(200);
      expect(res.headers()['content-type'], `${url} content-type`).toContain('image/jpeg');
    }

    await page.goto('/');
    const sizes = await page.evaluate(async () => {
      const out = [];
      for (let n = 0; n <= 20; n++) {
        const img = new Image();
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = `/images/numbers/number-${n}.jpg`;
        });
        out.push([n, img.naturalWidth, img.naturalHeight]);
      }
      return out;
    });
    for (const [n, w, h] of sizes) {
      expect([w, h], `number-${n} 尺寸`).toEqual([1600, 1600]);
    }
  });
});
