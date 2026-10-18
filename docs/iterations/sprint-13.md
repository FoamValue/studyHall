# Sprint 13 — v2.4 内容产线（N2）：植物 176 处小知识补齐

| 项 | 内容 |
|---|---|
| 迭代目标 | 承接 [PO 裁决 v3](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v3.md) 的 **N2（P1，内容产线独立方向）**：为植物板块 **176 处缺失部位**补齐「小知识」（`allusion`），把「无内容不渲染」造成的植物详情信息缺失补齐，与动物 / 昆虫 / 恐龙（0 缺失）拉齐。 |
| 状态 | ✅ 已完成（2026-10-18，门禁全绿、QA 放行、Master commit） |
| 依据 | [experience-triage-v3.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v3.md) §N2；PRD §18（增量 v2.4） |
| 类型 | **纯内容产线**（语料 `allusion` 增补；后端 / 前端 / 样式 / 路由 / 接口契约 / 图片 / 音频**零改动**） |
| 基线 | v2.3（commit `00baf24`）：语料 190（plant100/animal30/insect30/dinosaur30）、分类 6、图片 296、音频 380；后端 21 用例 / 前端 vitest 73 / E2E 50 全绿 |

## 一、迭代范围（Scope）

| 编号 | 范围项 | 说明 | 风险级 |
|---|---|---|---|
| N2-1 | **植物部位小知识补齐** | 为 `content/plants/*.json` 中 **176 个缺失 `allusion` 的部位**增补 `allusion`（flower 34 / leaf 97 / fruit 45），不改其余字段 | 中 |
| N2-2 | **文案合规** | 每条 `allusion.text` ≤60 字、`allusion.explain` ≤50 字；面向 3–6 岁低龄化；有出处填 `source`，无则不填 | 低 |
| N2-3 | **导入通道落地** | 全部经 `scripts/import-plants.mjs` 导入；不改代码、不加图片 / 音频、不改 schema | 低 |
| N2-4 | **回归不破** | 既有 v1.0~v2.3 全部验收与三层测试不回归（后端 TC-24 限长校验对新文案同样生效） | 中 |

**不在本迭代范围**：任何代码 / schema / 图片 / 音频 / 路由 / 接口契约改动；板块内容续扩（各 30 → ≤100，另立 Sprint）；竖屏单图留白（N5）；音频真机听感（N6，人工抽验）。

## 二、总体路线图（Master）

| Sprint / 阶段 | 目标 | 状态 |
|---|---|---|
| Sprint 1~12 | v1.0 冻结 → v1.1~v1.5 → v2.0 四板块能力先行 → v2.1/v2.2 PF 回流与内容扩容 → v2.3 PF 回流三视角 | ✅ |
| **Sprint 13（本次）** | **v2.4 内容产线：植物 176 处小知识补齐（N2）** | ✅ |
| Sprint 14+ | 板块内容续扩（各 30 → ≤100）；PF 阶段 5 四次回流；恐龙内容策略议题（须人工解冻 §14.6） | ⏳ |

## 三、任务拆解

| 编号 | 任务 | 角色 |
|---|---|---|
| **_阶段 2：迭代准备（文档先行，产出齐备才允许开发）_** | | |
| PO-13 | 整理《迭代需求文档》`docs/product/iteration-13-requirements.md`（冻结小知识口径、限长、`source` 规则、验收标准） | PO |
| PO-14 | PRD §18 增量 v2.4（US-20 + 验收） | PO |
| R-37 | 前端《开发设计文章》增量：确认**零改动**（`AllusionCard` 数据驱动，语料增补即渲染） | R |
| J-17 | 后端《开发设计文章》增量：确认**零改动**（`Allusion` 结构不变；TC-24 限长校验对新文案生效） | J |
| UI-17 | UI 规范增量：确认无视觉变更（复用 `.allusion-card`） | UI |
| QA-31 | 《迭代测试用例手册》`docs/qa/sprint-13-test-cases.md`（编号接 TC-127，自 **TC-128** 起），含内容合规脚本校验 | QA |
| **_阶段 3：开发推进（内容产线）_** | | |
| C13-1 | 为 176 个缺失部位生成 `allusion`（`text` / `source?` / `explain`），就地写入对应 `content/plants/*.json` | 内容产线 / R |
| C13-2 | 内容合规自检：全量 206 部位均有 `allusion`；`text` ≤60、`explain` ≤50、无拉丁字母约束（沿用 description 口径） | 内容产线 / QA |
| **_阶段 4：完成门禁_** | | |
| QA-32 | 全量回归与放行：语料校验 + 后端 `mvn test` + 前端 `npx vitest run` / `vite build` + `docker compose up -d --build` 健康 + 两次导入幂等 + `npx playwright test`，全绿后 Master 执行 commit | QA |

## 四、验收标准（Sprint 13 Definition of Done）

1. **N2-1**：`content/plants/*.json` 全部 206 个部位**均含** `allusion.text` 与 `allusion.explain`（缺失数 = 0）；植物 100 种、分类 6、图片 296、音频 380 **不变**。
2. **N2-2**：新增 `allusion.text` ≤60 字、`allusion.explain` ≤50 字；面向 3–6 岁低龄化；有出处者填 `source`（作者《篇名》或「俗语 / 谚语」等），无出处可省。
3. **N2-3**：`scripts/import-plants.mjs` 校验通过并成功导入两次；不改任何代码 / schema / 图片 / 音频。
4. **N2-4**：后端 `mvn test` 退出码 0（21 用例，其中 TC-24 限长校验覆盖新增文案）；前端 `npx vitest run` 全通过、`vite build` 退出码 0；`npx playwright test` 全通过；含 `allusion` 的植物详情页 `.allusion-card` 正确渲染「小知识」标题。
5. **门禁全绿**：`total=190`、分类 6、图片 296、音频 380；两次导入幂等（import_log delta **+380 = 2×190**；Mongo **190 条目 / 6 分类**；导入后 `redis sh:*` = 0）；全绿后 QA 放行、Master commit（**禁止 push**）。

## 五、风险与依赖

| 风险 / 依赖 | 影响 | 应对 |
|---|---|---|
| 176 条小知识质量参差（杜撰「古诗」） | 内容失真、误导幼儿 | 口径：**优先真实古诗词 / 成语 / 谚语**；植物无合适诗文时改用**与植物相关的文化 / 自然常识**（不杜撰出处）；有出处才填 `source` |
| 单条超长（text >60 / explain >50） | 后端 TC-24 限长校验失败 | C13-2 脚本自检 + 后端测试回归拦截 |
| 部分植物（苹果 / 番茄等）无古典诗文 | 硬凑古诗失真 | 走「常识型小知识」回退口径（PO-13 冻结） |
| 语料改动需要走导入通道才生效 | 库内数据与语料不一致 | 门禁第 3 步两次导入 + API / Mongo 核对 |
| 后端 / E2E 既有断言与新文案冲突 | 回归失败 | 既有断言均针对植物板块「有 / 无 allusion」行为，非具体文案；QA 全量复跑确认 |

## 六、阶段 2 需澄清的问题（提交 PO / 各角色）

| # | 问题 | 归属 | 冻结口径（PO-13 回复，见 iteration-13-requirements.md） |
|---|---|---|---|
| Q1 | 植物小知识是否必须为古诗典故 | R → PO | **优先**真实古诗词 / 成语 / 谚语；无合适诗文时以植物相关文化 / 自然常识回退，**不杜撰** |
| Q2 | 文本限长与 `source` 规则 | R → PO | `text` ≤60、`explain` ≤50；有明确出处填 `source`（作者《篇名》/ 俗语等），无则省 |
| Q3 | 是否新增 / 复用既有 30 条口径 | QA → PO | 新增与既有 30 条**同结构**（`text`/`source`/`explain`），风格一致 |
| Q4 | 是否改代码 / schema / 资产 | J → PO | **全部零改动**，纯语料增补，走导入通道 |
| Q5 | 用例编号起点 | QA → PO | 接 TC-127，自 **TC-128** 起 |

## 七、迭代回顾（阶段 4 后补）

**交付结论**：Sprint 13 全部范围 N2-1~N2-4 落地，**纯内容产线**——仅增补 `content/plants/*.json` 的 `allusion` 字段（176 处：flower 34 / leaf 97 / fruit 45，涉 98 株），后端 / 前端 / 样式 / 路由 / 接口契约 / 图片 / 音频**零改动**。植物板块部位小知识覆盖率由 **30/206** 提升至 **206/206**，与动物 / 昆虫 / 恐龙拉齐。

**门禁证据（2026-10-18）**：
- 语料/资产：`total=190`（plant100/animal30/insect30/dinosaur30）、分类 6、`flower=53 leaf=100 fruit=53`、图片 `.jpg` **296**、音频 `.m4a` **380**（零增减）；`allusion` 覆盖 **206/206**、缺失 0、`text`>60 与 `explain`>50 各 0、含拉丁字母 0、同株部位文案重复 0。
- 后端 `mvn test` 退出码 **0**（**21 用例**，TC-24 限长全量遍历覆盖新增文案）。
- 前端 `npx vitest run` **73/73**、`npx vite build` 退出码 0（前端零改动）。
- `docker compose up -d --build` 重建后 `/api/health=UP`；两次 `node scripts/import-plants.mjs` 各写入 190 条（import_log 4050→**4430**，delta **+380 = 2×190**；Mongo **190 条目 / 6 分类**；导入后立即 `redis sh:*` = 0）。
- API 计数 all=190 / plant=100 / animal=30 / insect=30 / dinosaur=30 / flower=53 / leaf=100 / fruit=53。
- `npx playwright test` **52/52**（既有 50 + 新增 TC-128 / TC-129）。

**门禁发现并修复的问题**：
- **D13-1（测试口径对齐，非功能缺陷）**：后端 `PlantApiIntegrationTest.tc11_allContentFilesShouldMatchSchema` 原对**植物部位**强制要求 `allusion.source` 非空，与本迭代 PO 冻结口径 Q2「有明确出处才填 `source`」冲突（新增 176 条中 156 条为无古典诗文的常识型小知识，省略 `source`；且「严禁杜撰出处」不允许补造）。按冻结口径将该断言调整为「`source` 可选，若填写则须非空」，与板块小知识口径统一；**仅测试层对齐，未改任何产品代码 / schema / 契约**。调整后后端 21 用例全绿。

**结论**：门禁无功能缺陷；D13-1 属测试口径滞后于冻结口径的对齐修复，已记录。QA 放行，Master 执行 commit（**禁止 push**）。

