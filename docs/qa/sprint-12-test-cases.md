# Sprint 12 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-18 |
| 范围 | Sprint 12 新增用例（编号接 TC-118，自 **TC-119** 起）+ Sprint 1~11 全量回归 + PRD §17.5 增量验收矩阵（48~52）；全部通过前禁止 commit |
| 依据 | [iteration-12-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-12-requirements.md)、[sprint-12.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-12.md)、PRD §17 |
| 执行记录 | 2026-10-18 QA-30 全量门禁**全绿**：语料 `total=190` / 分类 6 / 图片 296 / 音频 380（零资产改动）；后端 `mvn test` 退出码 0（**21 用例**，后端零改动）；前端 `npx vitest run` **73/73**（新增 6 条：TC-119~TC-124）、`vite build` 退出码 0；`docker compose up -d --build` 健康 `UP`；两次导入各写入 190 条（import_log 3670→**4050**，delta **+380 = 2×190**；Mongo **190 条目 / 6 分类**；导入后立即 `redis sh:*` = 0）；`npx playwright test` **50/50**（既有 47 + TC-125~TC-127） |

> **编号口径**：本迭代后端**无新增用例**（后端零改动，回归 21 用例）；前端新增单测 EX-7/EX-8/EX-9（TC-119~TC-124 区域）；E2E 新增 **TC-125~TC-127**（返回文案派生）。

## 一、第 0 步 语料与资产校验（脚本）
| 编号 | 检查项 | 期望 | 状态 |
|---|---|---|---|
| C12-A | 语料计数 | `OK total=190 flower=53 leaf=100 fruit=53 animal=30 insect=30 dinosaur=30`（分类 6） | 通过 |
| C12-B | 条目一致性 | 每条 `categories` 与 `parts` 键一致；单键板块键 = 唯一分类 code | 通过 |
| C12-C | 资产计数 | 图片 `.jpg` **296**；音频 `.m4a` **380**（本次零资产改动） | 通过 |

## 二、后端集成测试（Maven，`mvn test`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 后端零改动（J-16）；既有 **21 用例**作为回归基线，退出码须为 0 | 通过 |

## 三、前端组件测试（Vitest，`npx vitest run`）— 新增 EX-7/EX-8/EX-9
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-119 | 返回文案按板块派生（正常态） | 以 `section:plant|animal|insect|dinosaur` 渲染详情页 | 返回链接文案分别为「回花园 / 回动物世界 / 回昆虫角 / 回恐龙园」；`href="/"` | 通过 |
| TC-120 | 异常兜底文案派生 | `section:animal` + 404 响应渲染 | 兜底链接文案「回动物世界看看」；`href="/"` | 通过 |
| TC-121 | 未知 section 回退「花园」 | `section:'xunknown'` 渲染详情 | 返回文案「回花园」；不报错 | 通过 |
| TC-122 | EX-8 横屏拼音字号（样式源断言） | 读 `styles.css` 定位 `@media (orientation: landscape)` 内 `.detail-header .detail-pinyin` | `font-size` = **20px**（≥20） | 通过 |
| TC-123 | EX-9 首页按钮字号（样式源断言） | 读 `styles.css` 定位 `.section-nav .filter-btn, .category-filter .filter-btn` | `font-size` = **22px**（≥22） | 通过 |
| TC-124 | EX-9 不误伤详情部位按钮 | 读 `styles.css` 的 `.filter-btn` 基础块 + 断言无 `.part-switcher .filter-btn` 字号覆盖 | 基础块 `font-size` = 20px；`.part-switcher .filter-btn` 无字号覆盖规则 | 通过 |
| — | 既有 **67 用例**回归 | 既有 `PlantDetailPage.test.jsx`（`/回花园/` 均在植物板块）/ `HomePage.test.jsx`（TC-25 读基础块）| 不回归 | 通过 |

## 四、E2E（Playwright，`npx playwright test`）— 新增
> 前置：`docker compose up -d --build` 已重建（前端源码改动须 `--build`）、`nginx`/后端健康、导入已完成。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-125 | 动物详情返回文案派生 | 首页切「动物」→ 点首张卡进详情 | 返回链接文案「回动物世界」，`href="/"`；点击后回首页且板块仍「动物」 | 通过 |
| TC-126 | 昆虫详情返回文案派生 | 首页切「昆虫」→ 点卡进详情 | 返回链接文案「回昆虫角」，`href="/"` | 通过 |
| TC-127 | 恐龙详情返回文案派生 | 首页切「恐龙」→ 点卡进详情 | 返回链接文案「回恐龙园」，`href="/"` | 通过 |
| — | 既有 **47 用例**回归（含植物 `/回花园/`、响应式溢出、热区） | 全量 | 不回归；页面级溢出 0 | 通过 |

## 五、PRD §17.5 验收矩阵 → 用例对照
| PRD §17.5 | 验收点 | 主验方式 | 用例 |
|---|---|---|---|
| 48 | 返回文案四板块派生 + `href="/"` + 兜底同步 | 前端单测 + E2E | TC-119~TC-121 / TC-125~TC-127 |
| 49 | 横屏 `.detail-header .detail-pinyin` ≥20px；不溢出 | 样式源断言 + 响应式 E2E | TC-122 / 既有响应式用例 |
| 50 | 首页按钮 ≥22px；`.part-switcher` 保持 20px | 样式源断言 + E2E | TC-123 / TC-124 |
| 51 | 既有 v1.0~v2.2 验收全量不回归 | 全量回归 | 全量 |
| 52 | 四视口正常；热区 ≥56px；控制台无报错 | 响应式 E2E | 既有响应式用例 |

## 六、受影响断言清单（QA-29 出具）
| # | 文件 / 用例 | 现状 | 处理 |
|---|---|---|---|
| 1 | `PlantDetailPage.test.jsx` TC-32/TC-33/TC-45c（`/回花园/`） | 植物板块默认 | 不受影响（植物文案不变） |
| 2 | `e2e/navigation.spec.js` TC-39、`e2e/speech.spec.js` TC-46/47（`/回花园/`） | 植物板块 | 不受影响 |
| 3 | `HomePage.test.jsx` TC-25（读 `.filter-btn` 基础块） | 断言 `min-height:≥44`、`font-size:≥16` | 不受影响（基础块不改） |
| 4 | 门禁计数断言（total=190 / import_log delta） | 本次**零语料 / 资产改动** | 按基线核对；delta 仍 +380 = 2×190 |
| 5 | 响应式 E2E（`.detail-body` 溢出、热区） | 详情拼音 +4px | 复跑确认溢出仍 0 |

## 七、执行记录（门禁后回填）

| 层级 | 命令 | 结果 | 证据 |
|---|---|---|---|
| 0. 语料/资产 | 校验脚本 | **OK** | `total=190 flower=53 leaf=100 fruit=53`；分类 6；图片 `.jpg` **296**；音频 `.m4a` **380**（零资产改动） |
| 1. 后端 | `mvn -q test`（docker maven:3.9-eclipse-temurin-26） | **退出码 0** | 后端零改动；测试源码 `@Test` 计数 **21**（与基线一致） |
| 2. 前端 | `npx vitest run` / `npx vite build` | **73/73 通过** / **退出码 0** | `Test Files 2 passed，Tests 73 passed`（新增 6：TC-119~TC-124）；`✓ built in 1.37s` |
| 3. 部署与导入 | `docker compose up -d --build` + 两次 `node scripts/import-plants.mjs` | **健康 UP / 幂等** | `/api/health=UP`；两次各写入 190 条（import_log 3670→**4050**，delta +380 = 2×190）；Mongo 190/6；`redis sh:*` = 0 |
| 3b. API 计数 | `curl /api/plants?section=*` | **正确** | all=190、plant=100、animal=30、insect=30、dinosaur=30、flower=53；categories=6 |
| 4. E2E | `npx playwright test` | **50/50 通过** | 既有 47 + TC-125~TC-127（返回文案派生） |

**幂等说明**：`import_log` 为累积追加审计表，绝对值为历史导入累计（本次终值 4050）。幂等判据为「两次导入各 +190、Mongo 恰好 190 条且无重复」——已满足。

## 八、缺陷与流程问题（门禁后回填）

**无**。本迭代为纯前端文案 / 样式小微改动（后端零改动），门禁六步一次全绿，未发现功能缺陷或流程缺陷。
