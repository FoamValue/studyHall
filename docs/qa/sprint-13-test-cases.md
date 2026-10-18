# Sprint 13 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-18 |
| 范围 | Sprint 13 新增用例（编号接 TC-127，自 **TC-128** 起）+ Sprint 1~12 全量回归；全部通过前禁止 commit |
| 依据 | [iteration-13-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-13-requirements.md)、[sprint-13.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-13.md)、PRD §18 |
| 执行记录 | 2026-10-18 全绿：C13-A~D 通过；后端 `mvn test` 21/21 退出码 0；`npx vitest run` 73/73；`vite build` 退出码 0；两次导入幂等（import_log 4050→4430，delta +380 = 2×190；Mongo 190/6；`redis sh:*`=0）；`npx playwright test` 52/52（含新增 TC-128/TC-129）。**门禁发现 D13-1（见 §八），已修复并复跑全绿。** |

> **编号口径**：本迭代后端**无新增用例**（零代码改动，回归 21 用例）；前端新增 E2E **TC-128~TC-129**；内容合规新增脚本用例 **C13-A~C13-D**。

## 一、第 0 步 内容合规校验（脚本）
| 编号 | 检查项 | 期望 | 状态 |
|---|---|---|---|
| C13-A | 小知识覆盖率 | 植物 100 种、部位 **206/206** 均含 `allusion.text` 与 `allusion.explain`；缺失 **0**（补齐前 176） | 通过 |
| C13-B | 限长 | 全部 `allusion.text` ≤60 字、`allusion.explain` ≤50 字 | 通过 |
| C13-C | 低龄化口径 | `allusion.text` / `allusion.explain` 不含拉丁字母；`description` ≤80 字且无拉丁字母（既有口径） | 通过 |
| C13-D | 结构一致性 | 条目 `categories` 与 `parts` 键一致；`allusion` 仅出现在部位下且含 `text`+`explain`（`source` 可选） | 通过 |

## 二、后端集成测试（Maven，`mvn test`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 后端零改动（J-17）；既有 **21 用例**为回归基线，其中 TC-24 限长校验将覆盖新增小知识文案，退出码须为 0 | 通过 |

## 三、前端组件测试（Vitest，`npx vitest run`）— 无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 前端零改动（R-37）；既有 **73 用例**回归（`AllusionCard` 数据驱动，语料增补即渲染） | 通过 |

## 四、E2E（Playwright，`npx playwright test`）— 新增
> 前置：`docker compose up -d --build` 已重建、导入已完成。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-128 | 补齐后小知识卡片渲染 | 访问 `/`，植物板块「全部」，点开此前缺失小知识的植物（如 apple）详情 | `.allusion-card` 可见；`.allusion-title` 文本 =「小知识」；`.allusion-text` 非空 | 通过 |
| TC-129 | 不同部位小知识不重复 | 在同上详情切换「花 / 叶 / 果」 | 各部位 `.allusion-text` 均存在，且三者文案**互不相同** | 通过 |
| — | 既有 **50 用例**回归（响应式溢出、热区、导航、音频契约等） | 全量 | 不回归；页面级溢出 0 | 通过 |

## 五、PRD §18 验收矩阵 → 用例对照
| PRD §18 | 验收点 | 主验方式 | 用例 |
|---|---|---|---|
| 53 | 206/206 部位均有小知识；缺失 0 | 脚本 | C13-A |
| 54 | `text` ≤60、`explain` ≤50、无拉丁字母 | 脚本 + 后端 TC-24 | C13-B / C13-C |
| 55 | 走导入通道、不改代码 / 资产 | 门禁第 3 步 + 变更面核对 | 门禁 |
| 56 | 小知识卡片渲染与部位差异化 | E2E | TC-128 / TC-129 |
| 57 | 既有 v1.0~v2.3 验收全量不回归 | 全量回归 | 全量 |

## 六、受影响断言清单（QA-31 出具）
| # | 文件 / 用例 | 现状 | 处理 |
|---|---|---|---|
| 1 | 后端 TC-24（文案限长，全量遍历） | 新增 176 条 `allusion` 文案进入校验范围 | 全绿须退出码 0；超长即拦截 |
| 2 | 前端 `PlantDetailPage.test.jsx`（TC-32/TC-33 等 `allusion` fixture） | 使用 fixture，非真实语料 | 不受影响 |
| 3 | `e2e/responsive.spec.js`（`.allusion-text` 可见性，选既有含典故的植物） | 具体条目不变 | 不受影响 |
| 4 | 门禁计数断言（total=190 / import_log delta） | 本次**零条目增减** | delta 仍 **+380 = 2×190** |
| 5 | 后端 TC-11（`allusion.source` 对植物部位强制非空） | 与冻结口径 Q2「`source` 可选」冲突（QA-31 初次出具时**遗漏**，见 D13-2） | 已按口径对齐为「可选，填则非空」；后端 21/21 全绿 |

## 七、执行记录

| 步骤 | 命令 / 方式 | 结果 |
|---|---|---|
| ⓪ 语料/资产校验 | 脚本：plant schema + 资产普查 + `allusion` 覆盖 | `OK total=100 flower=53 leaf=100 fruit=53`；四板块 `total=190`、图片 `.jpg` 296、音频 `.m4a` 380；`allusion` **206/206**（缺失 0）、`text`>60 = 0、`explain`>50 = 0、含拉丁字母 = 0、同株部位重复 = 0 |
| ① 后端 | `docker run … maven:3.9-eclipse-temurin-26 mvn test`（挂载仓库根） | **21/21**，`Failures: 0, Errors: 0, Skipped: 0`，退出码 **0** |
| ② 前端单测 | `npx vitest run` | **73/73**（2 文件） |
| ② 前端构建 | `npx vite build` | 退出码 **0**（1483 modules） |
| ③ 部署 | `docker compose up -d --build` + 健康轮询 | `/api/health` = `{"code":0,"data":{"status":"UP"}}` |
| ③ 导入幂等 | `node scripts/import-plants.mjs` ×2 | 各 190 条；import_log 4050 → **4430**（delta **+380 = 2×190**）；Mongo **190 / 6**；`redis sh:*` = **0** |
| ④ API 计数 | `curl /api/plants[?category=][?section=]` | all=190 / plant=100 / animal=30 / insect=30 / dinosaur=30 / flower=53 / leaf=100 / fruit=53 |
| ⑤ E2E | `npx playwright test` | **52/52**（既有 50 + TC-128 / TC-129） |

## 八、缺陷与流程问题

| 编号 | 类型 | 描述 | 处置 | 状态 |
|---|---|---|---|---|
| D13-1 | 测试口径对齐（非功能缺陷） | 后端 `PlantApiIntegrationTest.tc11_allContentFilesShouldMatchSchema` 原对**植物部位** `allusion.source` 强制非空，与 PO 冻结口径 Q2「有明确出处才填 `source`」冲突（176 条新增中 156 条常识型小知识无古典诗文、按口径省略 `source`，且「严禁杜撰出处」不允许补造）。 | 按冻结口径将断言改为「`source` 可选，若填写则须非空」，与板块小知识口径统一；**仅测试层调整，无产品代码 / schema / 契约改动**；复跑后端 21/21 全绿。 | 已修复 |
| D13-2 | 流程改进（QA 受影响断言清单遗漏） | QA-31 出具的「受影响断言清单」（§六）只列入 TC-24，**漏列** TC-11 的 `allusion.source` 强制项；该遗漏在门禁第 ① 步才由测试失败暴露。 | 在本手册 §六 补记（本条）；后续内容类迭代把「文案/schema 结构性断言」纳入受影响清单排查项。 | 已记录 |

