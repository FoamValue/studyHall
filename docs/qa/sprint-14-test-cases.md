# Sprint 14 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-18 |
| 范围 | Sprint 14 新增用例（编号接 TC-129，自 **TC-130** 起）+ Sprint 1~13 全量回归 + PRD §19.5 增量验收矩阵（58~64）；全部通过前禁止 commit |
| 依据 | [iteration-14-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-14-requirements.md)、[sprint-14.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-14.md)、PRD §19 |
| 执行记录 | 2026-10-18 QA-31 全量门禁**全绿**：语料/资产校验 `total=250` / 分类 6 / 图片 356 / 音频 500；后端 `mvn test` 退出码 0（**21 用例**）；前端 `npx vitest run` **73/73**、`vite build` 退出码 0；`docker compose up -d --build` 健康 `UP`；两次导入各写入 250 条（import_log **4680→5180**，delta **+500 = 2×250**；Mongo **250 条目 / 6 分类**；导入后立即 `redis sh:*` = 0）；`npx playwright test` **56/56**（含门禁中发现的 D14-1 竞态修复） |

> **编号口径**：本迭代后端**无新增用例**（后端零改动，回归 21 用例）；前端**无新增单测**（内容扩容不改组件逻辑）；E2E 更新 TC-114 + TC-90/TC-94 + TC-115~TC-117，新增 **TC-130~TC-133**。

## 一、第 0 步 语料与资产校验（脚本）
| 编号 | 检查项 | 期望 | 状态 |
|---|---|---|---|
| C14-A | 语料计数 | `OK total=250 animal=50 insect=50 dinosaur=50 flower=53 leaf=100 fruit=53`（分类 6） | 通过 |
| C14-B | 条目一致性 | 每条 `categories` 与 `parts` 键一致；单键板块键 = 唯一分类 code | 通过 |
| C14-C | 文案合规 | 新增条目 `description` ≤80 且无 `[A-Za-z]`；`allusion.text` ≤60、`explain` ≤50 | 通过 |
| C14-D | 图片资产 | `animals/insects/dinosaurs` 各 **50** 张 `.jpg`（恐龙完整骨架化石）；`.jpg` 合计 **356** | 通过 |
| C14-E | 音频资产 | `frontend/public/audio/*.m4a` = **500**（zh 250 + en 250） | 通过 |

## 二、后端集成测试（Maven，`mvn test`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 后端零改动（J-15）；既有 **21 用例**作为回归基线，退出码须为 0 | 通过 |
| TC-71/TC-72/TC-74（回归） | `?section=plant|animal` 与 `?category=animal` 均为**数据驱动**计数（按语料实际过滤），自动适配 50 | 通过 |
| TC-24（回归） | 文案限长全量遍历（description ≤80 无拉丁、allusion ≤60/≤50）自动覆盖新增 60 条 | 通过 |
| TC-77（回归） | 列表顺序 = `sort ASC + id ASC`，重复请求稳定 | 通过 |

## 三、前端组件测试（Vitest，`npx vitest run`）— 本迭代无新增
| 编号 | 说明 | 状态 |
|---|---|---|
| — | 内容扩容不改组件逻辑；既有 **73 用例**作为回归基线（TC-106「共 N 种」为 mock 驱动，不受真实语料计数影响） | 通过 |

## 四、E2E（Playwright，`npx playwright test`）— 更新 + 新增
> 前置：`docker compose up -d --build` 已重建（新图片 / 音频须 `--build` 才进 nginx）、`nginx`/后端健康、导入已完成。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-114（更新） | 板块总量提示「共 50 种」 | 首页依次切「动物 / 昆虫 / 恐龙」 | 各 `.list-count` = 「共 50 种」；`loadAllCards(page,50)` 后各 50 张卡 | 通过 |
| TC-90 / TC-94（更新） | sprint9 板块导航与排序稳定 | 动物 / 昆虫 / 恐龙各滚动至 50 | 各 50 卡；`first[0]='大熊猫'`、刷新顺序一致 | 通过 |
| TC-115~TC-117（更新） | sprint11 三板块扩容与新增详情 | 各滚动至 50 → 抽查既有新增条目详情 | 「共 50 种」；单图分支与音频喇叭不回归；骨架图可加载 | 通过 |
| TC-130 | 三板块扩容至 50 且末位新增条目可见 | 切「动物」→ 等首屏首卡「大熊猫」→ 滚动至 50 → 抽查末位「鸵鸟」；「昆虫」→「蝴蝶」→「小虾」；「恐龙」→「霸王龙」→「翼手龙」 | 各「共 50 种」；末位新条目卡片（`.plant-card-zh`）可见 | 通过（D14-1 修复后） |
| TC-131 | 新增条目单图详情与音频喇叭 | `goto /plants/{ostrich,shrimp,pterodactyl}` | 详情名称正确；`.detail-body` 含 `single-image`；`[role="tab"]`=0；中文喇叭渲染 | 通过 |
| TC-132 | 新增图片资产契约可取 | 对新增 60 个 id 逐个 `request.get('/images/{dir}/{id}.jpg')` | 全部 HTTP **200**（图片已随 `--build` 进入 nginx） | 通过 |
| TC-133 | 新增音频资产契约可取 | 对新增 60 条逐个 `request.get('/audio/{id}-{zh,en}.m4a')` | 全部 HTTP **200**（120 个 `.m4a`） | 通过 |

## 五、PRD §19.5 验收矩阵 → 用例对照
| PRD §19.5 | 验收点 | 主验方式 | 用例 |
|---|---|---|---|
| 58 | 语料 total=250，四板块计数 100/50/50/50；条目一致性 | 脚本 | C14-A / C14-B |
| 59 | 图片资产：三板块各 50 张；恐龙完整骨架化石；`.jpg` 356 | 脚本 + E2E | C14-D / TC-130 / TC-132 |
| 60 | 音频资产：250 条 zh/en 齐全（500 个 `.m4a`） | 脚本 + 导入校验 | C14-E / TC-133 |
| 61 | 文案合规：description ≤80 且无拉丁字母；allusion ≤60/≤50 | 脚本 | C14-C |
| 62 | `?section=*` 各 50 条且顺序稳定；`/api/categories` 仍 6 | 后端集成 | TC-71/TC-72/TC-77 |
| 63 | 板块首屏 + 滚动加载至 50；「共 50 种」；单图详情与音频不回归 | E2E | TC-114 / TC-130 / TC-131 |
| 64 | 既有 v1.0~v2.4 验收全量不回归 | 全量回归 | 全量 |

## 六、受影响断言清单（QA-29 出具）
| # | 文件 / 用例 | 现状 | 处理 |
|---|---|---|---|
| 1 | `frontend/e2e/sprint10.spec.js` TC-114 | 「共 30 种」+ 30 卡 | 改「共 50 种」+ `loadAllCards(page,50)` |
| 2 | `frontend/e2e/sprint9.spec.js` TC-90 | 动物/昆虫/恐龙各 `loadAllCards(page,30)` | 改 `loadAllCards(page,50)` |
| 3 | `frontend/e2e/sprint9.spec.js` TC-94 | 动物板块 `loadAllCards(page,30)` ×2 | 改 `loadAllCards(page,50)`（`first[0]` 仍为「大熊猫」） |
| 4 | `frontend/e2e/sprint11.spec.js` TC-115~TC-117 | 「共 30 种」+ `loadAllCards(page,30)` | 改「共 50 种」+ `loadAllCards(page,50)` |
| 5 | 门禁脚本输出 | `total=190 animal=30 …` | 预期 `total=250 animal=50 …` |
| 6 | 导入幂等 import_log | 4430 基准 | delta = **+500 = 2×250**；Mongo **250 / 6** |
| 7 | 资产计数 | 296 图（.jpg）/ 380 音频 | **356 图 / 500 音频** |
| 8 | 后端数据驱动断言（TC-71/72/74） | 按语料过滤计数 | 不受影响（数据驱动自动适配） |
| 9 | 植物断言（100/53/100/53） | 不变 | 不受影响 |
| 10 | 前端 TC-106「共 N 种」 | mock | 不受影响（mock 驱动） |

## 七、执行记录（门禁后回填）

| 层级 | 命令 | 结果 | 证据 |
|---|---|---|---|
| 0. 语料/资产 | 校验脚本 | **OK** | `total=250 flower=53 leaf=100 fruit=53 animal=50 insect=50 dinosaur=50`；分类 6；图片 `.jpg` **356**；音频 `.m4a` **500** |
| 1. 后端 | `mvn -q test`（docker maven:3.9-eclipse-temurin-26） | **退出码 0** | surefire：`tests="21" errors="0" skipped="0" failures="0"` |
| 2. 前端 | `npx vitest run` / `npx vite build` | **73/73 通过** / **退出码 0** | `Test Files 2 passed，Tests 73 passed` |
| 3. 部署与导入 | `docker compose up -d --build` + 两次 `node scripts/import-plants.mjs` | **健康 UP / 幂等** | `/api/health=UP`；两次各写入 250 条（import_log 终值 **5180**，delta **+500 = 2×250**）；Mongo 250/6；`redis sh:*` = 0 |
| 3b. API 计数 | `curl /api/plants?section=*` | **正确** | all=250、plant=100、animal=50、insect=50、dinosaur=50、flower=53；categories=6 |
| 4. E2E | `npx playwright test` | **56/56 通过** | 既有 52 + TC-130~TC-133；TC-114/TC-90/TC-94/TC-115~117 按 50 种更新；TC-130 按 D14-1 修复后复跑全绿 |

**幂等说明**：`import_log` 为累积追加审计表，绝对值为历史导入累计（本迭代基线 **4430**；门禁前第 0 步校验运行的 1 次导入写入 +250 → **4680**；门禁第 3 步两次导入再 +500 → 终值 **5180**）。幂等判据为「门禁两次导入各 +250、Mongo 恰好 250 条且无重复」——已满足（门禁窗口 delta 恰为 **+500 = 2×250**）。

## 八、缺陷与流程问题（门禁后回填）

| # | 类型 | 描述 | 定位 | 处理 | 状态 |
|---|---|---|---|---|---|
| D14-1 | **测试缺陷（E2E 用例）** | TC-130 在「动物 → 昆虫」切换时失败：两板块总量文案同为「共 50 种」，上一板块 50 卡尚未被替换即满足 `toHaveText` 与 `loadAllCards` 早退条件（哨兵消失 + 卡数 50），导致对昆虫板块误判为「已加载完」，末位新条目「小虾」匹配不到 | `frontend/e2e/sprint14.spec.js` TC-130；竞态窗口 = 板块切换时 `setPlants(null)`→新数据到达前的旧列表残留 | 用例改为「切板块后先等该板块首屏专属首卡（大熊猫 / 蝴蝶 / 霸王龙）出现，再滚动加载」，末位断言改用 `.plant-card-zh` 文本定位（与既有 sprint11 用例一致） | 已修复（复跑 `npx playwright test` 56/56 全绿） |
| D14-2 | 流程缺陷（门禁第 0 步） | 门禁第 0 步语料校验时误触发 1 次导入（+250），使 import_log 基线由 4430 抬升至 4680，与用例手册预填的 4430→4930 口径不符 | 门禁第 0 步执行顺序 | 已核实现值并在本手册 §七 如实修正为「基线 4430 → 门禁前 +250 = 4680 → 门禁双导入 +500 = 5180」；判据仍为门禁窗口 delta +500 | 已修正 |

> **影响评估**：D14-1 / D14-2 均为**测试与流程层面**问题，**无产品代码 / schema / 接口契约 / 语料改动**，不影响 Sprint 14 交付内容。

## 九、交付后复验（2026-10-18）

**图片体积微调复验**：Sprint 14 交付后复核图片体积，`gorilla` / `rhinoceros` / `leopard` 三张新增动物图以 `djpeg | cjpeg -quality 70 -progressive` 原地重编码 → **438 / 417 / 404 KB**（<450KB，仍 1600×1600 渐进式）；`peacock` 因羽纹细节密集（降至 q40 仍需 460KB）**保持原 q82（857KB）不改**。

- 资产校验：三板块 150 图全部 1600×1600（不合规 0）；
- nginx 重供新字节：`gorilla` 449044 / `rhinoceros` 427131 / `leopard` 414446 bytes，均 **HTTP 200**（TC-132 契约不回归）；
- 走**精简验证路径**（图片字节与后端 / 前端单测逻辑无关）：`docker compose up -d --build` 重建 health `UP` + `npx playwright test` **56/56** 全绿；后端 `mvn test` 21 用例、前端 `vitest` 73/73 沿用 Sprint 14 门禁结果（不受图片字节影响）。
- **无新增缺陷**；语料 JSON / 代码 / 接口契约零改动。
