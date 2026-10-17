# Sprint 10 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 10 新增用例（编号接 TC-100，自 **TC-101** 起）+ Sprint 1~9 全量回归 + PRD §15.5 增量验收矩阵（34~40）；全部通过前禁止 commit |
| 依据 | docs/product/iteration-10-requirements.md、docs/iterations/sprint-10.md、PRD §15 |
| 执行记录 | 2026-10-17 QA-25 全量门禁**全绿**：语料 `total=130` / 分类 6；后端 `mvn test` 退出码 0（21 用例回归）；前端 `npx vitest run` **67/67**、`vite build` 退出码 0；`docker compose up -d --build` 健康 `UP`；导入两次幂等（import_log 2520→2780，delta **+260 = 2×130**；Mongo **130 条目 / 6 分类**；导入后立即 `redis sh:*` = 0）；`npx playwright test` **43/43** |

> **编号口径**：本迭代后端**无新增用例**（后端零改动，回归 21 用例）；前端单测 TC-101~TC-108；E2E TC-109~TC-114。新增子用例用字母后缀。

## 一、后端集成测试（Maven，`mvn test`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 后端零改动（J-13）；既有 **21 用例**（TC-01~TC-13、TC-24、TC-57/58、TC-71~TC-77）作为回归基线，退出码须为 0 | 通过 |

## 二、前端组件测试（Vitest，`npx vitest run`）— 新增
> 说明：jsdom 不计算级联样式，样式断言沿用既有做法（读 `src/styles.css` 源文件）；`IntersectionObserver` 用 stub 注入。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-101 | 小知识可见标题 | `render(<AllusionCard allusion={{text:'…'}}/>)` | 卡片内存在可见文本「**小知识**」（`.allusion-title`）；`aria-label` 仍为「小知识」 | 通过 |
| TC-102 | 小知识标题字号 | 读 `src/styles.css` | `.allusion-title` 的 `font-size ≥ 20px` | 通过 |
| TC-103 | 无内容不渲染（不回归） | `render(<AllusionCard allusion={null}/>)` 与 `{}` | 容器为空，无 `.allusion-card` | 通过 |
| TC-104 | 单图分支容器类 | 单图条目详情（`parts:{animal:{…}}`） | `.detail-body` 含 `single-image` 类；植物三部位条目的 `.detail-body` **不含** | 通过 |
| TC-105 | 单图横屏栏宽（EX-5） | 读 `src/styles.css` | `@media (orientation: landscape)` 内 `.detail-body.single-image` 栏宽 = **64%**；既有 `.detail-body` 栏宽仍 **48%**（植物不回归） | 通过 |
| TC-106 | 「共 N 种」口径 | 渲染首页（mock 长度 40）/ 切分类（mock 长度 7）/ 切动物板块（mock 长度 10） | `.list-count` 文本依次为「共 40 种」「共 7 种」「共 10 种」 | 通过 |
| TC-107 | 增量加载降级（jsdom 无 IO） | mock 40 条；不注入 `IntersectionObserver` | 首屏即渲染全量 40 张卡（降级）；不渲染 `.load-sentinel` | 通过 |
| TC-108 | 哨兵与追加（stub IO） | 注入 `IntersectionObserver` stub（默认不触发）；mock 40 条 | 首屏渲染 **16** 张卡且 `.load-sentinel` 存在；触发回调后追加至 32 张；再次触发至 40 张后哨兵消失 | 通过 |
| TC-108b | 滚动记忆兼容 | `location.state.restoreScroll=true` + `sessionStorage['sh:homeVisibleCount']=32`；mock 40 条 | 初始渲染 32 张卡（`max(16, 32)`），不因首屏 16 而丢失返回位置 | 通过 |
| TC-21（更新） | 100 条渲染断言稳妥化 | mock 100 条（jsdom 无 IO → 全量降级） | `await findByText('植物99')` 后 `.plant-card` 计数 = 100（原同步断言改为等待全量） | 通过 |

## 三、E2E（Playwright，`npx playwright test`）— 新增
> 前置：`docker compose` 已启动、nginx 在 `http://localhost:80`、真实浏览器 `IntersectionObserver` 可用。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-109 | 植物板块增量加载至全量 + 总量 | 首页植物「全部」；循环滚动到底 | 首屏卡片数明显 < 100；滚动后累计 = **100**；`.list-count` = 「共 100 种」 | 通过 |
| TC-110 | 分类态总量口径 | 切「花朵」分类 | `.list-count` = 「共 53 种」；列表计数一致 | 通过 |
| TC-111 | 小知识可见标题（E2E） | `/plants/giant-panda` | `.allusion-title` 文本 = 「小知识」（可见） | 通过 |
| TC-112 | 单图横屏主图占比（EX-5） | 动物详情 @1024×768 | 主图高度 / 可用高度 **≥ 0.8**；图片完整在容器内（未超边界） | 通过 |
| TC-113 | 植物版式不回归（EX-5 红线） | `/plants/apple` @1024×768 | `.detail-body` **不含** `single-image`；3 个部位标签；大图可见；页面级 X/Y 溢出 = 0 | 通过 |
| TC-114 | 板块总量提示 | 依次切 动物 / 昆虫 / 恐龙 | `.list-count` 均 = 「共 10 种」；各渲染 10 张卡 | 通过 |
| TC-95（更新） | 植物「全部」限定板块 + 全量 | 植物「全部」；滚动加载至全量 | 累计恰 **100** 张卡；不含「大熊猫」「霸王龙」 | 通过 |

## 四、语料与资产校验（回归）
| 编号 | 用例 | 期望 | 状态 |
|---|---|---|---|
| TC-96~TC-100 | 语料 schema / 限长 / 图片 / 音频 / 导入幂等 | 与 Sprint 9 口径一致，**内容与资产完全不动**：`total=130`、分类 6、图 266、音频 260、导入两次幂等 | 通过 |

## 五、全量回归（Sprint 1~9 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24、TC-57/58、TC-71 ~ TC-77 | 全量通过（21 用例） | 通过 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34、TC-41 ~ TC-45f、TC-53 ~ TC-88 | 全部通过（含 US-6/US-7/US-8、Sprint 6 无滚动、Sprint 7 封面/字号、Sprint 8 派生、Sprint 9 板块/单图/音频） | 通过 |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40、TC-46 ~ TC-52、TC-61 ~ TC-70、TC-89 ~ TC-95（含 TC-95 更新） | 全部通过 | 通过 |

> **断言影响面（Q7 确认）**：TC-21 与 TC-95 因增量加载需按上表更新；TC-90 / TC-94（动物 / 昆虫 / 恐龙 10 卡）因 10 ≤ 16 首屏即全量**不受影响**；TC-11 / TC-80a 筛选条结构不变。

## 六、PRD §15.5 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §15.5-34 小知识可见标题（≥20px；无内容不渲染；长条目不溢出） | 单测 + E2E | TC-101、TC-102、TC-103、TC-111、TC-113 |
| §15.5-35 单图横屏主图占可用高 ≥80%（完整不裁切） | E2E | TC-112 |
| §15.5-36 植物详情版式不回归（部位按钮、US-8、溢出 0） | 单测 + E2E | TC-104、TC-105、TC-113、（回归）TC-83、TC-91b |
| §15.5-37 首页首屏 + 滚动增量加载；顺序语义；滚动记忆不回归 | 单测 + E2E | TC-106、TC-107、TC-108、TC-108b、TC-109、TC-95、（回归）TC-94 |
| §15.5-38 「共 N 种」口径 | 单测 + E2E | TC-106、TC-109、TC-110、TC-114 |
| §15.5-39 既有 v1.0~v2.0 不回归 | 全量回归 | §五 |
| §15.5-40 平板横竖屏正常；热区 ≥56px；控制台无报错 | E2E + 样式断言 | TC-112、TC-113、TC-25b、（E2E 既有） |

## 七、放行标准（QA 裁决）
1. TC-101 ~ TC-114（本迭代新增，含后缀子用例）全部「通过」，无跳过；§六 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-100 回归全部通过；TC-21 / TC-95 按本手册口径更新后通过。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立；语料 `total=130`、分类 6。
4. 接口契约 / 语料结构 / 图片与音频路径 / 路由**均不变**。
5. 以上全部满足后 QA 放行，Master 执行 commit。

## 八、门禁发现的缺陷与修复（QA 记录）
| 编号 | 现象 | 根因 | 修复 | 验证 |
|---|---|---|---|---|
| D10-1 | 增量加载下 E2E 列表断言偶发失败（TC-26 果实 53 卡：滚动后哨兵未消失、仍停在首屏 16） | 共享 `loadAllCards` 以「哨兵是否消失」为唯一早退条件，而「数据到达 / IO 挂载 / 首次滚动」三者存在竞态，可能在不该早退时判空 | 终止条件改为「哨兵消失 **且** 已渲染条数 ≥ 预期」双条件，步进等待放宽至 250ms、上限 60 次 | 复跑 `npx playwright test` **43/43** 全绿；TC-26 单独复跑稳定通过 |
