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

---

# 前端开发设计文章 — Sprint 8（名实一致修复：卡片标题 + 详情默认部位跟随分类）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-8-requirements.md、PRD §13（v1.5） |
| 范围 | 前端 JSX 两处（`PlantCard.jsx`、`PlantDetailPage.jsx`）；不改样式、路由、接口与语料 |

## S8-1. `deriveCardTitle(plant, category)` 纯函数（位于 `PlantCard.jsx`）
```js
// 果实惯用名特例：语料里该果实本身的说法（银杏的果=白果、松树的果=松果、荷花的果=莲蓬）
export const FRUIT_SPECIAL_NAMES = { ginkgo: '白果', pine: '松果', lotus: '莲蓬' };

// 卡片标题按入口分类派生；「全部」/未知分类保持原名
export function deriveCardTitle(plant, category) {
  const zh = plant?.name?.zh || '';
  if (category === 'flower') return zh.includes('花') ? zh : `${zh}花`;
  if (category === 'leaf') return `${zh}叶`;
  if (category === 'fruit') return FRUIT_SPECIAL_NAMES[plant?.id] || zh;
  return zh;
}
```
- 规则：花→名已含「花」保持原名，否则 名称+「花」；叶→**一律** 名称+「叶」（口径见 PRD §13.3：统一「植物名+叶」，避免「蒲公英树叶」类不自然说法）；果→特例表命中否则原名；全部/未知→原名。
- `.plant-card-zh` 渲染改为 `{deriveCardTitle(plant, category)}`；卡片图片 `alt` 仍用 `plant.name.zh`（语义为植物本身名，不改）。
- 纯函数无副作用，单测直接断言（TC-64）。

## S8-2. 详情默认部位跟随入口分类（`PlantDetailPage.jsx`）
```js
// 默认部位：优先跟随入口分类对应的部位（该植物确有才选中），否则退回固定顺序第一个
const ordered = getOrderedParts(data.parts);
const preferred =
  ['flower', 'leaf', 'fruit'].includes(category) && data.parts?.[category] ? category : null;
setPart(preferred || ordered[0] || null);
```
- `category` 取 `location.state?.category`，缺省 `'all'`（深链接无 state 时与现状一致）。
- 效果：树叶→苹果默认「叶」、大图 `apple-leaf.jpg`；花朵→苹果默认「花」；果实→银杏默认「果」、大图 `ginkgo-fruit.jpg`；全部→仍默认「花」。
- 换株（`goPrev/goNext`，改动 `id` 触发同一 `useEffect`）与滑动切株后，新植物按**当前** `category` 重新计算默认部位，天然跟随分类。
- 不新增控件、不改换株 / 全屏 / 语音朗读逻辑。

## S8-3. 不回归
- 既有用例多为「全部」或「花朵」分类：`parts` 固定顺序首位即 flower，语义不变（TC-14/TC-15/TC-28/TC-30/TC-45 等）。
- Sprint 6 无滚动 / Sprint 7 封面与字号断言不受影响（未改样式与后端）。
- 唯一受影响断言：`HomePage.test.jsx` TC-12「花朵」分类下的卡片文本由「向日葵」变为「向日葵花」，按新语义更新。

## S8-4. 测试更新（配合 QA）
- `HomePage.test.jsx`：新增 TC-64（`deriveCardTitle` 派生规则：花/叶/果/全部 + 银杏/松树/荷花特例 + 桃花保持原名）；更新 TC-12 花朵分类卡片文本断言为「向日葵花」。
- `PlantDetailPage.test.jsx`：新增 TC-65（树叶分类默认选叶、输入 `apple-leaf` 数据）、TC-66（全部默认花 / 花朵默认花 / 果实默认果 + 换株后跟随）。
- `e2e/smoke.spec.js`：新增 TC-67（树叶分类苹果标题「苹果叶」且详情默认选叶、大图 `apple-leaf.jpg`）、TC-68（花朵分类苹果标题「苹果花」）、TC-69（果实分类银杏标题「白果」）、TC-70（全部进入苹果默认「花」）。

---

# 前端开发设计文章 — Sprint 9（增量：v2.0 四板块两级导航 + 单图详情 + 小知识 + 预生成音频）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-9-requirements.md（Q2~Q7 冻结）、PRD §14（v2.0） |
| 范围 | `HomePage.jsx`、`PlantDetailPage.jsx`、新增 `useAudio`、`AllusionCard.jsx`、`PartSwitcher.jsx`、`api/client.js`、`styles.css`；不改详情路由 |

## S9-1. 站点改名（S9-1）
- `HomePage.jsx` 标题三行文本：`zhí wù xiǎo huā yuán` → `zì rán xiǎo tú jiàn`；`植物小花园` → `自然小图鉴`；`Plant Garden` → `Nature Guide`。
- 样式类名（`.site-title-pinyin/-zh/-en`）与版式不变。

## S9-2. 板块导航 + 植物二级筛选（Q3/Q4/R-28）
- 新增常量：`SECTIONS = [{code:'plant',label:'植物'},{code:'animal',label:'动物'},{code:'insect',label:'昆虫'},{code:'dinosaur',label:'恐龙'}]`（板块固定顺序）。
- `HomePage` 状态：`section`（默认 `'plant'`）+ 既有 `category`。
- 新增 `SectionNav` 组件（可内联于 HomePage）：渲染 4 个板块按钮，复用 `.filter-btn`，`role="group" aria-label="板块导航"`，类名 `.section-nav`。
- 二级筛选：仅当 `section === 'plant'` 时渲染既有 `CategoryFilter`；**传入的分类须先按板块过滤**——`plantCategories = categories.filter(c => c.section === 'plant')`（否则 `/api/categories` 新增的 3 个板块分类会混进筛选条，出现 7 钮）。切换板块时 `setCategory('all')`（植物）或置为板块单一分类。
- 请求策略（`api/client.js` 增 `getPlantsBySection(section)`）：
  - 植物板块：`category === 'all'` → `GET /api/plants?section=plant`；否则 `GET /api/plants?category={category}`。
  - 动物/昆虫/恐龙板块：`GET /api/plants?section={section}`。
- 列表渲染、加载态、空态（文案「这个板块还没有内容哦」/「这个分类还没有植物哦」）与 PlantCard 复用不变；`PlantCard` 的 `state` 增带 `section`。

## S9-3. 详情单图分支（Q2/R-29）
- 判定：`const singleKey = getOrderedParts(plant.parts)[0]`，若 `plant.parts` 恰有 1 键且键 ∈ `{animal,insect,dinosaur}` → **单图分支**。
- 单图分支渲染：`header`（拼音/中文名 + 喇叭 / 英文名 + 音标 + 喇叭）→ 大图（`.part-img`，src = 该部位首图）→ `.part-content`（说明 + 小知识卡片）；**不渲染** `PartSwitcher`，**不渲染**部位三语名行。
- 植物分支完全沿用现状（含 US-6 沉浸/换株/全屏、US-7 喇叭、US-8 默认部位跟随分类）。
- 预加载与邻株计算复用（`usePlantNavigation` 以 `list` 快照为准，不依赖部位）。

## S9-4. 扩展 `PART_ORDER` / `PART_LABELS`（`PartSwitcher.jsx`）
```js
export const PART_ORDER = ['flower', 'leaf', 'fruit', 'animal', 'insect', 'dinosaur'];
export const PART_LABELS = { flower:'花', leaf:'叶', fruit:'果', animal:'动物', insect:'昆虫', dinosaur:'恐龙' };
```
- `getOrderedParts(parts)` 与原逻辑不变（按 PART_ORDER 过滤存在的部位）；**植物顺序仍 `flower,leaf,fruit` 在前**，US-8 默认部位按 category 命中逻辑不受影响。
- `PartSwitcher` 组件仅在植物分支渲染（单图分支不渲染），故新增标签不产生可见控件。

## S9-5. 小知识卡片（R-30）
- `AllusionCard` 复用，仅将 `aria-label` 由 `植物小典故` 改为 `小知识`；`.allusion-card` 视觉不变；无 `allusion.text` 不渲染（沿用现状）。
- 动物/昆虫/恐龙语料用 `allusion:{text,source,explain}` 承载「冷知识/习性/分布/季节」，`source` 可省。

## S9-6. 预生成音频播放（R-31/R-32）
- 新增 `frontend/src/hooks/useAudio.js`：
  - 单例 `HTMLAudioElement`（`new Audio()`），或按 URL 缓存。
  - API：`{ supported: true, playingUrl, play(url), stop() }`（`playingUrl` 用于按钮高亮与「再点停止」）。
  - `play(url)`：先 `pause()` 当前并 `currentTime=0`，再 `new Audio(url)`（或复用）`play()`；`onended/onerror → setPlayingUrl(null)`。
  - 互斥：同一时刻至多一个音频；再点同一 URL 视为停止（调用方判定，同 Sprint 5）。
  - 卸载清理：`useEffect(() => () => audio.pause(), [])`。
- 音频 URL 来源：`plant.name.audioZh ?? (plant.name.en ? \`/audio/${id}-zh.m4a\` : ...)`；设计定为 `name` 增可选 `audioZh`/`audioEn`，缺省按 `/audio/{id}-{zh|en}.m4a` 推导；**英文名缺失不渲染英文喇叭**。
- 降级：音频 URL 缺失或文件不存在时**不渲染**该喇叭；**不回退 `speechSynthesis`**（移除 `useSpeech` 依赖）。
- 场景停止：换株（`id` 变化）、切部位、回花园（`onClick`）、全屏进出（`fullscreenchange`）、组件卸载 —— 均调用 `stop()`（与 Sprint 5 一致）。
- `SpeakButton` 组件复用（props `text`→改为 `onToggle(url)` 语义；图标/热区/`aria-pressed` 不变）。
- 注：`useSpeech.js` 保留为回滚备份还是删除由实现决定；**运行时不再调用**。

## S9-7. 样式增量（styles.css）
- `.section-nav`：一行 4 个板块按钮，间距 ≥16px（复用 `.filter-btn` 视觉，热区 ≥56px）。
- 板块导航与植物分类筛选两行间距 ≥16px（`margin-top`）。
- 单图详情：`header` + 大图 + 文字；横屏沿用「左图右文」两栏、竖屏沿用「上图下文」；`aspect-ratio:1/1` + `object-fit:contain` 不变；去掉部位切换条后空间更充裕，不引入页面级滚动（Sprint 6 约束保持）。

## S9-8. 测试更新（配合 QA-20/QA-21）
- `HomePage.test.jsx`：站点标题断言改名；新增板块切换（请求 `?section=`）、植物二级筛选、板块列表渲染用例（TC-71 起）。
- `PlantDetailPage.test.jsx`：新增单图详情分支（不渲染 PartSwitcher、渲染大图与说明）、音频播放/停止/降级（stub `Audio`，断言无 `speechSynthesis` 调用）用例。
- `e2e/`：新增站点标题、板块导航、单图详情无部位切换、音频请求可见、排序稳定性用例。

---

# 前端开发设计文章 — Sprint 10（增量：v2.1 小知识可见标题 + 单图横屏主图放大 + 首页增量加载）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-10-requirements.md（Q1~Q7 冻结）、PRD §15（v2.1） |
| 范围 | `AllusionCard.jsx`、`PlantDetailPage.jsx`、`HomePage.jsx`、`styles.css`；**不改**后端 / 接口契约 / 语料 / 路由 |

## S10-1. EX-4 小知识可见标题（`AllusionCard.jsx`）
- 在卡片内 `<p className="allusion-title">小知识</p>`（置于引号装饰之后、正文之前），使称谓**用户可见**（当前仅有 `aria-label`）。
- 保留 `aria-label="小知识"`（region 无障碍名不变，E2E 既有 `getByRole('region',{name:'小知识'})` 不受影响）。
- 字号 ≥20px（Q6 冻结）；无 `allusion.text` 仍整卡不渲染（早退不变）。

## S10-2. EX-5 单图横屏主图放大（`PlantDetailPage.jsx` + `styles.css`）
- `PlantDetailPage` 已有 `isSingleImage`（`ordered.length === 1 && SINGLE_IMAGE_KEYS.includes(ordered[0])`）。给内容容器挂分支类：
  `className={isSingleImage ? 'detail-body single-image' : 'detail-body'}`。
- `styles.css` 在 `@media (orientation: landscape)` 内**新增**：
  ```css
  .detail-body.single-image {
    grid-template-columns: 64% minmax(0, 1fr);
  }
  ```
  既有 `.detail-body { grid-template-columns: 48% ... }` 保持不动 → **植物三部位版式不回归**（Q5 冻结）。
- 图片规则不变（`aspect-ratio:1/1` + `object-fit:contain` + `max-*:100%`），渲染尺寸 = `min(栏宽, 可用高)`；1024×768 约 81%、1180×820 约 89% 可用高，均不溢出。

## S10-3. EX-6 首页增量加载 + 「共 N 种」（`HomePage.jsx`）
- 常量 `PAGE_SIZE = 16`；新增状态 `visibleCount`，渲染 `plants.slice(0, visibleCount)`。
- 初始值：`location.state?.restoreScroll` 时取 `max(PAGE_SIZE, sessionStorage['sh:homeVisibleCount'])`，否则 `PAGE_SIZE`（Q4 冻结）。
- **重置**：板块 / 分类切换时（首次挂载除外，用 ref 区分）`setVisibleCount(PAGE_SIZE)`。
- **触发**：列表末尾 `visibleCount < plants.length` 时渲染 `.load-sentinel`（含 `.load-hint`「加载中…」）+ `IntersectionObserver`（`rootMargin:'200px'`）监听，进入视口则 `+PAGE_SIZE`（截断到全量）。
- **降级**：`typeof IntersectionObserver === 'undefined'` 时，数据到达后直接 `setVisibleCount(data.length)` 全量渲染（jsdom / 极旧浏览器）。
- **总量提示**：`plants?.length > 0` 时渲染 `<p className="list-count">共 {plants.length} 种</p>`（区块顶部右对齐）。
- **滚动记忆兼容**：`visibleCount` 变化写入 `sessionStorage['sh:homeVisibleCount']`；滚动复位 effect 追加兜底——复位后若 `window.scrollY < 目标`，继续 `+PAGE_SIZE` 补加载直至覆盖或到全量再清理 `pendingScroll`。
- 动物 / 昆虫 / 恐龙仅 10 条（< 16），首屏即全量，哨兵不渲染；总量提示统一展示。

## S10-4. 不回归
- `sort ASC + id ASC` 顺序语义不变（仍按接口返回顺序切片）。
- 空态 / 加载态 / 错误态文案与结构不变。
- US-6 沉浸换株、US-7 喇叭、US-8 默认部位跟随分类、Sprint 6 无滚动红线均不受影响。

## S10-5. 测试更新（配合 QA-23 / QA-24）
- `HomePage.test.jsx`：TC-21 断言稳妥化（`findByText('植物99')` 后再计数）；新增「共 N 种」与「哨兵存在 / 追加」用例（jsdom 无 IO 时走全量降级，用条数断言）。
- `PlantDetailPage.test.jsx`：新增 `.allusion-title` 可见文案与样式断言；单图分支 `.detail-body.single-image` 类断言；植物分支不含 `single-image`。
- `e2e/`：新增小知识可见标题、单图横屏主图占比、植物版式不回归、首页滚动增量至全量、「共 N 种」文案用例；既有 TC-95 改为滚动加载后断言 100 卡。

---

# 前端开发设计文章 — Sprint 11（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-17 |
| 结论 | **本迭代前端零改动**（R-32）；纯内容扩容 |

## S11-1. 零改动确认
- 板块导航（植物 / 动物 / 昆虫 / 恐龙）与植物二级筛选逻辑不变。
- 单图详情分支（`parts` 单键 → 无部位切换）不变；音频喇叭渲染与播放（有音频渲染、缺失不渲染）不变。
- 首页增量加载（首屏 16 + 滚动步进 16）与「共 N 种」总量提示对 30 种板块天然成立——板块 30 > 16 时触发滚动加载，与植物 100 同一路径。

## S11-2. 内容 JSON 产出（R-33）
- 按 PO-11 §四清单产出 60 个 JSON，schema 与既有模板（`content/animals/dolphin.json`）一致：单键 `parts` = 板块 code，`categories` = 同 code，`sort` = 11…30。
- 文案口径：`description` ≤80 字且无拉丁字母；`allusion.text` ≤60、`explain` ≤50。

## S11-3. 受影响断言（R 协同 QA-27）
- E2E TC-114：板块总量「共 10 种」+ 10 卡 → 「共 **30** 种」+ `loadAllCards(page,30)`。
- 其余前端用例（植物 100/53、滚动记忆、单图版式）不受影响。

---

# 前端开发设计文章 — Sprint 12（增量：v2.3 EX-7 返回文案派生 + EX-8 拼音字号对齐 + EX-9 首页按钮字号）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-18 |
| 依据 | docs/product/iteration-12-requirements.md（Q1~Q6 冻结）、PRD §17（v2.3） |
| 范围 | `PlantDetailPage.jsx`、`styles.css`；**不改**后端 / 接口契约 / 语料 / 路由 / 音频 |

## S12-1. EX-7 返回文案按板块派生（`PlantDetailPage.jsx`）
- 新增模块级常量映射（受控派生 + 兜底）：
  ```js
  // 返回入口文案按板块派生（Sprint 12 / EX-7）；未知板块回退「花园」
  const SECTION_HOME = {
    plant: '花园',
    animal: '动物世界',
    insect: '昆虫角',
    dinosaur: '恐龙园',
  };
  ```
- 在组件内取 `const homeLabel = SECTION_HOME[section] || '花园';`（`section` 已从 `location.state?.section || 'plant'` 派生）。
- 正常态返回按钮：`← 回{homeLabel}`（替换硬编码「← 回花园」）；`to="/"` 与 `state={{ section, category, restoreScroll: true }}` **保持不变**。
- 异常兜底（`status === 'notfound'`）：`回{homeLabel}看看`（替换硬编码「回花园看看」），`href` 仍 `/`。
- 其余结构、样式类 `.back-btn`、点击 `onClick={stop}` 均不变。

## S12-2. EX-8 横屏详情拼音字号（`styles.css`）
- 在 `@media (orientation: landscape)` 分支内，把既有 `.detail-header .detail-pinyin { margin:0; font-size:16px }` 的 `font-size` 改为 **20px**（与 `.detail-header .detail-en` 同级）。
- `margin:0`、字重、颜色不变；基础规则 `.detail-pinyin`（非横屏 20px）与竖屏分支**不动**。
- 影响评估：横屏详情拼音行高由 ~22px 增至 ~28px（+6px），远小于竖轴余量（PF-B 实测 1024×768 底部留白 133px），不触发 Sprint 6 页面级溢出。

## S12-3. EX-9 首页按钮字号（`styles.css`）
- `.filter-btn` 为三处共用（`.section-nav` 板块 / `.category-filter` 分类 / `.part-switcher` 部位）。**不改基础块**，改为在基础块之后**新增限定规则**：
  ```css
  /* Sprint 12（EX-9）：首页板块 / 分类按钮文字加大（20px → 22px）；
     详情部位切换（.part-switcher .filter-btn）保持 20px 不回归。 */
  .section-nav .filter-btn,
  .category-filter .filter-btn {
    font-size: 22px;
  }
  ```
- 放置位置：紧跟 `.filter-btn.selected` 之后（基础块同级），保证级联覆盖但**不覆盖** `.part-switcher`。
- 尺寸 `min-height:56px`、`padding`、圆角、配色不变；`22px` 未达 UI 上限 24px，避免「恐龙」两字按钮视觉过满。

## S12-4. 不回归
- 路由 `/plants/:id`、`location.state`（section / category / restoreScroll）语义不变；US-6 沉浸换株、US-7 喇叭（预生成音频）、US-8 默认部位跟随分类、Sprint 6 无滚动红线、Sprint 10 增量加载与「共 N 种」均不受影响。
- 后端 / 语料 / 图片 / 音频 / 接口契约**零改动**。

## S12-5. 测试更新（配合 QA-29 / QA-30）
- `PlantDetailPage.test.jsx`：新增 EX-7 四板块派生断言（`section:animal|insect|dinosaur` 详情返回文案正确、`href="/"`）；新增 EX-8 样式源断言（读 `styles.css`，切出 `@media (orientation: landscape)` 块内的 `.detail-header .detail-pinyin`，断言 `font-size` ≥20px）。
- `HomePage.test.jsx`：新增 EX-9 样式源断言（断言存在 `.section-nav .filter-btn, .category-filter .filter-btn` 规则且 `font-size` ≥22px，且 `.filter-btn` 基础块仍 20px）。
- `e2e/`：新增 TC-119~TC-121（动物 / 昆虫 / 恐龙详情返回文案派生 + `href="/"`）；既有 `/回花园/` 断言（植物）不改。

---

# 后端开发设计文章 — Sprint 12（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-18 |
| 结论 | **本迭代后端零改动**（J-16）。三项均为前端文案 / 样式；不涉接口契约、路由、语料、音频路径与排序逻辑。 |

---

# 前端开发设计文章 — Sprint 13（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-18 |
| 结论 | **本迭代前端零改动**（R-37）。纯语料增补。 |

## S13-1. 零改动确认
- `AllusionCard` 为**数据驱动**组件：`allusion.text` 存在即渲染「小知识」标题（`.allusion-title`）与 `.allusion-text`/`.allusion-explain`；无内容整卡不渲染（沿用 v2.1 EX-4 口径）。因此植物语料补齐 `allusion` 后**无需任何前端改动**即自动展示。
- **不改**：路由 `/plants/:id`、`location.state`（section / category / list / restoreScroll）、`SECTION_HOME` 返回文案派生、部位切换、喇叭音频播放、沉浸式 / 全屏 / 增量加载逻辑、`styles.css`。
- US-6 沉浸换株、US-7 喇叭、US-8 默认部位跟随分类、Sprint 6 无滚动红线、Sprint 10 增量加载与「共 N 种」、Sprint 12 返回文案派生均不受影响。

## S13-2. 测试更新（配合 QA-31 / QA-32）
- 前端单测**不新增**（`AllusionCard` 逻辑已由既有断言覆盖）。
- E2E 新增 **TC-128**（此前缺失小知识的植物，如 apple，详情 `.allusion-card` 与 `.allusion-title` 渲染）、**TC-129**（同株「花 / 叶 / 果」小知识文案互不相同）；既有 50 用例全量回归。

---

# 前端开发设计文章 — Sprint 14（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-18 |
| 结论 | **本迭代前端零改动**（R-34）。纯内容扩容。 |

## S14-1. 零改动确认
- 板块列表 / 单图详情 / 音频喇叭 / 增量加载均为**数据驱动**：`/api/plants?section=*` 返回条数增加后，`loadAllCards` 按滚动步进自然补全，「共 N 种」（`.list-count`）取接口返回总数——**无需任何前端改动**。
- **不改**：路由 `/plants/:id`、`location.state`（section / category / list / restoreScroll）、`SECTION_HOME` 返回文案派生、单图详情分支（`.detail-body.single-image`、无部位切换）、喇叭音频播放、沉浸式 / 全屏 / 增量加载逻辑、`styles.css`。
- US-6 沉浸换株、US-7 喇叭、US-8 默认部位跟随分类、Sprint 6 无滚动红线、Sprint 9 板块导航与单图模型、Sprint 10 增量加载、Sprint 12 返回文案派生均不受影响。

## S14-2. 测试更新（配合 QA-30 / QA-31）
- 前端单测**不新增**（组件逻辑不变；TC-106「共 N 种」等 mock 驱动用例不受真实语料计数影响）。
- E2E **更新**：TC-114「共 30 种」→「共 50 种」+ `loadAllCards(page, 50)`；`sprint9.spec.js` TC-90 / TC-94 与 `sprint11.spec.js` TC-115~TC-117 同步由 30 改 50。
- E2E **新增**：`sprint14.spec.js` **TC-130**（三板块扩容至 50，末位新增条目如「鸵鸟 / 小虾 / 翼手龙」可见）、**TC-131**（新增条目单图详情 + 音频喇叭）、**TC-132**（新增 60 图 HTTP 200）、**TC-133**（新增 120 音频 HTTP 200）。

---

# 前端开发设计文章 — Sprint 15（增量：v2.6 更名 + 两大组导航 + 启蒙板块适配）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-18 |
| 依据 | docs/product/iteration-15-requirements.md（Q1~Q8 冻结）、PRD §20（v2.6） |

## S15-1. 站点更名（`HomePage.jsx` + `index.html`）
- 标题三行：`.site-title-pinyin` = `rèn zhī xiǎo tú jiàn`；`.site-title-zh` = `认知小图鉴`；`.site-title-en` = `Cognitive Guide`。
- `index.html` `<title>` → `认知小图鉴 Cognitive Guide`。
- 旧文案「自然小图鉴 / zì rán xiǎo tú jiàn / Nature Guide」全量清除（同步 README、AGENTS、前端单测 TC-79、E2E TC-89）。

## S15-2. 两大组板块导航（`SectionNav.jsx`）
- 结构由「4 个平铺按钮」改为**两组**：
  - 组 1 `自然认知`：plant(植物) / animal(动物) / insect(昆虫) / dinosaur(恐龙)
  - 组 2 `认知启蒙`：letter(英文字母) / pinyin(汉语拼音) / number(数字) / color(颜色)
- 每个板块一个按钮（复用 `.filter-btn` 视觉与热区 ≥56px）；组标题用 `role="presentation"` 的 `.section-group-title`。
- 容器仍为 `role="group" aria-label="板块导航"`（E2E TC-90 选择器不变），共 **8 个** `.filter-btn`。
- 导出常量 `SECTIONS`（8 项，含 `group` 字段）与 `SECTION_GROUPS`（两组元数据），供 HomePage 派生 `sectionLabel` 与详情返回文案。
- `number/color` 本迭代**无内容**：点击后走既有空态「这个板块还没有内容哦」，不报错。

## S15-3. 首页板块/二级筛选（`HomePage.jsx`）
- `sectionLabel` 由 `SECTIONS.find` 派生（含新 8 板块）。
- `plantCategories` 过滤**不变**（仍 `c.section === 'plant'` → 4 钮）；二级筛选仅植物板块渲染。
- 空态文案区分不变：「植物」→「这个分类还没有植物哦」，其余板块 →「这个板块还没有内容哦」。
- 增量加载 / 「共 N 种」/ 回花园恢复逻辑**零改动**（数据驱动，自动适配 26 条）。

## S15-4. 卡片名称条件渲染（`PlantCard.jsx`）
- 主标题 `deriveCardTitle` 恒渲染（分类派生仅对植物分类生效；字母/拼音板块 `category='all'` → 原名）。
- `.plant-card-pinyin` / `.plant-card-en`：**字段存在才渲染**（`plant.name.pinyin` / `plant.name.en` 为 null/undefined 时**不渲染该 div**），消除字母/拼音卡片的空白行（Q7）。

## S15-5. 详情页启蒙板块适配（`PlantDetailPage.jsx`）
- `SINGLE_IMAGE_KEYS` 由 `['animal','insect','dinosaur']` 扩为 `['animal','insect','dinosaur','letter','pinyin','number','color']`：字母/拼音走**单图分支**（无部位切换、无部位名行）。
- 名称行条件渲染：
  - `.detail-pinyin` 仅 `plant.name.pinyin` 存在时渲染；
  - `.detail-en`（含 `.detail-ipa`）仅 `plant.name.en` 存在时渲染；`ipa` 仍单独条件渲染。
- 喇叭：`zhAudio = plant.name.audioZh`，`enAudio = plant.name.en ? plant.name.audioEn : null` → **改为** `enAudio = plant.name.audioEn`（字母无 `en` 名但有 `audioEn`，须按实际音频字段渲染）；字母仅英文喇叭、拼音仅中文喇叭（Q7）。
- `SECTION_HOME` 增 `letter:'字母乐园'`、`pinyin:'拼音角'`（Sprint 16 预留 `number:'数字屋'`、`color:'颜色屋'`）；未知 section 仍回退「花园」。
- 键名 `id` → 「上一株 / 下一株」文案沿用（启蒙板块语义泛化由 Sprint 16 评估，本迭代不改）。

## S15-6. 样式增量（`styles.css`）
- 新增 `.section-group-title` 组标题（字号与次级文字一致、上间距 ≥16px）。
- 两组之间间距 ≥16px；复用既有 `.section-nav` flex 布局（`.filter-btn` 字号 22px、热区 ≥56px 不变）。
- 单图详情 `.detail-body.single-image` 横屏 64% 版式**沿用**，字母/拼音详情自动受益。

## S15-7. 测试更新（配合 QA-33 / QA-34）
- **更新** `HomePage.test.jsx`：TC-79 更名断言（三行新文案）；TC-80a 板块导航候选由 4 → 8 钮（两组），`CATEGORIES` mock 增 letter/pinyin 两条。
- **更新** `e2e/sprint9.spec.js`：TC-89 站点标题三行新文案；TC-90 板块导航 `.filter-btn` 计数 4 → 8，并断言两组标题「自然认知 / 认知启蒙」存在。
- **新增** `e2e/sprint15.spec.js`：TC-134（更名 + 两组 8 板块导航）、TC-135（切「英文字母」→ 26 卡 + `loadAllCards(page,26)` + 首卡 `Aa` + 「共 26 种」）、TC-136（切「汉语拼音」→ 26 卡 + 首卡 `a`）、TC-137（字母详情 `letter-a`：单图分支、无 `[role=tab]`、`.detail-zh` = `Aa`、无 `.detail-pinyin`/`.detail-en`、仅英文喇叭）、TC-138（拼音详情 `pinyin-a`：`.detail-zh` = `a`、仅中文喇叭）、TC-139（`letter`/`pinyin` 音频请求契约 `/audio/letter-a-en.m4a`、`/audio/pinyin-a-zh.m4a`）、TC-140（返回按钮文案「← 回字母乐园」「← 回拼音角」）、TC-141（字母/拼音 52 图 HTTP 200）、TC-142（52 音频 HTTP 200）。
- 既有全部用例全量回归。

# 前端开发设计文章 — Sprint 16（增量：v2.7 数字 0–20 + 颜色 11 色）

> 本迭代前端**产品代码零改动**：Sprint 15 已把 `number`/`color` 纳入全部派生结构；本迭代仅清理过期注释并更新测试。

## S16-1. 零改动确认
- `SectionNav.jsx`：`SECTIONS` 已含 `number`/`color`（group `enlightenment`），`SECTION_GROUPS` 已含 4 码；**导航仍 8 钮**，仅删除「number/color 本迭代无内容（点击走既有空态）」过期注释。
- `PartSwitcher.jsx`：`PART_ORDER` / `PART_LABELS` 已含 `number`/`color`。
- `PlantDetailPage.jsx`：`SINGLE_IMAGE_KEYS` 已含 `number`/`color`（单图分支、无部位切换）；`SECTION_HOME` 已含 `number:'数字屋'` / `color:'颜色屋'`（返回文案派生）。
- `HomePage.jsx`：`getPlantsBySection(section)` 已支持任意板块；`plantCategories = categories.filter(c => c.section === 'plant')` 恒为植物 4 钮。
- `PlantCard.jsx`：名称条件渲染对「保留中英文名」的数字/颜色条目正常渲染拼音行与英文行。

## S16-2. 名称渲染复核（与字母/拼音的差异）
- 数字 / 颜色条目**保留** `name.pinyin/en/ipa` → 详情头 `.detail-pinyin`、`.detail-en` 行**正常渲染**；喇叭**中英各一**（`audioZh`/`audioEn` 均存在）。字母 / 拼音的「仅符号」分支不受影响。

## S16-3. 测试更新（配合 QA-36/QA-37）
- 更新 `SectionNav.jsx` 过期注释（无功能变更）。
- **新增** `e2e/sprint16.spec.js`：TC-148（数字板块 21 卡 + 首 `number-0` 末 `number-20` + 「共 21 种」）、TC-149（颜色板块 11 卡 + 首 `color-black` 末 `color-grey` + 「共 11 种」）、TC-150（数字详情 `number-1` 单图分支、无 `[role=tab]`、名称含中文/拼音/英文行、中英喇叭各一）、TC-151（颜色详情 `color-red` 单图分支）、TC-152（返回文案「← 回数字屋」「← 回颜色屋」）、TC-153（`/audio/number-1-zh.m4a` + `/audio/number-1-en.m4a` + `/audio/color-red-zh.m4a` 请求契约）、TC-154（数字/颜色 32 图 HTTP 200）、TC-155（数字/颜色 64 音频 HTTP 200）。
- 既有全部用例全量回归。

---

# 前端开发设计文章 — Sprint 18（增量：v2.9 书本集合：书架首页 + `/books/{code}` 书内页）

| 项 | 内容 |
|---|---|
| 作者 | R |
| 日期 | 2026-10-24 |
| 依据 | docs/product/iteration-18-requirements.md（Q1~Q14 冻结、验收 76~86）、docs/iterations/sprint-18.md §二 实现契约、docs/design/ui-style-guide.md（U18-x 由 UI 出规范，类名以 §2.1 契约为准） |
| 范围 | 前端 IA 重构 + 样式 + 8 张封面资产接入 + 测试迁移；**不改**后端接口签名/响应结构、内容语料、详情页版式与字号 |

## S18-0. 总体原则与「明确不做」

- **迁移而非复制**：`frontend/src/pages/HomePage.jsx` **删除**，其列表逻辑（`PAGE_SIZE`、`plants`、`visibleCount`、哨兵 IO、滚动记忆、pendingScroll 恢复）**整体搬入** `frontend/src/pages/BookPage.jsx`。全仓不允许存在两份列表逻辑：不保留 `HomePage.jsx` 空壳、不做 `HomePage → BookPage` 的 re-export 别名、不保留 `import HomePage from '../pages/HomePage'`。
- **不做**（避免虚假路径 / 重复实现）：
  - 不新增 `/books` 索引路由、不新增 `*` 通配路由（未知 code 在 `BookPage` 内部兜底，不引入第二套 404 页面）。
  - 不做书内真·翻页 / 章节目录 / 抽书翻书动画（Q2、Q7、Q9 冻结）。
  - 不把 `visibleCount` / 滚动位置写进 URL query（书内页 URL 只有 `:code`）。
  - 不给 8 本书硬编码一份 `BOOKS` 数组（书单唯一来源 `GET /api/categories`，见 S18-3）。
  - 不保留旧滚动键 `sh:homeScroll` / `sh:homeVisibleCount` 的读写兼容层（新旧并存必然串味，一次性失效可接受）。
  - 不删除 `CategoryFilter.jsx`（Sprint 17 起已无引用，属遗留死代码，清理不在本迭代范围，记入技术债）。
  - 不改 `api/client.js` 的既有导出签名（`getPlantsBySection` 仍被 `bookCache` 复用；`getPlants` 已无调用方但保持不动）。

## S18-1. 板块常量重构（`components/SectionNav.jsx`）

**文件**：`frontend/src/components/SectionNav.jsx`（**保留文件名**，内容改为纯常量模块；改名另立事项，本迭代不做，以减少 diff 与 import 路径波动）。

**改动**：
1. `SECTIONS` 每项由 `{code,label,group}` 扩为 `{code,label,group,cover}`，`cover` 由统一模板生成，避免 8 处手写路径：
```js
export const COVER_DIR = '/images/covers/';
export const coverPath = (code) => `${COVER_DIR}${code}.jpg`;

export const SECTIONS = [
  { code: 'plant',    label: '植物',     group: 'nature',        cover: coverPath('plant') },
  { code: 'animal',   label: '动物',     group: 'nature',        cover: coverPath('animal') },
  { code: 'insect',   label: '昆虫',     group: 'nature',        cover: coverPath('insect') },
  { code: 'dinosaur', label: '恐龙',     group: 'nature',        cover: coverPath('dinosaur') },
  { code: 'letter',   label: '英文字母', group: 'enlightenment', cover: coverPath('letter') },
  { code: 'pinyin',   label: '汉语拼音', group: 'enlightenment', cover: coverPath('pinyin') },
  { code: 'number',   label: '数字',     group: 'enlightenment', cover: coverPath('number') },
  { code: 'color',    label: '颜色',     group: 'enlightenment', cover: coverPath('color') },
];

// 书内页标题 + 详情页返回文案的唯一来源（Sprint 18 取代 PlantDetailPage 内联 SECTION_HOME）
export const SECTION_BOOK_TITLE = {
  plant: '植物书', animal: '动物书', insect: '昆虫书', dinosaur: '恐龙书',
  letter: '英文字母书', pinyin: '汉语拼音书', number: '数字书', color: '颜色书',
};

// 按 code 反查板块；未知 code 返回 null（统一 null 而非 undefined，调用方一律 if (!section) 判定）
export const getSection = (code) => SECTIONS.find((s) => s.code === code) || null;
```
2. `SECTION_GROUPS` **原样保留**（`key/title/codes`），仍为书架两层的层序与层标题来源。
3. **移除默认导出组件** `export default function SectionNav(...)`：板块按钮语义由 `/books/{code}` 取代，不再保留任何按钮渲染逻辑。

**受影响 import（全量清单）**：

| 文件 | 现状 | 处理 |
|---|---|---|
| `src/pages/HomePage.jsx` | `import SectionNav, { SECTIONS }` | 文件删除（见 S18-5） |
| `src/pages/BookShelfPage.jsx`（新增） | — | 不 import `SectionNav`，只经 `BookShelf` 取书单 |
| `src/components/BookShelf.jsx`（新增） | — | `import { SECTION_GROUPS, getSection } from './SectionNav'` |
| `src/components/BookCard.jsx`（新增） | — | `import { SECTION_BOOK_TITLE } from './SectionNav'`（仅 aria-label / 备用标题用） |
| `src/pages/BookPage.jsx`（新增） | — | `import { getSection, SECTION_BOOK_TITLE } from '../components/SectionNav'` |
| `src/pages/PlantDetailPage.jsx` | 无 SectionNav 依赖（本地 `SECTION_HOME` 常量） | 删除本地 `SECTION_HOME`，改 `import { getSection, SECTION_BOOK_TITLE } from '../components/SectionNav'`（见 S18-6） |
| `src/App.jsx` | `import HomePage` | 改 import `BookShelfPage` / `BookPage`（见 S18-2） |
| `src/__tests__/HomePage.test.jsx` | 直接测 `HomePage` | 拆分/重写为 `BookShelfPage.test.jsx` + `BookPage.test.jsx`，原文件删除（见 S18-8） |
| `src/__tests__/PlantDetailPage.test.jsx` | 断言 `回花园 / 回动物世界…` | 断言改为 `回{板块名}书` + `href="/books/{code}"`（见 S18-8） |

**边界**：`getSection` 精确匹配、**不做大小写/别名归一**（`/books/PLANT` 视为未知 → 兜底）；`SECTIONS` 的书写顺序只作兜底，书架实际顺序由 `categories.order` 决定（S18-3）。

**测试配合**：常量模块单测可并入 `BookShelfPage.test.jsx`（断言 8 项 `cover` 形如 `/images/covers/{code}.jpg`、`SECTION_BOOK_TITLE` 8 键齐备、`getSection('unknown') === null`）。

## S18-2. 路由（`App.jsx`）

**文件**：`frontend/src/App.jsx`。

**改动**：三条路由，`/` 只放书架，`/plants/:id` 不动：
```jsx
<Routes>
  <Route path="/" element={<BookShelfPage />} />
  <Route path="/books/:code" element={<BookPage />} />
  <Route path="/plants/:id" element={<PlantDetailPage />} />
</Routes>
```

**数据结构**：`BookPage` 用 `useParams()` 取 `code`（react-router 已解码），`const section = getSection(code)`：

- `section` 非空 → 正常书内页，标题 `SECTION_BOOK_TITLE[code]`，列表 `fetchBook(code)`。
- `section` 为空 → **早退兜底 UI**（不进入列表分支）：`「这本书还在路上哦」` + `<Link className="back-btn" to="/">回书架</Link>`。**不发起** `/api/plants?section=` 请求（避免后端 40001 弹错）、**不读** sessionStorage、**不**建 IO 哨兵。

**边界**：兜底 UI 复用 `.state-tip` 排版，不新增页面级错误页组件；`/books/`（缺 code）不匹配该路由 → 落到 React Router 默认 404 空页（与现状一致，本迭代不补，避免新增全站 404 页）；前端不做 `/books/{code}` 与 `/plants/{id}` 之间的互相 redirect。

**测试配合**：单测断言「未知 code 不触发任何 `fetch` 且文案/href 正确」；E2E 验收 83（`/books/unknown` 不白屏、`回书架` 可点）。

## S18-3. 书架数据流（`BookShelfPage.jsx` + `BookShelf.jsx` + `BookCard.jsx`）

**文件**：
- `frontend/src/pages/BookShelfPage.jsx`（新增）：站头三行（`.site-title-pinyin` `rèn zhī xiǎo tú jiàn` / `.site-title-zh` `认知小图鉴` / `.site-title-en` `Cognitive Guide`，与 HomePage 逐字一致）+ `<BookShelf />`。
- `frontend/src/components/BookShelf.jsx`（新增）：两层书架。
- `frontend/src/components/BookCard.jsx`（新增）：单本书。

**数据流**：

1. `getCategories()` 取书单（**唯一来源**，不硬编码 8 本）。归组规则（注意：`categories[].section` 存的是**板块 code**（如 `'plant'`），不是组名）：
```js
const meta = getSection(c.section) || getSection(c.code); // 兼容 section 缺失/新 code
if (!meta) return;                                        // 未知板块 → 忽略，不崩溃
bucket[meta.group].push(c);                               // group ∈ {nature, enlightenment}
```
2. 组序取 `SECTION_GROUPS` 顺序；组内 `order` **数值升序**，`order` 相同（或缺失）时按 `code` 字符串升序兜底，保证渲染稳定、不依赖接口顺序。
3. 空组不渲染该层（不显示空层标题）；两层都有书时才出现两个 `.shelf-row`。
4. 数量：书单就绪后**并发**取每本的数量，失败不影响书名：
```js
const results = await Promise.allSettled(books.map((b) => fetchBook(b.code)));
// fulfilled → counts[b.code] = results[i].value.length；rejected → 不写入（保持「未知」）
```
5. `BookCard` 结构（封面花纹 + HTML 文字叠加，符合 Q5/Q13）：
```jsx
<Link className="book" to={`/books/${book.code}`}
      aria-label={count == null ? book.nameZh : `${book.nameZh}，共 ${count} 种`}>
  <span className="book-cover" style={{ backgroundImage: `url(${cover})` }}>
    <span className="book-title-zh">{book.nameZh}</span>
    {book.pinyin ? <span className="book-title-pinyin">{book.pinyin}</span> : null}
    {book.nameEn ? <span className="book-title-en">{book.nameEn}</span> : null}
    <span className="book-count">{count == null ? '' : `共 ${count} 种`}</span>
  </span>
  <span className="book-spine" aria-hidden="true" />
  <span className="book-pages" aria-hidden="true" />
</Link>
```
   - 封面**书名取 `category.nameZh`**（「植物」），书内页 h1 取 `SECTION_BOOK_TITLE`（「植物书」）：因 `pinyin/nameEn` 是 `nameZh` 的同源转写（`zhí wù` / `Plant`），封面若拼「书」会与拼音失配；此为 R 定案（PO 若要求封面也带「书」字，仅 `nameZh + '书'` 一行改动，不动数据）。
   - 拼音 / 英文缺失时**不渲染该行**（沿用 S15-4 条件渲染口径，不出现空白行）。

**三态**：
| 态 | 判定 | 呈现 |
|---|---|---|
| 书单加载中 | `categories === null` | `.state-tip` + `Spin` + 「加载中…」 |
| 书单失败 | `error` 非空 | `.state-tip`，文案 `error.message \|\| '哎呀，出了点小问题，请稍后再试'`（与现首页口径一致）；重进页面重试，不做自动重试 |
| 数量未就绪 / 失败 | `counts[code] == null` | `.book-count` 高度固定占位（`min-height` 由 UI 定），内容为空字符串；书名/拼音/英文/可点击均正常 → 避免布局跳动（验收 77 的「N 种」在有数据后补显） |

**数据驱动零改码**：新增一条分类（含 `order`，`section` 指向 8 个已知板块 code 之一，如 `{code:'plant2', section:'plant', order:2}`）→ 该层自动多一本书、封面走 `/images/covers/{新code}.jpg`，前端不改码（验收 85）。封面文件缺失时 `.book-cover` 以 CSS 底色兜底，不阻塞渲染。新 book code 的 `BookPage` 可读性依赖 S18-附 建议 1 的判定分支（`getSection` 未命中时回落 `getCategories()` 查证），否则「书架能上架、点进去却说还在路上」，请一并确认。

**边界**：不做书本排序自定义、不做收藏/阅读进度（§六 非目标）；不做 `counts` 的持久化（会话内由 `bookCache` 承担）；`BookShelf` 不订阅路由变化。

**测试配合**：单测 mock `CATEGORIES` 8 条验两层各 4 本、`order` 乱序输入仍按升序渲染、数量 mock 各不同长度验「共 N 种」、数量 reject 验书名仍在且无数字、`getCategories` reject 验错误文案、**新增第 9 条分类**验零改码上架；`clearBookCache()` 必须在该文件 `beforeEach` 调用。

## S18-4. 缓存模块 `api/bookCache.js`

**文件**：`frontend/src/api/bookCache.js`（新增，不改 `api/client.js`）。

**数据结构**：模块级 `Map<code, Promise<Plant[]>>`（**存 Promise 而非数组** —— 并发 8 次 + 书内页天然共享同一个 in-flight 请求）。
```js
import { getPlantsBySection } from './client';

const cache = new Map(); // code -> Promise<list>

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

export function clearBookCache() { cache.clear(); } // 仅供测试隔离
```

**复用位置**：

| 位置 | 用法 | 效果 |
|---|---|---|
| `BookShelf` 数量 | `Promise.allSettled(8 × fetchBook(code))` | 首屏并发 8 次，各板块仅 1 次网络请求 |
| `BookPage` 列表 | `fetchBook(code)`（`code === section`） | 从书架点进书 → **命中缓存，零请求**，列表瞬时可达 |
| `PlantDetailPage` 深链接邻居列表 | `fetchBook(section)`（替换现状 `getPlantsBySection`） | 详情页回书 / 连翻复用同一份列表 |

**边界**：
- 缓存粒度 = 「某板块全量列表」，**不缓存** `getCategories()`（书单轻量，每次进书架重新取，保证新增分类即时可见）与 `getPlant(id)`（详情现状不变）。
- 不落 `sessionStorage` / `localStorage`（列表体积大：plant 204 条，序列化成本与陈旧风险不划算）；模块级 Map 随 SPA 刷新重建，内容更新自然可见。
- `Plant` 数组按引用共享：调用方**不得原地修改**（现有 `BookPage` 只做 `slice` 渲染，满足该约束）。
- 不改任何请求路径与响应解析，接口契约零变化（验收 84）。

**测试配合**：单测断言「同 code 两次 `fetchBook` → `getPlantsBySection` 仅调用 1 次」；「reject 后再调一次 → 重新发起请求（调用次数 2）」、「`clearBookCache()` 后重新请求」；各测试文件 `beforeEach` 调 `clearBookCache()` 防止跨用例串数据。

## S18-5. BookPage 列表逻辑（自 HomePage 迁移）

**文件**：`frontend/src/pages/BookPage.jsx`（新增）；`frontend/src/pages/HomePage.jsx`（**删除**）。

**迁移项（整体搬走，不复制）**：`PAGE_SIZE = 16`、`plants`（`null` = 加载中）、`error`、`visibleCount`、`sentinelRef` + `IntersectionObserver`（`rootMargin:'200px'`，`visibleCount >= plants.length` 时不渲染哨兵、`typeof IntersectionObserver === 'undefined'` 时降级全量）、`visibleCount → sessionStorage` 记录 effect、`pendingScroll` 恢复 effect（含「恢复条数不足则继续 +16」的兜底）。

**丢弃项（书内页不再需要）**：`section` state（改由 URL `:code` 派生，只读）、`firstFilterRef`（无板块切换）、`handleSectionChange`、`<SectionNav />` 渲染、植物二级筛选相关分支。

**新结构**：
```jsx
<main className="page book-page">
  <div className="book-topbar">
    <Link className="back-btn" to="/">← 回书架</Link>
    <h1 className="book-title">{SECTION_BOOK_TITLE[code]}</h1>
  </div>
  <section className="page-block" aria-label={`${SECTION_BOOK_TITLE[code]}列表`}>
    …（error / Spin / 空态「这个板块还没有内容哦」/ `.list-count` 共 N 种 / `.plant-grid` + PlantCard + `.load-sentinel`）
  </section>
</main>
```
- 空态**统一**为「这个板块还没有内容哦」（取消 `section === 'plant' ? '这里还没有植物哦'` 分支，书是容器，不再区分板块措辞）→ 既有 TC-13 断言按此更新。
- 数据源 `fetchBook(code)`（S18-4 缓存），effect 依赖 `[code]` + `alive` 竞态守卫（`:code` 变化时同一组件实例复用，必须防陈旧回写）。

**滚动键（按书隔离）**：`sh:bookScroll:{code}`、`sh:bookVisibleCount:{code}`。
- 写入方两处：`BookPage` 的 `visibleCount` effect；`PlantCard` 的 `rememberScroll`（由写死 `sh:homeScroll` 改为 `sh:bookScroll:${section}`——`section` 已是 code，**这是 PlantCard 唯一改动**，类名与 `deriveCardTitle` 不动）。
- 只读方：`BookPage` 初始化与恢复 effect。

**恢复判定（关键，两态必须在同一份代码里显式区分）**：
```js
const key = (k) => `sh:${k}:${code}`;
const readNum = (k) => { try { return Number(sessionStorage.getItem(key(k))) || 0; } catch { return 0; } };

const fromDetail = Boolean(location.state?.restoreScroll); // 详情页返回
// 条数：无论从详情还是从书架进入，都恢复该书已读条数（至少首屏 16）——契约 §2.2.4
const [visibleCount, setVisibleCount] = useState(() => Math.max(PAGE_SIZE, readNum('bookVisibleCount')));

const restoredRef = useRef(false);
useEffect(() => {
  if (plants === null || restoredRef.current) return;
  const target = fromDetail ? readNum('bookScroll') : 0; // 从书架进入：滚动置顶
  window.scrollTo(0, target);
  // 兜底：目标位置超出已渲染高度 → 继续 +PAGE_SIZE 补加载后复位（沿用 Sprint 10 逻辑）
  if (fromDetail && window.scrollY < target - 2 && visibleCount < plants.length) {
    setVisibleCount((c) => Math.min(plants.length, c + PAGE_SIZE));
    return;                       // 不复位 restoredRef，下轮继续
  }
  restoredRef.current = true;
}, [plants, visibleCount]);
```
- 判定要点：**「是否从详情返回」只看 `location.state?.restoreScroll`**，不能用「sessionStorage 是否有值」推断（书架第二次进入时该键必然已有值）；「滚动置顶」用 `scrollTo(0, 0)` 显式执行，而非「不调用」——上一本书的滚动位置会残留到本页。
- 多书隔离由 key 后缀保证：植物书滚到中段 → 切动物书（书架进入）→ 动物书 `scrollTo(0,0)`；分别返回时各自恢复（验收 82）。

**边界**：不把 `visibleCount` 恢复与「从书架进入」混为一谈（见上代码）；不做书内章节/翻页；`BookPage` 不在书间做书籍导航（跨书只能回书架）；书内页不做 `category` 概念（Sprint 17 起已取消）。

**测试配合**：`BookPage.test.jsx` 承接原 HomePage 列表用例（详见 S18-8），新增「两本书滚动/条数互不串味」「从书架进入 scrollY=0」「从详情带 `restoreScroll` 恢复条数与位置」「未知 code 不发请求」。

## S18-6. 详情页返回改造（`PlantDetailPage.jsx`）

**文件**：`frontend/src/pages/PlantDetailPage.jsx`（**只改返回相关与列表兜底，版式/字号/喇叭/沉浸/换株逻辑不动**）。

**改动**：

1. 删除本地 `SECTION_HOME`（`花园 / 动物世界 / 昆虫角 / 恐龙园 / 字母乐园 / 拼音角 / 数字屋 / 颜色屋`），改为从 `SectionNav.jsx` 取唯一来源：
```js
import { getSection, SECTION_BOOK_TITLE } from '../components/SectionNav';

const rawSection = location.state?.section || 'plant';
const code = getSection(rawSection) ? rawSection : 'plant'; // 未知 section 回退 plant（沿用现状语义）
const bookTitle = SECTION_BOOK_TITLE[code];                // 「植物书 / 动物书 / …」
```
2. 正常态返回按钮：
```jsx
<Link className="back-btn" to={`/books/${code}`} state={{ restoreScroll: true }} onClick={stop}>
  ← 回{bookTitle}
</Link>
```
   - 目标由 `/` 改为 `/books/{code}`；`state` **只带 `restoreScroll: true`**（不再带 `section/category/list`：书内页以 URL `:code` 为准，避免 state 与 URL 不一致产生分叉真相）。
3. 40401 兜底：文案 `回{bookTitle}看看`，`to={'/books/' + code}`（同步改造，不能只改正常态）。
4. 深链接邻居列表：`list` 缺失时由 `getPlantsBySection(section)` 改为 `fetchBook(code)`（共享 S18-4 缓存，书内页 → 详情 → 回书不再重复请求）。
5. `usePlantNavigation({ list, currentId: id, section: code })`：仅传参名归一，连翻依旧携带 `{ section: code, list }`，保证连翻后「回书」文案与目标仍正确。

**边界**：详情 40401 文案「这株植物还没准备好哦」**不改**（非本迭代范围）；不改 `.detail-*` 任何样式；不改沉浸式/全屏/滑动/键盘换株；`code` 只用于返回目标与文案，不参与详情数据请求（详情仍按 `id`）。

**测试配合**：`PlantDetailPage.test.jsx` 更新 TC-33 / TC-119 / TC-120 / TC-121 等返回断言为「← 回植物书」等，并断言 `href="/books/plant"`、`state.restoreScroll === true`；补 8 板块矩阵（含 `number/color`），断言本地不再有 `SECTION_HOME`（可用常量模块单测替代源码扫描）。

## S18-7. 样式类名清单（与 UI 规范 U18-x 对齐）

**文件**：`frontend/src/styles.css`（新增四组：书架 / 书本 / 封面 / 书内页容器；具体尺寸、字号、留白比例以 UI 规范 U18-x 为准，R 只锁定类名与 DOM 结构）。

| 类名 | 归属组件 | 作用 | 关键约束 |
|---|---|---|---|
| `.bookshelf` | `BookShelf` | 书架容器（两层纵向） | 页内一屏放下：`1024×768` 与 `1180×820` 页面级纵向溢出 **0** |
| `.shelf-row` | `BookShelf` | 一层（4 本） | 层内横向均分，`gap` 由 UI 定 |
| `.shelf-title` | `BookShelf` | 层标题（自然认知 / 认知启蒙） | 沿用 S15 语义，不承担按钮功能 |
| `.book` | `BookCard`（`<Link>`） | 单本书容器 | `role` 天然 `link`；热区 ≥56px；`hover/focus-visible` 上抬 ≤4px |
| `.book-cover` | `BookCard` | 封面：花纹平铺底 | `background-image` / `background-repeat` / `background-size`；底色兜底 `#FDFBF6` |
| `.book-spine` | `BookCard` | 木色书脊竖条 | 统一色系，非装饰图 |
| `.book-pages` | `BookCard` | 书页厚度（CSS 拟真） | `aria-hidden` 纯装饰 |
| `.book-title-zh` | `BookCard` | 封面书名（中，大） | 选择器写作 `.book-cover .book-title-zh`，避免与 `.book-title` 混淆 |
| `.book-title-pinyin` | `BookCard` | 封面拼音（小） | 数据缺失时不渲染 |
| `.book-title-en` | `BookCard` | 封面英文（小） | 数据缺失时不渲染 |
| `.book-count` | `BookCard` | 「共 N 种」 | 固定 `min-height` 占位，防数量补显时布局跳动 |
| `.book-page` | `BookPage` | 书内页容器（纸感底 + 书脊阴影） | 不改变卡片规格与字号 |
| `.book-topbar` | `BookPage` | 顶栏（← 回书架 + 书名） | 复用 `.back-btn` |
| `.book-title` | `BookPage` | 书内页 `<h1>` | 仅 `.book-topbar .book-title` 使用；不与封面书名类混用 |

**明确不改（零回归红线）**：

- `.plant-card` / `.plant-card-img` / `.plant-card-zh` / `.plant-card-pinyin` / `.plant-card-en` / `.plant-grid`：卡片规格与字号沿用；`.book-page` **不再加覆盖规则**，书内页直接复用同一网格。
- `.list-count`、`.load-sentinel`、`.load-hint`：书内页照常复用，**不改行为**（E2E `loadAllCards` 依赖 `.load-sentinel` 消失判据）。
- `.state-tip`、`.back-btn`、`.filter-btn` 基础块（20px）与 `.part-switcher .filter-btn`：不动。
- `.section-nav` / `.section-group` / `.section-group-title` / `.category-filter` 规则：**保留不删、不再有渲染引用**（删除会连带影响 `styles.css` 源文件断言与潜在回滚，清理留给 UI 统一决定）；本迭代**不新增** `.section-nav` 用法。
- 详情页 `.detail-*` 全系（含 Sprint 17 名称字号、Sprint 10 单图 64% 横屏版式）：不动。

**测试配合**：样式源断言（读 `styles.css`）从「`.section-nav .filter-btn` 字号」迁移到 `.book-title` / `.book-title-zh` / `.book-count` 的实际规则（字号与占位高度按 UI U18-x 定稿后由 QA 落数）；`.filter-btn` 基础块 20px 的断言（TC-124）保留。

## S18-8. 测试更新（配合 QA）

**单测文件拆分（原 `HomePage.test.jsx` 删除，不双份维护）**：

| 新文件 | 迁移/新增用例 |
|---|---|
| `src/__tests__/BookShelfPage.test.jsx` | TC-79（站头三行）、TC-80a 改造（两层 8 本 `.book`、层标题「自然认知 / 认知启蒙」、`aria-label` 含数量）、数量「共 N 种」与数量失败态、`getCategories` 失败文案、`order` 乱序排序、**新增第 9 条分类零改码上架**、`cover` 路径契约、`getSection` 未知返回 null |
| `src/__tests__/BookPage.test.jsx` | TC-11（书内页 `queryByRole('button', {name:'全部'})` 等 4 钮均不存在；`.filter-btn` 计数 0）、TC-12（`getPlantsBySection('plant')` 仅 1 次 → 经 `fetchBook`）、TC-12b（卡片 `state` 含 `{section, list}`）、TC-13（空态改「这个板块还没有内容哦」）、TC-20（`loading="lazy"`）、TC-21（100 条全量降级）、TC-106（「共 N 种」）、TC-107（无 IO 降级无哨兵）、TC-108（16→32→40 追加）、TC-108b（按书恢复条数）、新增：从书架进入 `scrollTo(0,0)`、从详情 `restoreScroll` 恢复位置+条数、两书键隔离、未知 code 兜底（零请求 + `href="/"`）、顶栏「← 回书架」与 h1「植物书」 |
| `src/__tests__/PlantDetailPage.test.jsx` | 返回文案矩阵 8 板块（植物书/动物书/昆虫书/恐龙书/英文字母书/汉语拼音书/数字书/颜色书）+ `href="/books/{code}"`；40401 兜底「回{板块名}书看看」；深链接走 `fetchBook`（mock 断言） |

**受影响断言清单（R 主动提示 QA）**：

1. 详情返回文案与目标（TC-33、TC-119~TC-121、sprint12 的「回花园 / 回动物世界 / 回昆虫角 / 回恐龙园」、sprint15 的「回字母乐园 / 回拼音角」、sprint16 的「回数字屋 / 回颜色屋」）→ 全部改为「回{板块名}书」+ `/books/{code}`。
2. 滚动键：`sh:homeScroll` / `sh:homeVisibleCount` 断言 → `sh:bookScroll:{code}` / `sh:bookVisibleCount:{code}`。
3. 板块按钮断言（TC-80a 8 钮、TC-81 切板块触发 `?section=`、TC-25b `.section-nav` 布局、TC-123 `.section-nav .filter-btn` 字号）→ 书架 `.book` 断言 / `gotoBook` 直进 / 新样式规则断言。
4. 首页列表断言（TC-11/12/13/20/21/106/107/108/108b、TC-146、TC-59、TC-64）→ 迁入 `BookPage.test.jsx`（语义不变，路径变）。
5. E2E 站点标题（TC-79 → TC-89 站头仍在 `/`）保留在书架页。

**E2E helper 设计（`e2e/helpers.js`）**：
```js
// 直进某本书：书内页顶栏出现即视为就绪（避免与列表加载竞态混淆）
export async function gotoBook(page, code) {
  await page.goto(`/books/${code}`);
  await expect(page.locator('.book-topbar')).toBeVisible({ timeout: 15000 });
}
// loadAllCards 保持独立（不改签名、不改「哨兵消失 且 条数达标」双条件、保留开头 scrollTo(0,0) 的 D17-1 修复）
```
- 迁移口径：11 个 spec、约 35 处 `page.goto('/')` 中，凡断言 `.plant-card` / `loadAllCards` / 板块内容的改为 `gotoBook(page, code)`；跨书场景一律「回书架再点书」或直接 `gotoBook`（书内页不提供书间导航，不能沿用「点板块按钮」）。
- 新增 `e2e/sprint18.spec.js`（TC-162~TC-170，编号交 QA 定稿）：书架 8 本两层 + 1024×768 / 1180×820 页面级零溢出（验收 76）、封面花纹与文字（77/78）、点击进书 + 顶栏（79）、书内列表与 206 全量加载（80）、详情返回文案 + 回书恢复（81）、多书滚动隔离（82）、未知 code 兜底（83）、接口契约与总量未变（84）、数据驱动新增分类（85，用 `page.route` 拦截 `/api/categories` 追加一条）、8 张封面 HTTP 200。
- **不写重复断言**：单测已覆盖纯派生/排序/缓存逻辑，E2E 只做跨页链路与真实数据量；不保留 `HomePage.test.jsx` 及其用例编号的「影子副本」。

---

## S18-附：对契约的补充与修正建议（仅记录，不修改 sprint-18 契约文本）

1. **建议补齐「未知 code」判定的数据驱动分支**：契约 §2.2.5 以 `getSection(code)` 为空即判「这本书还在路上」。但验收 85 要求「新增一条分类即零改码上架」——若新增分类的 code 不在 `SECTIONS`（现实是 `categories[].section === 自身 code`），书架会出现一本书，点进去却被判未知。建议实现为「`getSection(code)` 命中 ∪ `getCategories()` 中存在该 code」，命中后者时标题取 `SECTION_BOOK_TITLE[code] || `${category.nameZh}书``，内容仍 `fetchBook(code)`（后端 section 校验自 Sprint 15 起数据驱动，`?section={code}` 可直接用）。该分支仅未知 code 时多发 1 次 `getCategories()`；本节按此实现，并请 PO/Master 对本条口径确认（若确认「仅 8 个已知板块才可上架」，则删去该分支，`BookCard` 也只渲染已知板块分类）。
2. **契约 §2.2.4 措辞歧义**：「从书架进入恢复条数」与「从详情返回恢复条数」在本文档中统一为「**始终** `max(16, sh:bookVisibleCount:{code})`，仅**滚动位置**分两态（详情返回 → 恢复；书架进入 → 置顶 0）」，避免出现「从书架进入条数也不同」的第三种解释。
3. **封面书名口径**：契约只说「书名（中）」。本文档定案封面用 `category.nameZh`（「植物」），书内页 h1 用 `SECTION_BOOK_TITLE`（「植物书」），理由是拼音/英文与 `nameZh` 同源。若 PO 要求封面即显示「植物书」，改一行即可。
4. **`.section-nav` 样式**：契约未写其去留。本文档决定「保留 CSS、移除组件」，避免样式源断言与回滚面扩大；确认后由 UI 在 U18-x 中标注为「废弃待清理」。

---

# 前端开发设计文章 — Sprint 19（增量：v3.0 全站换肤 + 4 处路由过渡动画）

| 项 | 内容 |
|---|---|
| 依据 | `docs/product/iteration-19-requirements.md`（Q1~Q10 / 验收 87~93）、`docs/design/ui-style-guide.md` **U19-1 ~ U19-6**、`docs/iterations/sprint-19.md` §二（M19-1~M19-5） |
| 选定方案 | **P19-1 方案 A「温润纸感」**（主色 `#B45B3E` / 主色深 `#8A3E27`）；严格执行 A 列，未混入 B / C 任一色值 |
| 类型 | 纯前端样式 + 动效；后端 / 语料 / 路由结构 / 接口契约零改动 |

## S19-1. 换肤落地清单（旧 → 新，A 列）

`frontend/src/styles.css` 两处 `:root` 全部取值替换（规则体一律改引用变量，不动任何尺寸 / 字号 / 圆角 / 间距 / 列数 / 热区）。

| 用途 | 变量 | 旧值 | 新值（A） |
|---|---|---|---|
| 页面底 | `--color-page-bg` | `#fffdf5` | `#faf5ec` |
| 卡片底 | `--color-card-bg` | `#ffffff` | `#fffdf8` |
| 文字主 | `--color-text` | `#3e2723` | `#3a2a22` |
| 文字次 | `--color-text-light` | `#6d4c41` | `#6f5443` |
| 主色 | `--color-primary` | `#4caf50` | `#b45b3e` |
| 主色深 | `--color-primary-dark` | `#388e3c` | `#8a3e27` |
| 小知识卡底 | `--color-accent-bg` | `#fff8dc` | `#fbf0de` |
| 小知识卡描边 | `--color-accent-border` | `#f9a825` | `#b87a3d` |
| 书脊木色·中 | `--shelf-wood` | `#c9a876` | `#a87f55` |
| 书脊木色·深 | `--shelf-wood-dark` | `#a8825a` | `#8a6a47` |
| 书脊木色·浅 | `--shelf-wood-light` | `#e3cba5` | `#d3b48d` |
| 封面纸白 | `--book-paper` | `#fdfbf6` | `#fcf7ed` |
| 封面单墨 | `--book-ink` | `#d9c9ae` | `#d8c3a2` |
| 书页堆 | `--book-stack` | `#f3ebdd` | `#f2e8d8` |
| 书内页底 | `--book-page-bg` | `#fffdf9` | `#fffbf3` |
| **新增** 详情背景 | `--color-detail-bg` | （复用 page-bg） | `#f6eee2` |
| **新增** 聚焦描边 | `--color-focus` | （复用 primary-dark） | `#8a3e27` |
| **新增** 分隔线 | `--color-divider` | （散落硬编码） | `#e7dac6` |
| **新增** 阴影三元组 | `--shadow-rgb` | （硬编码 `62, 39, 35`） | `58, 42, 34` |

- `.bookshelf-page` 显式补 `background: var(--color-page-bg)`（此前靠 `body` 继承）；`.detail-immersive` 底色 `var(--color-page-bg)` → **`var(--color-detail-bg)`**；`.book-page-body` 维持 `var(--book-page-bg)`。
- 描边：`.back-btn` / `.filter-btn` / `.speak-btn` 沿用 `var(--color-primary-dark)`；`.book:focus-visible` 的 `outline` 由 primary-dark 改走 **`var(--color-focus)`**（U19-3 第 6 条：禁止用主色作聚焦描边）。
- antd 主题（`src/main.jsx`）：`colorPrimary '#4CAF50' → '#B45B3E'`，同步 `colorText '#3A2A22'`、`colorBgContainer '#FFFDF8'`，`borderRadius` 仍 16（避免 Spin 等组件残留旧棕 / 纯白与米纸底不一致）。

## S19-2. 除 token 外的硬编码色替换（5 处）

| 位置 | 旧硬编码 | 新写法 |
|---|---|---|
| `.book-pages` 书口条纹 | `#fffdf5` / `#e8e0d2` | `var(--book-page-bg)` / `var(--color-divider)` |
| 全站阴影（`.plant-card` / `.book` / `.shelf-plank` / `.book-spine` / `.book-cover` / `.book-page-body`，共 10 处） | `rgba(62, 39, 35, α)` | **统一** `rgba(var(--shadow-rgb), α)`，α 原值不变（全站只用这一种写法，未混用 `rgb(... / ...%)` 语法） |
| `.shelf-row` 行背景渐变 | `rgba(227, 203, 165, 0.28)` | `color-mix(in srgb, var(--shelf-wood-light) 22%, transparent)`（终点 `transparent`），alpha 落 U19-3 的 22%±4% |
| `.book-spine` 沟槽 / `inset` 阴影 | `rgba(62, 39, 35, 0.28 / 0.18)` | `rgba(var(--shadow-rgb), 0.28 / 0.18)` |
| `.book:focus-visible` 描边 | `var(--color-primary-dark)` | `var(--color-focus)` |

- 保留的白：`.filter-btn.selected` / `.speak-btn.is-speaking` 的 `color: #fff`、`.nav-btn` 的背景/文字阴影 `rgba(255,255,255,0.85)`（M19-4 的 `#fff` 豁免项）。
- **不动的语义色**：`components/PartIcon.jsx` 的部位小图标（花/叶/果）是内容语义插画色（粉/绿/橙），不属主题 token 族，保持原样；该组件目前仅被已无入口的 `CategoryFilter` 与「非单图」`PartSwitcher` 分支引用（Sprint 17 起所有条目均为单键单图）。

## S19-3. 4 处路由过渡：实现方式与方向映射

**采用「目标页入场 keyframes」方案**（U19-5 明文允许的降级路径）：4 个方向全部由**目标页**的入场动画承载，不保留上一屏做退场。方向由页面根容器上的 `data-route-enter` 标记区分，标记值由 `useLocation().state?.from` 派生。

| # | 过渡 | 目标页 / 标记 | 时长 | 曲线 | 入场参数 |
|---|---|---|---|---|---|
| 1 | 书架 → 书内页（打开书本） | `BookPage` / `shelf-to-book` | 320ms | `cubic-bezier(0.2, 0, 0, 1)` | `opacity 0→1`，`translateY(10px)→0`，`scale(0.97)→1` |
| 2 | 书内页 → 书架（关闭书本） | `BookShelfPage` / `book-to-shelf` | 260ms | `cubic-bezier(0.4, 0, 1, 1)` | `opacity 0→1`，`translateY(-8px)→0`，`scale(0.98)→1`（取 U19-5 #2 退场参数反向） |
| 3 | 书内页 → 详情页（翻开一页） | `PlantDetailPage` / `book-to-detail` | 340ms | `cubic-bezier(0.2, 0, 0, 1)` | `opacity 0→1`，`translateY(12px)→0`，`scale(0.98)→1` |
| 4 | 详情页 → 书内页（合上返回） | `BookPage` / `detail-to-book` | 240ms | `cubic-bezier(0.4, 0, 1, 1)` | `opacity 0→1`，`translateY(-6px)→0`，`scale(0.99)→1`（取 U19-5 #4 退场参数反向） |

**标记派生与 `state.from`（M19-1 允许的最小追加：只在既有根容器加 `data-*`，不改 DOM 结构 / 层级 / 文案 / 尺寸）**

| 文件 | 改动 |
|---|---|
| `pages/BookShelfPage.jsx` | `<main className="bookshelf-page" data-route-enter={from==='book' ? 'book-to-shelf' : undefined}>`；其余（无 state / 刷新 / 直接输 URL）不挂 |
| `pages/BookPage.jsx` | `BookView` 根容器：`from==='shelf' → 'shelf-to-book'`、`from==='detail' → 'detail-to-book'`，其余不挂；「← 回书架」与未知 code 兜底链接补 `state={{ from: 'book' }}` |
| `pages/PlantDetailPage.jsx` | 根容器 `data-route-enter` 由 `useState(() => from === 'book' ? 'book-to-detail' : undefined)` **首次进入冻结**：详情页内「上一株 / 下一株」为同组件换 id（`navigate` 只带 `{section, list}`），标记不变即**不重播**；返回按钮与 40401 兜底补 `state={{ from: 'detail', restoreScroll: true }}` |
| `components/BookCard.jsx` | 链接 → `/books/{code}` 补 `state={{ from: 'shelf' }}`（不改 `to`，既有 `href` 断言不受影响） |
| `components/PlantCard.jsx` | 链接 → `/plants/{id}` 的 state 由 `{ section, list }` → `{ section, list, from: 'book' }`（邻居列表与原滚动记忆逻辑不变） |
| `pages/BookPage.jsx` 滚动恢复 | 仍以 `location.state?.restoreScroll` 判定「从详情返回」，`from` 仅用于动画方向，两者互不替代 |

- **containing block 红线**：动画只挂在页面根容器自身（`.bookshelf-page` / `.page.book-page` / `.detail-immersive`），**未在 `#root` / `<main>` 外层 / `App.jsx` 任何包装上加 `transform`**，`.detail-immersive` 的 `position: fixed` 与「整屏不滚动」（U6-1）不受影响；无常驻 `will-change`，keyframes 的 `to` 帧为 `transform: none`，动画结束无残留层。
- 只动画 `opacity` / `transform`，`animation-delay: 0ms`、单次 `both`；不对 `img` / `.plant-grid` / 卡片加动画。

**为何不用 View Transitions / 不引入动画库**：`document.startViewTransition` 会在快照期捕获「异步取数前的空列表 / Spin」画面，切页瞬间出现旧屏空态闪现；且书内页从缓存命中到列表渲染有 1~2 帧差，快照边界不可控。纯 CSS 入场只需给目标页根容器一个属性，无 API 特性检测、无旧屏留存、无额外 JS，`prefers-reduced-motion` 也能由媒体查询整体收口。当前 `package.json` 无任何动画依赖，本迭代未新增。

**与 U19-5 的差异说明（按允许路径记录）**：U19-5 的 #2 / #4 原为「上一屏退场」（`data-route-exit`），需保留旧屏 240~260ms；本迭代判定保留旧屏成本高（需 `<RouteFade>` 记录 previous location 或 View Transitions），改以**目标页入场**承载这 2 个方向——参数取该表 exit 行的时长 / 曲线 / 位移 / 缩放反向值（260ms / -8px→0 / 0.98→1，240ms / -6px→0 / 0.99→1），验收 90 / 91「200~400ms 渐变、无跳动闪烁」口径不变。因此产物中**不存在 `data-route-exit` 选择器**（reduced-motion 段仍保留其兜底规则，供后续迭代使用）。

## S19-4. `prefers-reduced-motion: reduce` 降级（U19-6）

`styles.css` 末尾新增 `@media (prefers-reduced-motion: reduce)`：

- `[data-route-enter]` → `sh-fade 120ms linear both` + `transform: none !important`（只留纯淡入，取消全部位移/缩放）；`[data-route-exit]` → `animation: none !important`（0ms 直切，本轮无使用）。
- `.book` / `.plant-card` / `.speak-btn` / `.filter-btn` / `.nav-btn` `transition: none`；`.book:hover/:focus-visible`、`.plant-card:hover/:focus-visible`、`.speak-btn:active` 一律 `transform: none`。
- `* { scroll-behavior: auto !important }`，保证返回书架 / 回列表的滚动恢复不受动画干扰。
- 降级只影响动效，不改布局尺寸、热区、对比度与配色 token。

## S19-5. 封面 tile 重出（S19-7 / U19-4）

- `scripts/generate-covers.mjs` 仅改两个常量：`INK '#D9C9AE' → '#D8C3A2'`、`PAPER '#FDFBF6' → '#FCF7ED'`；`SIZE=1200`、`CENTERS`（x=377/823、y=300/900）、`SCALES`、`MOTIFS`、`cjpeg -quality 82 -progressive` 全部未动。
- 运行方式沿用脚本头部注释：仓库根执行 `node scripts/generate-covers.mjs`（依赖根 `node_modules/@playwright/test` 的 chromium + 本机 `cjpeg`）。
- 重出结果：**8 张**同名同路径 `frontend/public/images/covers/{plant,animal,insect,dinosaur,letter,pinyin,number,color}.jpg`，全部 `1200×1200` **progressive**，合计 **208KB**（基线 204KB，同量级）。
- 墨迹率：脚本的墨迹判定基准色仍是旧纸白 `253/251/246`（本次按「只改两常量」未动该基准），新纸白与该基准仅差 14（< 阈值 18），判定口径不变；按 4 母题折算单母题墨迹率 0.38%~4.93%，仍满足 U18-6 的「单母题 ≤5%」。

## S19-6. 自检结果（与 QA 门禁衔接）

| 项 | 结果 |
|---|---|
| `npx vitest run` | **81/81 全绿**，3 文件（BookShelfPage 9 / BookPage 20 / PlantDetailPage 52）；**零测试改动**（配色与 `data-*` 追加未触发任何既有断言） |
| `npx vite build` | 退出码 0（1486 modules，CSS 13.72 kB / JS 280.84 kB） |
| 旧色清零 grep（`4CAF50 / 388E3C / F9A825 / FFF8DC / C9A876 / A8825A / E3CBA5 / D9C9AE / FDFBF6 / 62, 39, 35`） | `frontend/src` + `frontend/index.html` **零命中** |
| `styles.css` 色值收敛 | 除 `:root` 的 19 个 token 定义与 `#fff` / `rgba(255,255,255,α)` 豁免项外，规则体内无 `#` 硬编码色（M19-4） |

- 受影响断言评估：`TC-177` 仍命中 `.book-cover` 的 `background-color: var(--book-paper)`（底色单一）；`TC-178` 仍命中 base `.book:hover, .book:focus-visible { translateY(-4px) }`（reduced-motion 覆盖块在其后，不干扰首个匹配）；`TC-53/TC-54/TC-55` 的 `.detail-immersive` 首个块仍为 `position: fixed; inset: 0`，无 `100dvh`。
- 新增断言建议（交 QA S19-13）：`:root` 新 token 与旧主色缺失、`[data-route-enter='…']` 四条选择器的 `animation-name` / 时长落在 200~400ms、`@media (prefers-reduced-motion: reduce)` 存在且入场降为 120ms、E2E 加 `use.reducedMotion: 'reduce'` 后 4 处过渡直切可交互。

## S19-7. 「明确不做」

不改 JSX 结构 / 组件层级 / 类名 / 文案 / 路由与 `to`；不改任何尺寸、字号、圆角、内边距、列数、热区；不改后端、语料、图片条目、音频；不引入动画库、**不使用 View Transitions**、不新增依赖；未在 `#root` 及外层加 `transform`。





