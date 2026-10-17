// 统一 API 封装：响应契约为 { code, data, message }，code !== 0 视为业务错误抛出
export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

async function request(path) {
  let res;
  try {
    res = await fetch(`/api${path}`);
  } catch {
    // 网络层失败（断网/服务未启动）
    throw new ApiError(-1, '网络不太顺畅，请稍后再试哦');
  }

  let body;
  try {
    body = await res.json();
  } catch {
    // 非 JSON 响应（如网关错误页）
    throw new ApiError(-1, '服务器开小差了，请稍后再试哦');
  }

  if (body.code !== 0) {
    // 业务错误：40001 非法分类、40401 植物不存在等，message 为后端友好文案
    throw new ApiError(body.code, body.message || '出了点小问题，请稍后再试哦');
  }
  return body.data;
}

export const getCategories = () => request('/categories');

export const getPlants = (category) =>
  request(category ? `/plants?category=${encodeURIComponent(category)}` : '/plants');

export const getPlantsBySection = (section) =>
  request(`/plants?section=${encodeURIComponent(section)}`);

export const getPlant = (id) => request(`/plants/${encodeURIComponent(id)}`);
