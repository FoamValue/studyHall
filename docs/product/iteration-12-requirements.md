# 迭代需求文档 — Sprint 12（v2.3 PF 体验回流三视角：EX-7 / EX-8 / EX-9）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 12 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §17（增量 v2.3：US-17~US-19，验收 48~53）；[experience-triage-v3.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v3.md) §6；[sprint-12.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-12.md) |
| 作者 | PO |
| 状态 | 已冻结（阶段 2 基线；人工已授权「由 PO 裁决并推进开发测试」，PO 一次冻结 Q1~Q6，不再上抛） |

## 一、需求基线（来源与 PO 冻结决策）

| 事项 | 冻结结论 |
|---|---|
| 来源 | PF 三视角体验报告 v3（N1/N3/N4）→ PO 裁决采纳 EX-7 / EX-8 / EX-9；人工指令「由产品经理 PO 裁决，并推进开发测试，完成后 commit，不主动 push」。 |
| 交付形态 | **纯前端**：一处文案派生（`PlantDetailPage.jsx`）+ 两处字号（`styles.css`）；**后端 / 语料 / 图片 / 音频 / 路由 / 接口契约零改动**。 |
| 影响面 | `frontend/src/pages/PlantDetailPage.jsx`、`frontend/src/styles.css`，及受影响测试（新增/更新单测与 E2E）。 |
| 版本 | v2.3 增量，PRD §17 |
| 不变量 | 语料 190（plant100/animal30/insect30/dinosaur30）、分类 6、图片 296、音频 380 全部保留；`/api/*` 路径与响应结构不变；详情路由 `/plants/:id` 不变；US-3 / US-6 / US-7 / US-8 / US-9~US-16 与 Sprint 6 无滚动约束、Sprint 10 增量加载与「共 N 种」**不回归**。 |
| 范围边界 | **不含** N2 内容补齐（单列 Sprint 13 内容产线）、N5 竖屏留白、N6 音频真机；不含板块内容续扩。 |

## 二、Q1~Q6 冻结口径（PO 裁决）

### Q1 返回文案派生表与兜底口径
| section | 板块 | 返回按钮文案 | 异常兜底文案 |
|---|---|---|---|
| `plant` | 植物 | `← 回花园` | `回花园看看` |
| `animal` | 动物 | `← 回动物世界` | `回动物世界看看` |
| `insect` | 昆虫 | `← 回昆虫角` | `回昆虫角看看` |
| `dinosaur` | 恐龙 | `← 回恐龙园` | `回恐龙园看看` |

- 派生表缺失（未知 section）时回退「花园」（即 `← 回花园` / `回花园看看`）。
- 路由与状态传递**不变**：仍 `to="/"`，`state={{ section, category, restoreScroll: true }}`。
- 纯文案，不改样式类（`.back-btn`）、不改结构。

### Q2 拼音目标字号与作用范围
- 横屏详情分支（`@media (orientation: landscape)`）内 `.detail-header .detail-pinyin`：**16px → 20px**。
- 基础规则（非横屏）`.detail-pinyin`（20px）**不动**；竖屏详情分支不新增覆盖。
- 字重 400、颜色 `--color-text-light` 不变；仅字号对齐 `.detail-en`（20px）。

### Q3 首页按钮目标字号与选择器范围
- `.section-nav .filter-btn` 与 `.category-filter .filter-btn`（首页板块导航 + 植物分类筛选）：**20px → 22px**。
- `.part-switcher .filter-btn`（详情页部位切换，同样复用 `.filter-btn`）**保持 20px 不变**，避免详情版式回归。
- 按钮 `min-height:56px`、圆角、配色、间距均不变；仅字号。

### Q4 既有「回花园」断言的处置
- 既有单测 / E2E 中的 `/回花园/`、`/回花园看看/` 断言均在**植物板块**（`section:plant` 默认或显式），派生后植物文案不变 → **天然通过**，无需改动。
- 新增三板块派生断言（E2E TC-119~TC-121）：动物 / 昆虫 / 恐龙详情返回文案与 `href="/"`。

### Q5 N2 内容产线是否并入本迭代
- **不并入**。植物 176 处缺失小知识单列 Sprint 13 内容产线（走 `scripts/import-plants.mjs`，不改代码）。本迭代不含任何内容 / 语料改动。

### Q6 用例编号起点
- 接 Sprint 11 的 TC-118，新增用例自 **TC-119** 起。

## 三、角色问答记录（阶段 2）

### J ↔ PO
- **J-16 后端是否需改动？** → PO：**零改动**。三项均为前端文案 / 样式，不涉接口契约、路由、语料、音频路径。

### R ↔ PO
- **R-34 实现要点？** → PO：EX-7 用常量映射 `SECTION_HOME`（受控派生 + 兜底）；EX-8/EX-9 仅改 `styles.css` 对应选择器；不引入新组件、不改 JSX 结构（除返回文案表达式）。
- **R-36 测试更新？** → PO：新增 EX-7 派生断言、EX-8 样式源断言（读 `styles.css` 断言横屏分支 `.detail-header .detail-pinyin` = 20px）、EX-9 限定选择器断言（`.section-nav`/`.category-filter` 22px 且 `.part-switcher` 20px）。

### UI ↔ PO
- **UI-15 视觉规范？** → PO：字号口径见 Q2/Q3；返回文案口径见 Q1；不新增样式体系、不改配色 / 尺寸 / 图标。

### QA ↔ PO
- **QA-29 受影响断言清单？** → PO：见 §五。
- **QA-30 回归范围？** → PO：PRD §17.5 验收（48~52）+ §7/§9.4/§10.4/§11.4/§12.4/§13.5/§14.5/§15.5/§16.5 全量；重点防详情溢出（Sprint 6）、首页/详情按钮字号误伤、返回文案与状态恢复。

## 四、变更点清单（PO 出具）

| 编号 | 变更点 | 文件 | 现状 | 目标 |
|---|---|---|---|---|
| EX-7 | 返回文案按板块派生（含异常兜底） | `frontend/src/pages/PlantDetailPage.jsx` | 硬编码「← 回花园」/「回花园看看」 | 按 `section` 派生四板块文案；兜底同步 |
| EX-8 | 横屏详情拼音字号 | `frontend/src/styles.css` | `@media (orientation: landscape)` 内 `.detail-header .detail-pinyin { font-size:16px }` | `font-size:20px`（仅横屏分支） |
| EX-9 | 首页板块/分类按钮字号 | `frontend/src/styles.css` | `.filter-btn { font-size:20px }`（三处共用） | 新增 `.section-nav .filter-btn, .category-filter .filter-btn { font-size:22px }`；`.part-switcher .filter-btn` 保持 20px |

## 五、既有断言影响面清单（QA 逐条处理）

| # | 受影响项 | 现状 | 处理 |
|---|---|---|---|
| 1 | 单测 `PlantDetailPage.test.jsx` TC-32/TC-33/TC-45c 中的 `/回花园/` | 植物板块默认 | **不受影响**（植物文案不变） |
| 2 | E2E `navigation.spec.js` TC-39、`speech.spec.js` TC-46/47 的 `/回花园/` | 植物板块 | **不受影响** |
| 3 | `HomePage.test.jsx` TC-25 读 `.filter-btn` 基础块 | 断言 `min-height` 与 `font-size ≥16` | **不受影响**（基础块不改，仅新增限定选择器） |
| 4 | 门禁计数断言（total=190 / 导入 delta） | 本次**零语料改动** | 按基线核对；import_log delta 仍 +380 = 2×190 |
| 5 | 响应式 E2E（`.detail-body` 溢出、热区） | 详情拼音 +4px | 复跑确认页面级溢出仍为 0 |

## 六、验收对照表（PRD §17.5 → Sprint 12 用例）

| PRD §17.5 | 验收点 | 主验方式 |
|---|---|---|
| 48 | 返回文案按板块派生（四板块）+ `href="/"` + 异常兜底同步 | 前端单测 + E2E |
| 49 | 横屏 `.detail-header .detail-pinyin` ≥20px；竖屏/基础规则不回归；长条目不溢出 | 样式源断言 + 响应式 E2E |
| 50 | 首页 `.section-nav`/`.category-filter` 按钮 ≥22px；`.part-switcher` 保持 20px | 样式源断言 + E2E |
| 51 | 既有 v1.0~v2.2 验收全量不回归 | 全量回归 |
| 52 | 四视口正常；热区 ≥56px；控制台无报错 | 响应式 E2E |

用例编号自主 **TC-119** 起（Sprint 11 已用到 TC-118）。

## 七、非目标（同 PRD §17.4）
- 任何后端 / 语料 / 图片 / 音频 / 路由 / 接口契约改动。
- N2 植物小知识补齐（单列 Sprint 13 内容产线）；N5 竖屏留白；N6 音频真机抽验。
- 板块内容续扩（各 30 → ≤100）；手机端专项适配；用户可见排序控件；板块内二级分类。
