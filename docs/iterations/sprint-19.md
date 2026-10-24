# Sprint 19 — v3.0 视觉重绘：全站配色焕新 + 翻书过渡动画

| 项 | 内容 |
|---|---|
| 迭代目标 | 解决 v2.9 人工复核提出的「配色搭配奇怪」：UI 出 3 套全站配色方案（可预览）→ PO 选定 1 套冻结（P19-1 待人工确认）→ 在**书架页 `/`、书内页 `/books/:code`、详情页 `/plants/:id`** 三处落地单一主色系换肤；8 张封面 tile 跟随新色板重出；补齐「打开书本 / 关闭书本 / 翻开一页 / 合上返回」4 处路由级轻量渐变动画，并保证 `prefers-reduced-motion` 降级直切。 |
| 状态 | **已交付**（2026-10-24 门禁全绿、QA 放行；**P19-1 方案 A 已经人工确认冻结**） |
| 依据 | [PRD.md §23](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md#L825-870)（v3.0 增量，US-29~US-30）；[iteration-19-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-19-requirements.md)（Q1~Q10 已冻结、验收 87~93） |
| 类型 | **纯前端样式 + 动效迭代**（后端 / 语料 / 路由结构 / 接口契约 / 条目插图零改动；仅 8 张封面 tile 重出） |
| 基线（Sprint 18 交付后） | 语料 440（plant 206，含 deprecated 2）/ 分类 8；API plant=204、all=438；图片 `.jpg` 448（条目 440 + 封面 8）/ `.svg` 206；音频 `.m4a` 1028；后端 28 用例 / vitest 81（3 文件）/ E2E 81（13 文件） |

## 一、迭代范围（Scope）

| 编号 | 范围项 | 认领 | 说明 |
|---|---|---|---|
| S19-1 | 3 套全站配色方案 + 可预览产物 | UI | 每套覆盖书架页（站头/书架底/封面 tile/书本文字）、书内页（顶栏/卡片/背景/`共 N 种`）、详情页（背景/名称区/部位切换/小知识卡）；每套给出完整 token 表 + 逐色对比度数值（正文 ≥4.5:1、大标题 ≥3:1）+ 可预览 HTML（三方案并排或可切换） |
| S19-2 | 方案选定与冻结 | PO（UI 供料） | PO 按幼龄向与可读性推荐 1 套并冻结，记录 **P19-1**（待人工确认，人工可推翻重选）；选定结果写入 UI 规范 U19-2 |
| S19-3 | 色板变量归一 + 全局底色/文字 | R | `styles.css` `:root`（1~11 行）与 Sprint 18 追加变量块（565~573 行）合并为**单一主色系** token 集；移除「绿 `#4caf50` + 木棕 `#c9a876` + 奶油黄 `#fff8dc`」并存 |
| S19-4 | 书架页换肤（`/`） | R | `.bookshelf-page`/`.site-header` 三行标题/`.bookshelf`/`.shelf-row`/`.book`/`.book-cover`/`.book-title*`/`.book-count` 全部改走新变量；版式尺寸不动 |
| S19-5 | 书内页换肤（`/books/:code`） | R | `.book-page` 顶栏/返回钮/`h1`/`.plant-grid` 容器底/`.list-count`/`.load-sentinel`/空态；`.plant-card` 系列颜色改走新变量，尺寸与类名不变 |
| S19-6 | 详情页换肤（`/plants/:id`） | R | `.detail-*` 背景/名称区（`.detail-zh`/`.detail-pinyin`/`.detail-en`）/`.part-switcher` 按钮/`.allusion-card`/`.speak-btn`/`.back-btn`；字号与版式零改动 |
| S19-7 | 8 张封面 tile 跟随新色板重出 | R + UI | 改 `scripts/generate-covers.mjs` 的 `INK`/`PAPER` 常量；`CENTERS`（x=377/823、y=300/900）与 8 个母题路径不变；仍 1200×1200、q82 渐进式 `.jpg` |
| S19-8 | 4 处路由过渡动画 | R | 书架→书内页（打开）/ 书内页→书架（关闭）/ 书内页→详情（翻开一页）/ 详情→书内页（合上返回）；淡入淡出为基础 + 可选 0.97→1 缩放 / ≤12px 位移；单段 200~400ms、`ease-out` 类曲线 |
| S19-9 | reduced-motion 降级 | R | `@media (prefers-reduced-motion: reduce)` 下 4 处过渡时长近似 0（直切），无位移/缩放残留 |
| S19-10 | UI 规范 U19-1~U19-6 | UI | 三套候选色板（色值表 + 对比度校验）、选定方案落地规范、动画规范（4 处时长/曲线/位移/缩放）、降级规范、封面 tile 新墨色/底色 |
| S19-11 | 前端设计文章 S19 章节 | R | `docs/design/frontend-design.md` 新增 S19：token 收敛策略、过渡实现方式（纯 CSS / `startViewTransition` 渐进增强）、降级路径、不回归自检清单 |
| S19-12 | 后端确认 | J | **零改动**；仅在 `docs/design/backend-design.md` 留「本迭代无接口/数据/缓存契约变更」确认记录 |
| S19-13 | 测试适配与新增用例 | QA | `playwright.config.js` 加 `use.reducedMotion: 'reduce'`；vitest 增加色板 token 断言 + 过渡 class/duration 断言 + reduced-motion 降级断言；补齐 4 处过渡与全套不回归用例；手册 `docs/qa/sprint-19-test-cases.md` |
| S19-14 | 计划与门禁证据 | Master | 本文件 §七；门禁全绿后更新 AGENTS.md「项目当前状态」并 commit |

## 二、实现契约（R/UI/QA 共同遵守）

### 2.1 文件与动作

| 路径 | 动作 |
|---|---|
| `frontend/src/styles.css`（932 行） | **主战场**：`:root`（1~11 行）与 Sprint 18 追加变量块（565~573 行）合并重写为新 token 集；各页面规则改为引用变量；新增页面入场 `@keyframes` 与 4 个方向 class；新增 `prefers-reduced-motion` 媒体查询。**不新增页面级尺寸/间距规则** |
| `frontend/src/pages/BookShelfPage.jsx` | 允许在既有 `<main className="bookshelf-page">` 上按 M19-1 追加过渡标记（不新增 DOM 节点、不改层级与文案） |
| `frontend/src/pages/BookPage.jsx` | 同上（`<main className="page book-page">` 与未知 code 兜底视图） |
| `frontend/src/pages/PlantDetailPage.jsx` | 同上（详情根容器） |
| `frontend/src/components/BookShelf.jsx` / `BookCard.jsx` / `PlantCard.jsx` | **零结构改动**（仅当必须区分方向时按 M19-1 追加属性，不改尺寸/文案/类名语义） |
| `frontend/src/App.jsx` | **零改动**（3 条路由不变、不新增路由） |
| `scripts/generate-covers.mjs` | 改 `INK` / `PAPER` 两个常量（及同族派生色）；`SIZE`/`CENTERS`/`MOTIFS`/输出路径/q82 流程不变 |
| `frontend/public/images/covers/*.jpg` | 重出 8 张（同名同路径，供回滚由 git 承担） |
| `frontend/playwright.config.js` | `use` 增加 `reducedMotion: 'reduce'` |
| `docs/design/ui-style-guide.md` | 新增 U19-1~U19-6 |
| `docs/design/frontend-design.md` | 新增 S19 章节 |
| `docs/design/backend-design.md` | 仅追加确认记录（S19-0） |

### 2.2 关键约定（Master 预置裁决 M19-1~M19-5）

| 编号 | 事项 | 裁决 |
|---|---|---|
| M19-1 | 动画需要方向标记，是否违反「不改 JSX 结构」 | **允许最小追加**：仅可在**既有页面根容器**上追加 `className` 片段或 `data-*` 属性（用于区分 `open` / `close` / `turn` / `back` 四方向）；**不新增/删除 DOM 节点、不改层级、不改标签、不改文案、不改尺寸**。若纯 CSS 选择器（如 `:has()` 或路径前缀）已能区分方向，则 JSX 完全零改动优先 |
| M19-2 | 动画实现方式（对齐 Q8） | **纯 CSS 优先**（入场 keyframes + 方向 class）；如 R 评估退出动画不可避免，允许 `document.startViewTransition` **渐进增强**（特性检测失败即直切，不报错、不引入动画库、不加依赖） |
| M19-3 | E2E 配置 | `playwright.config.js` 加 `use.reducedMotion: 'reduce'`，**既有 81 条用例断言零改动**；新动效用例以 vitest 断言 class/样式值/时长范围（jsdom 不校验真实动画帧） |
| M19-4 | 色板收敛 | 全站颜色必须来自 `:root` token（含 Sprint 18 的 `--shelf-*` / `--book-*` 7 个变量一并纳入），**禁止规则内硬编码色值**（`#fff`/`#000` 除外）；单一主色系（Q5） |
| M19-5 | 封面重出边界 | 仅换 `INK`（母题墨色）与 `PAPER`（纸白底色）；母题形状/位置/数量/密度不变；产物仍 1200×1200、q82 渐进式 `.jpg` |

### 2.3 动画参数基线（UI 定案后可微调，不得越界）

| 过渡 | 方向 | 入场 | 位移/缩放上限 | 时长 | 曲线 |
|---|---|---|---|---|---|
| 书架 → 书内页 | 打开书本 | 淡入 | opacity 0→1 + scale 0.97→1 | 260~320ms | ease-out |
| 书内页 → 书架 | 关闭书本 | 淡入 | opacity 0→1 + scale 1.015→1 或 ≤12px 上移 | 220~280ms | ease-out |
| 书内页 → 详情 | 翻开一页 | 淡入 | opacity 0→1 + scale 0.98→1 | 240~300ms | ease-out |
| 详情 → 书内页 | 合上返回 | 淡入 | opacity 0→1 + ≤12px 位移归位 | 220~280ms | ease-out |

硬约束：单段 ≥200ms 且 ≤400ms；**无布局跳动**（动画属性仅 `opacity` / `transform`，禁止动画 `width/height/top/left`）；动画期间不阻塞点击（`pointer-events` 保持默认）；`prefers-reduced-motion: reduce` 下 4 处全部 `animation-duration: 0.01ms` 级直切。

## 三、关键资产 / 规范

### 3.1 三套候选色板（UI 填表，PO 选定 → P19-1）

| 方案 | 方向描述 | 主色 | 页面底 | 卡片底 | 文字主/次 | 正文对比度 | 状态 |
|---|---|---|---|---|---|---|---|
| A | 待 UI 填 | 待填 | 待填 | 待填 | 待填 | ≥4.5:1 | 候选 |
| B | 待 UI 填 | 待填 | 待填 | 待填 | 待填 | ≥4.5:1 | 候选 |
| C | 待 UI 填 | 待填 | 待填 | 待填 | 待填 | ≥4.5:1 | 候选 |

选定结果：**待 PO 冻结**（记录 `P19-1`，人工可推翻）；冻结后 §3.1 只保留选定方案并标注「已冻结 2026-10-24」。

### 3.2 封面 tile 参数（S19-7）

| 项 | 现值（Sprint 18） | Sprint 19 |
|---|---|---|
| 尺寸 | 1200×1200 | 1200×1200（不变） |
| 底色 `PAPER` | `#FDFBF6` 纸白 | 随选定方案页面底/封面纸底派生 |
| 墨色 `INK` | `#D9C9AE` 浅棕 | 随选定方案主色淡色阶派生 |
| 母题中心 `CENTERS` | x=377/823、y=300/900 | **不变** |
| 母题形状 | 8 个（叶/爪印/蝴蝶/三趾印/Aa/a/1 2 3/圆点） | **不变** |
| 格式 | q82 渐进式 `.jpg`，2×2 四母题 | **不变** |

门禁资产校验项：8 张齐备、尺寸 1200×1200、渐进式、总量较 Sprint 18 不显著膨胀（基线合计 204KB）。

### 3.3 不回归硬清单（Q10，三处页面共同遵守）

| 项 | 基线值 |
|---|---|
| 书架 1024×768 / 1180×820 页面级溢出 | 0 / 0 |
| 书本尺寸 | 210×252（1024）/ 228×272（1180） |
| 书架可见本数 | 8 本两层一屏 |
| 书本四行文案 | 书名 / 拼音 / 英文 / 「N 种」全在 |
| 书内页首屏 / 步进 / 总量 | 16 / 16 / 「共 N 种」 |
| 滚动记忆 | `sh:bookScroll:{code}`、`sh:bookVisibleCount:{code}` 按书隔离 |
| 详情版式与字号 | `.detail-zh` 56px（横屏 52px）、`.detail-en` 30px（横屏 26px）等零变化 |
| `.plant-card` 规格与类名 | 尺寸/圆角/内边距/类名语义不变 |
| 控制台报错 | 0 |

## 四、测试迁移清单（QA 主责）

| 层 | 内容 |
|---|---|
| 配置 | `frontend/playwright.config.js` → `use.reducedMotion: 'reduce'`（全量生效，既有 81 条用例断言不改） |
| vitest 新增 | ① 色板 token 断言（`:root` 存在新 token 且**不再**含旧主色 `#4caf50` 等混搭色；关键规则引用 `var(--…)`）；② 4 处过渡断言（页面根容器带方向标记/动画 class、`animation-duration` 落在 200~400ms、`animation-name` 存在）；③ reduced-motion 断言（媒体查询存在且时长为 0 级直切）；④ 封面路径与 `coverPath` 仍指向 8 张 |
| vitest 更新 | 若既有用例断言了具体颜色/类名（如样式内联断言、`.section-nav` 规则），按新方案同步；**结构类断言（文案、尺寸、请求、滚动、增量加载）一律不动** |
| E2E 新增 | 4 处过渡（reduced-motion 下直切：点击后目标页立即可交互、无残留动画元素）；换肤后 3 页「关键尺寸不变」抽验（书本 rect、卡片 rect、详情主图占比）；书架/书内页零溢出复验；控制台 0 报错 |
| E2E 不迁移 | 既有 13 个 spec 的定位器与断言不变；如遇动画导致的可见性等待问题，只在 helper 层加 `waitFor` 兜底，**不改用例语义** |
| 资产核对 | 8 张封面：存在性、1200×1200、渐进式、总大小；`md5` 与本地一致 |
| 编号规则 | 三层各自续号（后端 TC / 前端 TC / E2E TC 分层续编，避免 D9-2 编号冲突） |

## 五、验收对应

| 验收 | 内容 | 落点 |
|---|---|---|
| 87 | 3 套方案 + 可预览产物 + 选定归档 P19-1 | S19-1 / S19-2 / S19-10 |
| 88 | 选定方案三页落地、无多主色系混搭、对比度达标、iPad 两档零溢出不回归 | S19-3 ~ S19-6 / S19-10 |
| 89 | 8 张封面按新色板重出、1200×1200 渐进式、构图不变 | S19-7 |
| 90 | 书架↔书内页渐变过渡，200~400ms，无跳动/闪烁/阻塞 | S19-8 |
| 91 | 书内页↔详情过渡同口径；滚动位置与增量条数不回归 | S19-8 / S19-13 |
| 92 | `prefers-reduced-motion: reduce` 下 4 处全部直切 | S19-9 / S19-13 |
| 93 | 三层测试全绿（后端 28 / vitest / E2E），样式断言同步 | S19-13 / §七 |

## 六、风险

| 编号 | 风险 | 对策 |
|---|---|---|
| R19-1 | 换肤误伤版式（改色时顺手改尺寸/间距） | Q3 硬约束 + §3.3 不回归清单 + QA「关键尺寸不变」断言（书本 rect / 卡片 rect / 详情主图占比） |
| R19-2 | 动画干扰 E2E 时序（点击后元素未就绪） | M19-3 全局 `reducedMotion: 'reduce'`；新动效用例单测断言，不做真实帧等待 |
| R19-3 | 退出动画纯 CSS 难实现，被迫大改 JSX | M19-1 最小追加白名单；必要时 `startViewTransition` 渐进增强（不支持直切） |
| R19-4 | 封面重出导致 md5/体积变化、母题被裁切 | 只改 `INK`/`PAPER`；`CENTERS` 不动；门禁核对 8 张尺寸/渐进式/体积、抽验母题落在可见窗口内 |
| R19-5 | 对比度不达标（幼龄向低饱和易踩线） | UI 逐色给对比度数值；QA 抽验正文主色 vs 页面底、文字 vs 卡片底 |
| R19-6 | 色板 token 未收敛，规则内仍有硬编码色 | M19-4：QA 用静态扫描断言 `.css` 中除 token 定义外无 `#` 色值（`#fff/#000` 豁免），残留即不通过 |
| R19-7 | P19-1 人工推翻方案导致二次换肤 | UI 三套方案同源 token 命名，切换仅改 `:root` 变量值 + 封面重出（不改规则/不改 JSX），返工成本可控 |

## 七、交付与门禁证据（2026-10-24，六步全绿、QA 放行）

### 7.1 交付物

| 层 | 交付 |
|---|---|
| 前端（样式） | `styles.css` 两处 `:root` 收敛为**方案 A 温润纸感**单一主色系（新增 `--color-detail-bg` / `--color-focus` / `--color-divider` / `--shadow-rgb`）；10 处 `rgba(62,39,35,α)` 阴影改 `rgba(var(--shadow-rgb),α)`；`.book-pages` 条纹、`.shelf-row` 渐变（`color-mix`）、`.book-spine` 沟槽、`.bookshelf-page` / `.detail-immersive` 底色全部走 token；旧色（绿 / 奶油黄 / 旧木色 / 旧墨）`grep` **0 命中** |
| 前端（动效） | 4 组入场 keyframes：`sh-enter-book` 320ms / `sh-enter-shelf` 260ms / `sh-enter-page` 340ms / `sh-enter-book-return` 240ms，选择器 `[data-route-enter="…"]`，`both` + 仅 opacity/transform；`prefers-reduced-motion` 降级 `sh-fade 120ms` + 取消 hover 抬升 |
| 前端（JSX 最小改动） | `BookShelfPage` / `BookPage` / `PlantDetailPage` 根容器挂 `data-route-enter`（由 `location.state?.from` 派生，详情页用惰性 state 冻结方向，换株不重播）；`BookCard` / `PlantCard` / 两处返回按钮补 `state.from`；`main.jsx` antd 主题色同步 |
| 资产 | `scripts/generate-covers.mjs` 仅改 `PAPER='#fcf7ed'` / `INK='#d8c3a2'`；8 张封面重出，**1200×1200 渐进式**，合计约 **194–208KB**（与基线 204KB 同量级） |
| 后端 | **零改动**（`docs/design/backend-design.md` §S19-1 确认记录） |
| 文档 | UI U19-1~U19-6（含 P19-1 冻结）、`color-schemes-v3.html` 三方案预览页、前端设计 S19、后端设计 S19-1、QA 手册、PRD §23、迭代需求文档 |

### 7.2 门禁口径（六步，全绿方可 commit）

| 步 | 内容 | 通过标准 | 实测结果 |
|---|---|---|---|
| 0 | 语料 / 资产校验 | `categories=8`、`total=440`（plant 206，含 deprecated 2）、图片 `.jpg` **448**、封面 8 张全 1200×1200 渐进式、音频 `.m4a` **1028** | **PASS**（8 / 440 / 448 / 8 张合规 / 1028） |
| 1 | 后端测试 | `mvn test` **28 用例**，0 失败 0 错误 0 跳过，退出码 0 | **PASS**（28/28，退出码 0） |
| 2 | 前端测试 + 构建 | `npx vitest run` 全绿、`npx vite build` 退出码 0 | **PASS**（vitest **90/90** = 81 既有 + 新增 RouteTransition 9；build 通过，CSS 13.72 kB / JS 280.84 kB） |
| 3 | 部署 | `docker compose up -d --build` 后 `/api/health=UP`、`/` = 200 | **PASS**（UP；`/`=200；`/images/covers/plant.jpg`=200） |
| 4 | 导入幂等 | 两次导入各 440 条：`import_log` delta **= 880**；Mongo 440 / 8 分类；`redis sh:*` = 0 | **PASS**（13112 → **13992**，delta +880；Mongo 440/8；redis 0；API all=438 / plant=204） |
| 5 | E2E 全量 | `npx playwright test`（`reducedMotion: 'reduce'`）≥81 全绿 | **PASS**（**86/86** = 既有 81 零改动 + 新增 TC-171~TC-175；与后端串行执行，遵守 D15-2） |

### 7.3 浏览器实测

- 书架 `/`：1024×768 与 1180×820 页面级溢出 **0**；8 本两层一屏；书本 **210×252 / 228×272** 尺寸未变（换肤不改版式）。
- 书内页 `/books/plant`：标题「植物书」、`共 204 种`、首屏 16、增量到底 204；新配色下卡片与总量文案可读。
- 详情 `/plants/{id}`：返回按钮「← 回植物书」、名称区字号未变、小知识卡新配色；动画结束后 `position: fixed` 仍在，`scrollHeight === innerHeight`（整屏不滚动未回归）。
- 4 处过渡：`reducedMotion: 'reduce'` 下直切（E2E 断言 marker 存在/缺失）；常规模式下动画名与时长 320/260/340/240ms 实测正确；直接输入 URL / 刷新 / 详情内换株 **marker 为 null（不播）**。
- 控制台 0 报错；`<56px` 热区 0。

### 7.4 门禁发现与修复

- **D19-1（环境层，非产品缺陷）**：后端测试首次按任务书仅挂载 `backend/`，Testcontainers 缺 Docker socket 报错；改为仓库根挂载 + socket 后 **28/28** 复跑通过。
- **D19-2（测试层口径对齐，非产品缺陷）**：单测无法校验真实动画帧，改为解析 `[data-route-enter]` 的 `animation` 简写与 `@keyframes` 定义；E2E 在 reducedMotion 下断言 marker 存在/缺失（真实帧效果由人工真机复核）。
- 说明（非缺陷）：本迭代以**目标页入场**承载 4 个方向，未保留旧屏做退场——属 U19-5 明确允许的降级路径（已在 `frontend-design.md` S19 与 UI 规范记录）；封面体积 194KB vs 208KB 为计量口径差异（均与基线 204KB 同量级）。

### 7.5 遗留待人工确认

- ~~**P19-1**~~（已闭环）：配色方案选定结果——PO 裁决 **方案 A 温润纸感**（主色 `#B45B3E` / 深 `#8A3E27`），**2026-10-24 人工确认「保留方案 A」，冻结生效**（预览页 `docs/design/color-schemes-v3.html` 留档）。
- 8 张封面 tile 新色板**真机观感**（母题疏密、米纸/暖木搭配、iPad 横屏亮度）。
- 4 处过渡动画的**真机手感**（尤其在 Safari 上的流畅度与眩晕感）。
- 沿用历史遗留：字母 / 拼音 / 数字 / 颜色 / 植物部位音频真机听感。

