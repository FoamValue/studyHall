# Sprint 20 — v3.1 数字卡片计数元素重绘：朱砂小苹果替代黑点

| 项 | 内容 |
|---|---|
| 迭代目标 | 解决人工投诉「数字详情页的小黑点太丑」：21 张数字卡片（`frontend/public/images/numbers/number-0.jpg … number-20.jpg`）按冻结规格重绘——纸白底 `#FCF7ED` + 深棕墨大号数字 `#3A2A22` + 朱砂小苹果计数物（数量=数值，按 5 分组排列），脚本确定性绘制（SVG→JPG），数量 100% 准确。 |
| 状态 | **已交付**（2026-10-24 门禁全绿、QA 放行，Master commit `见提交记录`，不 push） |
| 依据 | [PRD.md §24](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md)（v3.1 增量，US-31）；[iteration-20-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-20-requirements.md)（Q1~Q6 已冻结、验收 94~97）；PF 报告 [number-dots-review.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/experience/number-dots-review.md)（方案①获选） |
| 类型 | **纯资产重绘**（前后端产品代码 / 语料 JSON / 路由 / 接口契约 / 音频**零改动**；仅 21 张图片同名同路径覆盖 + 新增生成脚本） |
| 基线（Sprint 19 交付后） | 语料 440（plant 206，含 deprecated 2）/ 分类 8；API plant=204、all=438；图片 `.jpg` 448 / 音频 `.m4a` 1028；后端 28 用例 / vitest 90 / E2E 86 |

## 一、迭代范围（Scope）

| 编号 | 范围项 | 认领 | 说明 |
|---|---|---|---|
| S20-1 | 迭代计划与门禁证据 | Master | 本文件；门禁全绿后更新 AGENTS.md「项目当前状态」并 commit（不 push） |
| S20-2 | 迭代需求文档 + PRD §24 | PO | 冻结画面规格与验收 94~97 |
| S20-3 | UI 规范 U20-1 | UI | 数字卡片新视觉规范：色值、分组、尺寸 |
| S20-4 | 生成脚本 `scripts/generate-numbers.mjs` | R | 沿用 `generate-covers.mjs` 渲染通道（Playwright 截图 → cjpeg q82 渐进式）；确定性 SVG 绘制，数量零误差 |
| S20-5 | 21 张图重出 + 逐张人工核验 | R | 输出 `frontend/public/images/numbers/number-{0..20}.jpg`（同名同路径覆盖，1600×1600 渐进式 q82）；Read 工具抽看 number-0/1/5/7/11/16/20 等核验数量与风格 |
| S20-6 | 测试手册 + 六步门禁 | QA | `docs/qa/sprint-20-test-cases.md`；资产校验用例；六步门禁全绿后放行 |

## 二、冻结画面规格（摘自 PO 冻结口径，UI U20-1 固化）

| 元素 | 规格 |
|---|---|
| 画布 | 1600×1600 渐进式 `.jpg`，q82，同名同路径覆盖 |
| 底色 | 纸白 `#FCF7ED`（替换纯白） |
| 大号数字 | 阿拉伯数字，深棕墨 `#3A2A22`，圆润粗体（font-family 回退链），居中偏上（n=0 时整幅居中） |
| 计数物 | 朱砂小苹果：果身 `#B45B3E`、叶/柄 `#8A3E27`、白色 16% 高光，圆润简笔扁平风；数量 = 数值；0 无计数物 |
| 分组 | 每排最多 5 个，自上而下降序填满，末排为余数；每排水平居中；1~5 单排、6~10 两排、11~15 三排、16~20 四排 |
| 尺寸 | 苹果随排数自适应（1 排 a=230 / 2 排 a=200 / 3 排 a=175 / 4 排 a=160，a 为苹果外接盒边长）；整体构图居中、留白均匀 |

## 三、零改动红线（M20-1）

前后端产品代码、`content/**` 语料 JSON、路由、接口契约、音频资产一律不动；仅 21 张 `.jpg` 变化（同名同路径）+ 新增 `scripts/generate-numbers.mjs` + 文档。若既有测试因图片内容变化失败，先判断是否测试层口径问题再调整测试，**不得改产品代码**。

## 四、验收对应

| 验收 | 内容 | 落点 |
|---|---|---|
| 94 | 21 张图按冻结规格重出：存在、1600×1600、渐进式、体积合理 | S20-4 / S20-5 / 门禁第 0 步 |
| 95 | 每张计数物数量 = 数值（0 无计数物），分组正确、无畸形、风格一致 | S20-5 逐张核验 + 脚本确定性保证 |
| 96 | 数字字形清晰正确，色值符合 U20-1 | S20-5 抽看 + 规范 |
| 97 | 三层测试全绿（后端 28 / vitest 90 / E2E 86），无产品代码改动 | 门禁第 1/2/5 步 |

## 五、风险

| 编号 | 风险 | 对策 |
|---|---|---|
| R20-1 | 计数物数量错误（本迭代最大风险） | 脚本确定性绘制（数量由循环保证）+ R 逐张 Read 核验 0/1/5/7/11/16/20 |
| R20-2 | librsvg/字体渲染致数字字形差 | 用 Playwright+Chromium 渲染（系统圆润粗体回退链），抽看确认；若差则数字改 SVG path 自绘 |
| R20-3 | 扁平色图体积过小触发资产阈值告警 | 沿用 Sprint 16 口径：体积极小为扁平图天然属性，人工核验合规即可 |
| R20-4 | 图片变化导致既有 E2E/vitest 断言失败 | 既有断言只涉路径/尺寸/HTTP 200，不涉图像内容；若失败先判测试层口径 |

## 六、交付与门禁证据（2026-10-24，六步全绿、QA 放行）

> 门禁结果回填见下表；详细执行记录见 [sprint-20-test-cases.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/qa/sprint-20-test-cases.md)。

| 步 | 内容 | 通过标准 | 实测结果 |
|---|---|---|---|
| 0 | 语料 / 资产校验 | `categories=8`、`total=440`、`.jpg=448`、`.m4a=1028`；21 张数字图全 1600×1600 渐进式 | **PASS**（8 / 440 / 448 / 1028；21 张合规，合计 986KB） |
| 1 | 后端测试 | `mvn test` 28 用例，0 失败 0 错误 0 跳过，退出码 0 | **PASS**（28/28，退出码 0） |
| 2 | 前端测试 + 构建 | `npx vitest run` 全绿、`npx vite build` 退出码 0 | **PASS**（vitest **90/90** 零改动回归；build 退出码 0，CSS 13.72 kB / JS 280.84 kB 与基线一致） |
| 3 | 部署 | `docker compose up -d --build` 后 `/api/health=UP`、`/` = 200 | **PASS**（UP；`/`=200；`/images/numbers/number-11.jpg`=200） |
| 4 | 导入幂等 | 两次导入各 440 条：import_log delta **+880**；Mongo 440/8；`redis sh:*` = 0 | **PASS**（13992 → **14872**，delta +880；Mongo 440/8；redis 0；API all=438 / plant=204 / number=21） |
| 5 | E2E 全量 | `npx playwright test` ≥86 全绿 | **PASS**（**87/87** = 既有 86 零改动 + 新增 TC-176，退出码 0） |

**图像核验（R 逐张 Read）**：number-0（无苹果，仅数字 0 居中）/ 1 / 3 / 5 / 7（5+2）/ 11（5+5+1）/ 13（5+5+3）/ 16（5+5+5+1）/ 20（5×4） 共 9 张抽看确认：数量正确、分组正确、无畸形、风格一致；其余 12 张由脚本确定性绘制保证。门禁无功能缺陷、无流程缺陷。

**遗留待人工复核**：21 张数字卡真机观感（朱砂小苹果亲和度、iPad 横屏详情放大观感）；沿用历史遗留音频真机听感。
