# 迭代需求文档 — Sprint 10（v2.1 PF 体验回流：EX-4~EX-6）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 10 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §15（增量 v2.1，验收 34~40）；[PF 体验报告 v2](file:///Users/chenxinjie/Mirror/github/studyHall/docs/experience/experience-review-v2.md)；[PO 体验裁决 v2](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v2.md) |
| 作者 | PO |
| 状态 | 已冻结（阶段 2 基线；人工已授权「剩下的 PO 决定，然后团队推进开发」，故 §六 七问由 PO 一次冻结） |

## 一、需求基线（来源与冻结决策）
| 事项 | 冻结结论 |
|---|---|
| 来源 | PF iPad 横屏（1024×768 / 1180×820）走查 → PO 裁决采纳 EX-4 / EX-5 / EX-6（F4 不采纳、F5 人工抽验、F6 非缺陷）→ PRD §15 |
| 交付形态 | **纯前端**：一个组件（`AllusionCard`）+ 一个横屏样式分支 + 首页加载策略；**后端零改动** |
| 影响面 | 前端：`AllusionCard.jsx`（可见标题）、`PlantDetailPage.jsx` + `styles.css`（单图横屏分支）、`HomePage.jsx`（首屏 + 增量加载 + 总量提示）；不改语料 / 图片 / 音频 / 接口契约 / 路由 |
| 版本 | v2.1 增量，PRD §15 |
| 不变量 | 内容与资产**完全不动**（130 条目 / 6 分类 / 260 音频 / 266 图）；US-3 / US-6 / US-7 / US-8 / US-9~US-12 行为**不回归**；列表顺序语义 = `sort` ASC + `id` ASC 不变 |

## 二、Q1~Q7 冻结口径（PO 裁决，人工已授权）

### Q1 首屏条数与滚动步进 → **首屏 16、步进 16**
- 首屏渲染 **16** 条（约 4 列 × 4 行），滚动触发后每次追加 **16** 条，直至全量。
- 首屏 16 > 现状「首屏可见 8 张」的下限，满足 §四 验收 3。
- 常量 `PAGE_SIZE = 16`，首页组件内定义。

### Q2 增量加载触发方式与加载态 → **`IntersectionObserver` 哨兵 + 底部轻量占位；不支持 IO 的环境退化为全量渲染**
- 列表末尾渲染一个 `.load-sentinel` 哨兵元素；`IntersectionObserver`（`rootMargin: 200px`）监测其进入视口后追加 `PAGE_SIZE` 条。
- 哨兵存在时其内显示轻量占位文案「加载中…」（`.load-hint`，不遮挡卡片、不使用纯图标）。
- **不引入可见「加载更多」按钮**；交互天然随滚动推进。
- **降级**：当 `typeof IntersectionObserver === 'undefined'`（如 jsdom 单测 / 极旧浏览器）时，数据到达后**一次性渲染全量**，保证可用性与既有单测（如 TC-21 的 100 条）不回归。此降级为实现口径，非用户可见行为。

### Q3 「共 N 种」文案与位置 → **文案「共 N 种」，列表区块顶部右侧一行**
- 文案固定为「共 N 种」（`N` = 当前请求返回的条目总数）。类名 `.list-count`。
- 位置：置于列表区块（`.page-block`）顶部、**右对齐**一行，位于卡片网格之前；植物板块紧随二级筛选条下方，动物 / 昆虫 / 恐龙板块紧随板块导航下方。
- **统一展示**：四个板块均展示总量提示；动物 / 昆虫 / 恐龙仅 10 种**不做分段加载**（16 ≥ 10，首屏即全量），但总量提示仍渲染。
- 口径：植物「全部」= 100；植物分类态 = 该分类计数；动物 / 昆虫 / 恐龙 = 板块计数（均取接口返回的数组长度，不额外请求）。

### Q4 回花园滚动记忆兼容 → **复用 `sessionStorage`，新增 `sh:homeVisibleCount` 记录离页条数**
- `HomePage` 在 `visibleCount` 变化时写入 `sessionStorage` 键 `sh:homeVisibleCount`（与既有 `sh:homeScroll` 并列）。
- 回花园（`location.state.restoreScroll`）时，初始 `visibleCount` 取 `max(PAGE_SIZE, 记录的条数)`；再按既有机制复位 `sh:homeScroll`。
- **兜底**：若依记录条数复位后仍未到达目标 `scrollY`（如列表变化），滚动 effect 内按 `PAGE_SIZE` 继续补加载直至覆盖该位置或到全量，然后停止（不引入死循环）。
- 不改 `PlantCard` 既有的 `sh:homeScroll` 写入时机（点击瞬间）。

### Q5 单图横屏图片栏比例与图片高度上限 → **栏宽 64%、图片 `max-height` 保持 100% 可用高**
- **仅**单图分支（`parts` 单键 ∈ animal/insect/dinosaur）的横屏分支：`.detail-body.single-image` 的 `grid-template-columns` 由 `48% minmax(0,1fr)` 放宽为 `64% minmax(0,1fr)`。
- 图片继续 `aspect-ratio:1/1` + `object-fit:contain` + `max-width/max-height:100%`（完整不裁切），实际渲染尺寸 = `min(栏宽, 可用高)`。
- 依据：1024×768 下容器内容宽约 872px、可用高约 684px；64% → 约 558px → 主图占可用高约 **81%**（现状约 61%）；1180×820 下约 **89%**，均 ≤ 可用高，**无溢出**。
- 红线：**植物三部位版式必须保持 48% 现状不回归**（该规则不改动，仅新增单图专属类覆盖）。

### Q6 EX-4 标题是否配图标 → **纯文字「小知识」，不新增图标**
- `AllusionCard` 内渲染可见标题文字「小知识」（类名 `.allusion-title`，字号 **≥20px**）。
- 沿用既有 `allusion-quote` 大引号装饰，**不新增图标**，与卡片既有视觉体系协调。
- 无 `allusion.text` 仍**不渲染整卡**（既有约束不变）。

### Q7 既有断言影响面清单 → **由 QA-23 出具**（见下表，写入手册 §五）

| 受影响用例 | 位置 | 冲突原因 | 处理 |
|---|---|---|---|
| TC-21「100 条渲染无异常」 | `frontend/src/__tests__/HomePage.test.jsx` | 增量加载下不再一次性渲染 100 张（jsdom 降级为全量，须改断言方式稳妥化） | 断言改为 `await screen.findByText('植物99')` 后再计数，兼容降级 |
| TC-95「植物板块『全部』恰 100 卡」 | `frontend/e2e/sprint9.spec.js` | 真实浏览器 IO 下首屏仅 16 卡 | 改为「滚动加载至全量」循环后断言 100 卡 |
| TC-90 / TC-94（动物 / 昆虫 / 恐龙 10 卡） | `frontend/e2e/sprint9.spec.js` | 10 ≤ 16，首屏即全量，**不受影响** | 保持不变 |
| TC-11 / TC-80a（筛选条 4 钮、板块导航 4 钮） | `HomePage.test.jsx` | 总量提示不改变筛选条结构 | 保持不变，另新增「共 N 种」断言 |

> 其余 Sprint 1~9 用例（详情版式、滚动记忆、音频、派生标题等）不受本迭代影响，回归覆盖。

## 三、功能明细（按 EX 项）

| 编号 | 需求 | 落点 | 验收（PRD §15.5） |
|---|---|---|---|
| EX-4 | 「小知识」可见标题 | `AllusionCard.jsx` 渲染 `.allusion-title`「小知识」（≥20px）；无内容不渲染 | 34 |
| EX-5 | 单图横屏主图放大 | `PlantDetailPage.jsx` 单图分支给 `.detail-body` 挂 `single-image` 类；`styles.css` 横屏专属栏宽 64% | 35、36 |
| EX-6 | 首页增量加载 + 总量提示 | `HomePage.jsx` 首屏 16 + IO 哨兵追加 + `.list-count`「共 N 种」+ 滚动记忆兼容 | 37、38 |

## 四、验收标准（同 PRD §15.5 第 34~40，逐条）
34. 「小知识」卡片存在**可见标题文字「小知识」**（非仅 `aria-label`）；正文 ≤60 字、解释 ≤50 字；无内容不渲染；新增标题后在 1024×768 与 1180×820 下长条目不溢出。
35. 动物 / 昆虫 / 恐龙**横屏**详情主图占可用高度比例显著提升（目标 ≥80%），竖向留白明显缩小；图片完整不裁切。
36. 植物详情（三部位）横竖屏版式**不回归**：部位按钮仍渲染、US-8 默认部位跟随分类仍成立、页面级溢出为 0。
37. 首页植物板块采用首屏 + 滚动增量加载，首屏条数明显少于总量且可滚动至全量；不改变 `sort ASC + id ASC` 顺序语义；回花园滚动位置记忆不回归。
38. 首页显示「共 N 种」，口径与当前板块 / 分类一致。
39. 既有 v1.0~v2.0 全部验收项**不回归**。
40. 平板横竖屏正常；热区 ≥56px；控制台无报错。

## 五、风险与约束（承接 sprint-10 §五）
- EX-6 为结构性改动，回归面最大；若开发中回归超预期，允许 Master 顺延 EX-6 至 Sprint 11（先交付 EX-4 / EX-5），此顺延不视为「第三次推迟」。
- EX-5 改动**仅限**单图分支横屏（`single-image` 类），植物版式不动。
- EX-4 标题须克制（≥20px、上下留白小），不得挤占横屏竖向空间导致长条目溢出。
- 页面级溢出为 0 的 Sprint 6 红线全程保持。
