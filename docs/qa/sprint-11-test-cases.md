# Sprint 11 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 11 新增用例（编号接 TC-114，自 **TC-115** 起）+ Sprint 1~10 全量回归 + PRD §16.5 增量验收矩阵（41~47）；全部通过前禁止 commit |
| 依据 | [iteration-11-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-11-requirements.md)、[sprint-11.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-11.md)、PRD §16 |
| 执行记录 | 2026-10-17 QA-28 全量门禁**全绿**：语料/资产校验 `total=190` / 分类 6 / 图片 296 / 音频 380；后端 `mvn test` 退出码 0（**21 用例**，0 失败/0 错误/0 跳过）；前端 `npx vitest run` **67/67**、`vite build` 退出码 0；`docker compose up -d --build` 健康 `UP`；两次导入各写入 190 条（import_log 终值 3290，delta **+380 = 2×190**；Mongo **190 条目 / 6 分类**；导入后立即 `redis sh:*` = 0）；`npx playwright test` **47/47** |

> **编号口径**：本迭代后端**无新增用例**（后端零改动，回归 21 用例）；前端**无新增单测**（内容扩容不改组件逻辑，TC-106 等 mock 驱动用例不受影响）；E2E 更新 TC-114 + 新增 **TC-115~TC-118**。

## 一、第 0 步 语料与资产校验（脚本）
| 编号 | 检查项 | 期望 | 状态 |
|---|---|---|---|
| C11-A | 语料计数 | `OK total=190 animal=30 insect=30 dinosaur=30 flower=53 leaf=100 fruit=53`（分类 6） | 通过 |
| C11-B | 条目一致性 | 每条 `categories` 与 `parts` 键一致；单键板块键 = 唯一分类 code | 通过 |
| C11-C | 文案合规 | 新增条目 `description` ≤80 且无 `[A-Za-z]`；`allusion.text` ≤60、`explain` ≤50 | 通过 |
| C11-D | 图片资产 | `animals/insects/dinosaurs` 各 **30** 张 `.jpg`；路径与语料 `url` 一致 | 通过 |
| C11-E | 音频资产 | `frontend/public/audio/*.m4a` = **380**（zh 190 + en 190） | 通过 |

## 二、后端集成测试（Maven，`mvn test`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 后端零改动（J-14）；既有 **21 用例**作为回归基线，退出码须为 0 | 通过 |
| TC-75（回归） | `?section=animal` 计数 = 30、`?section=insect` = 30、`?section=dinosaur` = 30（既有断言为数据驱动或按基线计数的，须核对） | 通过 |
| TC-77（回归） | 列表顺序 = `sort ASC + id ASC`，重复请求稳定 | 通过 |

## 三、前端组件测试（Vitest，`npx vitest run`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 内容扩容不改组件逻辑；既有 **67 用例**作为回归基线（TC-106「共 N 种」等为 mock 驱动，不受真实语料计数影响） | 通过 |

## 四、E2E（Playwright，`npx playwright test`）— 更新 + 新增
> 前置：`docker compose up -d --build` 已重建（新图片须 `--build` 才进 nginx）、`nginx`/后端健康、导入已完成。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-114（更新） | 板块总量提示「共 30 种」 | 首页依次切「动物 / 昆虫 / 恐龙」 | 各 `.list-count` = 「共 30 种」；`loadAllCards(page,30)` 后各 30 张卡 | 通过 |
| TC-115 | 动物板块扩容可浏览至全量 + 新增条目详情 | 切「动物」→ 滚动加载至 30 卡 → 抽查 `cat`/`dog`/`whale` 卡片可见 → 点击「鲸鱼」 | 详情名称「鲸鱼」可见；`.detail-body` 含 `single-image`；无部位切换（`[role="tab"]` 计数 0）；音频喇叭渲染 | 通过 |
| TC-116 | 昆虫板块扩容（含并入的「小虫」） | 切「昆虫」→ 滚动加载至 30 卡 → 抽查 `spider`/`snail`/`centipede`/`hornet` 卡片可见 → 点击「蜘蛛」 | 详情名称「蜘蛛」可见；单图分支；音频喇叭渲染 | 通过 |
| TC-117 | 恐龙板块扩容（完整骨架化石图） | 切「恐龙」→ 滚动加载至 30 卡 → 抽查 `styracosaurus`/`protoceratops` → 点击「戟龙」 | 详情名称「戟龙」可见；主图 `object-fit: contain` 且 `naturalWidth > 0`（图片真实可加载） | 通过 |
| TC-118 | 新增图片资产契约可取 | 对新增 60 个 id 逐个 `request.get('/images/{dir}/{id}.jpg')` | 全部 HTTP **200**（图片已随 `--build` 进入 nginx） | 通过 |

## 五、PRD §16.5 验收矩阵 → 用例对照
| PRD §16.5 | 验收点 | 主验方式 | 用例 |
|---|---|---|---|
| 41 | 语料 total=190，四板块计数 100/30/30/30；条目一致性 | 脚本 | C11-A / C11-B |
| 42 | 图片资产：三板块各 30 张；恐龙完整骨架化石 | 脚本 + E2E | C11-D / TC-117 / TC-118 |
| 43 | 音频资产：190 条 zh/en 齐全（380 个 `.m4a`） | 脚本 + 导入校验 | C11-E |
| 44 | 文案合规：description ≤80 且无拉丁字母；allusion ≤60/≤50 | 脚本 | C11-C |
| 45 | `?section=*` 各 30 条且顺序稳定；`/api/categories` 仍 6 | 后端集成 | TC-75/TC-77 |
| 46 | 板块首屏 + 滚动加载至 30；「共 30 种」；单图详情与音频不回归 | E2E | TC-114~TC-117 |
| 47 | 既有 v1.0~v2.1 验收全量不回归 | 全量回归 | 全量 |

## 六、受影响断言清单（QA-26 出具）
| # | 文件 / 用例 | 现状 | 处理 |
|---|---|---|---|
| 1 | `frontend/e2e/sprint10.spec.js` TC-114 | 「共 10 种」+ 10 卡 | 改「共 30 种」+ `loadAllCards(page,30)` |
| 2 | `frontend/e2e/sprint9.spec.js` TC-90 | 动物/昆虫/恐龙各 `toHaveCount(10)` | 改 `loadAllCards(page,30)` |
| 3 | `frontend/e2e/sprint9.spec.js` TC-94 | 动物板块 `toHaveCount(10)` | 改 `loadAllCards(page,30)`（`first[0]` 仍为「大熊猫」） |
| 4 | 门禁脚本输出 | `total=130 animal=10 …` | 预期 `total=190 animal=30 …` |
| 5 | 导入幂等 import_log | 2780 基准 | delta = **+380 = 2×190**；Mongo **190 / 6** |
| 6 | 资产计数 | 236 图（.jpg）/ 260 音频 | **296 图 / 380 音频** |
| 7 | 植物断言（100/53/100/53） | 不变 | 不受影响 |
| 8 | 前端 TC-106「共 N 种」 | mock 10 | 不受影响（mock 驱动） |

## 七、执行记录（门禁后回填）

| 层级 | 命令 | 结果 | 证据 |
|---|---|---|---|
| 0. 语料/资产 | 校验脚本 | **OK** | `total=190 flower=53 leaf=100 fruit=53 animal=30 insect=30 dinosaur=30`；分类 6；图片 `.jpg` **296**；音频 `.m4a` **380** |
| 1. 后端 | `mvn -q test`（docker maven:3.9-eclipse-temurin-26） | **退出码 0** | surefire：`tests="21" errors="0" skipped="0" failures="0"` |
| 2. 前端 | `npx vitest run` / `npx vite build` | **67/67 通过** / **退出码 0** | `Test Files 2 passed，Tests 67 passed`；`✓ built in 1.48s` |
| 3. 部署与导入 | `docker compose up -d --build` + 两次 `node scripts/import-plants.mjs` | **健康 UP / 幂等** | `/api/health=UP`；两次各写入 190 条（import_log 终值 3290，delta +380 = 2×190）；Mongo 190/6；`redis sh:*` = 0 |
| 3b. API 计数 | `curl /api/plants?section=*` | **正确** | all=190、plant=100、animal=30、insect=30、dinosaur=30、flower=53；categories=6 |
| 4. E2E | `npx playwright test` | **47/47 通过** | 既有 43 + TC-115~TC-118；TC-114/TC-90/TC-94 按 30 种更新 |

**幂等说明**：`import_log` 为累积追加审计表，绝对值为历史导入累计（本次终值 3290）。幂等判据为「两次导入各 +190、Mongo 恰好 190 条且无重复」——已满足。

## 八、缺陷与流程问题（门禁后回填）

**无**。本迭代为纯内容扩容（零代码改动），门禁六步一次全绿，未发现功能缺陷或流程缺陷。
