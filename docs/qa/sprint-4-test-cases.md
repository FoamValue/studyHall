# Sprint 4 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 4 新增用例（TC-28 起）+ Sprint 1~3 全量回归 + PRD §9.4 增量验收矩阵；全部通过前禁止 commit |
| 依据 | docs/product/iteration-4-requirements.md、docs/iterations/sprint-4.md、PRD §9 |
| 执行记录 | 2026-10-17 全量回归：后端 `mvn test` 退出码 0（TC-01~13、TC-24 数据驱动 100 种全绿）；前端 `npx vitest run` 22/22 通过、`vite build` 退出码 0；`docker compose up -d --build` 重建后健康；导入连跑两次：Mongo 100 种 / 3 分类无重复、import_log delta = +200、Redis `sh:*` 导入后为 0；`npx playwright test` 11/11 通过（TC-22/23/26/27 + TC-35~TC-40）。QA 放行。 |

## 一、前端组件测试（Vitest，`npx vitest run`）— 新增

> 前置调整：`PlantDetailPage.test.jsx` 的 api mock 需补 `getPlants`（默认 `mockResolvedValue([])` 或返回与用例一致的列表），因为详情页在无路由 state 时会兜底拉取邻居列表。既有 TC-14~TC-20b 断言语义不变（保留 `.part-img`、`role="tab"`、`.detail-zh`、`loading="lazy"`）。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-28 | 邻株按钮切换（点「下一株」） | 带 `state.list=[a,b,c]`、当前 a，渲染详情；点「下一株」 | `getPlant` 以 b 调用，详情中文名更新为 b | 通过 |
| TC-29 | 首尾循环 | `list=[a,b,c]`、当前 a，点「上一株」；再看当前 c 点「下一株」 | a 的上一株 = c；c 的下一株 = a | 通过 |
| TC-30 | 换株后部位回落 | 当前植物含 flower+leaf 且选中 leaf；下一株仅含 fruit | 切换后部位自动落到 fruit，渲染果实图与说明 | 通过 |
| TC-31 | 单株/空列表禁用 | `list=[a]` | 「上一株」「下一株」按钮存在但 `disabled`，不隐藏 | 通过 |
| TC-32 | 全屏按钮降级 | jsdom 默认 `document.fullscreenEnabled` 为假 | 「全屏」按钮不渲染；沉浸式功能（回花园、部位切换）正常 | 通过 |
| TC-32b | 全屏按钮可用时触发 API | 置 `document.fullscreenEnabled=true` 且 `Element.prototype.requestFullscreen=vi.fn()`；点「全屏」 | `requestFullscreen` 被调用一次 | 通过 |
| TC-33 | 沉浸式态存在「回花园」入口 | 详情 ready | 存在可点「← 回花园」链接，指向 `/` | 通过 |
| TC-33b | 键盘 → 换植物 | 详情 ready，`fireEvent.keyDown(window, {key:'ArrowRight'})` | 切到相邻植物并更新中文名 | 通过 |
| TC-34 | 热区样式断言（新增样式规则） | 读 `src/styles.css` | `.nav-btn` 规则含 `min-height ≥ 56px`；`.part-img` 含 `object-fit: contain` | 通过 |

## 二、E2E 冒烟（Playwright，`npx playwright test`）— 新增

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-35 | 三通道换植物行为一致 | 分别用 ①点「下一株」按钮 ②按 `ArrowRight` ③在沉浸式容器派发左滑触摸序列，从同一株（花朵分类首张）出发各切一次 | 三种方式落到**同一株**（中文名一致） | 通过 |
| TC-36 | 首尾循环 | 首页选「花朵」→ 记录首张与末张卡中文名 → 进首张详情 → 点「上一株」 | 详情跳到该分类**末张**；反向由末张点「下一株」回到首张 | 通过 |
| TC-37 | 系统全屏进出不丢位置 | 进详情 → 记录中文名 → 点「全屏」→ 点「退出全屏」 | `document.fullscreenElement` 由 null → 非空 → null；中文名不变 | 通过 |
| TC-38 | 沉浸式无页面级滚动条 | 进详情（1024×768） | `documentElement.scrollHeight ≤ clientHeight + 1`；`.part-img` 可见且 `object-fit: contain` | 通过 |
| TC-39 | 返回首页保住分类与滚动位置 | 首页选「花朵」→ 滚动到列表中部 → 进卡片 → 点「← 回花园」 | 「花朵」按钮 `aria-pressed=true`；`window.scrollY > 0`（未回到顶部） | 通过 |
| TC-40 | 平板尺寸适配 | 1024×768 与 768×1024 两种视口进详情 | 图片完整可见；「上一株/下一株」与「回花园」热区高度 ≥56px；无页面级滚动 | 通过 ×2 |

> TC-37 补充说明：Playwright headless Chromium 不模拟浏览器原生 Esc 退出全屏（Esc 由浏览器处理，与「退出全屏」按钮走同一条 `fullscreenchange` 路径），故自动化以「退出全屏」按钮验证 PRD §9.4-8「Esc **或**退出按钮可回沉浸式态」；Esc 行为在真实浏览器由人工抽验。

## 三、全量回归（Sprint 1~3 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24 | 100 种规模下全部通过（后端本迭代零改动，纯回归） | 通过 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b | 全部通过（TC-12b 为新增：卡片携带分类与列表快照） | 通过 |
| E2E | TC-22、TC-23、TC-26、TC-27 | 全部通过（详情页保留 `.detail-zh`/`[role=tab]`/`.part-img`，原断言无需改） | 通过 |
| 导入 | TC-10 幂等 | 导入两次：Mongo 总数 100 无重复、import_log delta = +200、Redis `sh:*` 导入后为 0 | 通过 |

## 四、PRD §9.4 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §9.4-6 从详情 ≤1 次操作切到相邻植物，无白屏 | 点「下一株」一次即换株；切换后图片立即可见 | TC-28、TC-35 |
| §9.4-7 沉浸式图片不裁切、无页面级滚动条 | `object-fit: contain` + `scrollHeight ≤ clientHeight` | TC-34、TC-38 |
| §9.4-8 全屏进出不丢位置 | `fullscreenElement` 进出一致，中文名不变 | TC-37 |
| §9.4-9 三通道一致（含首尾循环、限当前分类） | 三方式落到同一株；首尾循环；切换限于当前分类列表 | TC-35、TC-36 |
| §9.4-10 可操作元素热区 ≥56px | 结构 + 样式表断言（`.nav-btn`/`.back-btn`/`.filter-btn`） | TC-34、TC-40 |
| §9.4-11 平板横竖屏、1024×768、iPad 尺寸正常 | 两种视口下图片可见、无页面级滚动、热区达标 | TC-40 |

## 五、放行标准（QA 裁决）
1. TC-01 ~ TC-40 全部「通过」，无跳过；§9.4 验收矩阵逐条打勾。
2. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；导入两次幂等成立。
3. 全部满足 → QA 宣告放行，Master 执行 commit；任一失败 → 回阶段 3 修复，禁止 commit。
