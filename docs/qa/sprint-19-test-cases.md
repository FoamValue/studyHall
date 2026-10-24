# 迭代测试用例手册 — Sprint 19（v3.0 全站换肤 + 4 处路由过渡动画）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 19 |
| 依据 | [iteration-19-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-19-requirements.md)（Q1~Q10、验收 **87~93**）；[sprint-19.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-19.md)（M19-1~M19-5、§3.3 不回归清单）；[ui-style-guide.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/design/ui-style-guide.md#L664)（U19-1~U19-6）；[frontend-design.md §S19](file:///Users/chenxinjie/Mirror/github/studyHall/docs/design/frontend-design.md#L1060) |
| 编号起始 | E2E **TC-171**（接 Sprint 18 的 TC-170）；前端单测 **TC-185**（接 Sprint 18 的 TC-184） |
| 类型 | 纯前端样式 + 动效：**不新增业务功能**，用例以「样式 token / 过渡标记 / 降级 / 尺寸不回归」为主 |
| 范围 | 书架页 `/`、书内页 `/books/:code`、详情页 `/plants/:id` 的色板换肤、4 处路由入场过渡、`prefers-reduced-motion` 降级、8 张封面重出 |
| 放行口径 | 六步门禁全绿（语料/资产 / 后端 / vitest+build / compose+health / 双导入幂等 / E2E） |
| 状态 | **已执行**（2026-10-24，六步门禁全绿，QA 放行） |

---

## 一、总览

### 1.1 基线（Sprint 18 交付后）

| 项 | 基线值 | 本迭代影响 |
|---|---|---|
| 语料总量 | **440**（plant 206 含 deprecated 2 / animal 50 / insect 50 / dinosaur 50 / letter 26 / pinyin 26 / number 21 / color 11） | **零改动** |
| 分类 | **8** | **零改动** |
| 图片 `.jpg` | **448**（条目 440 + 封面 8） | 8 张封面**同名同路径重出**（仅墨色/底色换方案 A） |
| 音频 `.m4a` | **1028** | **零改动** |
| 后端 `mvn test` | **28** 用例 | **零改动**（回归） |
| 前端 `vitest` | **81**（BookShelfPage 9 / BookPage 20 / PlantDetailPage 52） | 仅新增，不迁移 |
| E2E `playwright` | **81**（13 个 spec 文件） | 仅新增，配置加 `reducedMotion: 'reduce'` |
| API 计数 | all=438 / plant=204 / 其余按 50/26/26/21/11 | **零改动**（契约不变） |

### 1.2 本迭代新增统计

| 类别 | 数量 | 明细 |
|---|---|---|
| 新增前端单测 | **9** | `src/__tests__/RouteTransition.test.jsx`：TC-185 / TC-186 / TC-187a~187d / TC-188 / TC-189 / TC-190 |
| 新增 E2E | **5** | `e2e/sprint19.spec.js`：TC-171~TC-175 |
| 配置改动 | **1** | `frontend/playwright.config.js` → `use.reducedMotion: 'reduce'`（既有 81 条断言零改动） |
| 迁移 / 删除用例 | **0** | 既有 vitest 81 与 E2E 81 全部保留 |
| 终值预估 | vitest **90** / E2E **86** / 后端 **28** | 81+9 / 81+5 |

---

## 二、新增用例

### 2.1 前端单测（`frontend/src/__tests__/RouteTransition.test.jsx`，TC-185~TC-190）

> 统一约定：色板/动效断言以 **样式源（`src/styles.css` 文本）** 为被测对象（jsdom 不做真实动画帧与布局计算）；`data-route-enter` 断言以 `MemoryRouter initialEntries=[{pathname, state}]` 渲染真实页面组件后读根容器属性。
> Mock 约定：`vi.mock('../api/client')`（`getCategories / getPlants / getPlantsBySection / getPlant`）+ `vi.mock('../api/bookCache')`（`fetchBook / clearBookCache`）。

| 编号 | 名称 | 层级 | 前置 | 步骤 | 期望 | 验收 |
|---|---|---|---|---|---|---|
| **TC-185** | 方案 A 全量 token 落地 + 新增 4 token | 前端 | 读取 `src/styles.css` | 逐个匹配 19 个 token 声明值；断言新增 4 token 存在 | `--color-primary: #b45b3e`、`--color-primary-dark: #8a3e27`、`--color-page-bg: #faf5ec`、`--color-card-bg: #fffdf8`、`--color-text: #3a2a22`、`--color-text-light: #6f5443`、`--color-accent-bg: #fbf0de`、`--color-accent-border: #b87a3d`、`--shelf-wood #a87f55` / `--shelf-wood-dark #8a6a47` / `--shelf-wood-light #d3b48d`、`--book-paper #fcf7ed` / `--book-ink #d8c3a2` / `--book-stack #f2e8d8` / `--book-page-bg #fffbf3` 全部命中；**新增** `--color-detail-bg #f6eee2`、`--color-focus #8a3e27`、`--color-divider #e7dac6`、`--shadow-rgb: 58, 42, 34` 存在 | **88** |
| **TC-186** | 旧色系零命中 + 阴影统一走变量 | 前端 | 读取 `src/styles.css` / `src/main.jsx` / `index.html` | 全文本扫描 9 个旧色与旧阴影三元组；断言 antd 主题主色已换 | 旧色 `#4CAF50 / #388E3C / #F9A825 / #FFF8DC / #C9A876 / #A8825A / #E3CBA5 / #D9C9AE / #FDFBF6` 与 `rgba(62, 39, 35, …)` **全部零命中**（大小写不敏感）；`main.jsx` 含 `colorPrimary: '#B45B3E'`；`styles.css` 含 `rgba(var(--shadow-rgb)` | **88** |
| **TC-187a** | 书架 → 书内页：`shelf-to-book` + 320ms | 前端 | `renderBook({from:'shelf'})` | 读 `.page.book-page` 的 `data-route-enter`；解析 `[data-route-enter='shelf-to-book']` 规则 | 属性 = `shelf-to-book`；`animation: sh-enter-book 320ms …`；`@keyframes sh-enter-book` 存在；时长落在 200~400ms | **90** |
| **TC-187b** | 书内页 → 书架：`book-to-shelf` + 260ms | 前端 | `renderShelf({from:'book'})` | 读 `.bookshelf-page` 属性；解析对应规则 | 属性 = `book-to-shelf`；`sh-enter-shelf 260ms`；keyframes 存在 | **90** |
| **TC-187c** | 书内页 → 详情：`book-to-detail` + 340ms | 前端 | `renderDetail({from:'book', section:'plant'})`，`getPlant` resolve | 等 `.detail-immersive` 出现后读属性；解析规则 | 属性 = `book-to-detail`；`sh-enter-page 340ms`；keyframes 存在；详情名称正常渲染（版式不回归） | **91** |
| **TC-187d** | 详情 → 书内页：`detail-to-book` + 240ms | 前端 | `renderBook({from:'detail', restoreScroll:true})` | 读 `.page.book-page` 属性；解析规则 | 属性 = `detail-to-book`；`sh-enter-book-return 240ms`；keyframes 存在 | **91** |
| **TC-188** | 无 state 不挂标记（刷新 / 直接 URL / 书内换株） | 前端 | 三页均以 `state=undefined` 渲染 | 断言根容器 `data-route-enter` | 三页属性均为 **null**（不播动画，避免「莫名缩放」） | **90、91** |
| **TC-189** | `prefers-reduced-motion: reduce` 降级 | 前端 | 读取 `src/styles.css` | 定位媒体查询与其内规则 | 存在 `@media (prefers-reduced-motion: reduce)`；其内 `[data-route-enter]` 为 `sh-fade 120ms` + `transform: none !important`；`@keyframes sh-fade` 存在；降级段含 `.book/.plant-card/.speak-btn/.filter-btn/.nav-btn` 的 `transition: none`、hover `transform: none`、`scroll-behavior: auto !important` | **92** |
| **TC-190** | 换肤不改版式（关键尺寸与字号源） | 前端 | 读取 `src/styles.css` | 解析 `.bookshelf`、`@media (min-width:1100px)`、`.plant-card`、`.detail-zh` 与横屏块 | `.bookshelf` `--book-w:210px` / `--book-h:252px`；≥1100px 档 `228/272`；`.plant-card` `border-radius:20px` + `padding:16px`；`.detail-zh` 56px、横屏 52px | **88** |

> 说明：任务书建议「从 CSS 文本解析 animation 时长」——本手册按实际实现取 `[data-route-enter='…']` 规则内的 `animation` 简写解析（`sh-enter-* {ms}`），未使用浏览器动画帧（jsdom 无真实动画），口径已在缺陷表记「文档口径对齐、非产品缺陷」。

### 2.2 E2E（`frontend/e2e/sprint19.spec.js`，TC-171~TC-175）

> 全局前置：`playwright.config.js` 的 `use.reducedMotion = 'reduce'`（M19-3 / Q9），4 处过渡降级为 120ms 纯淡入；`data-route-enter` 标记与结构不变。
> 统一 helper：`gotoBook(page, code)` 沿用 Sprint 18；方向标记用 `page.evaluate` 读 `document.querySelector(selector)?.getAttribute('data-route-enter')`。

| 编号 | 名称 | 层级 | 前置 | 步骤 | 期望 | 验收 |
|---|---|---|---|---|---|---|
| **TC-171** | 4 个方向 `data-route-enter` 实测 | E2E | 视口 1024×768；站点已部署+已导入 | ① `/` 点「植物书」→ 读 `.page.book-page`；② 点首卡进详情 → 读 `.detail-immersive`；③ 点「← 回植物书」→ 读 `.page.book-page`；④ 点「← 回书架」→ 读 `.bookshelf-page` | 依次为 `shelf-to-book` / `book-to-detail` / `detail-to-book` / `book-to-shelf`；各步目标页内容立即可交互（reduced-motion 直切）；控制台 0 error / 0 pageerror | **90、91、92** |
| **TC-172** | 直接访问三页不挂标记且无动画 | E2E | — | ① 直接 `/`；② 直接 `/books/plant`；③ 刷新书内页；④ 深链接 `/plants/azalea-flower` | 三页根容器 `data-route-enter` 均为 **null**，`getComputedStyle().animationName === 'none'`；0 console error；详情深链接正常渲染 `.detail-zh` | **90、91** |
| **TC-173** | 书架 8 本、书本尺寸不变、页面零溢出 | E2E | 两档视口 1024×768 / 1180×820 | 逐档 `goto('/')`：断言 `.book`=8、`.shelf-row`=2；遍历 8 本 `getBoundingClientRect()`；算 `scrollWidth-clientWidth` 与 `scrollHeight-clientHeight` | 8 本尺寸分别 **210×252** / **228×272**（±0）；页面级横向与纵向溢出均 **≤1px** | **88** |
| **TC-174** | 详情页整屏不滚动不回归 | E2E | 视口 1024×768；植物书首卡 | 进详情后读 `.detail-immersive` 的 `position`、`documentElement.scrollHeight/clientHeight`；`mouse.wheel(0,600)` 后比较 `scrollY` | `position=fixed`；纵向/横向页面级溢出 ≤1px（`scrollHeight === clientHeight`）；滚动不改变文档滚动位置 | **88**（U6-1 不回归） |
| **TC-175** | 8 张新色板封面资源与尺寸 | E2E | 8 张封面随 `--build` 进镜像 | ① `request.get` 8 个 `/images/covers/{code}.jpg`；② 页面内 `new Image()` 读 `naturalWidth/Height` | ① 全部 **HTTP 200** 且 `content-type: image/jpeg`；② 8 张均 **1200×1200** | **89** |

### 2.3 不回归断言（沿用既有用例，不重复新增）

| 项 | 承载用例 | 说明 |
|---|---|---|
| 「共 N 种」总量 + 首屏 16 + 步进增量到底 | E2E TC-166 / TC-181（vitest TC-106/108） | 换肤不改数据与增量逻辑 |
| 滚动记忆按书隔离（`sh:bookScroll:{code}` / `sh:bookVisibleCount:{code}`） | E2E TC-168 / TC-169、vitest TC-184 | 过渡只在目标页入场，不触碰滚动恢复逻辑 |
| 详情返回文案与 href（8 板块） | E2E TC-167、vitest TC-32/33/119/120/121 | 仅追加 `state.from`，`to` 未改 |
| 单图详情版式与字号（`.detail-zh` 56 / 横屏 52 等） | vitest TC-70 类断言 + 本手册 TC-190 | 换肤只改色 |
| `.plant-card` 规格与类名、卡片网格 | vitest TC-20/21/59 | 类名/尺寸零改动 |
| 音频 `.m4a` 契约、小知识标题、部位单图 | E2E TC-93/111/113、vitest TC-147a/b | 本迭代零改动 |
| 未知 code 兜底、后端契约不变 | E2E TC-170 | 后端零改动 |
| 控制台 0 报错 | E2E TC-171 / TC-172 / TC-162 | 新增用例内显式收集 |

### 2.4 自动化不可覆盖、单独人工抽验（不计入自动用例）

| 项 | 抽验内容 | 依据 |
|---|---|---|
| 配色观感（P19-1） | 方案 A「温润纸感」三页真机观感；人工可推翻重选 | 验收 87 / Q2 |
| 动画手感 | `no-preference` 下 4 处过渡的速度/位移是否「轻而不飘」；自动化仅断言参数区间 | 验收 90、91 |
| 对比度抽验 | 正文/页面底、正文/卡片底、白字/主色 逐色实测（UI 已给 12.60 / 13.46 / 4.66） | Q5 / U19-1 |
| 封面 tile 真机观感 | 8 张新色板母题可见、平铺接缝无色差 | 验收 89 / U19-4 |

---

## 三、不迁移清单（既有用例全部保留）

| 层 | 数量 | 处置 |
|---|---|---|
| 后端 `mvn test` | **28** | 零改动（本迭代后端零改动） |
| 前端 `vitest` | **81** | 零改动（R 自检确认配色与 `data-*` 追加未触发既有断言） |
| E2E `playwright` | **81**（13 spec） | 定位器与断言零改动；仅新增全局 `use.reducedMotion: 'reduce'`（若遇可见性等待问题只在 helper 层加兜底） |
| 手册 | — | 不新增迁移映射表（本迭代无迁移） |

---

## 四、验收 87~93 映射

| 验收 | 内容 | 自动覆盖 | 人工 |
|---|---|---|---|
| **87** | 3 套方案 + 可预览产物 + 选定归档 P19-1 | — | UI 规范 U19-1/U19-2 + `color-schemes-v3.html`；**P19-1 待人工确认** |
| **88** | 选定方案三页落地、无多主色系、对比度达标、两档零溢出不回归 | TC-185 / TC-186 / TC-190 / TC-173 / TC-174 | 对比度抽验（U19-1 数值） |
| **89** | 8 张封面按新色板重出、1200×1200 渐进式、构图不变 | TC-175 + 门禁 0 步（node 解析 JPEG SOF） | 封面真机观感 |
| **90** | 书架 ↔ 书内页过渡 200~400ms、无跳动闪烁阻塞 | TC-187a / TC-187b / TC-171 / TC-172 | 动画手感 |
| **91** | 书内页 ↔ 详情同口径；滚动与条数不回归 | TC-187c / TC-187d / TC-188 / TC-171、TC-168 / TC-169 | 动画手感 |
| **92** | `reduced-motion` 下 4 处降级直切 | TC-189 + 全局 `reducedMotion: 'reduce'` 下 TC-171 全绿 | DevTools 模拟走查 |
| **93** | 三层测试全绿（后端 28 / vitest / E2E 全量） | 门禁第 1/2/5 步 | — |

---

## 五、执行记录（2026-10-24 已回填）

| 步骤 | 结果 | 时间 |
|---|---|---|
| 0 语料/资产校验 | **OK**：`categories=8`、`total=440`（plant 206 / animal 50 / insect 50 / dinosaur 50 / letter 26 / pinyin 26 / number 21 / color 11）、图片 `.jpg` **448**（条目 440 + 封面 8）、音频 `.m4a` **1028** | 2026-10-24 |
| 0b 封面资产规格 | **OK**：8 张封面全 **1200×1200**、`progressive=true`（解析 JPEG SOF2），合计 **194KB**（基线 208KB，同量级） | 2026-10-24 |
| 1 后端 `mvn test` | **OK**：surefire `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`，退出码 0（maven:3.9-eclipse-temurin-26；后端零改动回归） | 2026-10-24 |
| 2 前端 `vitest` / `vite build` | **OK**：vitest **90/90**（4 文件：RouteTransition 9 / BookShelfPage 9 / BookPage 20 / PlantDetailPage 52），无失败、无 unhandled error；`vite build` 退出码 0（CSS 13.72 kB / JS 280.84 kB） | 2026-10-24 |
| 3 compose 重建 + health | **OK**：`docker compose up -d --build` 后 `/api/health=UP`、`/`=200、`/images/covers/plant.jpg`=200 | 2026-10-24 |
| 4 两次导入幂等 | **OK**：import_log 13112 → **13992**，delta **+880 = 2×440**；Mongo **440 条目 / 8 分类**（含 deprecated 2 不物理删除）；导入后 `redis sh:*` = **0**；API all=**438** / plant=**204** / animal 50 / insect 50 / dinosaur 50 / letter 26 / pinyin 26 / number 21 / color 11 | 2026-10-24 |
| 5 E2E 全量 | **OK**：`npx playwright test` **86/86**（6 workers，29.3s，退出码 0）；既有 81 条零改动通过 + 新增 `sprint19.spec.js` TC-171~TC-175 全绿 | 2026-10-24 |
| 6 文档收尾与放行 | **OK**：本手册 §五/§六 已回填；**QA 放行 PASS**，交由 Master commit（QA 不执行 commit） | 2026-10-24 |

## 六、缺陷与流程问题（2026-10-24 已回填）

| # | 类型 | 描述 | 定位 | 处理 | 状态 |
|---|---|---|---|---|---|
| D19-1 | 流程/环境（**非产品缺陷**） | 首次按任务书给的「仅挂 `backend` 目录」跑后端测试，Testcontainers 报 `Could not find a valid Docker environment`（Errors 1、未出 28 用例） | 后端测试执行命令 | 改用项目既有门禁命令（挂 `/var/run/docker.sock` + 仓库根 `/project` + `TESTCONTAINERS_RYUK_DISABLED=true` + `TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal`）复跑 → 28/28 全绿；产品代码与测试代码零改动 | **已修复**（复跑 28/28） |
| D19-2 | 文档口径（**非产品缺陷**） | 任务书建议单测「从 CSS 文本解析对应 animation 时长」，jsdom 无真实动画帧；且实现按 U19-5 允许路径把 #2/#4 退场改为**目标页入场**，产物中不存在 `data-route-exit` 选择器 | `RouteTransition.test.jsx` TC-187a~187d / `sprint19.spec.js` TC-171 | 单测改为解析 `[data-route-enter='…']` 规则的 `animation` 简写（`sh-enter-* + 320/260/340/240ms`）并断言 keyframes 存在；E2E 在 `reducedMotion:'reduce'` 下断言 marker 属性与直切可交互，不断言真实帧时长。断言语义等价，手册 §2.1 已注明 | **已对齐** |
| — | 非缺陷提示 | 封面重出后合计 194KB（R 自检口径 208KB），差异来自 JPEG 编码波动，仍同量级且 8 张全合规；4 处过渡无 `data-route-exit`（退场降级为入场，见 S19-3 记录） | `frontend/public/images/covers/`、`styles.css` | 记录备查，无需处置 | — |

---

## 七、门禁执行清单（口径）

> 顺序要求：后端 `mvn test` 与 E2E **不得并行**（Sprint 15 D15-2）；E2E 在容器重建 + 导入完成后的空闲窗口执行；封面为静态资源，必须 `docker compose up -d --build`（非 `restart`）。

| 步 | 命令 | 通过标准 |
|---|---|---|
| 0 | `node` 统计 `content/*` 与 `frontend/public/{images,audio}` | `categories=8`、`total=440`（plant 206 含 deprecated 2）、`.jpg=448`、`.m4a=1028` |
| 0b | `node` 解析 JPEG SOF | 8 张封面全 `1200×1200` 且 `progressive=true` |
| 1 | `docker run … maven:3.9-eclipse-temurin-26 mvn -q test` | **28 用例** 0 失败 / 0 错误 / 0 跳过，退出码 0 |
| 2 | `cd frontend && npx vitest run && npx vite build` | vitest **90/90** 无 unhandled error；build 退出码 0 |
| 3 | `docker compose up -d --build` + `curl localhost/api/health` | `UP`；`/` = 200 |
| 4 | 记录 `import_log` 基线 → 两次 `node scripts/import-plants.mjs` | delta **+880 = 2×440**；Mongo **440 条目 / 8 分类**；`redis sh:*` = 0 |
| 5 | `cd frontend && npx playwright test` | **86/86**（既有 81 + 新增 5），退出码 0 |
| 6 | 回填本手册 §五/§六；Master 更新 AGENTS.md 并 commit | 全绿方可 commit |
