# 迭代测试用例手册 — Sprint 18（v2.9 书本集合：书架首页 + 书内浏览）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 18 |
| 依据 | [iteration-18-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-18-requirements.md) §五 验收 **76~86**；[sprint-18.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-18.md) §二 实现契约、§四 测试迁移清单 |
| 编号起始 | E2E **TC-162**（接 Sprint 16 的 TC-155）；前端单测 **TC-171**（接 Sprint 17 的 TC-170） |
| 范围 | 书架页 `/`、书内页 `/books/:code`、详情页返回改造、8 张封面资产、全量测试迁移 |
| 放行口径 | 六步门禁全绿（语料/资产 / 后端 / vitest+build / compose+health / 双导入幂等 / E2E） |
| 状态 | 待执行（阶段 2 产出，R/UI/J 交付后由 QA 执行） |

---

## 一、总览

### 1.1 基线（Sprint 17 交付后）

| 项 | 基线值 | 说明 |
|---|---|---|
| 语料总量 | **440**（plant 206 含 deprecated 2 / animal 50 / insect 50 / dinosaur 50 / letter 26 / pinyin 26 / number 21 / color 11） | 本迭代**零改动** |
| 分类 | **8**（plant order 1 / animal 2 / insect 3 / dinosaur 4 / letter 5 / pinyin 6 / number 9 / color 10） | 本迭代**零改动** |
| 后端 `mvn test` | **28** 用例 | 本迭代默认零改动；若 Q14 触发只读计数接口则追加用例 |
| 前端 `vitest` | **72**（`HomePage.test.jsx` 22 + `PlantDetailPage.test.jsx` 50） | 本迭代拆分/迁移 |
| E2E `playwright` | **72**（12 个 spec 文件） | 本迭代迁移 45 条 + 新增 9 条 |
| API 计数 | all=438 / plant=204 / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / number=21 / color=11 | 契约不变（验收 84） |

### 1.2 本迭代新增与迁移统计

| 类别 | 数量 | 明细 |
|---|---|---|
| 新增 E2E | **9** | `e2e/sprint18.spec.js`：TC-162~TC-170 |
| 新增前端单测 | **14** | `BookShelfPage.test.jsx`：TC-171~TC-178；`BookPage.test.jsx`：TC-179~TC-184 |
| 迁移 E2E | **45** | 12 个 spec 逐条见 §三 |
| 迁移前端单测（受影响用例） | **28** | `HomePage.test.jsx` 22 条全部处置（15 迁入新文件，含 TC-81/TC-108b 2 条重写；3 删除；2 移位；2 合并入 TC-183）+ `PlantDetailPage.test.jsx` 6 条返回文案断言 |
| 删除用例 | **3** | TC-80a、TC-25b、TC-123（依赖已移除的 `.section-nav`，由书架断言替代） |
| 合并用例 | **2** | TC-13、TC-80b（空态语义并入新增 TC-183） |
| 终值预估 | vitest **81** / E2E **81** / 后端 **28** | 72−3−2+14=81；72+9=81 |

---

## 二、新增用例

### 2.1 E2E（`frontend/e2e/sprint18.spec.js`，TC-162~TC-170）

> 前置统一约定：`test.beforeEach` 内 `page.setViewportSize` 按用例设定；书架用例的数据来自真实 `/api/categories` + 8 次 `/api/plants?section=`；书内用例统一 `await gotoBook(page, code)`（见 §3.0）；列表类断言一律走 `loadAllCards(page, expectedCount)`。
>
> **类名口径**：契约（§2.2-8）保证的类名为 `.book`（书本容器）、`.plant-card` / `.plant-card-zh|pinyin|en`、`.list-count`、`.load-sentinel`、`.plant-grid`；书架/封面内部类名（本手册示例用 `.shelf-group` / `.shelf-group-title` / `.book-cover` / `.book-title-zh|pinyin|en` / `.book-count`）以 UI 规范 **U18-x** 与 R 开发设计文章定案为准，若命名不同按同一语义映射，断言不变。

| 编号 | 名称 | 层级 | 前置 | 步骤 | 期望 | 验收 |
|---|---|---|---|---|---|---|
| **TC-162** | 书架两层 8 本且一屏零溢出 | E2E | 站点已部署+内容已导入；视口 **1024×768** 与 **1180×820** 各跑一遍 | ① `page.goto('/')`；② 等 `.book` 出现；③ 断言 `.shelf-group`=2、`.shelf-group-title` 文本 `['自然认知','认知启蒙']`、`.book`=8；④ 依次断言 8 个书名 `植物/动物/昆虫/恐龙/英文字母/汉语拼音/数字/颜色` 顺序与 `categories.order` 升序一致；⑤ 计算 `document.documentElement.scrollHeight - clientHeight`；⑥ 遍历 8 个 `.book` 的 `getBoundingClientRect()` | ③④ 计数与顺序全部成立；⑤ 页面级纵向溢出 **≤1px**；⑥ 每个 book 的 `bottom ≤ viewport.height + 1` 且 `top ≥ 0`（8 本全在一屏内，无需滚动）；控制台 0 error | **76** |
| **TC-163** | 书本四行内容与数量、且不出现编号 | E2E | 真实数据（plant=204 / animal/insect/dinosaur=50 / letter/pinyin=26 / number=21 / color=11） | ① `page.goto('/')`；② 对每本书读取 `.book-title-zh / .book-title-pinyin / .book-title-en / .book-count`；③ 断言全书架文本不含编号 | ② 植物书显示 `植物 / zhí wù / Plant / 共 204 种`（或 `204 种`），动物书 `共 50 种`，字母书 `共 26 种`，数字书 `共 21 种`，颜色书 `共 11 种`；③ `.book` 内不存在 `[class*=index]`，`page.getByText(/第\s*[0-9一二三四五六七八]\s*本/)` 命中 0 | **77** |
| **TC-164** | 8 张封面资源与统一底色 | E2E | 8 张 `/images/covers/{code}.jpg` 已随 `--build` 进镜像 | ① `request.get` 8 个封面 URL；② `page.goto('/')` 后逐个 `.book-cover` 读 `getComputedStyle` 的 `backgroundImage / backgroundRepeat / backgroundColor`；③ 在页面内 `new Image()` 载入 8 张封面读 `naturalWidth/naturalHeight` | ① 全部 **HTTP 200**、`content-type` 为 `image/jpeg`；② 每个 `backgroundImage` 含 `/images/covers/{code}.jpg`、`backgroundRepeat=repeat`；全部封面 `backgroundColor` **完全相同**（统一底色）；③ 8 张均 **1200×1200** | **78** |
| **TC-165** | 点击书进入 `/books/{code}` 并回书架 | E2E | 视口 1024×768 | ① `page.goto('/')`；② 点 `.book`（植物）；③ 断言 URL、`h1` 与返回入口；④ 计算页面级纵向/横向溢出；⑤ 点「← 回书架」 | ③ URL 匹配 `/books/plant`，`h1` 文本 `植物书`，「← 回书架」`href="/"`；④ 溢出 x/y 均 **≤1px**；⑤ 回到 `/` 且 `.book`=8 | **79** |
| **TC-166** | 书内页总量、首屏 16 与增量到底 | E2E | 植物书 204 条 | ① `gotoBook(page,'plant')`；② 读首屏卡片数与 `.list-count`；③ `loadAllCards(page, 204)`；④ 记录全量标题数组；⑤ `page.reload()` 后 `gotoBook` 再取一次标题数组 | ② `.list-count` = `共 204 种`，首屏卡片数 **< 204**（增量生效，实测应为 16）；③ 最终 `.plant-card`=204 且 `.load-sentinel` 消失；④⑤ 两次顺序完全一致（`sort ASC + id ASC` 不回归） | **80** |
| **TC-167** | 8 板块详情返回文案与 href | E2E | 8 本书各一条真实首卡 | 对 `[plant 植物书 / animal 动物书 / insect 昆虫书 / dinosaur 恐龙书 / letter 英文字母书 / pinyin 汉语拼音书 / number 数字书 / color 颜色书]` 循环：① `gotoBook(code)`；② 点首张卡片；③ 读 `.imm-topbar .back-btn` 的文本与 href | ③ 文案 = `← 回{板块名}书`（8 条逐一精确匹配），`href="/books/{code}"`；详情页无 `[role=tab]` 部位切换（不回归） | **81** |
| **TC-168** | 详情返回恢复该书滚动位置与条数 | E2E | 视口 1024×768；植物书 | ① `gotoBook(page,'plant')`；② `loadAllCards(page, 204)`；③ `scrollTo(0,1200)`，记录 `scrollY`、`.plant-card` 数；④ 点 `.plant-card` 第 13 张进详情；⑤ 点「← 回植物书」；⑥ 读 URL、`scrollY`、卡片数、`sessionStorage['sh:bookVisibleCount:plant']` | ⑥ URL `/books/plant`；`scrollY` **>0** 且与 ③ 记录值差 ≤2px；已渲染卡片数 ≥ ③ 记录值（不退回首屏 16）；`sh:bookVisibleCount:plant` 与渲染条数一致 | **81** |
| **TC-169** | 多书滚动记忆互不串味 | E2E | 视口 1024×768 | ① 植物书 `loadAllCards(204)` → `scrollTo(0,1200)` → 记录 `yP`；② 回书架；③ 进动物书（不滚动）记录 `yA`；④ 回书架；⑤ 再进植物书读 `scrollY`；⑥ 再进动物书读 `scrollY` 与首屏卡片数；⑦ 读两个 key | ⑤ 植物书 `scrollY` ≈ `yP`（>0，差 ≤2px）；⑥ 动物书 `scrollY` = 0、首屏 16 张；⑦ `sh:bookScroll:plant` >0、`sh:bookScroll:animal` 为 0/不存在，两 key 独立 | **82** |
| **TC-170** | 未知 code 兜底 + 后端契约不变 | E2E | 站点已部署 | ① `page.goto('/books/unknown')`，收集 console/pageerror；② 断言兜底 UI；③ `request.get('/api/categories')`；④ `request.get('/api/plants?section=plant')`、`?section=animal`、`/api/plants`；⑤ 断言分类字段与顺序、条目字段结构 | ② 显示 `这本书还在路上哦` 且「回书架」`href="/"`，无白屏、0 console error / pageerror；③ HTTP 200、**8** 条、字段 `code/nameZh/pinyin/nameEn/order/section` 齐备、`order` 升序；④ plant=**204**、animal=**50**、all=**438**；⑤ 条目含 `id/name/coverImage/parts`，`parts` 为数组，无字段删除 | **83、84** |

### 2.2 前端单测（TC-171~TC-184）

> Mock 约定：`BookShelfPage` 需 `vi.mock('../api/client')`（`getCategories`）+ `vi.mock('../api/bookCache')`（`fetchBook` / `clearBookCache`）；`BookPage` 需 `vi.mock('../api/bookCache')`。若 R 最终未单独抽 `bookCache`，则统一 mock `../api/client` 的 `getPlantsBySection`；以开发设计文章 S18-5 的最终模块为准，断言语义不变。

#### `BookShelfPage.test.jsx`（书架页）

| 编号 | 名称 | 层级 | 前置 | 步骤 | 期望 | 验收 |
|---|---|---|---|---|---|---|
| **TC-171** | 两层书架渲染 8 本且顺序正确 | 前端 | mock `getCategories` 返回 8 条真实分类；`fetchBook` 均 resolve 对应长度列表 | render `<BookShelfPage />`（MemoryRouter） | 两个 `.shelf-group`；组标题 `['自然认知','认知启蒙']`；`.book`=8；组内书名顺序 = `order` 升序（plant→color）；组内各 4 本 | **76** |
| **TC-172** | 书本四行文字完整且无编号 | 前端 | 同 TC-171，`fetchBook` 长度取 204/50/50/50/26/26/21/11 | render 后逐本读 `.book-title-zh/.book-title-pinyin/.book-title-en/.book-count`；`screen.queryByText(/第\s*\d+\s*本/)`；`.book` 内 `querySelector('[class*=index]')` | 8 本书名/拼音/英文齐全；数量文本分别为 `共 204 种 / 共 50 种 … 共 11 种`；编号命中 **0** | **77** |
| **TC-173** | 书单数据驱动：第 9 条分类零改码上架 | 前端 | mock `getCategories` 返回 8 条 + 新增 `{code:'vehicle', nameZh:'交通工具', pinyin:'jiāo tōng gōng jù', nameEn:'Vehicle', order:11, section:'nature'}` + 一条 `{code:'ghost', section:'mystery'}` | render；断言 `.book` 数与末位；再断言 ghost 不渲染 | `.book`=**9**；「交通工具」出现在「自然认知」组末尾（order 11）；`mystery` 分类被忽略不崩溃；封面路径派生为 `/images/covers/vehicle.jpg` | **85** |
| **TC-174** | 数量未就绪不显示「N 种」，就绪后补显 | 前端 | 8 个 `fetchBook` 返回未决 Promise | render；断言书名可见、数量区为空；再用 `resolve` 全部并 `await` | 未决时 8 个书名均可见且 `.book-count` 数量为 0（不渲染「N 种」）；resolve 后 8 个数量文本出现；占位高度固定（`.book` `getBoundingClientRect().height` 前后相等，无布局跳动） | **77** |
| **TC-175** | 单本数量失败隔离（`Promise.allSettled`） | 前端 | 7 个 resolve（长度 50），`animal` reject | render 后 `await waitFor` 其他数量出现 | `.book`=8、8 个书名齐全；失败书（动物）**无** `.book-count`；其余 7 本数量文本正常；无 unhandled rejection | **77** |
| **TC-176** | 分类接口失败友好提示 | 前端 | `getCategories.mockRejectedValue(new Error('x'))` | render 后等待 | 显示 `哎呀，出了点小问题，请稍后再试`；`.book`=0；控制台无 unhandled error | **77**（§3.2 加载/异常） |
| **TC-177** | 封面路径、平铺与统一底色（样式源断言） | 前端 | — | ① render 后读 8 个 `.book-cover` 的 `data-cover`/内联背景或组件 props；② `readFileSync('src/styles.css')` 解析规则 | ① 8 个路径 = `/images/covers/{code}.jpg`；② `.book-cover` 规则含 `background-repeat: repeat`、`background-size` 平铺值、**单一** `background-color`；③ CSS 中不存在按 `[data-section="…"]` 或 `.book-plant/.book-animal` 覆写封面底色的规则（无「每本一个主色」） | **78** |
| **TC-178** | 点击跳转、热区与 hover 规则 | 前端 | 探针路由 `<Route path="/books/:code" element={<Probe/>} />` | ① 点书名「植物」所在 `.book`；② 读 `.book` 的 `role` 与 accessible name；③ 样式源断言 `.book` 与 `:hover` | ① 探针渲染 `location.pathname === '/books/plant'`；② 语义为 `role="link"`（或 `<button>`），accessible name 含 `植物` 与 `共 204 种`；③ `.book { min-height ≥56px }` 且 `:hover` 的 `transform: translateY(-Npx)` 中 N ≤4 | **76、79** |

> TC-79（站头三行）随 `HomePage.test.jsx` 拆入 `BookShelfPage.test.jsx`，断言不变（见 §3.13）。

#### `BookPage.test.jsx`（书内页）

| 编号 | 名称 | 层级 | 前置 | 步骤 | 期望 | 验收 |
|---|---|---|---|---|---|---|
| **TC-179** | 8 个 code 的标题「{板块名}书」+ 回书架 | 前端 | mock `fetchBook` 返回空列表 | 对 8 个 code 分别以 `/books/{code}` 渲染 `BookPage` | 每例 `h1` = `植物书/动物书/昆虫书/恐龙书/英文字母书/汉语拼音书/数字书/颜色书`；「← 回书架」`href="/"`；页面无 `第 N 本` 文案 | **79** |
| **TC-180** | 共 N 种 + 首屏 16 / 步进 16 + 哨兵消失 | 前端 | `fetchBook` 返回 40 条；`IntersectionObserver` 桩（沿用 HomePage TC-108 的 MockIO） | render；断言首屏；派发两次 `isIntersecting` | 首屏 `.plant-card`=**16**、`.load-sentinel` 存在、`.list-count`=`共 40 种`；第 1 次 →32、第 2 次 →40 且哨兵消失 | **80** |
| **TC-181** | 植物书 204 条可完整加载到底 | 前端 | `fetchBook('plant')` 返回 204 条；IO 桩 | render 后循环派发直到哨兵消失 | 最终 `.plant-card`=**204**、哨兵 `count=0`、`.list-count`=`共 204 种`；无 `unhandled error` | **80** |
| **TC-182** | 未知 code 兜底 | 前端 | 路由 `/books/unknown` | render | 显示 `这本书还在路上哦` + 「回书架」`href="/"`；不抛异常、不渲染列表 | **83** |
| **TC-183** | 书内页空态 | 前端 | `fetchBook` resolve `[]` | render `/books/dinosaur` | 显示 `这个板块还没有内容哦`；不渲染 `.list-count` / `.plant-grid` | **80**（不回归 §16/§17 空态） |
| **TC-184** | 滚动记忆按书隔离 + 恢复条数 | 前端 | `sessionStorage['sh:bookVisibleCount:plant']='32'`、`['sh:bookVisibleCount:animal']='16'`；`fetchBook` 各 40 条；`restoreScroll` state | ① 渲染 plant（`state.restoreScroll:true`）；② 断言条数与 key；③ 渲染 animal 同理；④ 回读 plant 的 key | ① 初始 `.plant-card`=**32**（不退回首屏 16）；② `sh:bookVisibleCount:plant` 保持 32；③ animal 初始 =**16**、`sh:bookVisibleCount:animal` 保持 16；④ 渲染 animal 后 plant 的 key **未被覆写**（无串味） | **81、82** |

### 2.3 自动化不可覆盖、单独人工抽验（不计入自动用例）

| 项 | 抽验内容 | 依据 |
|---|---|---|
| 封面观感 | 8 张封面「肉眼可见母题 ≤12 个/封面、留白 ≥60%、单色线描/扁平剪影、不填色不加阴影、幼龄不繁杂」 | 验收 78 / Q11 |
| 书脊与书本拟真 | 书脊统一木色系、书页厚度拟真、hover 微抬升观感自然（≤4px 由 TC-178 兜底，观感需人看） | 验收 78 / Q7、Q12 |
| iPad 真机 | Safari 横屏实际书架的滚动/返回手感（沿用项目既有「headless 以机制消除为口径」约定） | AGENTS 五·iPad 真机验收口径 |

---

## 三、迁移清单（逐文件逐条）

### 3.0 `frontend/e2e/helpers.js`（前置改造，所有 spec 依赖）

| 项 | 原状 | 迁移后 |
|---|---|---|
| 新增 helper | 无 | 新增 `export async function gotoBook(page, code)`：`await page.goto('/books/' + code)` → `await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 })` → `await page.evaluate(() => window.scrollTo(0, 0))` |
| `loadAllCards` | 依赖「首页直接渲染卡片」；靠「切换板块后 scrollTo(0,0)」规避 D14-1/D17-1 竞态 | 语义不变（哨兵消失 + 条数达标双条件保留）；调用方一律改为先进书内页。**D14-1 竞态结构性消除**：不再在同页切板块，每次 `gotoBook` 都是新导航 |
| 页面选择器 | `.plant-card` / `.load-sentinel` | 不变（契约 2.2-8 要求类名与行为保持） |

> 说明：`gotoBook` 只保证首卡出现，不追加全量加载；需要全量的用例继续显式调用 `loadAllCards(page, N)`。

### 3.1 `frontend/e2e/smoke.spec.js`（9 条全部迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-22 | `page.goto('/')` + `loadAllCards(204)` + 点桃花卡 | 前置 `await gotoBook(page,'plant'); await loadAllCards(page,204);`，其余断言不变 | 迁移 |
| TC-23 | `page.goto('/')` + 204 | `gotoBook('plant')` + 204 | 迁移 |
| TC-26 | 同上 | `gotoBook('plant')` + 204 | 迁移 |
| TC-27 | `page.goto('/')`，首 4 卡同一行 | `gotoBook('plant')`；网格断言不变（`.plant-grid` 同规格不回归） | 迁移 |
| TC-63 | `page.goto('/')` + 204 | `gotoBook('plant')` + 204 | 迁移 |
| TC-67 | `page.goto('/')` + 204 + 进详情 | `gotoBook('plant')` + 204；详情断言不变 | 迁移 |
| TC-68 | 同上 | `gotoBook('plant')` + 204 | 迁移 |
| TC-69 | 同上 | `gotoBook('plant')` + 204 | 迁移 |
| TC-70 | 同上 + 详情字号 | `gotoBook('plant')` + 204；字号断言不变 | 迁移 |

### 3.2 `frontend/e2e/navigation.spec.js`（7 条全部迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| `enterFirstPlantDetail` helper | `page.goto('/')` + `loadAllCards(204)` + scrollTo(0,0) | `await gotoBook(page,'plant'); await loadAllCards(page,204); await page.evaluate(()=>window.scrollTo(0,0));` | 迁移 |
| TC-35 | 三通道换株 | 仅前置改为 `enterFirstPlantDetail`（内部已改） | 迁移 |
| TC-36 | `page.goto('/')` 两处 + 首尾循环 | 两处均改 `gotoBook('plant')` + `loadAllCards(204)` | 迁移 |
| TC-37 | 全屏进出 | 前置改 helper | 迁移 |
| TC-38 | 1024×768 无页面滚动 | 前置改 helper | 迁移 |
| TC-39 | 标题「回花园保住滚动位置」；`page.goto('/')`；返回链接 `/回花园/` | 标题改「回植物书保住滚动位置」；前置 `gotoBook('plant')`；返回链接 `/回植物书/`；**新增** `await expect(page).toHaveURL(/\/books\/plant$/)` | 迁移（断言增强） |
| TC-40 | 两视口 + 回花园热区 | 前置改 helper；`.back-btn` 选择 `/回花园/` → `/回植物书/`，热区断言不变 | 迁移 |

### 3.3 `frontend/e2e/responsive.spec.js`（10 条中 8 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| `enterFirstPlantDetail` helper | `page.goto('/')` + 204 | `gotoBook('plant')` + 204 | 迁移 |
| TC-48（×2 视口） | 前置 helper | 前置改 helper，断言不变 | 迁移 |
| TC-49（×2 视口） | 前置 helper | 前置改 helper，断言不变 | 迁移 |
| TC-50 | 全屏不滚动 | 前置改 helper，断言不变 | 迁移 |
| TC-51 | 图片不裁切 | 前置改 helper，断言不变 | 迁移 |
| TC-52 | 深链接 `/plants/azalea-flower` | **不改** | 复核不改 |
| TC-61（×2 视口） | 横屏两栏 | 前置改 helper，断言不变 | 迁移 |
| TC-62 | 深链接 `/plants/azalea-flower` | **不改** | 复核不改 |

### 3.4 `frontend/e2e/speech.spec.js`（2 条全部迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| `enterFirstPlantDetail` helper | `page.goto('/')` + 204 | `gotoBook('plant')` + 204 | 迁移 |
| TC-46 | 喇叭热区 | 前置改 helper，断言不变 | 迁移 |
| TC-47 | 播放后点 `/回花园/` 离开 | 返回链接改 `/回植物书/`；其余（`-zh.m4a` 请求、pause 增加）不变 | 迁移 |

### 3.5 `frontend/e2e/sprint9.spec.js`（9 条中 3 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-89 | `page.goto('/')` 断言 `.site-title-*` 三行 | **不改**（书架页保留站头三行，断言落点仍为 `/`） | 复核不改 |
| TC-90 | 标题「板块导航八钮两组」；`[role=group name=板块导航]` + 8 `.filter-btn` + 点按钮切板块 | 改为「书架两层八本」：`.shelf-group`=2、组标题 2 个、`.book`=8、8 个书名可见；随后**分别** `gotoBook('plant')`+`loadAllCards(204)`、对 animal / insect / dinosaur 各 `gotoBook`+`loadAllCards(50)`；**删除** `植物分类筛选` 的 group 断言（书架页也不再渲染它） | 迁移（重写） |
| TC-91a | 深链接 `/plants/giant-panda` | **不改** | 复核不改 |
| TC-91b（×2 视口） | 深链接 `/plants/apple-flower` | **不改** | 复核不改 |
| TC-92 | 深链接 `/plants/tyrannosaurus` | **不改** | 复核不改 |
| TC-93 | 深链接 `/plants/giant-panda` 音频 | **不改** | 复核不改 |
| TC-94 | `page.goto('/')` + 点「动物」+ reload 再点「动物」+ 顺序一致 | `await gotoBook(page,'animal'); await loadAllCards(50)`；reload 后 `await gotoBook(page,'animal'); await loadAllCards(50)`；顺序断言不变（首「大熊猫」） | 迁移 |
| TC-95 | `page.goto('/')` + 204 + 断言无大熊猫/霸王龙 | `gotoBook('plant')` + 204，断言不变 | 迁移 |

### 3.6 `frontend/e2e/sprint10.spec.js`（5 条中 2 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-109 | `page.goto('/')`，首屏 <204、`共 204 种`、滚到底 | `gotoBook('plant')`；其余断言不变 | 迁移 |
| TC-111 | 深链接 `/plants/giant-panda` 小知识标题 | **不改** | 复核不改 |
| TC-112 | 深链接 `/plants/giant-panda` 主图占比 | **不改** | 复核不改 |
| TC-113 | 深链接 `/plants/apple-flower` 单图版式 | **不改** | 复核不改 |
| TC-114 | 点导航切「动物/昆虫/恐龙」，各 `共 50 种` + 50 卡 | 循环 `for (const code of ['animal','insect','dinosaur']) { await gotoBook(page, code); await expect(.list-count).toHaveText('共 50 种'); await loadAllCards(page,50); }` | 迁移 |

### 3.7 `frontend/e2e/sprint11.spec.js`（4 条中 3 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-115 | `page.goto('/')` + 点「动物」+ 50 | `gotoBook('animal')` + 50；鲸鱼详情断言不变 | 迁移 |
| TC-116 | 点「昆虫」+ 50 | `gotoBook('insect')` + 50；蜘蛛详情断言不变 | 迁移 |
| TC-117 | 点「恐龙」+ 50 | `gotoBook('dinosaur')` + 50；骨架图断言不变 | 迁移 |
| TC-118 | 纯 `request.get` 图片资产 | **不改** | 复核不改 |

### 3.8 `frontend/e2e/sprint12.spec.js`（3 条全部迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-125~127（动物/昆虫/恐龙各 1 条） | 点 `.filter-btn` 切板块 → 首卡 → 返回按钮 `/回动物世界/`、`href="/"` → 点击返回后 `aria-pressed=true` | 循环 `[['animal','动物书'],['insect','昆虫书'],['dinosaur','恐龙书']]`：`gotoBook(code)` → 点首卡 → `.imm-topbar a.back-btn` 文本 `回{板块名}书` 且 `href="/books/{code}"` → 点击后 `expect(page).toHaveURL('/books/'+code)`、`h1` = `{板块名}书`、`.plant-card` 首卡可见 | 迁移（断言替换） |

### 3.9 `frontend/e2e/sprint13.spec.js`（2 条，全部不改）

| 原用例 | 原断言 | 处置 |
|---|---|---|
| TC-128 | 深链接 `/plants/apple-flower` 小知识渲染 | 复核不改 |
| TC-129 | 深链接 `apple-flower/leaf/fruit` 文案两两不同 | 复核不改 |

### 3.10 `frontend/e2e/sprint14.spec.js`（4 条中 1 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-130 | 点导航切三板块 → 各 `共 50 种` → 首卡 / 末卡 | 循环 `[['animal','大熊猫','鸵鸟'],['insect','蝴蝶','小虾'],['dinosaur','霸王龙','翼手龙']]`：`gotoBook(code)` → `共 50 种` → 首卡 → `loadAllCards(50)` → 末卡 | 迁移 |
| TC-131 | 深链接 3 条 | **不改** | 复核不改 |
| TC-132 | 图片资产 request | **不改** | 复核不改 |
| TC-133 | 音频资产 request | **不改** | 复核不改 |

### 3.11 `frontend/e2e/sprint15.spec.js`（9 条中 4 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-134 | 站头三行 + `[role=group 板块导航]` 两组/8 `.filter-btn` | 站头三行断言保留；导航断言改为书架：`.shelf-group-title` 文本 `['自然认知','认知启蒙']`、`.book`=8、「英文字母」「汉语拼音」书名可见 | 迁移（导航部分重写） |
| TC-135 | 点「英文字母」+ 首卡 Aa + 26 | `gotoBook('letter')`；首卡 Aa、`loadAllCards(26)`、`共 26 种`、首尾 Aa/Zz 不变；**删除**「规避 D14-1 竞态」注释 | 迁移 |
| TC-136 | 点「汉语拼音」+ 26 | `gotoBook('pinyin')`；其余不变 | 迁移 |
| TC-137 | 深链接 `/plants/letter-a` | **不改** | 复核不改 |
| TC-138 | 深链接 `/plants/pinyin-a` | **不改** | 复核不改 |
| TC-139 | 深链接音频契约 | **不改** | 复核不改 |
| TC-140 | 点「英文字母」→ 首卡 → `/回字母乐园/`；返回后点「汉语拼音」→ `/回拼音角/` | `gotoBook('letter')` → 首卡 → 返回文案 `/回英文字母书/`、`href="/books/letter"`；点返回 → 书内页 → 点「← 回书架」→ 书架 → `gotoBook('pinyin')` → 首卡 → `/回汉语拼音书/`、`href="/books/pinyin"` | 迁移（路径与文案全改） |
| TC-141 | 图片资产 request | **不改** | 复核不改 |
| TC-142 | 音频资产 request | **不改** | 复核不改 |

### 3.12 `frontend/e2e/sprint16.spec.js`（8 条中 3 条迁移）

| 原用例 | 原断言 / 前置 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-148 | 点「数字」+ 首卡「零」+ 21 | `gotoBook('number')`；首卡「零」、`loadAllCards(21)`、`共 21 种`、首尾「零/二十」不变 | 迁移 |
| TC-149 | 点「颜色」+ 11 | `gotoBook('color')`；其余不变 | 迁移 |
| TC-150 | 深链接 `/plants/number-1` | **不改** | 复核不改 |
| TC-151 | 深链接 `/plants/color-red` | **不改** | 复核不改 |
| TC-152 | 点「数字」→ 详情 `/回数字屋/`；返回后点「颜色」→ `/回颜色屋/` | `gotoBook('number')` → 首卡 → `/回数字书/`、`href="/books/number"`；点返回 → 书内页 → 「← 回书架」→ `gotoBook('color')` → 首卡 → `/回颜色书/`、`href="/books/color"` | 迁移 |
| TC-153 | 深链接音频契约 | **不改** | 复核不改 |
| TC-154 | 图片资产 request | **不改** | 复核不改 |
| TC-155 | 音频资产 request | **不改** | 复核不改 |

### 3.13 `frontend/src/__tests__/HomePage.test.jsx` 拆分方案（22 条去向）

**文件处置**：删除 `HomePage.test.jsx`；新增 `BookShelfPage.test.jsx` 与 `BookPage.test.jsx`；`deriveCardTitle` 纯函数用例（TC-64）随 `BookPage.test.jsx` 保留（其被测函数在 `PlantCard.jsx`，不属于页面）。`HomePage.jsx` 删除后所有 import 改为 `BookShelfPage` / `BookPage`。

| 原编号 | 原断言语义 | 去向 | 处置 |
|---|---|---|---|
| TC-11 | 植物板块无二级筛选条 | `BookPage.test.jsx`（`/books/plant`） | 迁移保留 |
| TC-12 | 仅 `getPlantsBySection('plant')`，不调 `getPlants` | `BookPage.test.jsx`（改断言为 `fetchBook('plant')` 或 client 等价调用） | 迁移保留 |
| TC-13 | 植物空态「这里还没有植物哦」 | 由 **TC-183** 覆盖，原用例合并删除 | 合并 |
| TC-20 | 卡片图 `loading="lazy"` | `BookPage.test.jsx` | 迁移保留 |
| TC-21 | 100 条渲染无异常 | `BookPage.test.jsx` | 迁移保留 |
| TC-25 | `.filter-btn { min-height ≥44px }` | `PlantDetailPage.test.jsx`（与 TC-124 同组，样式通用） | 移位保留 |
| TC-12b | 卡片链接 state 为 `section / category / list.length`（旧断言 `plant / undefined / 2`） | `BookPage.test.jsx`（保存新 state 形状；category 恒 undefined） | 迁移保留 |
| TC-45e | 列表不渲染喇叭 | `BookPage.test.jsx` | 迁移保留 |
| TC-59 | 卡片次级字号 ≥16px（样式源） | `BookPage.test.jsx` | 迁移保留 |
| TC-79 | 站头三行站名 | `BookShelfPage.test.jsx` | 移位保留 |
| TC-80a | 板块导航两组 8 个 `.filter-btn` | **删除**；由 **TC-171**（两层 8 本）替代 | 删除替换 |
| TC-146 | 字母卡缺拼音/英文不渲染空行 | `BookPage.test.jsx`（`/books/letter`） | 迁移保留 |
| TC-81 | 点导航切板块触发 section 请求 | **重写**为 **TC-179**（按 code 请求）+ **TC-166**（书内页加载） | 重写替换 |
| TC-80b | 非植物空态「这个板块还没有内容哦」 | 由 **TC-183** 覆盖 | 合并 |
| TC-25b | `.category-filter/.part-switcher/.section-nav` 同组 + `.section-nav` margin + `.filter-btn ≥56` | **删除**；替代：**TC-178**（`.book` 热区 ≥56 + hover）与 **TC-162**（一屏零溢出） | 删除替换 |
| TC-64 | `deriveCardTitle` 返回 `name.zh` | `BookPage.test.jsx`（纯函数用例原样保留） | 移位保留 |
| TC-106 | 「共 N 种」40 / 10 | `BookPage.test.jsx`（plant 书 40、animal 书 10，两次 render 而非切换） | 迁移保留 |
| TC-107 | 无 IO 时全量降级、无哨兵 | `BookPage.test.jsx` | 迁移保留 |
| TC-108 | 哨兵 16→32→40 | `BookPage.test.jsx`（与 **TC-180** 同源，保留原用例不重复计新增） | 迁移保留 |
| TC-108b | `sh:homeVisibleCount` 恢复 32 条 | **重写**为 **TC-184**：key 改 `sh:bookVisibleCount:plant`，并增加多书隔离断言 | 重写替换 |
| TC-123 | `.section-nav .filter-btn` 字号 ≥22px | **删除**；替代：**TC-177/183** 中书架书名与书内页 `h1` 的字号源断言（阈值按 UI 规范 U18-x 冻结值） | 删除替换 |
| TC-124 | `.filter-btn` 基础 20px 且不误伤 `.part-switcher` | `PlantDetailPage.test.jsx`，断言不变 | 移位保留 |

> 差异说明：`BookPage.test.jsx` 的 mock 目标随实现（`bookCache.fetchBook` vs `client.getPlantsBySection`）二选一，以开发设计文章 S18-5 定案为准。

### 3.14 `frontend/src/__tests__/PlantDetailPage.test.jsx`（6 条返回断言更新）

| 原编号 | 原断言 | 迁移后断言 | 处置 |
|---|---|---|---|
| TC-32 | `screen.getByRole('link', { name: /回花园/ })` | `/回植物书/`（默认 section=plant） | 更新 |
| TC-33 | `back` 文案 `/回花园/`，`href="/"` | 文案 `/回植物书/`，`href="/books/plant"` | 更新 |
| TC-45c | 断言存在 `/回花园/` 链接 | `/回植物书/` | 更新 |
| TC-119 | 4 板块文案 `回花园/回动物世界/回昆虫角/回恐龙园`，`href="/"` | `plant→回植物书 /books/plant`、`animal→回动物书 /books/animal`、`insect→回昆虫书 /books/insect`、`dinosaur→回恐龙书 /books/dinosaur` | 更新 |
| TC-120 | 40401 兜底 `回动物世界看看`，`href="/"` | `回动物书看看`，`href="/books/animal"` | 更新 |
| TC-121 | 未知 section 回退「花园」`回花园` | 回退 plant → `回植物书`，`href="/books/plant"` | 更新 |

> 其余 44 条（TC-14/15/16/18/20b/28~31/32b/33b/34/41~45b/45d/45f/53~56/60/65/66/82a/82b/83/84a/84b/88/101~105/122/147a/147b/159/160）**断言不变**，仅确认 `getPlant`/列表 mock 不被 `bookCache` 引入破坏。字母/拼音/数字/颜色四板块返回文案由 E2E **TC-167** 全量覆盖。

### 3.15 样式断言类用例结论（TC-25b / TC-123 / TC-124）

| 编号 | 依赖选择器 | 结论 | 替代断言 |
|---|---|---|---|
| TC-25b | `.section-nav`、`.category-filter`、`.part-switcher`、`.filter-btn` | **删除**（`SectionNav` 组件被删除，`.section-nav` 规则不再存在，保留即必红） | **TC-178**：`.book` `min-height ≥56px`、`:hover translateY ≤4px`；**TC-162**：1024/1180 页面级零溢出 |
| TC-123 | `.section-nav .filter-btn, .category-filter .filter-btn` | **删除**（两份选择器均随组件移除） | **TC-177**：书架书名 `.book-title-zh` 字号源断言（阈值取 UI 规范 U18-x）；**TC-179** 增加书内页 `h1` 字号源断言（不低于书内页标题冻结值） |
| TC-124 | `.filter-btn` 基础块 + `.part-switcher .filter-btn` 不存在覆盖 | **保留不改**（不依赖 `.section-nav`，保护详情部位按钮保持 20px） | 移位到 `PlantDetailPage.test.jsx` |

### 3.16 迁移后计数核对

| 文件 | 原有 | 迁移 | 不改 | 删除/合并 | 新增 | 终值 |
|---|---|---|---|---|---|---|
| `smoke.spec.js` | 9 | 9 | 0 | 0 | — | 9 |
| `navigation.spec.js` | 7 | 7 | 0 | 0 | — | 7 |
| `responsive.spec.js` | 10 | 8 | 2 | 0 | — | 10 |
| `speech.spec.js` | 2 | 2 | 0 | 0 | — | 2 |
| `sprint9.spec.js` | 9 | 3 | 6 | 0 | — | 9 |
| `sprint10.spec.js` | 5 | 2 | 3 | 0 | — | 5 |
| `sprint11.spec.js` | 4 | 3 | 1 | 0 | — | 4 |
| `sprint12.spec.js` | 3 | 3 | 0 | 0 | — | 3 |
| `sprint13.spec.js` | 2 | 0 | 2 | 0 | — | 2 |
| `sprint14.spec.js` | 4 | 1 | 3 | 0 | — | 4 |
| `sprint15.spec.js` | 9 | 4 | 5 | 0 | — | 9 |
| `sprint16.spec.js` | 8 | 3 | 5 | 0 | — | 8 |
| `sprint18.spec.js` | — | — | — | — | 9 | 9 |
| **E2E 合计** | **72** | **45** | **27** | **0** | **9** | **81** |
| `HomePage.test.jsx`（拆分至两个新文件） | 22 | 15（含 TC-81 / TC-108b 2 条重写）+ 2 移位至 PlantDetail | 0 | 3 删除 + 2 合并入 TC-183 | — | 0（文件删除） |
| `PlantDetailPage.test.jsx` | 50 | 6（返回文案断言更新） | 44 | 0 | — | **52**（含 2 条移入） |
| `BookShelfPage.test.jsx` | — | — | — | — | 8 | **9**（含 TC-79 迁入） |
| `BookPage.test.jsx` | — | — | — | — | 6 | **20**（含 14 条迁入） |
| **vitest 合计** | **72** | **28** | **44** | **3 删除 + 2 合并** | **14** | **81** |

---

## 四、门禁执行清单

> 顺序要求：后端 `mvn test` 与 E2E **不得并行**（Sprint 15 D15-2：争用资源致偶发失败）；E2E 需在容器重建 + 导入完成后的空闲窗口执行。`docker compose up -d --build` 而非 `restart`（新增封面为静态资源，必须重建 frontend 镜像）。

| 步骤 | 命令 | 通过标准 |
|---|---|---|
| **0 语料/资产校验** | `node scripts/import-plants.mjs`（校验 + 一次导入；连接参数指向 compose 的 Mongo/Redis/MySQL） | 退出码 0；输出 `total=440`；`categories=8`；`plant=206`（含 deprecated 2）；内容图 `.jpg=440`；**新增封面 8 张 `/images/covers/{code}.jpg` 单独计数（1200×1200、`image/jpeg`、可平铺）**；音频 `.m4a` 沿用 Sprint 17 终值不变（本迭代零改动）；语料 `flower/leaf/fruit` 口径不再断言（Sprint 17 起已合并为 plant） |
| **0b 封面资产规格** | `sips -g pixelWidth -g pixelHeight frontend/public/images/covers/*.jpg`（或等价脚本） | 8 张全部 `1200×1200`；md5 两两不同；无遗漏 code |
| **1 后端测试** | `cd backend && mvn test`（或沿用的 `docker run … maven mvn test`，Testcontainers 起真实中间件） | 退出码 **0**；surefire `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`（本迭代默认零改动；若 J 按 Q14 增设只读计数接口，则所需新增用例同时通过） |
| **2 前端单测 + 构建** | `cd frontend && npx vitest run && npx vite build` | vitest `Tests 81 passed (81)`、`Test Files` 全通过、**0 unhandled error**；`vite build` 退出码 **0** |
| **3 容器重建 + 健康 + 封面可达** | `docker compose up -d --build`；`curl -s localhost/api/health`；`curl -o /dev/null -w '%{http_code}' localhost/images/covers/plant.jpg` ×8 | `/api/health` = **UP**；8 张封面 **HTTP 200** 且 `Content-Type: image/jpeg`；书架页 `/` 返回 200 |
| **4 两次导入幂等** | 先记录 `import_log` 基线 → `node scripts/import-plants.mjs` → `node scripts/import-plants.mjs` → 查 `import_log` 终值、Mongo 计数、`redis-cli --scan --pattern 'sh:*'`、API 计数 | delta = **+880 = 2×440**；Mongo `plants/categories = 440 / 8`（含 deprecated 2 条不物理删除）；导入后 `redis sh:*` = **0**；API：all=**438** / plant=**204** / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / number=21 / color=11；分类 **8** 且 `order` 升序 |
| **5 E2E 全量** | `cd frontend && npx playwright test`（目标 = nginx 80；先 `docker compose up -d` 并完成步骤 4 导入） | **81 passed (81)**、退出码 0；新增 `sprint18.spec.js` TC-162~TC-170 全绿；12 个既有 spec 迁移后全绿 |
| **6 文档收尾** | 回填本手册「执行记录」「缺陷表」；Master 更新 `AGENTS.md` 项目状态 | 门禁证据齐备；全绿后方可 commit（阶段 4 硬性规则） |

---

## 五、不回归基线

- 后端既有 **28** 用例（含 TC-161 废弃条目过滤）全部通过。
- 前端既有语义用例经迁移后全部通过：卡片网格规格（`.plant-card` / `.plant-card-zh|pinyin|en`）、`.list-count`、`.load-sentinel`、`.plant-grid`、详情页版式/字号（Sprint 17 的 `.detail-zh` 48/56px 等）、音频 `.m4a` 契约、单图分支、`AllusionCard` 小知识标题。
- E2E 既有 27 条不改用例（深链接/资产 request 类）全部通过。
- PRD §7 / §9.4 / §10.4 / §11.4 / §12.4 / §13.5 / §14.5 / §15.5 / §16.5 / §17.5 / §18.5 / §19.5 / §20.6 全部不回归（验收 86）。

---

## 六、风险与执行注意

| # | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R1 | `loadAllCards` 与 `gotoBook` 的「首卡可见」竞态 | 迁移后列表断言早退/误判（D10-1、D14-1、D17-1 同族） | 保留「哨兵消失 **且** 条数达标」双条件；`gotoBook` 先等首卡再回滚 `scrollTo(0,0)`；切书统一走新导航，禁止同页切板块 |
| R2 | 8 板块返回文案/href 全量替换 | ~20 处断言（TC-119/120/121 + E2E TC-39/40/47 + sprint12/15/16），漏改一处即红或语义漂移 | 以 `SECTION_BOOK_TITLE` 单一来源断言；E2E TC-167 全 8 板块兜底；PlantDetail 单测仅覆盖 4 自然板块 |
| R3 | 滚动记忆 key 从全局改为按书 | `sh:homeScroll` / `sh:homeVisibleCount` 残留导致多书串味；TC-108b 若只改常量会漏隔离断言 | TC-184 显式断言「渲染 animal 后 plant 的 key 未被覆写」；E2E TC-169 双向往返验证 |
| R4 | 书架数量 8 次并发请求首屏耗时 | 若首屏 >2.5s，验收 76「一屏可看全」体验变差，Q14 可能触发后端计数接口 | TC-174/175/176 覆盖未就绪/失败隔离；E2E 首屏等待沿用 15s 超时；若新增后端接口，追加契约用例 |
| R5 | mock 模块随实现二选一（`bookCache` vs `client`） | 单测大面积失败 | 以 R 的开发设计文章 S18-5 定案为准；`clearBookCache()` 在 `beforeEach` 调用，避免跨用例缓存污染 |
| R6 | 封面计数口径混入内容图 `.jpg=440` | 校验步骤误判「图片总数回归」 | 门禁 0 步按目录分别计数；封面 8 张单列 |
| R7 | 新增封面未重建镜像 | E2E TC-164 404 | 必须 `docker compose up -d --build` |

---

## 七、执行记录（2026-10-24 已回填）

| 步骤 | 结果 | 时间 |
|---|---|---|
| 0 语料/资产校验 | **OK**：`categories=8`、`total=440`（plant 206，含 deprecated 2）、图片 `.jpg` 448（条目 440 + 封面 8）/ `.svg` 206、音频 `.m4a` 1028 | 2026-10-24 |
| 1 后端 `mvn test` | **OK**：28 用例，Failures 0 / Errors 0 / Skipped 0，退出码 0（maven:3.9-eclipse-temurin-26 容器；后端零改动） | 2026-10-24 |
| 2 前端 `vitest` / `vite build` | **OK**：vitest **81/81**（PlantDetailPage 52 / BookShelfPage 9 / BookPage 20）无 unhandled error；`vite build` 退出码 0（280.33 kB JS） | 2026-10-24 |
| 3 compose 重建 + health + 封面 | **OK**：`docker compose up -d --build` 后 `/api/health=UP`、`/`=200；8 张封面以 `curl \| md5` 与本地比对一致；书架 1024×768 `scrollH=768/scrollW=1024`、1180×820 `820/1180` 零溢出，控制台 0 报错 | 2026-10-24 |
| 4 两次导入幂等 | **OK**：import_log 12232 → **13112**，delta **+880 = 2×440**；Mongo **440 条目 / 8 分类**（含 deprecated 2 不物理删除）；导入后 `redis sh:*` = 0 | 2026-10-24 |
| 5 E2E 全量 | **OK**：`npx playwright test` **81/81**（13 files，29.0s）；修复 D18-1 后复跑仍 81/81 | 2026-10-24 |
| 6 文档收尾与 commit | **OK**：本手册执行记录/缺陷表已回填，`sprint-18.md` §八 门禁证据、`AGENTS.md` §五 状态、README 与 UI U18-6 已同步；门禁全绿后 commit（不 push） | 2026-10-24 |

## 八、缺陷与流程问题（已回填）

| # | 类型 | 描述 | 定位 | 处理 | 状态 |
|---|---|---|---|---|---|
| D18-1 | 测试层 | TC-168 / TC-169 用 `locator('.plant-card').nth(12).click()`，Playwright 先把卡片自动滚动进视口，`PlantCard` onClick 记录的 `scrollY` 与断言基准（`beforeY`/`yP`）不一致 → 全量 E2E 79/81 | `frontend/e2e/sprint18.spec.js` TC-168 / TC-169 | 改为 `page.evaluate` 内 DOM 直点并回传实际 `clickY`（同步触发 React onClick），断言与 `clickY` 比较；产品代码零改动 | **已修复**（复跑 81/81） |
| D18-2 | 文档口径 | 手册与实现/冻结口径 9 处不一致：TC-173 `section:'nature'` 应取已知板块；TC-175 `.book-count` 始终渲染（空串占位）；TC-176 错误优先 `error.message`；TC-177/TC-164 `background-repeat:no-repeat`；TC-178 `.book` 用 `height` 而非 `min-height`；`.shelf-group` → `.shelf-row` 类名映射；TC-169 按 §四-4「从书架进入置顶、仅恢复条数」；TC-165 只断言水平溢出；计数算术以 81 终值回填 | 手册 TC-164~TC-178 | QA 逐条改为按实现/冻结口径断言，并在交付说明中列明；无产品改动 | **已对齐** |
| R18-1 | 实现提示（非缺陷） | 书内页从书架往返时滚动置顶（`sh:bookScroll:{code}` 仅在卡片点击进详情时写入），与 §四-4 冻结口径一致；若产品改为「回书架再进仍在原位置」需 PO 追加需求由 R 改造 | `BookPage` / `PlantCard` | 保持现状，记入遗留供人工复核 | **待人工确认** |
