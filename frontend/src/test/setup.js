import '@testing-library/jest-dom/vitest';

// antd 部分组件依赖 matchMedia，jsdom 未实现，补一个最小桩
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  });
}
