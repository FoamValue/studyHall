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
├── public/images/plants/     # 植物部位写实照片（`.jpg`）
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
3. 部位内容区：大图（写实照片）+ 部位三语名称 + 低龄化说明（大字号）。
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

---

# 前端开发设计文章 — Sprint 2（增量）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-2-requirements.md |

## S2-1. 体验打磨
- 图片懒加载：PlantCard 缩略图与详情大图 `<img loading="lazy">`（详情同植物部位图仍预加载，切换即时）。
- photo 类型图片：按 images 顺序渲染第一张，type 不影响 UI。

## S2-2. 工程卫生
- `frontend/.gitignore` 追加 `test-results/`。

## S2-3. 测试更新（配合 QA）
- 组件测试不依赖具体植物数量；新增用例：mock 30 条数据渲染无异常、缺部位（仅 leaf）植物详情只渲染叶标签。

---

# 前端开发设计文章 — Sprint 3（增量）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-3-requirements.md |

## S3-1. 平板细节优化
- 网格：首页卡片栅格在 ≥1024px 横屏下保证 ≥4 列（检查/调整 antd Row/Col 或 CSS grid 断点）。
- 触控目标：分类 Segmented/按钮、部位 Tabs 标签 min-height 44px，通过 CSS 变量/内联样式统一。
- 字号：平板上不缩小标题与正文字号（验证现有响应式规则，必要时锁定最小字号）。

## S3-2. 100 种规模
- 不做分页/虚拟滚动（PO 裁决）；静态 SVG + loading="lazy" 已足够，E2E 验证渲染无 console error。

## S3-3. 测试更新（配合 QA）
- TC-21 mock 数据 30 → 100 条。
- 新增 TC-25：触控目标 ≥44px 样式断言。

---

# 前端开发设计文章 — Sprint 4（增量）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-4-requirements.md |

## S4-1. 新增 `usePlantNavigation`（自定义 Hook）
- 位置：`frontend/src/hooks/usePlantNavigation.js`。
- 输入：`{ list, currentId, category }`；`list` 为「当前生效列表」的有序卡片数组（未知时为 null）。
- 输出：`{ prevId, nextId, canPrev, canNext, goPrev, goNext }`。
- 计算：`ids = list.map(p => p.id)`；`n = ids.length`；`i = ids.indexOf(currentId)`；
  `prevId = ids[(i - 1 + n) % n]`，`nextId = ids[(i + 1) % n]`（首尾循环）；
  `n <= 1` 或 `i < 0` 时 `prevId/nextId` 为 null，`canPrev/canNext` 为 false。
- 导航：`goPrev/goNext` 用 `useNavigate()` 跳到 `/plants/{id}`，`state` 携带 `{ category, list }`，保证连续翻株时邻居来源不丢。
- 顺序一致性：邻居始终由**同一份** `list` 快照计算（见 S4-2），不依赖后端两次请求顺序相同。

## S4-2. 邻居列表来源与深链接兜底
- 从首页进入：`PlantCard` 增加 `state={{ category, list }}`（`list` = 首页当前分类的卡片数组）。详情页读 `useLocation().state`。
- 深链接兜底：`state` 缺失时，详情页用 `getPlants(category)` 拉一次列表得到 `list`（`category` 缺省 `'all'`）。
- 单株/空列表：两侧按钮保留但 `disabled`（不隐藏，避免版式跳动）。

## S4-3. 三通道换植物（行为一致）
- 左右滑：沉浸式容器监听 `touchstart` / `touchend`，仅当水平位移 ≥ 60px 且 > 纵向位移时判定为滑动；右滑 = 上一株，左滑 = 下一株。
- 两侧按钮：`.nav-btn`，`aria-label` 明确「上一株 / 下一株」。
- 键盘：`keydown` 监听 `ArrowLeft/ArrowRight`，输入框内按键忽略。
- 三通道共用 `goPrev/goNext`；越界即循环。

## S4-4. 系统全屏（增强项）
- 「全屏」按钮调用容器 `requestFullscreen()`；`fullscreenchange` 同步 `isFullscreen` 状态。
- Esc / 「退出全屏」按钮：`document.exitFullscreen()` 回沉浸式态。
- `!document.fullscreenEnabled` 时按钮不渲染，沉浸式态功能不受影响。
- 全屏态与沉浸式态共用同一 DOM（仅样式差异），故植物/部位/浏览位置天然不丢。

## S4-5. 预加载与切换无白屏
- 保留现有「同植物全部部位图预加载」，追加预加载上一株/下一株卡片的 `coverImage`。
- 切换植物时若目标数据未就绪，保留上一帧图片避免白屏，就绪后替换。

## S4-6. 样式增量（styles.css）
- `.detail-immersive`：`min-height: 100dvh`（回退 `100vh`）、`overflow: hidden`、纵向 flex；**页面级滚动条消除**。
- `.imm-topbar`：左上「← 回花园」+ 右上「全屏」，绝对定位于顶部两角。
- `.nav-btn`：两侧垂直居中固定，热区 ≥56px，圆角 16px，半透明底，不遮挡主体图片。
- `.part-img`：`object-fit: contain` + 视口高度自适应上限（横屏约 `58vh`、竖屏约 `48vh`），**完整不裁切**；信息区在极小高度下允许局部滚动，但页面级不滚动。
- 断点：`@media (orientation: landscape)` 允许图片区与文字区左右分栏，保证横屏可见性。
- 首页 `.page`、站点标题样式不变。

## S4-7. 首页状态记忆
- `HomePage` 的 `category` 初值从 `location.state?.category` 取（回退 `'all'`）。
- 从首页进详情前记录 `window.scrollY`；返回时（`location.state?.restoreScroll`）`useEffect` 恢复滚动位置。
- 路由保持不变（`/` 与 `/plants/:id`），`category` 不上 URL。

## S4-8. 测试更新（配合 QA）
- `PlantDetailPage.test.jsx`：mock 增加 `getPlants`；新增 TC-28~TC-32（邻株切换 / 首尾循环 / 换株后部位回落 / 全屏不可用降级 / 回花园入口存在）。
- `HomePage.test.jsx`：TC-12 补充断言卡片 Link 的 `state` 含 `category` 与 `listIds`（原断言语义不变）。
- `e2e/smoke.spec.js`：新增 TC-33~TC-35（三通道一致、首尾循环、全屏进出不丢位置）。

---

# 前端开发设计文章 — Sprint 5（增量）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-5-requirements.md |

## S5-1. 新增 `useSpeech`（自定义 Hook）
- 位置：`frontend/src/hooks/useSpeech.js`。
- 能力检测：`supported = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'`；不支持时调用方不渲染喇叭。
- 状态：`speakingLang`（`'zh' | 'en' | null`），用于按钮高亮与「再点停止」判定。
- API：`{ supported, speakingLang, speak(text, lang), stop() }`。
- `speak` 逻辑：
  ```js
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'en' ? 'en-US' : 'zh-CN';
  u.rate = 0.8;
  u.onend = u.onerror = () => setSpeakingLang(null);
  window.speechSynthesis.cancel();     // 互斥：先停掉当前
  window.speechSynthesis.speak(u);
  setSpeakingLang(lang);
  ```
- `stop()`：`speechSynthesis.cancel()` + `setSpeakingLang(null)`。
- 卸载清理：`useEffect(() => () => window.speechSynthesis?.cancel(), [])`，避免离开页面残音。
- 「再点同一喇叭 = 停止」由调用方判定：`speakingLang === lang ? stop() : speak(text, lang)`。

## S5-2. 详情页集成与场景自动停止
- 中文名行渲染 `.speak-btn`（`lang='zh'`，文本 `plant.name.zh`）；英文名行渲染英文喇叭（`lang='en'`，文本 `plant.name.en`）；**`name.en` 为空则不渲染英文喇叭**。
- 统一 `stop()` 的触发点：
  - 植物 id 变化（换株）→ `useEffect(..., [id])`
  - 部位切换 → `useEffect(..., [part])`
  - 全屏进出 → `fullscreenchange` 回调内
  - 回花园 → `.back-btn` 的 `onClick`
  - 组件卸载 → 见 S5-1
- `supported === false` 时整组喇叭不渲染，其余功能（换株、部位切换、全屏）不受影响。
- 不自动播放：只在用户点击喇叭时 `speak`（满足浏览器「语音播放需用户手势」策略）。

## S5-3. `SpeakButton` 组件
- 位置：`frontend/src/components/SpeakButton.jsx`；props `{ text, lang, speaking, onToggle }`。
- 渲染：`<button type="button" className="speak-btn" aria-label={lang === 'en' ? '朗读英文名' : '朗读中文名'} aria-pressed={speaking}>`；图标播放中显示「停止」，空闲显示「喇叭」（内联 SVG）。
- 热区由样式保证 ≥56px。

## S5-4. 样式增量（styles.css）
- `.detail-name-row`：`display: flex; align-items: center; gap: 12px;`（名称 + 喇叭同一行）。
- `.speak-btn`：`min-width: 56px; min-height: 56px; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center;` 白底 + 主色描边；`.is-speaking` 时主色实底白图标。
- 全屏态与横屏分栏复用同一样式；不遮挡 `.nav-btn`、`.imm-topbar`。

## S5-5. 测试更新（配合 QA）
- `PlantDetailPage.test.jsx`：`beforeEach` 注入 `window.speechSynthesis` mock（`speak` / `cancel` spy，`SpeechSynthesisUtterance` 构造 mock 记录 `text` / `lang` / `rate`），`afterEach` 还原；新增 TC-41~TC-45。
- `e2e/`：新增 TC-46~TC-47（喇叭存在且热区 ≥56px；stub `speechSynthesis` 后点击触发调用）。

## S5-6. 兼容与降级
- Safari / iPadOS 要求用户手势触发，喇叭仅由点击触发，程序不自动播放。
- 浏览器无中文 voice 时可能静音但调用仍成功：属能力边界，不做额外处理，真机音质由人工抽验。

---

# 前端开发设计文章 — Sprint 6（详情页整屏不滚动缺陷修复）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-6-requirements.md（方案 A） |
| 范围 | 纯 CSS 修复（`frontend/src/styles.css`）；不改 JSX 结构、路由、接口与语料 |

## S6-1. 缺陷与实测根因（修正 S4-6）
- S4-6 原文写 `.detail-immersive` 用 `min-height: 100dvh`，实际代码为 `height: 100vh; height: 100dvh`，并约定「内容区内部可滚动」，该约定在 iPad Safari 上产生问题：
  - 内容区 `.detail-body`（`overflow: auto`）出现纵向滚动条：横屏 78px、竖屏 130px；
  - 滚动到边界后**滚动链式传递到页面**，页面滚动使 iPad Safari 退出全屏。
- 实测（Playwright）溢出全部来自图片固定视角高度：横屏 `.part-img` 为 `64vh`（492px）＞ 内容区可用高度 446px；文字列实测最高约 397px，横竖屏可用高度内均可完整放下。

## S6-2. 容器：脱离文档流并铺满视口
```css
.detail-immersive {
  position: fixed;      /* 原为 relative */
  inset: 0;             /* 取代 height: 100vh / 100dvh */
  overflow: hidden;
  overscroll-behavior: none;
  display: flex;
  padding: 68px 76px 16px;
  background: var(--color-page-bg);
}
```
- 容器高度恒等于视口、脱离文档流 → 文档高度恒等于视口，**永不产生页面级滚动条**，也不存在滚动链式传递的落点。
- 全屏态下 UA 对 `:fullscreen` 的 `position: fixed; inset: 0` 与本规则天然一致，沉浸式与全屏态行为统一。

## S6-3. 内容区：不可滚动
```css
.detail-body {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;          /* 原为 auto */
  overscroll-behavior: contain;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
```

## S6-4. 主体与图片：按剩余空间自适应
```css
.detail-main {
  flex: 1 1 auto; min-height: 0;        /* 占满内容区剩余高度 */
  overflow: auto; overscroll-behavior: contain;   /* 兜底：极端小屏下仅此处滚动，不传递到页面 */
}

.part-img {
  flex: 0 1 auto;            /* 允许在空间不足时收缩 */
  min-height: 0;
  max-height: 44vh;          /* 竖屏视角上限；横屏被媒体查询覆盖 */
  max-width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;       /* 完整不裁切 */
}

@media (orientation: landscape) {
  /* 图片宽度固定为容器 40%，不再参与收缩，避免水平溢出把内容推出视口 */
  .part-img { flex: 0 0 auto; max-height: 100%; max-width: 40%; }
  /* 文字占满图片右侧剩余宽度（吸收剩余空间），宽度不再写死 */
  .part-content {
    flex: 1 1 auto; min-width: 0; max-width: 640px;
    max-height: 100%; overflow: auto; overscroll-behavior: contain;
  }
}
```
- 横屏：`.detail-main` 为行；图片按容器宽度 40% 固定、高度随可用高度自适应；文字列吸收剩余宽度 → 纵向与横向均无溢出。
- 竖屏：`.detail-main` 为列；图片收缩让位给文字 → 无滚动条。
- 修正背景（S6-4 补充）：横屏旧规则 `.part-img { max-height: 64vh; max-width: min(48vw, 64vh) }`（491px）+ `.part-content { max-width: 640px }` + gap 32 = 1163px ＞ 可用 872px，配合 `justify-content: center` 使图片被推到 `x=-11`、文字右边界溢出视口（实测 1024×768 水平溢出 87px，描述文字被截断）。新规则一并消除该隐患。

## S6-5. 文字兜底滚动（极端场景）
```css
.part-content { flex: 0 0 auto; min-height: 0; }   /* 基础：文字不被压缩，空间不足时图片优先收缩 */
```
- 文字区默认不滚动；兜底滚动上移到 `.detail-main`（见 S6-4），仅当极长文案在极端小屏放不下时触发，`overscroll-behavior: contain` 保证不传递到页面 / 全屏。

## S6-6. 断言口径（不受影响）
- `object-fit: contain` 不变 → TC-38 / TC-40 的「图片完整」断言继续成立。
- 页面级溢出断言（`documentElement.scrollHeight - clientHeight ≤ 1`）在修复后仍成立且更稳（文档高度 = 视口高度）。
- 触控目标（`.nav-btn`、`.back-btn` 等 ≥56px）与横屏分栏规则不变 → TC-40 平板适配断言继续成立。
- 不改 JSX：`PlantDetailPage.jsx` 结构、语音朗读与换株逻辑均不动。

## S6-7. 测试更新（配合 QA）
- `e2e/navigation.spec.js`：TC-38 / TC-40 的溢出断言保留（回归）。
- 新增 `e2e/responsive.spec.js`：TC-48（横屏四视口一档）/ TC-49（竖屏）沉浸式「页面级溢出 ≤1 且内容区不可滚动」；TC-50 全屏态溢出与滚动不改变文档滚动位置；TC-51 图片 `object-fit: contain` 且不溢出视口；TC-52 长文案植物（azalea）含典故不产生页面滚动。
- `PlantDetailPage.test.jsx`：新增 TC-53~TC-56 样式表规则断言（容器 `position: fixed; inset: 0`；内容区 `overflow: hidden`；`overscroll-behavior` 阻断链式传递；`.part-img` 可收缩 + 横屏 `max-height: 100%`）。

---

# 前端开发设计文章 — Sprint 7（PF 体验优化）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-7-requirements.md、docs/product/experience-triage-v1.md |
| 范围 | 前端纯 CSS（`frontend/src/styles.css`）；不改 JSX 结构、路由、接口与语料 |

## S7-1. 横屏详情图片放大（EX-2）
```css
@media (orientation: landscape) {
  /* Sprint 7：图片宽度上限 40% → 48%，更充分利用可用高度、减少左右留白 */
  .part-img { flex: 0 0 auto; max-height: 100%; max-width: 48%; }
  /* 文字列继续吸收剩余宽度，避免重新引入水平溢出（Sprint 6 消除的 87px） */
  .part-content { flex: 1 1 auto; min-width: 0; max-width: 640px; }
}
```
- 仅调宽度上限；`aspect-ratio: 1/1` 与 `object-fit: contain` 不变，图片仍然完整不裁切。
- 必须实测 1024×768 与 1180×820：图片像素宽度较修复前增大、页面级溢出为 0、无水平溢出；长文案（azalea）不溢出。

## S7-2. 横屏头部收紧（EX-2，并入 F6）
- 在横屏媒体查询内收紧详情头部的上下留白（如名称行 `.detail-name-row` 与头部容器的 `gap` / `margin`），把竖轴空间让给图片。
- 底线：长文案仍完整可读、不溢出；字号不降低。
- 仅在横屏生效，竖屏与既有版式不受影响。

## S7-3. 卡片次级字号（EX-3）
```css
/* Sprint 7：卡片次级文字由 14px 提升至 16px，横屏更清晰 */
.plant-card-pinyin,
.plant-card-en { font-size: 16px; color: var(--color-text-light); }
```

## S7-4. 封面跟随分类（EX-1，后端提供，前端无改动）
- 封面由后端清单接口按请求分类生成（见 backend-design S7-x）；前端 `HomePage` / `PlantCard` 无需改动，渲染逻辑与 `coverImage` 字段契约不变。

## S7-5. 不回归
- 不改 JSX：`PlantDetailPage.jsx` / `HomePage.jsx` / `PlantCard.jsx` 结构与逻辑均不动（EX-1 由后端承载）。
- Sprint 6 约束继续成立：页面级溢出 0、内容区不可滚动、滚动不改变文档滚动位置。
- US-6 / US-7 行为（换株、全屏、语音朗读）与既有热区（≥56px）不变。

## S7-6. 测试更新（配合 QA）
- 新增 `styles` 样式断言：TC-59（卡片次级字号 16px，读 `styles.css`）、TC-60（横屏 `.part-img` `max-width: 48%`）。
- `e2e/responsive.spec.js`：新增 TC-61（横屏详情图片像素宽度增大且无水平溢出、页面级溢出 ≤ 1）、TC-62（长文案 azalea 不溢出）。
- `e2e/smoke.spec.js`：新增 TC-63（分类页卡片封面 URL 与分类一致）。


