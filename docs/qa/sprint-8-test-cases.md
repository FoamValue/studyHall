# Sprint 8 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 8 新增用例（编号接 TC-63，自 TC-64 起）+ Sprint 1~7 全量回归 + PRD §13.5 增量验收矩阵；全部通过前禁止 commit |
| 依据 | docs/product/iteration-8-requirements.md、docs/iterations/sprint-8.md、PRD §13 |
| 执行记录 | 2026-10-17 全量回归：第 0 步语料校验 `OK total=100 flower=53 leaf=100 fruit=53`；后端 `docker mvn test` 退出码 0（16 用例，0 失败/0 错误/0 跳过，本迭代后端零改动）；前端 `npx vitest run` 47/47 通过（新增 TC-64a~d、TC-65/TC-66a~d 共 9 个；原 38 + 更新 TC-12）、`vite build` 退出码 0；`docker compose up -d --build` 重建后健康（`/api/health` = `{"code":0,"data":{"status":"UP"},"message":"ok"}`）；导入幂等（导入前 import_log=1700，连跑两次后 1900，delta +200 = 2×100；Mongo 100 种 / 3 分类无重复；导入后立即 `redis sh:*` = 0）；`npx playwright test` 28/28 通过（既有 20 + Sprint 7 TC-61~TC-63 + 本次 TC-67~TC-70；既有 TC-22/TC-26/TC-36 按新派生语义更新断言后通过）。QA 放行。 |

## 一、后端集成测试（Maven，`mvn test`）— 本迭代无新增
> 本迭代后端**零代码变更**，接口契约与语料不变；回归既有 TC-01 ~ TC-13、TC-24、TC-57、TC-58 即可。

| 编号 | 用例 | 期望 | 状态 |
|---|---|---|---|
| —（无新增） | — | 后端既有用例全量通过（含 TC-57/TC-58 封面分类） | 通过 |

## 二、前端组件测试（Vitest，`npx vitest run`）— 新增

> 说明：jsdom 不计算级联样式，样式断言沿用既有做法（读取 `src/styles.css` 源文件）。本迭代新增用例直接断言导出纯函数 `deriveCardTitle(plant, category)` 与详情默认部位选择。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-64 | 卡片标题派生规则（EX-4） | 调用 `deriveCardTitle(plant, category)`：`apple/向日葵/玫瑰/蒲公英/桃花` × `flower`；`apple/maple/ginkgo/蒲公英` × `leaf`；`ginkgo/pine/lotus/apple` × `fruit`；任一植物 × `all` | flower：不含「花」的名+「花」（苹果→苹果花、向日葵→向日葵花、玫瑰→玫瑰花、蒲公英→蒲公英花）；含「花」保持原名（桃花→桃花）；leaf：**一律** 名+「叶」（苹果叶、枫树叶、银杏叶、蒲公英叶）；fruit：银杏→白果、松树→松果、荷花→莲蓬，其余保持原名（苹果→苹果）；all/未知→原名 | 通过 |
| TC-65 | 详情默认部位跟随入口分类——树叶（EX-5） | `renderDetail('apple', { category: 'leaf', list: [...] })`（苹果含花/叶/果） | 默认选中「叶」标签（`aria-selected=true`）、大图 `alt='苹果的叶'`/`src=apple-leaf.jpg`，与卡片图一致；切「花」「果」标签仍可手动切换 | 通过 |
| TC-66 | 详情默认部位跟随入口分类——全部/花朵/果实 + 换株（EX-5 回归+扩展） | ① `apple` + `all` → 默认「花」；② `apple` + `flower` → 默认「花」；③ `ginkgo` + `fruit` → 默认「果」；④ `apple` + `flower`，点「下一株」到 `peach` → 新植物默认「花」 | ①默认「花」（`parts` 首位不同不影响，仍回落首个）；②默认「花」；③默认「果」、`src=ginkgo-fruit.jpg`；④换株后新植物默认部位仍跟随 `flower` | 通过 |

## 三、E2E（Playwright，`npx playwright test`）— 新增

> 前置：`docker compose` 已启动、nginx 在 `http://localhost:80`、列表就绪（等 `.plant-card` 计数稳定）。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-67 | 树叶分类：苹果标题「苹果叶」且详情默认选叶（EX-4+EX-5 端到端） | 首页选「树叶」→ 读 `.plant-card`(hasText 苹果) 的 `.plant-card-zh`；点苹果进详情 → 读默认选中标签与 `.part-img` src | 标题 = **苹果叶**；详情默认选中「叶」、`.part-img` src = `/images/plants/apple-leaf.jpg`（与卡片图一致） | 通过 |
| TC-68 | 花朵分类：苹果标题「苹果花」（EX-4） | 首页选「花朵」→ 读苹果卡片 `.plant-card-zh` | 标题 = **苹果花** | 通过 |
| TC-69 | 果实分类：银杏标题「白果」（EX-4 特例） | 首页选「果实」→ 读银杏卡片 `.plant-card-zh` | 标题 = **白果** | 通过 |
| TC-70 | 全部分类：苹果标题原名 + 详情默认「花」（回归） | 首页「全部」→ 读苹果卡片标题；点苹果进详情 → 读默认选中标签 | 标题 = **苹果**；详情默认选中「花」 | 通过 |

## 四、全量回归（Sprint 1~7 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24、TC-57、TC-58 | 全量通过（契约与语料不变） | 通过 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34、TC-41 ~ TC-45f、TC-53 ~ TC-66 | 全部通过（含 Sprint 5 语音、Sprint 6 无滚动、Sprint 7 封面/字号、Sprint 8 派生与默认部位） | 通过 |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40、TC-46 ~ TC-52、TC-61 ~ TC-70 | 全部通过；TC-22 / TC-36 依赖 `.plant-card-zh` 文本比较，须确认花朵分类标题语义（含「花」原名不变）不回归 | 通过 |
| 导入 | TC-10 幂等 | 导入两次：Mongo 总数不变无重复、import_log delta = 2×总数、Redis `sh:*` 导入后为 0 | 通过 |
| 语料校验 | 导入前第 0 步脚本 | 以实际输出为准（预期 `OK total=100 flower=53 leaf=100 fruit=53`） | 通过 |
| 抽查 | 封面跟随分类（Sprint 7 回归） | `?category=leaf` 中 apple.coverImage=`apple-leaf.jpg`；`?category=fruit` 中 ginkgo=`ginkgo-fruit.jpg` | 通过 |

## 五、PRD §13.5 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §13.5-23 花朵分类：不含「花」名+「花」，含「花」保持原名 | 纯函数单测 + E2E 花朵分类标题 | TC-64、TC-68 |
| §13.5-24 树叶一律名+「叶」；果实特例 白果/松果/莲蓬、其余原名；全部原名 | 纯函数单测 + E2E 树叶/果实标题 | TC-64、TC-67、TC-69 |
| §13.5-25 详情默认部位跟随入口分类（叶/花/果；全部→花；换株跟随） | 组件单测 + E2E 端到端 | TC-65、TC-66、TC-67、TC-70 |

## 六、放行标准（QA 裁决）
1. TC-64 ~ TC-70 全部「通过」，无跳过；§13.5 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-63 回归全部通过（含 Sprint 6 无滚动、Sprint 7 封面/字号、US-6/US-7）。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立。
4. 接口契约与语料不变；路由与既有行为不回归。
5. 以上全部满足后 QA 放行，Master 执行 commit。
