# Sprint 12 — v2.3 PF 体验回流（三视角）：返回文案随板块派生 + 详情拼音字号对齐 + 首页板块/分类按钮字号提升

| 项 | 内容 |
|---|---|
| 迭代目标 | 承接 [PF 浏览器体验报告 v3](file:///Users/chenxinjie/Mirror/github/studyHall/docs/experience/experience-review-v3.md) 与 [PO 裁决 v3](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v3.md)，把三项小微优化一次性交付：**EX-7** 详情返回文案按板块派生（P1）、**EX-8** 横屏详情拼音 16px → 20px（P2）、**EX-9** 首页板块 / 分类按钮 20px → 22px（P2）。均为**纯前端**改动。 |
| 状态 | ✅ 已完成（2026-10-18 门禁全绿、QA 放行、Master commit） |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §17（增量 v2.3：US-17~US-19，验收 48~53）；[experience-triage-v3.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v3.md) §6 |
| 类型 | **前端体验优化**（文案 + 样式；后端 / 语料 / 图片 / 音频 / 路由 / 接口契约**零改动**） |
| 基线 | v2.2：语料 190（plant100/animal30/insect30/dinosaur30）、分类 6、图片 296、音频 380；后端 21 用例 / 前端 vitest 67 / E2E 47 全绿 |

## 一、迭代范围（Scope，来自 PRD §17）

| 编号 | 范围项 | 对应 PRD | 说明 | 风险级 |
|---|---|---|---|---|
| EX-7 | **返回文案按板块派生** | §17.3.1 | `PlantDetailPage` 返回按钮文案随 `section` 派生（植物「回花园」/ 动物「回动物世界」/ 昆虫「回昆虫角」/ 恐龙「回恐龙园」）；异常兜底 `回{板块名}看看` 同步派生 | 低 |
| EX-8 | **横屏详情拼音字号对齐** | §17.3.2 | `@media (orientation: landscape)` 内 `.detail-header .detail-pinyin` 16px → **20px**，字重/颜色不变 | 低 |
| EX-9 | **首页板块 / 分类按钮字号提升** | §17.3.3 | `.section-nav .filter-btn`、`.category-filter .filter-btn` 20px → **22px**；`.part-switcher .filter-btn`（详情部位按钮）**不误伤** | 低 |

**不在本迭代范围**：任何后端 / 语料 / 图片 / 音频 / 路由 / 接口契约改动；竖屏单图留白（N5）；音频真机听感（N6，人工抽验）；植物 176 处缺失小知识（N2，**单列 Sprint 13 内容产线**）；板块内容续扩。

## 二、总体路线图（Master）

| Sprint / 阶段 | 目标 | 状态 |
|---|---|---|
| Sprint 1~11 | v1.0 冻结 → v1.1~v1.5 增量 → v2.0 四板块能力先行 → v2.1/v2.2 PF 回流与内容扩容 | ✅ |
| **Sprint 12（本次）** | **v2.3 PF 体验回流三视角：EX-7 / EX-8 / EX-9** | ⏳ |
| Sprint 13+ | 内容产线：植物 176 处小知识补齐（N2，走导入通道）；板块续扩（各 30 → ≤100） | ⏳ |
| 后续 | PF 阶段 5 三次回流；恐龙内容策略议题（须人工解冻 §14.6） | ⏳ |

## 三、任务拆解

| 编号 | 任务 | 角色 |
|---|---|---|
| **_阶段 2：迭代准备（文档先行，产出齐备才允许开发）_** | | |
| PO-12 | 整理《迭代需求文档》`docs/product/iteration-12-requirements.md`（冻结三项改动口径、派生表、字号口径、验收标准） | PO |
| R-34 | 前端《开发设计文章》增量（EX-7 文案派生派生表与兜底、EX-8 横屏样式分支、EX-9 选择器限定） | R |
| J-16 | 后端《开发设计文章》增量：确认**零改动** | J |
| UI-15 | UI 规范增量：字号口径（拼音 20px / 首页按钮 22px / 详情部位按钮保持 20px）、返回文案口径 | UI |
| QA-29 | 《迭代测试用例手册》`docs/qa/sprint-12-test-cases.md`（编号接 TC-118，自 **TC-119** 起），并出具受影响断言清单 | QA |
| **_阶段 3：开发推进（前端代码 + 测试）_** | | |
| R-35 | 实现 EX-7：`PlantDetailPage.jsx` 派生返回文案（含异常兜底） | R |
| UI-16 | 实现 EX-8 / EX-9：`styles.css` 横屏拼音 20px + 首页 `.section-nav`/`.category-filter` 按钮 22px（限定选择器，不误伤 `.part-switcher`） | UI |
| R-36 | 补 / 改前端单测（EX-7 四板块派生、EX-8 样式源断言、EX-9 限定选择器断言）与 E2E（EX-7 返回文案派生） | R |
| **_阶段 4：完成门禁_** | | |
| QA-30 | 全量回归与放行：语料校验 + 后端 `mvn test` + 前端 `npx vitest run` / `vite build` + `docker compose up -d --build` 健康 + 两次导入幂等 + `npx playwright test`，全绿后 Master 执行 commit | QA |

## 四、验收标准（Sprint 12 Definition of Done）

1. **EX-7**：详情页返回按钮文案随板块派生（植物「回花园」/ 动物「回动物世界」/ 昆虫「回昆虫角」/ 恐龙「回恐龙园」）；`href` 仍为 `/` 且 `location.state` 传递（section/category/restoreScroll）不变；异常兜底文案 `回{板块名}看看` 同步派生。
2. **EX-8**：`@media (orientation: landscape)` 内 `.detail-header .detail-pinyin` 字号 = **20px**（与 `.detail-en` 同）；基础规则 `.detail-pinyin`（非横屏）不受影响；字重 400 与颜色不变。
3. **EX-9**：`.section-nav .filter-btn` 与 `.category-filter .filter-btn` 字号 = **22px**；`.filter-btn` 基础规则仍 20px，`.part-switcher .filter-btn` 保持 20px（不误伤）；按钮 `min-height:56px` 与配色不变。
4. **不溢出**：1024×768 / 1180×820 详情页长文案条目页面级 X / Y 溢出为 0（Sprint 6 无滚动约束保持）；首页「恐龙」等长文案按钮不换行、不超容器。
5. **不回归**：既有 v1.0~v2.2 全部验收项（§7、§9.4、§10.4、§11.4、§12.4、§13.5、§14.5 26~33、§15.5 34~40、§16.5 41~47）**不回归**；热区 ≥56px 保持；控制台 0 报错。
6. **门禁全绿**：语料校验 `total=190`；后端 `mvn test` 退出码 0（21 用例，后端零改动）；前端 `npx vitest run` 全通过、`vite build` 退出码 0；`docker compose up -d --build` 健康 `UP`；两次导入幂等（import_log delta **+380 = 2×190**；Mongo 190 条目 / 6 分类；导入后 `redis sh:*` = 0）；`npx playwright test` 全通过；全绿后 QA 放行、Master commit（**禁止 push**）。

## 五、风险与依赖

| 风险 / 依赖 | 影响 | 应对 |
|---|---|---|
| 既有单测 / E2E 断言「← 回花园」「回花园看看」 | 若正则在植物板块外命中，绿化失败 | R-36 逐一核对：既有断言均在植物板块，派生后植物文案不变，天然通过；新增动物 / 昆虫 / 恐龙派生断言 |
| EX-9 选择器误伤详情部位按钮（同样 `.filter-btn`） | 详情版式回归（部位按钮变大） | 仅用 `.section-nav .filter-btn` / `.category-filter .filter-btn` 限定；QA 加「`.part-switcher .filter-btn` 仍 20px」断言 |
| EX-8 拼音放大挤压竖向空间 | 详情长文案溢出（Sprint 6 红线） | 仅横屏分支 +4px（≈行高 28px），实测 1024×768 / 1180×820 溢出为 0；QA 复跑响应式 E2E |
| 前端源码改动需重建镜像才生效 | E2E 用旧构建 | 门禁第 3 步 `docker compose up -d --build`（非 `restart`） |
| 自动化无法判定真机听感 / 竖屏留白观感 | 无法端到端验收 | 沿用口径：N6 人工抽验；N5 记录观察，本迭代不做 |

## 六、阶段 2 需澄清的问题（提交 PO / 各角色）

| # | 问题 | 归属 | 冻结口径（PO-12 回复，见 iteration-12-requirements.md） |
|---|---|---|---|
| Q1 | 返回文案派生表与兜底口径 | R → PO | 植物「回花园」/ 动物「回动物世界」/ 昆虫「回昆虫角」/ 恐龙「回恐龙园」；兜底 `回{板块名}看看`，派生表缺失回退「花园」 |
| Q2 | 拼音目标字号与作用范围 | UI → PO | 横屏详情 `.detail-header .detail-pinyin` **20px**；仅横屏分支，竖屏/基础规则不动 |
| Q3 | 首页按钮目标字号与选择器范围 | UI → PO | `.section-nav .filter-btn` / `.category-filter .filter-btn` **22px**；`.part-switcher .filter-btn` 保持 20px |
| Q4 | 既有「回花园」断言的处置 | QA → PO | 既有断言均在植物板块 → 天然通过；新增三板块派生断言（TC-119~TC-121） |
| Q5 | N2 内容产线是否并入本迭代 | PO → 全队 | **不并入**；单列 Sprint 13 内容产线，本迭代不含内容改动 |
| Q6 | 用例编号起点 | QA → PO | 接 TC-118，自 **TC-119** 起 |

## 七、迭代回顾（阶段 4 后补）

**交付**：v2.3 PF 体验回流（三视角）——EX-7 详情返回文案按板块派生（植物「回花园」/ 动物「回动物世界」/ 昆虫「回昆虫角」/ 恐龙「回恐龙园」，异常兜底同步）、EX-8 横屏详情拼音 16px → 20px（对齐英文，消除层级倒挂）、EX-9 首页板块 / 分类按钮 20px → 22px（限定选择器，详情部位按钮保持 20px）。**纯前端改动**：`PlantDetailPage.jsx`（新增 `SECTION_HOME` 派生映射）、`styles.css`（横屏拼音字号 + 新增 `.section-nav`/`.category-filter` 按钮字号规则）；后端 / 语料 / 图片 / 音频 / 路由 / 接口契约零改动。

**门禁证据（2026-10-18）**：
- 第 0 步语料/资产校验：`OK total=190 flower=53 leaf=100 fruit=53`（四板块 100/30/30/30）、分类 6；图片 `.jpg` **296**、音频 `.m4a` **380**（零资产改动）。
- 后端 `mvn test` 退出码 **0**（21 用例，后端零改动）。
- 前端 `npx vitest run` **73/73**（新增 6：TC-119~TC-124）、`vite build` 退出码 **0**。
- `docker compose up -d --build` 重建后 `/api/health=UP`；两次导入各写入 190 条（import_log 3670→**4050**，delta **+380 = 2×190**）；Mongo **190 条目 / 6 分类**无重复；导入后立即 `redis sh:*` = **0**。
- API 计数：`/api/plants` = 190、`?section=plant` = 100、`?section=animal|insect|dinosaur` 各 30、`?category=flower` = 53；`/api/categories` = 6。
- `npx playwright test` **50/50**（既有 47 + TC-125~TC-127 返回文案派生）。
- 用例与执行记录详见 `docs/qa/sprint-12-test-cases.md`。

**门禁发现**：无功能缺陷、无流程缺陷。注：`import_log` 为累积追加审计表，其绝对值受历史导入次数影响（本次终值 4050）；幂等判据以「两次导入各 +190、Mongo 恰好 190 条无重复」为准。

**遗留 / 后续**：N2 植物 176 处缺失小知识 → Sprint 13 内容产线（走导入通道不改代码）；N5 竖屏单图留白记录观察；N6 音频真机听感人工抽验；板块内容续扩（各 30 → ≤100）；恐龙写实复原图待人工解冻 PRD §14.6。
