# 前端开发设计文章 — Sprint 1

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-16 |
| 依据 | PRD v1.0、docs/product/iteration-1-requirements.md、docs/design/ui-style-guide.md |

## 1. 工程结构
```
frontend/
├── package.json              # Vite + React(JavaScript/JSX) + antd 5.x + react-router-dom
├── vite.config.js            # dev proxy: /api → http://localhost:8080
├── Dockerfile                # node:22 构建 → nginx:alpine 托管 dist + 反代 /api
├── nginx.conf                # 静态资源 + try_files + location /api 反代 backend:8080
├── public/images/plants/     # 植物简笔画（UI 产出）
└── src/
    ├── main.jsx / App.jsx    # Router: / 首页、/plants/:id 详情
    ├── api/client.js         # fetch 封装（统一 code!==0 抛错）
    ├── pages/HomePage.jsx    # 分类筛选 + 植物网格
    ├── pages/PlantDetailPage.jsx
    └── components/           # CategoryFilter、PlantCard、PartSwitcher、AllusionCard、PartIcon(内联SVG)
```

## 2. 页面设计
### HomePage
1. 顶部：站点标题「植物小花园 Plant Garden」（中文大字 + 拼音 + 英文小字）。
2. 分类筛选：大按钮组（全部 / 花朵 / 树叶 / 果实），含 PartIcon 图标，选中高亮主色；点击切换请求 `GET /api/plants?category=...`。
3. 植物网格：响应式栅格（平板 3–4 列，电脑 4–6 列），PlantCard 显示 coverImage、中文名（大字）+ 拼音 + 英文名；点击进入详情。
4. 加载态 Spin；空态提示「这个分类还没有植物哦」。

### PlantDetailPage
1. 顶部返回按钮 + 植物名称区：中文名（特大字）+ 拼音（标注于上方）+ 英文名 + 音标。
2. 部位切换：大按钮组（花/叶/果，仅显示该植物存在的部位，`parts` 键顺序 flower→leaf→fruit），默认选中第一个。
3. 部位内容区：大图（简笔画）+ 部位三语名称 + 低龄化说明（大字号）。
4. 典故卡片（AllusionCard，浅黄底）：原文 + 出处 + 白话解释；无典故不渲染。
5. 数据缺失（40401）：显示友好错误页「这株植物还没准备好哦」。

## 3. 交互与低龄化要求
- 全部可点元素热区 ≥ 56px；圆角、大字号遵循 UI 规范。
- 部位切换即时渲染（图片预加载同植物全部部位图）。
- 触屏优先：无 hover 依赖；平板宽度优先响应式。

## 4. API 对接
- BASE=`/api`；响应 `{code,data,message}`，code!==0 抛错并按页面态展示。
- 错误分类：网络错误 / 业务错误（40001/40401）。

## 5. 前端测试（npx vitest run 必须全绿）
- Vitest + @testing-library/react + jsdom；mock api/client。
- 用例对应 QA 手册 TC-07 ~ TC-09：分类筛选切换请求与渲染、详情部位切换、缺部位标签隐藏、典故有/无渲染。
- 另需 `vite build` 通过。
