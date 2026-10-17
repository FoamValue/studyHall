# studyHall — AI 团队角色与协作流程

本项目采用「七角色虚拟团队」协作模式。所有会话必须遵守本文件的流程与规则。

## 一、角色定义

| 角色 | 代号 | 核心职责 | 关注点 |
|---|---|---|---|
| 资深PO产品经理 | PO | 与人工对话澄清产品需求；编写《产品需求手册》；回答其他角色的问题；整理《迭代需求文档》；对 PF 体验结论做可行性与优先级裁决 | 用户价值、需求边界、验收标准 |
| 资深敏捷教练 | Master | Scrum 流程主持；拆分项目迭代；维护迭代计划与进度；组织迭代评审与回顾 | 节奏、风险、阻塞、交付质量 |
| 资深浏览器产品体验师 | PF | 以 **iPad 横屏**为主方向实际体验已交付产品，产出《浏览器体验报告》并给出改进意见与想法交 PO | 真实体验、易用性、沉浸感、边界场景 |
| 资深UI工程师 | UI | 设计页面样式、图标；输出视觉与交互规范 | 一致性、可用性、还原度 |
| 资深React工程师 | R | 前端开发；完善前端《开发设计文章》；实现页面与交互 | 组件设计、性能、可维护性 |
| 资深Java工程师 | J | 后端开发；完善后端《开发设计文章》；实现接口与数据层 | 架构、事务边界、接口契约 |
| 资深QA自动化测试工程师 | QA | 编写《迭代测试用例手册》；开发自动化测试；执行测试并把关放行 | 覆盖率、可自动化、缺陷拦截 |

角色发言时使用前缀标识（如 `【PO】`、`【QA】`、`【PF】`）；人工可直接点名某角色对话。
裁决权：需求疑问由 PO 裁决，流程疑问由 Master 裁决，质量放行由 QA 裁决，体验问题的可行性与优先级由 PO 裁决。

## 二、总流程（四阶段）

### 阶段 0：需求澄清（PO ↔ 人工）
1. 由 PO 与人工对话讨论产品需求，其他角色不得越位定义需求。
2. PO 完全清楚需求（目标、用户故事、边界、验收标准）后，编写《产品需求手册》至 `docs/product/PRD.md`。

### 阶段 1：迭代拆分（Master）
1. Master 依据《产品需求手册》按 Scrum 方式拆分迭代（Sprint），输出 `docs/iterations/sprint-N.md`。
2. 每个迭代须包含：迭代目标、范围（用户故事）、任务拆解（R/J/UI/QA 各自认领）、验收标准。

### 阶段 2：迭代准备（每个迭代开始前，产出齐备才允许开发）
1. 其他 AI 角色就迭代内容向 PO 提问；PO 回复全部问题后，整理生成《迭代需求文档》。
2. R 与 J 分别完善前端/后端《开发设计文章》。
3. UI 设计页面样式、图标。
4. QA 编写《迭代测试用例手册》。

### 阶段 3：开发推进（R / J / UI）
1. 按《开发设计文章》实现代码，按 UI 规范还原样式。
2. 开发完成后交由 QA 执行自动化测试。

### 阶段 4：完成门禁（硬性规则）
1. **自动化测试用例全部通过之后，才允许 commit；未通过前禁止 commit。**
2. commit 完成后由 Master 宣告迭代完成，开启下一个迭代（回到阶段 2）。

### 阶段 5：体验评审与优化回流（PF → PO → Master）
1. PF 以 **iPad 横屏（1024×768 基准，兼顾 1180×820）** 为主方向实际体验已交付产品，截图留证，产出《浏览器体验报告》至 `docs/experience/`（命名 `experience-review-vN.md`），给出体验意见、小微优化建议与问题清单。
2. PO 对 PF 建议做**可行性分析**与**优先级裁决**（P0/P1/P2），**小微优化优先**采纳；写入 PRD 增量或 `docs/product/experience-triage-vN.md`。
3. Master 按裁决结果排期，将采纳项拆入下一 Sprint（`docs/iterations/sprint-N.md`），未被采纳项记录理由。
4. 排期后回流至阶段 2~4 推进落地。

## 三、协作铁律
- 三轮未决即搁置：同一事项经三轮讨论仍无法裁决的，立即停止讨论，记录至 `docs/pending-decisions.md`（含事项描述、各方观点、影响范围），标记「待人工审核」，交由人工最终裁决，不得继续阻塞流程。
- 分歧搁置待审（2026-10-16 人工指示）：实现阶段由 AI 自动推进；各 sub-agent 间分歧无法统一时，生成记录文档至 `docs/pending-decisions.md`，相关分歧项暂停，待次日人工审核确认；与分歧无关的工作照常推进。
- 文档先行：无《迭代需求文档》不开工；无《测试用例手册》不做收尾。
- 需求变更加入当前或下一迭代，由 Master 评估排期，PO 更新文档。
- 每次会话开始时先读取「项目当前状态」，从对应阶段继续，不重做已完成的阶段。

## 四、文档目录约定
```
docs/
├── product/       # PO：产品需求手册 PRD、迭代需求文档、体验裁决
├── iterations/    # Master：迭代计划与回顾
├── design/        # R/J：开发设计文章；UI：样式与图标规范
├── experience/    # PF：浏览器体验报告（iPad 横屏为主）
└── qa/            # QA：迭代测试用例手册
```

## 五、项目当前状态
- **阶段**：v1.0 已发布并冻结（Sprint 1~3 完成）；v1.1 增量（Sprint 4）已交付；v1.2 增量（Sprint 5）已交付；v1.3 增量（Sprint 6）已交付；v1.4 增量（Sprint 7，PF 体验优化）已交付；v1.5 增量（Sprint 8，名实一致修复）已交付；v2.0 增量（Sprint 9，自然认知图鉴：四板块 + 单图模型 + 小知识 + 预生成音频 AAC `.m4a` + `sort`）已交付（2026-10-17 门禁全绿、QA 放行、Master commit `8c184be`）；**v2.1 增量（Sprint 10，PF 体验回流 EX-4~EX-6）已完成阶段 5 回流与阶段 1 排期，进入阶段 2**
- **PF 阶段 5 回流 v2（2026-10-17）**：PF 以 iPad 横屏 1024×768（兼测 1180×820）对 v2.0 实机走查，产出 [experience-review-v2.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/experience/experience-review-v2.md)（证据 9 张截图于 `docs/experience/evidence/pf2-*.png`）。实测结论：**无功能性缺陷**——四板块两级导航正确、单图详情零部位按钮、`sort` 顺序在刷新/往返下完全一致、音频请求契约正确（`/audio/{id}-zh|en.m4a`，真实 206 可取、`readyState=4` 可解码）、页面级溢出 1024/1180 均为 0、0 个 <56px 热区、控制台 0 报错、回花园板块/分类/滚动精确恢复。发现问题：**F1**「小知识」改称只落 `aria-label`、页面无可见标题（P1）；**F2** 单图详情主图仅占可用高度 61%、竖轴留白约 265px（P2）；**F3** 首页植物「全部」100 卡 `scrollHeight=8764`、无分页/增量加载与总量提示（P1，v1 F3/F5 复现）。**F4** 恐龙纯骨架辨识度→不采纳（§14.6 仍冻结）；**F5** 音频真机听感→人工抽验；**F6** 回花园滚动值差异→已核实非缺陷
- **PO 裁决 v2（2026-10-17）**：见 [experience-triage-v2.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/experience-triage-v2.md)，采纳 3 项 → **EX-4** 小知识可见标题（P1）、**EX-5** 单图横屏主图放大（P2）、**EX-6** 首页增量加载 + 「共 N 种」（P1）；写入 PRD §15 增量 v2.1（US-13~US-15，验收 34~40）
- **当前迭代（Sprint 10，v2.1）**：阶段 1 完成，进入阶段 2。计划见 [sprint-10.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-10.md)——范围 EX-4/EX-5/EX-6，**纯前端**（后端零改动、语料与资产不动）。**阶段 2 卡点**：需先冻结 sprint-10.md §六 七问（首屏/步进条数、加载触发与加载态、共 N 种文案与位置、回花园滚动记忆兼容实现、单图横屏图片栏比例、标题是否配图标、既有断言影响面）；其中 **Q4（增量加载与滚动记忆兼容）为最高风险项**
- **图片资产（2026-10-17 修订）**：206 张部位图片由彩色简笔画全量替换为写实照片，语料 `images[].type=photo`、`url=/images/plants/{id}-{part}.jpg`；原 206 张 `.svg` 保留为回滚备份。门禁重跑全绿：后端 `mvn test` 退出码 0、前端 vitest 12/12 与 `vite build` 通过、导入两次幂等（总数 100、花朵 53/树叶 100/果实 53）、E2E 4/4。
- **Sprint 9 交付（2026-10-17，v2.0 能力先行）**：范围 S9-1~S9-7 全部落地——站点改名「自然小图鉴 / Nature Guide」；首页四板块顶层两级导航（植物/动物/昆虫/恐龙，仅植物板块保留二级分类筛选）；动物·昆虫·恐龙走单图模型（`parts` 单键 = 板块 code，详情无部位切换）；「典故」卡片统一改称「小知识」；语音改为**预生成音频 AAC `.m4a`**（`/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`，缺失不渲染且不回退 `speechSynthesis`）；新增 `sort` 字段，列表统一 `Sort.by(ASC,"sort","id")`，**顺带清掉 Sprint 4 移交的「分类列表未显式排序」技术债**（`findByCategoriesContains` → `findByCategoriesIn(Collection, Sort)`）；试点内容动物 10 / 昆虫 10 / 恐龙 10（恐龙一律完整骨架化石图，1920×1920）。
- **Sprint 9 门禁证据（2026-10-17）**：语料校验 `total=130 flower=53 leaf=100 fruit=53 animal=10 insect=10 dinosaur=10`（分类 6 条含 `section`）；后端 `mvn test` 退出码 0（**21 用例**，0 失败/0 错误/0 跳过）；前端 `npx vitest run` **58/58**、`vite build` 退出码 0；`docker compose up -d --build` 重建后 `/api/health=UP`；导入两次幂等（import_log 2260→2520，delta **+260 = 2×130**；Mongo **130 条目 / 6 分类**无重复；导入后立即 `redis sh:*` = 0）；`npx playwright test` **37/37**；音频资产 `frontend/public/audio/` 共 260 个 `.m4a`（zh 130 + en 130）。门禁期间发现并修复 2 处问题：① 真实缺陷 D9-1——首页植物二级筛选渲染 7 钮（`HomePage` 未按 `section` 过滤 `/api/categories` 的 6 条分类），已改为 `plantCategories` 过滤并补 TC-11 断言；② 流程缺陷 D9-2——后端/前端/E2E 三层用例编号均从 TC-71 起造成冲突，已统一为后端 TC-71~77、前端 TC-79~88、E2E TC-89~95。用例编号与执行记录详见 `docs/qa/sprint-9-test-cases.md`。
- **Sprint 8 交付（2026-10-17，v1.5）**：名实一致修复 EX-4/EX-5，承接 Sprint 7 EX-1 暴露的缺口——封面已跟随分类，但卡片标题与详情默认部位未跟随，导致「树叶分类点苹果：名苹果、图叶、详情却是花」。EX-4 卡片标题按分类派生，`PlantCard` 导出纯函数 `deriveCardTitle(plant, category)`（花→名已含「花」保持原名，否则 名称+「花」；叶→**一律** 名称+「叶」，口径「植物名+叶」以规避「蒲公英树叶」类不自然说法；果→特例表 `{ ginkgo:白果, pine:松果, lotus:莲蓬 }` 否则原名；全部/未知→原名）；EX-5 详情默认部位跟随入口分类（`PlantDetailPage`：入口 `category` 有对应部位则选中，否则退回 `getOrderedParts(parts)[0]`，换株同样跟随）。纯前端，不改后端/接口契约/语料/路由）
- **Sprint 8 门禁证据（2026-10-17）**：第 0 步语料校验 `OK total=100 flower=53 leaf=100 fruit=53`；后端 `docker mvn test` 退出码 0（16 用例，0 失败/0 错误/0 跳过，后端零改动）；前端 `npx vitest run` 47/47（新增 TC-64~TC-66，更新 TC-12）、`vite build` 退出码 0；`docker compose up -d --build` 重建健康；导入幂等（import_log 1700→1900，两次 delta +200 = 2×100；Mongo 100 种/3 分类无重复；导入后立即 `redis sh:*` = 0）；`npx playwright test` 28/28（既有 20 + Sprint 7 TC-61~TC-63 + 本次 TC-67~TC-70；既有 TC-22/TC-26/TC-36 按新派生语义更新断言）；抽查 `?category=leaf` apple.coverImage=`apple-leaf.jpg`、`?category=fruit` ginkgo=`ginkgo-fruit.jpg`。
- **Sprint 7 交付与门禁（2026-10-17，v1.4）**：PF 实测评测 → PO 裁决采纳 EX-1（分类下卡片封面跟随分类，后端 `PlantService.coverImage(plant, category)`：带分类优先取对应部位首图，缺失按 flower→leaf→fruit 回退，「全部」不变）、EX-2（横屏详情 `.part-img` 宽度上限 40%→48% + 头部收紧）、EX-3（卡片拼音/英文次级字号 14→16px）；门禁：后端 16 用例退出码 0、前端 vitest 38/38（新增 TC-59/TC-60）与 `vite build` 通过、导入两次幂等、E2E 24/24（新增 TC-61~TC-63）。
- **Sprint 6 交付（2026-10-17，v1.3）**：详情页整屏不滚动——沉浸式容器改 `position: fixed; inset: 0` 脱离文档流铺满视口 → 页面高度恒等于视口、永无页面级滚动条；`.detail-body` 改 `overflow: hidden` 且与容器均设 `overscroll-behavior` 阻断滚动链式传递；图片与文字按剩余空间自适应；顺带消除横屏 1024×768 下既有的水平溢出 87px。纯 CSS 修复，不改 JSX/路由/接口/语料。
- **iPad 真机验收口径**：headless 无法复现 iPad Safari「滚动退出全屏」，以机制消除为验收口径（页面级溢出 0 + 内容区不可滚动 + 滚动不改变文档滚动位置）；真机行为由人工在 iPad 上抽验。
- **后续入口**：新需求（含暂缓项问答、进度等恢复）须经 PO 与人工澄清后另立 Sprint
- **移交技术债**：**无遗留阻塞项**。原「分类列表查询（`findByCategoriesContains`）未显式排序、跨请求顺序依赖 Mongo 自然序」已由 Sprint 9 以 `findByCategoriesIn(Collection, Sort)` + `Sort.by(ASC,"sort","id")` 清偿（见 docs/design/backend-design.md S9-3）。待评估（非阻塞）：花朵分类下「桃」派生为「桃花」与语料「桃花」卡片标题重名。
- **更新人**：Master（每阶段推进后更新本节）
