# Sprint 11 — v2.2 内容扩容（一）：动物 / 昆虫 / 恐龙 各 10 → 30

| 项 | 内容 |
|---|---|
| 迭代目标 | 承接 v2.0 能力先行后的内容短板，把**动物 / 昆虫 / 恐龙**三个板块由**各 10 种**扩容至**各 30 种**（本迭代每板块 **+20**，共 **+60**，语料总数 130 → **190**），验证「仅走导入通道、零代码改动」的扩容路径；后续 Sprint 12+ 再续扩至各 ≤100。 |
| 状态 | ✅ 已完成（2026-10-17 门禁全绿、QA 放行、Master commit） |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §14（v2.0 能力先行口径：每板块上限 100）与 §16（v2.2 增量） |
| 类型 | **内容扩容**（纯语料 + 图片 + 音频资产；**后端 / 前端代码零改动**） |
| 内容基线 | 语料 130 条（plants 100 / animals 10 / insects 10 / dinosaurs 10）、分类 6、音频 260 个、图片 266 张 |
| 交付后基线 | 语料 **190** 条（plants 100 / animals **30** / insects **30** / dinosaurs **30**）、分类 6、音频 **380** 个（zh 190 + en 190）、图片 **296** 张（.jpg：plants 206 + animals 30 + insects 30 + dinosaurs 30） |

## 一、迭代范围（Scope，来自 PRD §16）

| 编号 | 范围项 | 对应 PRD | 说明 | 风险级 |
|---|---|---|---|---|
| C11-1 | **动物板块 +20**（10 → 30） | §16.3.1 | 写实照片 `/images/animals/{id}.jpg`，单键 `parts.animal` | 低 |
| C11-2 | **昆虫板块 +20**（10 → 30） | §16.3.2 | 写实照片 `/images/insects/{id}.jpg`，单键 `parts.insect`；常见「小虫」（蜘蛛/蜗牛/蚯蚓/蜈蚣）并入 | 低 |
| C11-3 | **恐龙板块 +20**（10 → 30） | §16.3.3 | **一律完整骨架化石**照片 `/images/dinosaurs/{id}.jpg`，单键 `parts.dinosaur` | 低 |
| C11-4 | **音频资产 +120** | §16.3.4 | 每新增条目 zh/en 各一，AAC `.m4a`，`say -v Tingting/Samantha` | 低 |
| C11-5 | **受影响断言同步** | §16.3.5 | 板块总量断言「共 10 种」→「共 30 种」并滚动加载至 30 卡 | 低 |

**不在本迭代范围**：任何后端 / 前端**代码**改动；接口契约 / 路由 / 图片音频路径规则改动；植物板块内容与资产改动；板块内二级分类；用户可见排序控件；恐龙写实复原图（§14.6 仍冻结）；手机端适配。

## 二、总体路线图（Master）

| Sprint / 阶段 | 目标 | 状态 |
|---|---|---|
| Sprint 1~10 | v1.0 冻结 → v1.1~v1.5 增量 → v2.0 四板块能力先行 → v2.1 PF 体验回流 | ✅ |
| **Sprint 11（本次）** | **v2.2 内容扩容（一）：动物 / 昆虫 / 恐龙 各 10 → 30** | ⏳ |
| Sprint 12+ | 内容续扩（各 30 → ≤100，仍走导入通道） | ⏳ |
| 后续 | PF 阶段 5 二次回流；恐龙内容策略议题（须人工解冻 §14.6） | ⏳ |

## 三、任务拆解

| 编号 | 任务 | 角色 |
|---|---|---|
| **_阶段 2：迭代准备（文档先行，产出齐备才允许开发）_** | | |
| PO-11 | 整理《迭代需求文档》`docs/product/iteration-11-requirements.md`（冻结新增 id 清单、命名/拼音/音标口径、文案长度、恐龙骨架口径、验收标准） | PO |
| J-14 | 后端《开发设计文章》增量：确认**零改动**（导入校验天然覆盖新增条目；`section`/`sort`/单键部位既有实现无需变更） | J |
| R-32 | 前端《开发设计文章》增量：确认**零改动**（板块导航、单图详情、音频播放、增量加载对 30 种天然成立） | R |
| UI-12 | UI 规范增量：确认**零改动**（沿用既有单图卡片 / 详情版式 / 热区红线；新图片与既有同尺寸 1920×1920） | UI |
| QA-26 | 《迭代测试用例手册》`docs/qa/sprint-11-test-cases.md`（编号接 TC-114，自 **TC-115** 起），并出具受影响断言清单 | QA |
| **_阶段 3：开发推进（内容生产，非代码）_** | | |
| R-33 | 生产 60 个内容 JSON（`content/{animals,insects,dinosaurs}/*.json`），schema 与既有模板一致 | R |
| UI-13 | 生成 59 张新图片（动物/昆虫写实照片、恐龙完整骨架化石） | UI |
| UI-14 | 生成 120 个预生成音频 `.m4a`（zh/en） | UI |
| **_阶段 4：完成门禁_** | | |
| QA-27 | 更新受影响断言：板块总量「共 30 种」+ 滚动加载至 30 卡（E2E TC-114 及 QA 手册同步） | QA |
| QA-28 | 全量回归与放行：语料校验（total=190）+ 后端 `mvn test` + 前端 `vitest run` / `vite build` + `docker compose up -d --build` 健康 + 两次导入幂等（import_log delta +380、Mongo 190/6、`redis sh:*`=0）+ `playwright test`，全绿后 Master 执行 commit | QA |

## 四、验收标准（Sprint 11 Definition of Done）

1. 语料校验：`OK total=190`，分类 6（flower/leaf/fruit/animal/insect/dinosaur），且 plants/animals/insects/dinosaurs 计数分别为 **100/30/30/30**；新增条目 `categories` 与 `parts` 键一致（单键板块键 = 分类 code）。
2. 图片资产齐备：`/images/animals/*.jpg` 30 张、`/images/insects/*.jpg` 30 张、`/images/dinosaurs/*.jpg` 30 张（恐龙一律**完整骨架化石**）。
3. 音频资产齐备：`/audio/{id}-zh.m4a` 与 `/audio/{id}-en.m4a` 对**全部 190 条**存在（合计 380 个 `.m4a`）；缺失则导入校验报错。
4. 文案合规：新增条目 `description` ≤80 字且**无拉丁字母**；`allusion.text` ≤60 字、`allusion.explain` ≤50 字。
5. 接口契约不回归：`/api/plants?section=animal|insect|dinosaur` 各返回 30 条，顺序 = `sort ASC + id ASC`；`/api/categories` 仍 6 条；详情 `/plants/:id` 单图分支行为不变。
6. 前端行为不回归：板块导航切换、单图详情（无部位切换）、音频喇叭（有音频渲染、缺失不渲染）、增量加载与「共 N 种」总量提示对 30 种板块成立（首屏 16 + 滚动步进 16）。
7. 既有 v1.0~v2.1 全部验收项（§7、§9.4、§10.4、§11.4、§12.4、§13.5、§14.5 26~33、§15.5 34~40）**不回归**；植物板块 100/53/100/53 计数与资产不变。
8. 门禁全绿：后端 `mvn test` 退出码 0；前端 `npx vitest run` 全通过、`vite build` 退出码 0；`docker compose up -d --build` 健康 `UP`；两次导入幂等（import_log 2780→3160，delta **+380 = 2×190**；Mongo 190 条目 / 6 分类；导入后 `redis sh:*` = 0）；`npx playwright test` 全通过；全绿后 QA 放行、Master commit。

## 五、风险与依赖

| 风险 / 依赖 | 影响 | 应对 |
|---|---|---|
| 新增图片为静态资源，需重建 frontend 镜像才被 nginx 提供 | 图片 404、E2E 红 | 门禁第 3 步用 `docker compose up -d --build`（非 `restart`） |
| 音频缺失导致导入校验 `existsSync` 失败 | 导入中断 | 先批量生成 120 个 `.m4a` 再导入；门禁前 `ls frontend/public/audio/*.m4a | wc -l` 应为 380 |
| 文案含拉丁字母或超长触发 QA 校验 | 语料校验红 | PO-11 冻结文案口径；门禁第 0 步脚本按 `description ≤80 / 无 [A-Za-z]` 校验 |
| 板块内 30 > 首屏 16，既有「共 10 种 / 10 卡」断言失效 | 门禁红 | QA-26 出具受影响清单；QA-27 更新 TC-114 为「共 30 种」+ `loadAllCards(page,30)` |
| 图片生成模型风格不稳定（恐龙须像骨架化石） | 观感不一致 | UI-13 prompt 固化「完整骨架化石、博物馆陈列」；生成后人工/自动核对数量与命名 |
| 自动化环境无法判定音频真机听感 | 无法端到端验收 | 沿用既有口径：以**文件存在 + 契约可取**为验收口径，真机听感由人工抽验（PF F5） |

## 六、阶段 2 需澄清的问题（提交 PO / 各角色）

| # | 问题 | 归属 | 冻结口径（PO-11 回复，见 iteration-11-requirements.md） |
|---|---|---|---|
| Q1 | 新增 60 个 id、三语名、拼音、音标清单 | R / UI → PO | PO-11 §二 冻结完整清单（20+20+20），拼音带声调、国际音标带 `/ /` |
| Q2 | 文案长度与低龄化口径 | R → PO | description ≤80 字且无拉丁字母；allusion.text ≤60、explain ≤50 |
| Q3 | 恐龙图片口径 | UI → PO | **一律完整骨架化石**（§14.6 冻结，不做复原图） |
| Q4 | 昆虫板块范围边界（蜘蛛/蜗牛/蚯蚓/蜈蚣） | R → PO | 作为常见「小虫」并入昆虫板块（与 v2.0 试点口径一致） |
| Q5 | 音频生成方式与格式 | UI → PO | `say -v Tingting`(zh) / `say -v Samantha`(en) → AAC `.m4a`，落 `frontend/public/audio/` |
| Q6 | 新增条目 `sort` 取值 | R → PO | 各板块内续排 **11…30**（按 PO-11 清单顺序） |
| Q7 | 受影响断言与用例编号 | QA → PO | E2E TC-114 改「共 30 种」+ 30 卡；新增用例自 **TC-115** 起 |

## 七、迭代回顾（阶段 4 后补）

**交付**：v2.2 内容扩容（一）——动物 / 昆虫 / 恐龙各 **10 → 30**（共 +60），语料 **130 → 190**；新增 60 个内容 JSON、60 张图片（`bear.jpg` 复用既有）、120 个预生成音频 `.m4a`。**后端 / 前端代码零改动**，全部经 `scripts/import-plants.mjs` 导入通道落地。恐龙一律完整骨架化石图；昆虫板块按 PO 口径并入蜘蛛/蜗牛/蚯蚓/蜈蚣等常见「小虫」。

**门禁证据（2026-10-17）**：
- 第 0 步语料/资产校验：`total=190 flower=53 leaf=100 fruit=53 animal=30 insect=30 dinosaur=30`，分类 6；条目 `categories↔parts` 一致；文案合规（description ≤80 无拉丁字母、allusion 60/50）；图片 `.jpg` **296**（plants 206 + animals 30 + insects 30 + dinosaurs 30）；音频 `.m4a` **380**。
- 后端 `mvn test` 退出码 **0**（21 用例，0 失败 / 0 错误 / 0 跳过；后端零改动）。
- 前端 `npx vitest run` **67/67**、`vite build` 退出码 **0**。
- `docker compose up -d --build` 重建后 `/api/health=UP`；两次导入各写入 190 条（import_log 终值 **3290**，delta **+380 = 2×190**）；Mongo **190 条目 / 6 分类**无重复；导入后立即 `redis sh:*` = **0**。
- API 计数：`/api/plants` = **190**、`?section=plant` = 100、`?section=animal|insect|dinosaur` 各 **30**、`?category=flower` = 53；`/api/categories` = 6。
- `npx playwright test` **47/47**（既有 43 + TC-115~TC-118；TC-114/TC-90/TC-94 按 30 种更新）。
- 用例与执行记录详见 `docs/qa/sprint-11-test-cases.md`。

**门禁发现**：无功能缺陷、无流程缺陷。注：`import_log` 为**累积追加**审计表，其绝对值受历史导入次数影响（本次终值 3290）；幂等判据以「两次导入各 +190、Mongo 恰好 190 条无重复」为准。

**遗留 / 后续**：内容续扩（各 30 → ≤100，Sprint 12+，仍走导入通道不改代码）；恐龙写实复原图/骨架对照图待人工解冻 PRD §14.6；PF 阶段 5 二次回流。
