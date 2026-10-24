# 迭代测试用例手册 — Sprint 20（v3.1 数字卡片计数元素重绘）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 20 |
| 依据 | [iteration-20-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-20-requirements.md)（Q1~Q6、验收 **94~97**）；[sprint-20.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-20.md)；[ui-style-guide.md U20-1](file:///Users/chenxinjie/Mirror/github/studyHall/docs/design/ui-style-guide.md) |
| 编号起始 | E2E **TC-176**（接 Sprint 19 的 TC-175）；后端 / vitest 不新增（零改动回归） |
| 类型 | 纯资产重绘：**不新增业务功能**，用例以「21 张数字图资产规格 + 全量不回归」为主 |
| 范围 | `frontend/public/images/numbers/number-{0..20}.jpg` 21 张同名同路径覆盖；`scripts/generate-numbers.mjs` 新增 |
| 放行口径 | 六步门禁全绿（语料/资产 / 后端 / vitest+build / compose+health / 双导入幂等 / E2E） |
| 状态 | **已执行**（2026-10-24，六步门禁全绿，QA 放行） |

---

## 一、总览

### 1.1 基线（Sprint 19 交付后）

| 项 | 基线值 | 本迭代影响 |
|---|---|---|
| 语料总量 | **440**（plant 206 含 deprecated 2 / animal 50 / insect 50 / dinosaur 50 / letter 26 / pinyin 26 / number 21 / color 11） | **零改动** |
| 分类 | **8** | **零改动** |
| 图片 `.jpg` | **448**（条目 440 + 封面 8） | 21 张数字图**同名同路径重出**（总数不变） |
| 音频 `.m4a` | **1028** | **零改动** |
| 后端 `mvn test` | **28** 用例 | **零改动**（回归） |
| 前端 `vitest` | **90** | **零改动**（回归） |
| E2E `playwright` | **86**（14 个 spec 文件） | 新增 TC-176 → **87** |
| API 计数 | all=438 / plant=204 / 其余按 50/26/26/21/11 | **零改动**（契约不变） |

### 1.2 本迭代新增统计

| 类别 | 数量 | 明细 |
|---|---|---|
| 新增 E2E | **1** | `e2e/sprint20.spec.js`：TC-176（21 张数字图 HTTP 200 + 1600×1600） |
| 迁移 / 删除用例 | **0** | 既有后端 28 / vitest 90 / E2E 86 全部保留 |
| 终值预估 | 后端 **28** / vitest **90** / E2E **87** | — |

---

## 二、新增用例

### 2.1 E2E（`frontend/e2e/sprint20.spec.js`，TC-176）

| 编号 | 名称 | 层级 | 前置 | 步骤 | 期望 | 验收 |
|---|---|---|---|---|---|---|
| **TC-176** | 21 张新数字图资源与尺寸 | E2E | 21 张图随 `--build` 进镜像 | ① `request.get` 21 个 `/images/numbers/number-{0..20}.jpg`；② 页面内 `new Image()` 读 `naturalWidth/Height` | ① 全部 **HTTP 200** 且 `content-type: image/jpeg`；② 21 张均 **1600×1600** | **94** |

### 2.2 门禁第 0 步资产校验（node 解析，不进用例库）

| 项 | 校验 | 通过标准 |
|---|---|---|
| 存在性 | 21 张 `number-{0..20}.jpg` 齐备 | 21/21 |
| 尺寸 / 渐进式 | 解析 JPEG SOF | 全部 **1600×1600** 且 `progressive=true`（SOF2） |
| 体积 | 逐张字节数 | 扁平色图体积偏小（数十 KB 级）为正常（U20-1 口径，不沿用照片图阈值） |
| 数量正确性 | R 逐张 Read 核验 + 脚本确定性 | 每张苹果数 = 数值（0 无苹果）；抽看 0/1/3/5/7/11/13/16/20 全对（验收 **95**） |
| 色值 / 字形 | R 抽看 | 底 `#FCF7ED` / 数字 `#3A2A22` / 苹果 `#B45B3E` 系；字形清晰（验收 **96**） |

### 2.3 不回归断言（沿用既有用例，不重复新增）

| 项 | 承载用例 | 说明 |
|---|---|---|
| 数字板块列表/详情/排序/音频 | E2E sprint16 TC-148~TC-155、vitest TC-159/160 | 图片同名同路径，断言不涉图像内容 |
| 「共 N 种」+ 增量加载 + 滚动记忆 | E2E TC-166/168/169 等 | 本迭代零改动 |
| 详情整屏不滚动 / 过渡降级 | E2E TC-174/171 等 | 本迭代零改动 |
| 控制台 0 报错 | 既有各 spec | 本迭代零改动 |

### 2.4 自动化不可覆盖、单独人工抽验（不计入自动用例）

| 项 | 抽验内容 | 依据 |
|---|---|---|
| 数字卡真机观感 | 21 张朱砂小苹果卡 iPad 横屏详情放大观感、与方案 A 页面融合度 | 验收 95、96 / U20-1 |
| 沿用历史遗留 | 字母/拼音/数字/颜色/植物部位音频真机听感 | — |

---

## 三、不迁移清单（既有用例全部保留）

| 层 | 数量 | 处置 |
|---|---|---|
| 后端 `mvn test` | **28** | 零改动（本迭代后端零改动） |
| 前端 `vitest` | **90** | 零改动（前端产品代码零改动） |
| E2E `playwright` | **86**（14 spec） | 定位器与断言零改动；仅新增 sprint20.spec.js TC-176 |

---

## 四、验收 94~97 映射

| 验收 | 内容 | 自动覆盖 | 人工 |
|---|---|---|---|
| **94** | 21 张图存在、1600×1600、渐进式、体积合理 | 门禁第 0 步（node 解析 SOF）+ TC-176 | — |
| **95** | 计数物数量 = 数值、分组正确、无畸形、风格一致 | 脚本确定性绘制（循环保证） | R 逐张 Read 核验（9 张抽看全对）+ 真机观感 |
| **96** | 数字字形清晰正确、色值符合 U20-1 | — | R 抽看确认（圆润粗体字形清晰） |
| **97** | 三层测试全绿（后端 28 / vitest 90 / E2E 87） | 门禁第 1/2/5 步 | — |

---

## 五、执行记录（2026-10-24 已回填）

| 步骤 | 结果 | 时间 |
|---|---|---|
| 0 语料/资产校验 | **OK**：`categories=8`、`total=440`（plant 206 / animal 50 / insect 50 / dinosaur 50 / letter 26 / pinyin 26 / number 21 / color 11）、图片 `.jpg` **448**、音频 `.m4a` **1028** | 2026-10-24 |
| 0b 数字图资产规格 | **OK**：21 张全 **1600×1600**、`progressive=true`（解析 JPEG SOF2），合计 **986KB**（22KB~70KB/张，扁平色图口径合规） | 2026-10-24 |
| 0c 图像数量核验 | **OK**：R 逐张 Read 抽看 0/1/3/5/7/11/13/16/20——0 无苹果、1 单颗、5 单排、7=5+2、11=5+5+1、13=5+5+3、16=5+5+5+1、20=5×4，数量与分组全对、无畸形、风格一致 | 2026-10-24 |
| 1 后端 `mvn test` | **OK**：surefire `Tests run: 28, Failures: 0, Errors: 0, Skipped: 0`，退出码 0（docker 方式：仓库根挂载 + docker socket + TESTCONTAINERS_*；后端零改动回归） | 2026-10-24 |
| 2 前端 `vitest` / `vite build` | **OK**：vitest **90/90**（4 文件，零改动回归）；`vite build` 退出码 0 | 2026-10-24 |
| 3 compose 重建 + health | **OK**：`docker compose up -d --build` 后 `/api/health=UP`、`/`=200、`/images/numbers/number-11.jpg`=200 | 2026-10-24 |
| 4 两次导入幂等 | **OK**：import_log 13992 → **14872**，delta **+880 = 2×440**；Mongo **440 条目 / 8 分类**；导入后 `redis sh:*` = **0**；API all=**438** / plant=**204** / 其余各按 50/26/26/21/11 | 2026-10-24 |
| 5 E2E 全量 | **OK**：`npx playwright test` **87/87**（既有 86 零改动 + 新增 TC-176），退出码 0 | 2026-10-24 |
| 6 文档收尾与放行 | **OK**：本手册 §五/§六 已回填；**QA 放行 PASS**，交由 Master commit（QA 不执行 commit） | 2026-10-24 |

## 六、缺陷与流程问题（2026-10-24 已回填）

| # | 类型 | 描述 | 处理 | 状态 |
|---|---|---|---|---|
| — | 无 | 门禁一次全绿，无功能缺陷、无流程缺陷（21 张图扁平色小体积沿用 Sprint 16 口径，非缺陷） | — | — |

---

## 七、门禁执行清单（口径）

> 顺序要求：后端 `mvn test` 与 E2E **不得并行**（Sprint 15 D15-2）；E2E 在容器重建 + 导入完成后的空闲窗口执行；图片为静态资源，必须 `docker compose up -d --build`（非 `restart`）。

| 步 | 命令 | 通过标准 |
|---|---|---|
| 0 | `node` 统计 `content/*` 与 `frontend/public/{images,audio}` | `categories=8`、`total=440`、`.jpg=448`、`.m4a=1028` |
| 0b | `node` 解析 21 张数字图 JPEG SOF | 全 `1600×1600` 且 `progressive=true` |
| 1 | `docker run … maven:3.9-eclipse-temurin-26 mvn -q test`（挂仓库根 + docker socket） | **28 用例** 0 失败 / 0 错误 / 0 跳过，退出码 0 |
| 2 | `cd frontend && npx vitest run && npx vite build` | vitest **90/90**；build 退出码 0 |
| 3 | `docker compose up -d --build` + `curl localhost/api/health` | `UP`；`/` = 200 |
| 4 | 记录 `import_log` 基线 → 两次 `node scripts/import-plants.mjs` | delta **+880 = 2×440**；Mongo **440 / 8**；`redis sh:*` = 0 |
| 5 | `cd frontend && npx playwright test` | **87/87**（既有 86 + 新增 1），退出码 0 |
| 6 | 回填本手册 §五/§六；Master 更新 AGENTS.md 并 commit | 全绿方可 commit |
