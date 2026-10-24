# Sprint 18 — v2.9 书本集合：书架首页 + 书内浏览

| 项 | 内容 |
|---|---|
| 迭代目标 | 引入「书本集合」心智：8 个板块 = 8 本书，首页 = 书架（两层，一屏放下），新增 `/books/{code}` 书内页沿用卡片列表；封面以各板块**单一母题的极简线描花纹**平铺妆点；详情页返回改为「← 回{板块名}书」。 |
| 状态 | 已交付（2026-10-24 门禁全绿、QA 放行；待人工复核） |
| 依据 | [iteration-18-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-18-requirements.md)（Q1~Q14 已冻结，验收 76~86） |
| 类型 | **能力迭代**（前端 IA + 样式 + 8 张封面资产 + 测试迁移；后端默认零改动） |
| 基线（Sprint 17 交付后） | 语料 440 / 分类 8 / API plant=204、all=438；前端 vitest 72、E2E 72、后端 28 用例 |

## 一、迭代范围（Scope）

| 编号 | 范围项 | 认领 | 说明 |
|---|---|---|---|
| S18-1 | 书架页 `/`（BookShelfPage + BookShelf + BookCard） | R | 两层书架、数据驱动 8 本、书名/拼音/英文/「N 种」、hover 抬升、可访问性 |
| S18-2 | 书内页 `/books/:code`（BookPage） | R | 顶栏「← 回书架」+「{板块名}书」；沿用卡片网格 + 「共 N 种」+ 首屏 16/步进 16；未知 code 兜底 |
| S18-3 | 路由与板块常量 | R | `App.jsx` 增 `/books/:code`；`SectionNav.jsx` 改为板块常量模块（`SECTIONS`/`SECTION_GROUPS`/`SECTION_BOOK_TITLE`/`getSection`），移除按钮组件 |
| S18-4 | 详情页返回改造 | R | 文案「← 回{板块名}书」，目标 `/books/{code}`；异常兜底同步；返回时恢复该书滚动位置与条数 |
| S18-5 | 滚动记忆按书隔离 | R | `sh:bookScroll:{code}` / `sh:bookVisibleCount:{code}`；书籍列表缓存模块（Q14，前端并发 8 次 `?section=`） |
| S18-6 | 书架 / 书本 / 封面 / 书内页样式 | UI + R | iPad 1024×768 与 1180×820 页面级零溢出；热区 ≥56px |
| S18-7 | 封面花纹资产 8 张 | R + UI | `/images/covers/{code}.jpg`，1200×1200 可平铺，单色线描、极低密度 |
| S18-8 | 后端确认 | J | 零改动（Q14 前端缓存方案实测达标即不新增接口）；仅在开发设计文章留确认记录 |
| S18-9 | 测试迁移 + 新增用例 | QA | 单测：书架页 / 书内页拆分 + 详情返回断言更新；E2E：约 20+ 条「首页直接渲染卡片/板块按钮」迁移为 `/books/{code}` |

## 二、实现契约（R/UI/QA 共同遵守，PO 已授权实现层自定案）

### 2.1 文件与组件

| 路径 | 动作 |
|---|---|
| `frontend/src/pages/BookShelfPage.jsx` | 新增：站头三行 + `<BookShelf />` |
| `frontend/src/pages/BookPage.jsx` | 新增：书内页（列表逻辑由 HomePage 迁移） |
| `frontend/src/components/BookShelf.jsx` | 新增：两层书架，数据来自 `getCategories()`（按 `order` 升序） |
| `frontend/src/components/BookCard.jsx` | 新增：单本书（封面花纹 + 书名/拼音/英文/「N 种」） |
| `frontend/src/components/SectionNav.jsx` | 改造：**只保留常量导出**（`SECTIONS`、`SECTION_GROUPS`、`SECTION_BOOK_TITLE`、`getSection`），移除默认导出组件 |
| `frontend/src/pages/HomePage.jsx` | 删除（列表逻辑迁移至 BookPage） |
| `frontend/src/api/bookCache.js` | 新增：按 code 缓存 `GET /api/plants?section=`（Map + in-flight 去重 + 失败不缓存 + `clearBookCache()` 供测试） |
| `frontend/src/App.jsx` | `/` → BookShelfPage；新增 `/books/:code` → BookPage；`/plants/:id` 不变 |
| `frontend/src/pages/PlantDetailPage.jsx` | 返回文案/目标改造；深链接邻居列表走 `fetchBook(section)` |
| `frontend/src/styles.css` | 新增书架、书本、封面、书内页四组样式（UI 规范 U18-x） |
| `scripts/generate-covers.mjs` | 新增：生成 8 张封面 tile（SVG → Playwright 截图 → `.jpg`） |
| `frontend/public/images/covers/*.jpg` | 新增 8 张 1200×1200 渐进式 JPG |

### 2.2 关键约定

1. **板块常量唯一来源**：`SECTIONS` 保留 `{ code, label, group }`，新增 `cover: '/images/covers/{code}.jpg'` 与 `SECTION_BOOK_TITLE = { plant:'植物书', animal:'动物书', insect:'昆虫书', dinosaur:'恐龙书', letter:'英文字母书', pinyin:'汉语拼音书', number:'数字书', color:'颜色书' }`。
2. **书架数据驱动**：`getCategories()` 返回 8 条 → 按 `section` 归组（`nature` / `enlightenment`），组内按 `order` 升序；不硬编码书本数量。未知 section 的分类忽略（不崩溃）。
3. **数量**：书架对每个 code 调 `fetchBook(code)` 取 `list.length`，`Promise.allSettled`；未就绪/失败不显示「N 种」，失败不影响书名展示。书内页复用同一缓存，避免二次请求。
4. **滚动记忆键**：`sh:bookVisibleCount:{code}`、`sh:bookScroll:{code}`。从详情返回（`location.state.restoreScroll`）恢复滚动位置 + 条数；从书架进入恢复条数（≥16）但滚动置顶；多书互不串味。
5. **书内页文案**：标题 `<h1>{SECTION_BOOK_TITLE[code]}</h1>`；总量沿用「共 N 种」；空态沿用「这个板块还没有内容哦」；未知 code → 「这本书还在路上哦」+「回书架」。
6. **详情返回**：`Link to={'/books/' + section} state={{ restoreScroll: true }}`，文案「← 回{板块名}书」；40401 兜底「回{板块名}书看看」同样指向 `/books/{section}`；未知 section 回退 plant。
7. **封面叠加文字**：书名/拼音/英文/数量全部 HTML 渲染，不烧进图；封面仅作 `background-image`。
8. **既有能力不回归**：卡片规格 `.plant-card` / `.plant-card-zh|pinyin|en`、`.list-count`、`.load-sentinel`、`.plant-grid` 类名与行为保持；详情页版式与字号不动。

## 三、封面花纹资产（UI 出规范，R 生成）

| code | 母题 | 数量/图 | 画法 |
|---|---|---|---|
| plant | 一片叶子（含主脉） | 4 | 单色线描，浅棕 |
| animal | 四趾爪印 | 4 | 单色扁平剪影 |
| insect | 蝴蝶（对称） | 4 | 单色线描 |
| dinosaur | 三趾脚印 | 4 | 单色扁平剪影 |
| letter | 「Aa」 | 4 | 单色字形 |
| pinyin | 「a」 | 4 | 单色字形 |
| number | 「1 2 3」 | 4 组 | 单色字形 |
| color | 实心圆点 | 4 | 单色小圆 |

统一：1200×1200、纸白底 `#FDFBF6`、单色 `#D9C9AE`（浅棕）或同族；母题 2×2 均匀分布，单母题占位 ≤10% 面积，留白 ≥80%；可见母题 ≤12、留白 ≥60%（验收 78）。

## 四、测试迁移清单（QA 主责）

| 层 | 迁移内容 |
|---|---|
| vitest | `HomePage.test.jsx` → 拆为书架页（站头/8 本/两层/数量/数据驱动/失败态）与书内页（请求/空态/增量加载/滚动记忆 per-code/卡片链接 state）；`PlantDetailPage.test.jsx` 返回文案与 href 更新（8 板块）；样式断言更新（板块按钮字号规则改为书架书名/书内页标题） |
| E2E | 所有「`page.goto('/')` + `.plant-card`」改为 `page.goto('/books/{code}')`；`loadAllCards` 增加 `gotoBook(page, code)` helper；板块切换断言改为书架 8 本断言；新增 `sprint18.spec.js`（TC-162~TC-170，覆盖验收 76~86） |

## 五、验收对应

需求文档 §五 验收 76~86 全部映射到 S18-1~S18-9；QA 手册逐条给出对应用例编号。

## 六、实现层裁决（Master 2026-10-24，依 PO 授权）

R 开发设计文章（S18-附）提出 4 条建议，裁决如下：

| 编号 | 事项 | 裁决 |
|---|---|---|
| M18-1 | 封面书名是否带「书」字 | **带**：封面书名 = `category.nameZh + '书'`（植物→「植物书」），与书内页 h1 完全同源；拼音/英文沿用分类数据作副标题（不强行补「shū」） |
| M18-2 | 未知 code 是否回落查 `getCategories()` | **不采纳**：`BookPage` 仅认 8 个已知板块 code，未知 code 直接兜底「这本书还在路上哦」且不发 `/api/plants` 请求；验收 85 的「零改码上架」由**书架渲染**证明（新增分类只要 `section` 指向已知板块即渲染为新书） |
| M18-3 | 书 code 取 `category.code` 还是 `category.section` | 取 **`category.code`**（书唯一标识）；归组用 `getSection(category.section)?.group ?? getSection(category.code)?.group`，两者都未命中则忽略该分类；封面 `/images/covers/{category.code}.jpg`，缺图走纸白兜底 |
| M18-4 | `.section-nav` 样式去留 | **保留 CSS 规则、移除组件渲染**；本迭代不新增用法，样式清理留待 UI 统一评估 |

## 七、风险

1. **测试迁移量最大**：12 个 spec 文件、20+ 条依赖首页列表的用例，须逐条迁移并保持原断言语义。
2. **书架一屏放下**：8 本 × 书名/拼音/英文/数量在 1024×768 下需精确控制字号与间距，以 `getBoundingClientRect` 断言零溢出。
3. **数量并发请求**：8 次 `/api/plants?section=` 首屏耗时需实测；若 > 2.5s 再按 Q14 评估后端计数接口（J 出设计）。

## 八、交付与门禁证据（2026-10-24）

### 8.1 交付物
| 层 | 交付 |
|---|---|
| 前端 | `BookShelfPage` / `BookPage` 新页面，`BookShelf` / `BookCard` 新组件，`api/bookCache.js`（Map + in-flight 去重 + 失败清除），`SectionNav` 降为常量模块（`SECTIONS`/`SECTION_GROUPS`/`SECTION_BOOK_TITLE`/`getSection`/`coverPath`），`PlantDetailPage` 返回文案与目标、深链接邻居列表走缓存，`PlantCard` 滚动键改 `sh:bookScroll:{section}`，`HomePage` 删除，`styles.css` 新增书架/书本/封面/书内页样式；**`.plant-card` 规格、`.list-count`、`.load-sentinel`、`.plant-grid` 与详情版式零改动** |
| 资产 | `scripts/generate-covers.mjs` + `frontend/public/images/covers/{8 code}.jpg`（1200×1200、纸白 `#FDFBF6`、单墨 `#D9C9AE`、2×2 母题、q82 渐进式，合计 204KB） |
| 后端 | **零改动**（书架 8 次 `GET /api/plants?section=` 复用既有接口，接口契约不变） |
| 文档 | PRD §22（v2.9 增量）、迭代需求 Q1~Q14 + 验收 76~86、UI 规范 U18-1~U18-7（U18-6 已按最终实测参数固化）、前端设计 S18-0~S18-8、QA 用例手册、README 同步 |

### 8.2 门禁结果（六步全绿）
1. **语料 / 资产**：`categories=8`、`total=440`（plant 206，含 deprecated 2）、`counts={plants:206,animals:50,insects:50,dinosaurs:50,letters:26,pinyin:26,numbers:21,colors:11}`；图片 `.jpg` **448**（条目 440 + 封面 8）/ `.svg` 206；音频 `.m4a` **1028**。
2. **后端** `mvn test`（maven:3.9-eclipse-temurin-26 容器）：**28 用例**，Failures 0 / Errors 0 / Skipped 0，退出码 **0**（后端零改动回归）。
3. **前端** `npx vitest run`：**81/81**（3 文件：PlantDetailPage 52 / BookShelfPage 9 / BookPage 20），无 unhandled error；`npx vite build` 退出码 **0**（280.33 kB JS）。
4. **部署** `docker compose up -d --build`：重建后 `/api/health=UP`、`/` = 200。
5. **导入幂等**：import_log 12232 → **13112**（门禁窗口 delta **+880 = 2×440**）；Mongo **440 条目 / 8 分类**（含 deprecated 2 不物理删除）；导入后 `redis sh:*` = 0。
6. **API 计数**：plant=**204** / all=**438** / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / number=21 / color=11；`section=all` 按设计返回 40002。

### 8.3 浏览器实测（R/PF 口径，Playwright + 截图）
- 书架 1024×768：`scrollHeight=768 / scrollWidth=1024`；1180×820：`820 / 1180`，均**零溢出**，8 本两层一屏；书本 210×252 / 228×272；数量依次为 204/50/50/50/26/26/21/11。
- 封面：`background-size 250/270`、纸白底、8 张单墨花纹、`smallHotspots=0`、控制台 0 报错；母题完整落在封面可见窗口内（不裁切、不压书名）。
- 书内页 `/books/plant`：标题「植物书」、`共 204 种`、首屏 16、无水平溢出；详情返回「← 回植物书」。
- 未知 `/books/unknown`：「这本书还在路上哦」+「回书架」，且 `/api/plants` 请求数 **0**（M18-2）。

### 8.4 门禁发现与修复
- **D18-1（测试层，已修复）**：TC-168 / TC-169 首版用 `page.locator('.plant-card').nth(12).click()`，Playwright 会先自动滚动进视口再点击，导致 `PlantCard` 写入的 `scrollY` 与断言基准 `beforeY`/`yP` 不一致 → 全量 E2E 79/81。改为 `page.evaluate` 内 DOM 直点并回传实际 `clickY`（同步触发 React onClick）后 **81/81 全绿**；产品代码/契约零改动。
- 用例手册与实现口径的 9 处偏差（TC-169 滚动记忆口径、TC-173 `section`、TC-175 `.book-count` 占位、TC-177 `background-repeat` 等）由 QA 在手册执行记录中逐条说明，均属**文档口径对齐、非产品缺陷**。

### 8.5 遗留待人工抽验
- 8 张封面 tile 的**真机观感**（母题疏密、纸白/木色搭配、iPad 横屏亮度）；
- 既有遗留：字母 / 拼音 / 数字 / 颜色 / 植物部位音频真机听感。
