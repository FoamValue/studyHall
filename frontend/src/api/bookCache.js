// Sprint 18（S18-4）：按书（板块 code）缓存列表请求。
// 存 Promise 而非数组：书架并发 8 次 + 书内页 / 详情页共享同一个 in-flight 请求，避免二次网络请求。
import { getPlantsBySection } from './client';

const cache = new Map(); // code -> Promise<Plant[]>

export function fetchBook(code) {
  const hit = cache.get(code);
  if (hit) return hit;
  const p = getPlantsBySection(code).catch((err) => {
    cache.delete(code); // 失败不缓存：下次进入可重试
    throw err;
  });
  cache.set(code, p);
  return p;
}

// 仅供测试隔离使用
export function clearBookCache() {
  cache.clear();
}
