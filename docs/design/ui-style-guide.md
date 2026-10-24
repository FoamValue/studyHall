# UI 视觉与交互规范 — Sprint 1

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-16 |
| 适用 | 前端全部页面与组件、部位图片资产、图标 |

## 1. 色彩
| 用途 | 色值 |
|---|---|
| 主色（自然绿，选中/强调） | `#4CAF50` |
| 主色深（按钮描边/按下态） | `#388E3C` |
| 辅助色（阳光黄，典故卡片底） | `#FFF8DC` / 描边 `#F9A825` |
| 点缀色（活力橙，果实相关强调） | `#FF7043` |
| 页面背景（奶白） | `#FFFDF5` |
| 正文文字（深棕） | `#3E2723` |
| 卡片背景 | `#FFFFFF` |

antd 主题定制：`token.colorPrimary=#4CAF50`，`borderRadius=16`。

## 2. 字体与字号
- 字体栈：`system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`。
- 站点标题：中文 40px 粗体 + 拼音 18px 浅色（置上方）+ 英文 20px。
- 植物名（详情）：中文 48px 粗体，拼音 20px，英文 24px + 音标 16px。
- 卡片植物名：中文 24px 粗体，拼音 14px，英文 14px。
- 部位说明正文：20px，行高 1.7，短句分行。

## 3. 组件样式
- 按钮/筛选钮：高度 ≥ 56px，圆角 16px，描边 2px 主色深，选中实底白字。
- 卡片：圆角 20px，阴影 `0 4px 12px rgba(62,39,35,0.10)`，hover 轻微上浮（平板也保留，触点友好）。
- 典故卡片：辅助色底 + 2px `#F9A825` 圆点边框，左侧大引号装饰，原文楷体风格优先（`Kaiti, STKaiti, serif`），白话解释用正文字体。
- 页面留白：移动边距 24px，区块间距 32px。

## 4. 图标（PartIcon，内联 SVG 组件）
- 花：五瓣圆花瓣 + 黄色花心；叶：叶形 + 主叶脉；果：圆果 + 叶柄。
- 风格扁平圆润、主色描边。三枚图标随分类按钮与部位切换复用。

## 5. 部位图片资产规范（写实照片）
- **格式**：JPG（正方形 1:1，1600×1600，mozjpeg q82 渐进式），浅色虚化背景；文件 ≤ 500KB。
- **风格**：写实摄影，自然柔和光照、浅景深虚化的浅色背景，主体完整居中不裁切、色彩明快、高清细节。
- **命名**：`{plantId}-{part}.jpg`（如 `sunflower-flower.jpg`），存 `frontend/public/images/plants/`。
- **色调约定**：花=暖色系（黄/粉/红/橙），叶=绿色系，果=果实本色（如苹果红、葵花籽褐、白果米白）。
- 每图主体居中占画布 ≥ 70%，留白均匀，适合缩略图与详情大图双场景。

## 6. 可用性红线
- 文字与背景对比度 ≥ 4.5:1；禁用纯灰小字。
- 任何状态（加载/空/错误）都有大字友好文案，不用纯图标表达。

---

# UI 视觉与交互规范 — Sprint 4（增量：沉浸式详情 + 全屏）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 适用 | 详情页沉浸式态与系统全屏态；首页与既有组件样式不变 |

## U4-1. 沉浸式详情版式（默认形态）
```
┌──────────────────────────────────────────────┐
│ [← 回花园]                          [⛶ 全屏] │  ← .imm-topbar（顶部两角，覆盖式）
│                                              │
│ [←]            部位大图（完整居中）      [→] │  ← 两侧 .nav-btn 垂直居中
│                                                │
│                                               │
│                花 / 叶 / 果 按钮组            │  ← 底部中央，沿用 .filter-btn
│              部位三语名称 + 低龄化说明        │
└──────────────────────────────────────────────┘
```
- **不显示**站点标题（拼音 + 中文大字 + 英文），减少顶部留白。
- 页面级无滚动条（`overflow: hidden`），图片 `object-fit: contain` 完整不裁切。
- 文字区不遮挡图片；信息确放不下时该区域内局部滚动，页面级仍不滚动。

## U4-2. 切换按钮（`.nav-btn`）
- 位置：左右两侧垂直居中，距边约 16px；圆角 16px。
- 尺寸：热区 **≥56px**（与 `.filter-btn` 一致），符号「←」「→」+ 小字「上一株 / 下一株」（空间不足时只留符号）。
- 颜色：白底半透明（`rgba(255,255,255,0.85)`）+ 主色深描边；`disabled` 时降低不透明度并保持可见。
- 首尾循环：始终可点（列表 > 1 株时），不做「到头即禁用」。

## U4-3. 全屏按钮
- 位置：右上角，图标 + 文字「全屏」；进入全屏后文案变「退出全屏」。
- 热区 ≥56px；颜色沿用主色深描边 + 白底。
- 浏览器不支持 Fullscreen API 时不渲染该按钮（沉浸式功能不受影响）。

## U4-4. 部位按钮与文字区（复用）
- 部位按钮组沿用 `.part-switcher` / `.filter-btn`（热区 ≥56px，选中实底白字），仅在沉浸式态下改为底部居中排版。
- 部位三语名称与说明字号沿用 §2：名称 28px/16px 灰、说明 20px 行高 1.7。
- 典故卡片沿用 `.allusion-card`；空间不足时同样在信息区内局部滚动。

## U4-5. 全屏态
- 与沉浸式态**共用同一套组件与操作区**，仅容器铺满屏幕；操作按钮位置与热区不变。
- 安全留白：四周 ≥16px，避免按钮贴边；横屏时文字区可置于图片右侧（分栏）。

## U4-6. 平板适配
- 横屏 1024×768：图片区高度上限约 `58vh`，文字区与图片区左右分栏，均可见。
- 竖屏 iPad：图片区上限约 `48vh`，文字区在下，整体单屏可见、无页面级滚动。
- 触控目标：全部可点元素 ≥56px（含 `.nav-btn`、`.back-btn`、`.filter-btn`、全屏按钮）。

## U4-7. 可用性红线（增量）
- 切换过程无白屏：图片未就绪时保留上一帧。
- 所有状态（加载 / 404 / 错误）沿用大字友好文案，沉浸式态同样适用。

---

# UI 规范增量 — Sprint 5（语音朗读喇叭）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 适用 | 详情页沉浸式态与全屏态的喇叭按钮；首页与既有组件样式不变 |

## U5-1. 喇叭按钮（`.speak-btn`）
- 位置：中文喇叭贴 `.detail-zh` 右侧、英文喇叭贴 `.detail-en` 右侧（音标在英文行内），同一行垂直居中，与文字间距 12px。
- 尺寸：热区 **≥56×56px**（沿用可用性红线）；圆形，图标可见尺寸约 28px。
- 图标：空闲态「喇叭」，播放态「停止」方块；线条风格与 PartIcon 内联 SVG 保持一致。

## U5-2. 播放态
- 播放中：主色实底 + 白图标，`aria-pressed="true"`；停止 / 空闲：白底 + 主色描边图标。
- 播放中再次点按 = 停止；按下反馈沿用按钮微缩放，不做长按或滑动交互。

## U5-3. 版式与不遮挡
- 名称行改为 flex 行：`中文名 + 中文喇叭`；`英文名 + 音标 + 英文喇叭`。
- 喇叭随名称行排布，不进入 `.imm-topbar` 独占位，不遮挡两侧 `.nav-btn` 与右上「全屏」按钮。

## U5-4. 全屏态与平板适配
- 全屏态与沉浸式态共用同一样式，热区与颜色不变。
- 竖屏 iPad：名称行可换行，喇叭仍 ≥56px；横屏分栏时名称行位于图片右侧文字区，喇叭随行。

## U5-5. 优雅降级
- 浏览器不支持语音合成时**不渲染**喇叭，名称行退回仅文字原样，不出现空位或错位。

---

# UI 规范增量 — Sprint 6（详情页整屏不滚动）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 适用 | 详情页沉浸式态与全屏态的溢出与尺寸策略；首页与既有组件样式不变 |
| 依据 | docs/product/iteration-6-requirements.md（方案 A） |

## U6-1. 沉浸即整屏（不可滚动）
- 详情页沉浸式容器铺满视口并**脱离文档流**，页面本身高度恒等于视口：整页**永无纵向滚动条**。
- 内容区**不可滚动**；不再采用「页面级不滚动、内容区内部可滚动」的旧约定（该约定在 iPad Safari 上产生滚动条与退出全屏问题）。

## U6-2. 图片让位给文字
- 图片不再以 `vh` 写死横屏宽度与高度（旧规则 `max-width: min(48vw, 64vh)` 造成横屏水平溢出），改为**按剩余空间自适应收缩**；竖屏保留 `44vh` 作为封顶、空间不足时可继续收缩。
- 图片始终 `aspect-ratio: 1/1` + `object-fit: contain`：**完整不裁切**，不因收缩而变形或裁剪。
- 视觉优先级：文字完整可读 > 图片完整可见 > 图片尺寸。

## U6-3. 文字兜底滚动
- 仅当极长文案在极端小屏确实放不下时，允许**内容主体区内部**滚动（`.detail-main`，保持系统默认滚动条，不做隐藏障眼法）。
- 兜底滚动**不得传递**到页面 / 全屏：滚动到边界后不产生页面滚动，不触发 iPad Safari 退出全屏。

## U6-4. 不回归
- 横屏左图右文、竖屏上下布局不变；名称行与喇叭、两侧切换按钮、右上全屏按钮的位置与热区（≥56px）不变。
- 全屏态与沉浸式态共用同一套策略，两者均无滚动条。

---

# UI 规范增量 — Sprint 7（PF 体验优化）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 适用 | 详情页横屏版式（图片占比与头部疏密）；首页卡片次级字号 |
| 依据 | docs/product/iteration-7-requirements.md、docs/product/experience-triage-v1.md |

## U7-1. 横屏详情图片占比（EX-2）
- iPad 横屏（`orientation: landscape`）下，`.part-img` 宽度上限由容器的 **40%** 提升至约 **48%**，使图片更充分利用可用高度、左右留白明显减少。
- 图片保持 `aspect-ratio: 1/1` + `object-fit: contain`，**完整不裁切**；文字列（`.part-content`）继续吸收剩余宽度。
- 红线：**不得重新引入横屏水平溢出**（Sprint 6 刚消除的 87px）；1024×768 与 1180×820 下页面级溢出为 0。

## U7-2. 横屏头部疏密（EX-2，并入 F6）
- 横屏下收紧详情头部（名称行 + 拼音 + 英文 + 喇叭）的**上下留白**，把竖轴空间让给图片；可适度收紧装饰性间距。
- 底线：长文案（如杜鹃花）仍**完整可读、不溢出**；字号不得低于可读标准。
- 不改结构、不移动控件、不改变喇叭与名称的相对位置。

## U7-3. 卡片次级字号（EX-3）
- 首页卡片拼音（`.plant-card-pinyin`）与英文（`.plant-card-en`）字号由 **14px** 提升至 **16px**，与整体大字号风格一致、横屏可辨。
- 中文名（24px 粗体）与卡片整体版式不变；卡片高度由图片主导，字号变化不影响栅格列数。

## U7-4. 封面视觉一致性（EX-1）
- 分类列表下卡片封面应与当前分类对应（树叶分类显叶、果实分类显果）；缺失该部位才回退其他部位。
- 封面统一保持 1:1 缩略图、`object-fit: contain`，不改变卡片视觉规格。

---

# UI 规范增量 — Sprint 9（v2.0 四板块导航 + 单图详情 + 小知识）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 适用 | 首页板块导航、单图详情版式、小知识卡片称谓；既有植物组件视觉不变 |
| 依据 | docs/product/iteration-9-requirements.md（Q2~Q7 冻结）、PRD §14（v2.0） |

## U9-1. 板块导航（`.section-nav`，一级）
- 形态：首页标题下方一行 **4 个板块按钮**（植物 / 动物 / 昆虫 / 恐龙），复用 `.filter-btn` 视觉：高度 ≥56px、圆角 16px、描边 2px 主色深、选中实底白字。
- 顺序固定：植物 → 动物 → 昆虫 → 恐龙。
- 与下方二级分类筛选（`.category-filter`，仅植物板块）**两行间距 ≥16px**。

## U9-2. 二级分类筛选（植物板块）
- 沿用既有 `.category-filter`（全部 / 花朵 / 树叶 / 果实）视觉与行为，无变化。
- 动物 / 昆虫 / 恐龙板块**不出现**二级筛选（平铺列表）。

## U9-3. 单图详情版式
- 结构：名称区（拼音 / 中文名 + 喇叭 / 英文名 + 音标 + 喇叭）→ **大图** → 说明 + 小知识卡片。
- **不出现部位切换条**（单图条目无部位概念）；因此图片区可占用原切换条让出的竖轴空间。
- 横屏：沿用「左图 + 右文字」两栏（Sprint 9 已交付口径）；竖屏：沿用「上图下文」。
- 图片 `aspect-ratio:1/1` + `object-fit:contain`，**完整不裁切**；页面级无滚动（Sprint 6 红线保持）。

## U9-4. 小知识卡片（复用 `.allusion-card`）
- 视觉完全沿用：辅助色底 `#FFF8DC` + `#F9A825` 描边 + 左侧大引号；原文楷体、解释用正文字体。
- 仅文案称谓与无障碍标签由「植物小典故」改为「**小知识**」；**不新增样式体系**。
- 无内容不渲染，不留空位。

## U9-5. 热区红线（增量复核）
- 新增 `.section-nav` 按钮纳入可用性红线：全部可点元素热区 **≥56px**（含板块按钮、分类按钮、喇叭、切换按钮、全屏按钮）。

---

# UI 规范增量 — Sprint 10（v2.1：小知识可见标题 + 单图横屏主图 + 首页总量提示与加载态）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 适用 | 详情页小知识标题、单图横屏版式、首页总量提示与加载态；既有植物组件视觉不变 |
| 依据 | docs/product/iteration-10-requirements.md（Q1~Q7 冻结）、PRD §15（v2.1） |

## U10-1. 小知识可见标题（`.allusion-title`）
- 在 `.allusion-card` 内、引号装饰之后渲染可见标题「小知识」，类名 `.allusion-title`。
- 字号 **20px**、粗体 700、正文色 `--color-text`；与正文（22px）/ 解释（18px）层级协调，上下留白小（`margin: 0 0 4px`）。
- **不新增图标**，沿用既有左侧大引号装饰；无内容时整卡不渲染（不留空位）。
- 红线：新增标题后长条目在 1024×768 / 1180×820 下**不溢出**。

## U10-2. 单图横屏图片栏比例（EX-5）
- **仅**单图板块（动物 / 昆虫 / 恐龙）横屏分支：图片栏宽度由 **48% → 64%**（`.detail-body.single-image`），图片继续 `object-fit:contain` 完整不裁切。
- 意图：主图占可用高度由约 61% 提升到 **≥80%**，减少竖向留白。
- 红线：植物（三部位）版式**保持 48% 不回归**；页面级 X / Y 溢出仍为 0（Sprint 6 约束），两侧 `.nav-btn`（56px）不被压住。

## U10-3. 首页总量提示（`.list-count`）
- 文案「共 N 种」，类名 `.list-count`；位置：列表区块顶部**右对齐**一行（卡片网格之前）；植物板块紧随二级筛选条、其余板块紧随板块导航。
- 字号 18px、颜色 `--color-text-light`，与整体大字号风格一致；四板块统一展示。

## U10-4. 增量加载占位（`.load-sentinel` / `.load-hint`）
- 列表末尾哨兵 `.load-sentinel`：高约 56px、占满整行、`aria-hidden="true"`。
- 哨兵内 `.load-hint` 显示低龄友好文案「加载中…」（沿用 `.state-tip` 色系，字号 18–20px），不使用纯图标、不遮挡卡片。
- 加载推进随滚动自然发生，**不设可见「加载更多」按钮**。

## U10-5. 热区红线（增量复核）
- 新增元素均为非交互占位（哨兵 / 提示 / 计数文字），不新增可点目标；既有可点元素热区 **≥56px** 复核不变。

---

# UI 规范增量 — Sprint 11（v2.2：内容扩容，视觉零改动）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-17 |
| 结论 | **本迭代无视觉规范改动**（UI-12） |

## U11-1. 零改动确认
- 沿用既有单图卡片（`.plant-card`）、单图详情版式（左图 + 右文字横屏 / 上图下文竖屏）、小知识卡片、板块导航与分类筛选视觉。
- 新条目沿用既有渲染分支，不新增组件、不新增样式类。

## U11-2. 资产规格（新图片）
- 新图片与既有同一规格：**方图 1600×1600、JPG（mozjpeg q82 渐进式）、写实**；动物 / 昆虫为写实照片，恐龙**一律完整骨架化石**照片。
- 命名与路径沿用规则：`/images/animals/{id}.jpg`、`/images/insects/{id}.jpg`、`/images/dinosaurs/{id}.jpg`（既有 10 张同规则）。

## U11-3. 热区红线（增量复核）
- 本迭代不新增可点目标；板块导航 / 分类筛选 / 卡片 / 喇叭热区 **≥56px** 复核不变。

---

# UI 规范增量 — Sprint 12（v2.3：返回文案口径 + 拼音字号 + 首页按钮字号）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-18 |
| 适用 | 详情页返回文案、横屏详情拼音字号、首页板块 / 分类按钮字号；既有组件视觉与配色不变 |
| 依据 | docs/product/iteration-12-requirements.md（Q1~Q6 冻结）、PRD §17（v2.3） |

## U12-1. 返回按钮文案口径（EX-7）
- 视觉**完全沿用** `.back-btn`（配色、图标箭头、尺寸、热区 ≥56px 均不变），**仅换文案**。
- 文案按板块派生：植物「← 回花园」/ 动物「← 回动物世界」/ 昆虫「← 回昆虫角」/ 恐龙「← 回恐龙园」；异常兜底「回{板块名}看看」。
- 不引入新样式类、不改图标；语义与当前板块一致（页面唯一方位提示）。

## U12-2. 详情拼音字号（EX-8）
- **仅横屏**详情分支 `.detail-header .detail-pinyin` 字号 **20px**（与 `.detail-en` 同级）；颜色 `--color-text-light`、字重 400 不变。
- 层级目标：中文名 40px（横屏）> 拼音 20px = 英文 20px > 部位说明 20px；消除「拼音比英文小」的倒挂。
- 红线：1024×768 / 1180×820 长条目不溢出，页面级溢出为 0。

## U12-3. 首页板块 / 分类按钮字号（EX-9）
- `.section-nav .filter-btn` 与 `.category-filter .filter-btn` 文字 **20px → 22px**（字号未达 24px 上限，避免「恐龙」两字按钮视觉过满）。
- 按钮 `min-height:56px`、`padding:8px 24px`、圆角 16px、配色均**不变**。
- **不误伤**：详情页部位切换 `.part-switcher .filter-btn` 保持 20px；基础 `.filter-btn` 保持 20px。

## U12-4. 热区红线（增量复核）
- 本迭代不新增可点目标、不改任何可点元素尺寸；板块 / 分类 / 部位按钮、喇叭、切换、全屏按钮热区 **≥56px** 复核不变；首页按钮仅字号变化不改变 `min-height`。

## U13-1. 零改动确认
- 本迭代为**纯语料增补**（植物补齐小知识 `allusion`），**无任何 UI / 样式变更**。
- 小知识卡片**完全复用**既有 `.allusion-card`（辅助色底 + 黄描边 + 引号装饰 + `.allusion-title`「小知识」标题，≥20px，见 U10-1），不新增样式体系、不改字号 / 颜色 / 间距。

## U13-2. 版式复核（增量）
- 补齐后更多植物详情出现小知识卡片，属既有版式；Sprint 6「整屏不滚动」红线不变，1024×768 / 1180×820 长文案条目页面级溢出须仍为 0（E2E 复跑确认）。
- 热区红线复核：本迭代不新增 / 不改任何可点元素，全部热区 **≥56px** 不变。

## U14-1. 零改动确认
- 本迭代为**纯内容扩容**（动物 / 昆虫 / 恐龙各 30 → 50），**无任何 UI / 样式变更**；沿用既有单图卡片 / 详情版式 / 热区红线。
- 新增卡片与既有板块同款：`.plant-card` + `.plant-card-img` + 中文 / 拼音 / 英文三行；单图详情 `.detail-body.single-image`，无部位切换。

## U14-2. 图片资产规范（增量）
- 新增 **60 张**图片，`/images/{animals,insects,dinosaurs}/{id}.jpg`；尺寸 **1600×1600**、mozjpeg（`cjpeg -quality 82 -progressive`）渐进式 JPG，与既有资产一致（iPad Pro 12.9" 2x 详情图栏无损下限 1554px，1600 为安全余量）。
- 恐龙一律**完整骨架化石**（博物馆陈列，无皮肤），中性背景；动物 / 昆虫为写实照片（昆虫为微距）。
- 音频：`/audio/{id}-{zh,en}.m4a`（AAC），与既有 380 个同规格。

---

# UI 规范增量 — Sprint 15（v2.6：两大组导航 + 字母 / 拼音字形卡资产）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-18 |
| 依据 | docs/product/iteration-15-requirements.md（Q1~Q8 冻结）、PRD §20（v2.6） |

## U15-1. 两大组板块导航版式（`.section-nav`）
- 由一组平铺改为**两组**：组标题 `.section-group-title`（纯展示，`role="presentation"`），组内 4 个 `.filter-btn` 复用既有样式（字号 22px、`min-height` 56px 热区）。
- 两组纵向排列，组间间距 ≥16px；组标题与按钮行间距 ≥8px；组标题字号与次级文字一致（16px）、颜色 `--color-text-light`。
- 容器仍为单行 `role="group" aria-label="板块导航"` 语义（E2E 选择器不变）；不引入新配色、不改变既有板块按钮视觉。

## U15-2. 字形卡图片规范（新增资产）
- **英文字母卡** `/images/letters/letter-{a..z}.jpg`：白（或极浅色）纯底，**居中并排显示大写+小写**字形（如 `Aa`），字族用无衬线粗体，字色高对比深色（如 `#2B2B2B`）；四周留白 ≥12% 画布；正方形构图。
- **汉语拼音卡** `/images/pinyin/pinyin-{a..z}.jpg`：同底色口径，居中显示**小写**字形（如 `a`），字号与字母卡视觉重量一致。
- 统一尺寸 **1600×1600**、渐进式 JPEG（`-quality 82 -progressive`），与既有 `.jpg` 资产同规格；单边无裁切、无边框装饰。
- 数字 / 颜色资产（纯色块卡、大号数字+点数）**Sprint 16** 出规范，本迭代仅预留命名目录 `numbers` / `colors`。

## U15-3. 详情名称区（字母 / 拼音）
- 字母 / 拼音条目**无拼音 / 英文 / 音标**：详情头仅渲染 `.detail-zh`（符号本身），`.detail-pinyin` 与 `.detail-en` 行**缺失即不渲染**，不留空白占位。
- 喇叭：字母仅英文喇叭、拼音仅中文喇叭（按实际音频字段渲染）；喇叭仍贴名称右侧、热区 ≥56px。

## U15-4. 热区红线（增量复核）
- 新增的组标题为**纯展示元素**，非可点目标；8 个板块按钮、二级分类 4 钮热区仍 **≥56px**（`.filter-btn` `min-height`）。
- 本迭代不新增其他可点元素、不改既有可点元素尺寸；横屏 1024×768 / 1180×820 页面级溢出须为 0（E2E 复跑确认）。

# UI 规范增量 — Sprint 16（v2.7：数字 / 颜色卡资产）

## U16-1. 数字卡规范（`/images/numbers/number-{0..20}.jpg`）
- 白底（`#FFFFFF`），构图 **1600×1600**，四周留白 ≥8%。
- **上区**：大号阿拉伯数字（sans-serif 粗体，深色 `#2B2B2B`），字号随位数自适应（1 位 ≈ 560px，2 位 ≈ 480px）。
- **下区**：**点数**——与数值等量的小圆点（实心圆，`#2B2B2B`），每行 ≤5 个换行排布；`0` 不排点（仅显示数字）。
- 无边框、无阴影、无装饰纹理；与字母 / 拼音字形卡同底色口径。

## U16-2. 颜色卡规范（`/images/colors/color-{black..grey}.jpg`）
- 白底（`#FFFFFF`），**居中一枚大圆角正方形「纯色块」**（边长 ≈ 画布 72%、圆角 ≈ 8%），色块填该颜色实色：
  black `#000000` · white `#FFFFFF` · red `#E5484D` · green `#3BA55D` · yellow `#F2C94C` · blue `#3B82F6` · brown `#8B5E3C` · purple `#8E5BD9` · pink `#F28AB2` · orange `#F2811D` · grey `#9AA0A6`。
- **white 色块加极浅灰描边**（`#E0E0E0`，宽 ≈ 6px）以在白色卡底上可辨；其余色块无描边。
- 不叠加文字；构图简洁、纯色块语义清晰。

## U16-3. 尺寸与编码
- 全部 **1600×1600**、渐进式 JPEG（`cjpeg -quality 82 -progressive`），单张 ≤500KB；命名与路径 `/images/numbers/{id}.jpg`、`/images/colors/{id}.jpg`。

## U16-4. 热区红线（增量复核）
- 本迭代不新增可点元素、不改既有元素尺寸；8 板块钮与植物二级筛选 4 钮热区仍 **≥56px**；横屏 1024×768 / 1180×820 页面级溢出须为 0（E2E 复跑确认）。

---

# UI 规范增量 — Sprint 18（v2.9：书架首页 + 书本 + 书内页）

| 项 | 内容 |
|---|---|
| 作者 | UI |
| 日期 | 2026-10-24 |
| 适用 | 书架页 `/`（`.bookshelf`）、书本 `.book`、封面 `.book-cover` 与文字层、书内页 `/books/:code`、封面 tile 资产；**不改**详情页版式与 `.plant-card` 规格 |
| 依据 | [iteration-18-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-18-requirements.md)（Q1~Q14 冻结、验收 76~86）、[sprint-18.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-18.md) §二 / §三 |

## U18-1. 书架页整体（`.bookshelf-page` / `.bookshelf` / `.shelf-row` / `.shelf-title` / `.bookshelf-grid`）

**结构（先选书，再看书）**
```
┌──────────────────────────────────────────────┐
│   rèn zhī xiǎo tú jiàn                       │ ← 站头（紧凑档 92px）
│               认知小图鉴                      │
│             Cognitive Guide                   │
│               自然认知                        │ ← .shelf-title（32px 含间距）
│   [书]  [书]  [书]  [书]                      │ ← .bookshelf-grid（4 列）
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                  │ ← .shelf-plank（木色隔板 10px）
│               认知启蒙                        │
│   [书]  [书]  [书]  [书]                      │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔                  │
└──────────────────────────────────────────────┘
```

**新增设计变量（不修改既有 `:root` 变量，只追加）**
```css
:root {
  --shelf-wood: #C9A876;        /* 隔板 / 书脊主木色（8 本统一） */
  --shelf-wood-dark: #A8825A;   /* 木色深（描边 / 沟槽） */
  --shelf-wood-light: #E3CBA5;  /* 木色浅（高光） */
  --book-paper: #FDFBF6;        /* 封面纸白底 */
  --book-stack: #F3EBDD;        /* 书页堆米白（右侧书口 / 底口露出的页边） */
  --book-page-bg: #FFFDF9;      /* 书内页纸感底 */
  --book-ink: #D9C9AE;          /* 封面母题单色 */
}
```

**尺寸（两档，全部为实测基准值）**

| 项 | 1024×768（基准档） | 1180×820（大档） |
|---|---|---|
| `.bookshelf-page` 内边距 | `16px 16px 12px` | `20px 24px 16px` |
| 站头（`.site-header` 书架页紧凑档） | 拼音 16 / 中文 40 / 英文 18，行盒合计 **92px** | 同左（**92px**） |
| 站头下间距 | `12px` | `14px` |
| `.shelf-title` | 20px / 行高 1.2 = 24px + `margin-bottom: 8px` → **32px** | 22px / 1.2 ≈ 27 + 8 → **35px** |
| 书本 `.book` | **210 × 252** | **228 × 272** |
| `.bookshelf-grid` 列间距 | `column-gap: 24px` | `column-gap: 28px` |
| 网格总宽 | 4×210 + 3×24 = **912px** | 4×228 + 3×28 = **996px** |
| `.shelf-plank` | `height: 10px` | `height: 12px` |
| 书架行间距（`.bookshelf` gap，共 1 处） | `12px` | `12px` |
| 单个书架行块高（标题 + 书 + 隔板） | 32 + 252 + 10 = **294px** | 35 + 272 + 12 = **319px** |

**纵向尺寸预算（页面级纵向溢出 = 0 的依据）**

| 组件 | 1024×768 | 1180×820 |
|---|---|---|
| 上内边距 | 16 | 20 |
| 站头 + 下间距 | 92 + 12 = 104 | 92 + 14 = 106 |
| 书架行 1（标题 + 书 + 隔板） | 294 | 319 |
| 行间距（两行之间） | 12 | 12 |
| 书架行 2（标题 + 书 + 隔板） | 294 | 319 |
| 下内边距 | 12 | 16 |
| **合计** | **732（余量 36px）** | **792（余量 28px）** |

- 水平：1024 → `16 + 912 + 16 = 944`，余 80px（居中每侧 40px）；1180 → `24 + 996 + 24 = 1044`，余 136px（每侧 68px）。**两档均无水平溢出**。
- 机制：`.bookshelf-page { height: 100vh; height: 100dvh; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; }`，`.bookshelf { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; justify-content: space-evenly; gap: 12px; }`。余量由 `space-evenly` 均匀吸收，**不允许**用增大书本尺寸的方式消耗余量。

```css
.bookshelf-page { max-width: 1024px; margin: 0 auto; padding: 16px 16px 12px;
  height: 100vh; height: 100dvh; overflow: hidden;
  display: flex; flex-direction: column; }
.bookshelf { --book-w: 210px; --book-h: 252px;
  flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
  justify-content: space-evenly; gap: 12px; }
.bookshelf-grid { display: grid; grid-template-columns: repeat(4, var(--book-w));
  column-gap: 24px; justify-content: center; align-items: end;
  max-width: 912px; margin: 0 auto; }
.shelf-row { display: flex; flex-direction: column; padding: 0;
  background: linear-gradient(180deg, rgba(227,203,165,0.28), rgba(227,203,165,0)); }
.shelf-title { margin: 0 0 8px; font-size: 20px; font-weight: 700; line-height: 1.2;
  color: var(--color-text-light); text-align: center; }
.shelf-plank { height: 10px; max-width: 912px; width: 100%; margin: 0 auto;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--shelf-wood-light) 0, var(--shelf-wood) 55%, var(--shelf-wood-dark) 100%);
  box-shadow: 0 6px 10px rgba(62,39,35,0.12); }
@media (min-width: 1100px) {
  .bookshelf-page { max-width: 1180px; padding: 20px 24px 16px; }
  .bookshelf { --book-w: 228px; --book-h: 272px; }
  .bookshelf-grid { column-gap: 28px; max-width: 996px; }
  .shelf-title { font-size: 22px; }
  .shelf-plank { height: 12px; max-width: 996px; }
}
```

- **红线**：`.bookshelf-page` **不得与 `.page` 共用**（`.page` 的 `padding-bottom: 64px` 会直接吃掉预算）；站头紧凑档仅作用于 `.bookshelf-page .site-header` 作用域，不改全局 `.site-title-*`。
- 站头紧凑档：`.bookshelf-page .site-header { margin: 0 0 12px; }`、`.site-title-pinyin { font-size:16px; line-height:1.2; margin:0 0 2px }`、`.site-title-zh { font-size:40px; line-height:1.15; margin:0 0 2px }`、`.site-title-en { font-size:18px; line-height:1.2; margin:0 }`。
- **竖屏 768×1024（可展示不崩，非零溢出）**：`@media (max-width: 900px)` 下 `.bookshelf-page { height:auto; min-height:100dvh; overflow:visible; padding:16px }`、`.bookshelf-grid { grid-template-columns: repeat(2, 180px); column-gap: 24px; row-gap: 16px; max-width:none }`、`.bookshelf { --book-w:180px; --book-h:216px; justify-content:flex-start }`；同时文字层降档（书名 22px / 拼音 13px / 英文 12px / 数量 12px 且高度 18px），封面外框 156 宽 → 文字可用宽 156 − 24 = 132px，5 字 × 22 = 110px ✓；允许页面纵向滚动，但**不得出现水平溢出**。

## U18-2. 书本（`.book` / `--book-*` 变量 / `.book-spine` / `.book-pages` / hover）

**DOM 契约（R 按此实现类名）**：`a.book`（或 `button.book`）> `.book-spine` + `.book-pages` + `.book-cover`（内含 `.book-title-zh` / `.book-title-pinyin` / `.book-title-en` / `.book-count`）。

```css
.book { --book-spine-w: 16px; --book-pages-w: 8px;
  --book-cover-inset: 4px 8px 6px 16px;   /* top right bottom left */
  position: relative; display: block;
  width: var(--book-w); height: var(--book-h);
  background: var(--book-stack); border-radius: 4px 14px 14px 4px;
  box-shadow: 0 6px 14px rgba(62,39,35,0.12);
  text-decoration: none; color: inherit;
  transform: translateY(0);
  transition: transform 0.2s ease, box-shadow 0.2s ease; }
.book:hover, .book:focus-visible { transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(62,39,35,0.18); }
.book:active { transform: translateY(-1px); }
.book:focus-visible { outline: 3px solid var(--color-primary-dark); outline-offset: 3px; }
.book-spine { position: absolute; left: 0; top: 0; bottom: 0; width: var(--book-spine-w);
  border-radius: 4px 0 0 4px; z-index: 2;
  background: linear-gradient(90deg, var(--shelf-wood-dark) 0, var(--shelf-wood) 45%, var(--shelf-wood-dark) 100%);
  box-shadow: inset -2px 0 3px rgba(62,39,35,0.18); }
.book-pages { position: absolute; right: 0; top: 4px; bottom: 6px; width: var(--book-pages-w);
  border-radius: 0 4px 4px 0; z-index: 0;
  background: repeating-linear-gradient(90deg, #FFFDF5 0 1px, #E8E0D2 1px 2px); }
```

| 项 | 值 |
|---|---|
| 书脊 | 宽 **16px** 竖直木色条（`--shelf-wood` 系，8 本完全一致），左圆角 4px，两道 2px 深色沟槽（`::before/::after` 横线，位于高度 18% / 82%） |
| 书页厚度 | 右侧书口 **8px** 条纹（1px 纸白 `#FFFDF5` / 1px 米灰 `#E8E0D2` 交替）；底部 6px 由 `.book-cover` 内缩露出 `.book` 页堆色 `--book-stack #F3EBDD`，形成下口页边 |
| 圆角 | 书脊侧 4px / 书口侧 14px（上右下三处） |
| 阴影 | 静置 `0 6px 14px rgba(62,39,35,0.12)`；hover `0 10px 22px rgba(62,39,35,0.18)` |
| hover 抬升 | `translateY(-4px)`（**≤4px 硬上限**），过渡 `0.2s ease`（与 `.plant-card` 一致）；`:active` 回落到 `-1px` |
| 热区 | **210×252 / 228×272 ≫ 56px**；`:focus-visible` 3px 主色深描边 + 3px offset |

- **红线**：8 本书除封面母题外**视觉参数完全一致**；禁止引入 `--book-accent` 一类「每本一个主色」的色相变量（Q12）。
- 书本在网格内 `align-items: end` 对齐，底边贴住 `.shelf-plank`（书本与隔板间距 0，隔板上沿即书底）。

## U18-3. 封面（`.book-cover`）

```css
.book-cover {
  position: absolute; inset: var(--book-cover-inset);
  border-radius: 2px 12px 12px 2px;
  padding: 12px 12px 14px;
  overflow: hidden;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 4px;
  background-color: var(--book-paper);
  background-image: var(--book-cover-image, none);   /* R 内联注入 url('/images/covers/{code}.jpg') */
  background-size: calc(var(--book-h) - 2px) calc(var(--book-h) - 2px);
  background-position: center center;
  background-repeat: no-repeat;   /* tile 尺寸 > 封面尺寸，不会出现接缝 */
  box-shadow: inset 0 0 0 1px rgba(62,39,35,0.10), inset 0 0 24px rgba(62,39,35,0.06);
}
```

| 项 | 1024×768 档 | 1180×820 档 |
|---|---|---|
| 书本外框 | 210 × 252 | 228 × 272 |
| 封面外框（外框 − 书脊 16 − 书口 8；− 上 4 / 下 6） | **186 × 242** | **204 × 262** |
| `background-size`（= 书高 − 2px） | **250px × 250px** | **270px × 270px** |
| 裁切窗口 / 单 tile 面积比 ρ | 186×242 ÷ 250² = **0.720** | 204×262 ÷ 270² = **0.733** |
| 可见母题数 | **4**（2×2 全在窗口内） | **4** |
| 封面留白率 | `1 − 0.20/0.720` = **≥72.2%** | `1 − 0.20/0.733` = **≥72.7%** |

**240×300 参考书封下的计算过程（备查 / 后续放大版式复用）**
- 若书本 240×300 → 封面外框 = 240−16−8 = **216 宽** × 300−4−6 = **290 高**。
- `background-size` 取「书高 − 2px」= **288 × 288**；裁切窗口 / tile 面积比 ρ = 216×290 ÷ 288² = **0.755**。
- 单 tile 4 个母题、单母题墨迹 ≤5%（tile 留白 ≥80%）→ 封面墨迹 ≤ 20% ÷ 0.755 = 26.5%，**封面留白 ≥73.5%**，可见母题 **4 个**（≤12）。结论：该尺寸同样满足 Q11/验收 78，但 240×300 在 1024×768 与 1180×820 的两层书架下均超出纵向预算，**本迭代不采用**。

- 纸白底 `--book-paper #FDFBF6`；轻微纹理用内阴影 24px / 6% 棕，**不叠加**额外渐变纹理层（避免与 tile 花纹抢视觉）。
- **红线**：封面只用 `background-image` 承载花纹，书名/拼音/英文/数量一律 HTML 文字（Q13）；未知 code 无图时 `--book-cover-image: none` 也应显示纯净纸白封面，不出现破图或纯色块。

## U18-4. 封面文字层（`.book-title-zh` / `.book-title-pinyin` / `.book-title-en` / `.book-count`）

| 类名 | 1024×768 | 1180×820 | 字重 / 颜色 | 约束 |
|---|---|---|---|---|
| `.book-title-zh` | **26px** / 行高 1.2（31.2） | **28px** / 行高 1.2（33.6） | 700 / `--color-text` | `white-space: nowrap`；letter-spacing 0.5px |
| `.book-title-pinyin` | **14px** / 1.2（16.8） | **15px** / 1.2（18） | 400 / `--color-text-light` | `nowrap` |
| `.book-title-en` | **13px** / 1.2（15.6） | **14px** / 1.2（16.8） | 500 / `--color-text-light` | `nowrap` |
| `.book-count` | **13px** / 行高固定 **20px** | **14px** / 行高固定 **22px** | 600 / `--color-text-light` | 固定高度占位，`margin-top: 6px` |

**横向不溢出验算**（文字可用宽 = 封面宽 − 左右 padding 24px）
- 1024 档：186 − 24 = **162px**。最长书名「英文字母书 / 汉语拼音书」5 字 × 26 + 0.5px×4 = **132px ≤ 162px** ✓；最长拼音「yīng wén zì mǔ」14 字符 × ≈7.4 = **≈104px** ✓；最长英文「Dinosaur」≈**55px** ✓。
- 1180 档：204 − 24 = **180px**。5 字 × 28 + 2 = **142px ≤ 180px** ✓。
- 红线：书名 **≤5 字**用上表字号；若后续新增板块书名 ≥6 字，必须降档到 22px（1024）/ 24px（1180）并复核 ≤162 / ≤180。**禁止** `text-overflow: ellipsis`（不允许截断书名）。

**纵向占位**
- 1024 档文字块 = 31.2 + 4 + 16.8 + 2 + 15.6 + 6 + 20 = **95.6px**，占封面高 242 的 39.5%（**≤45% 上限**）✓；1180 档 = 33.6 + 4 + 18 + 2 + 16.8 + 6 + 22 = **102.4px** / 262 = 39.1% ✓。
- 母题中心位于 tile 的 25% / 75% 象限 → 对应封面高度约 46–98px 与 144–196px 两带，文字块（约 73–169px）与母题最小间距 ≥ 4px（视觉上文字落在中央留白带）。
- `.book-count` 数量未就绪/失败时渲染空文本但**保留高度**（1024: `height:20px`；1180: `height:22px`），就绪后补「N 种」，**禁止条件卸载该元素**（避免 4 本高度跳动 / CLS）。文案口径「204 种」，`aria-label="{书名}，共 N 种"`。
- 文本分离度：书名加 `text-shadow: 0 1px 0 rgba(255,255,255,0.85)`；正文色 `#3E2723` 对纸白 `#FDFBF6` 对比度 ≈11.7:1，对母题色 `#D9C9AE` 仍 ≥8:1（红线 ≥4.5:1）。

## U18-5. 书内页（`.book-page` / `.book-topbar` / `.book-title` / `.book-page-body`）

```css
.book-page { max-width: 1200px; margin: 0 auto; padding: 20px 16px 32px; }
.book-topbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.book-title { margin: 0; font-size: 32px; font-weight: 700; line-height: 1.2; color: var(--color-text); }
.book-page-body {
  background: var(--book-page-bg);
  border-left: 6px solid var(--shelf-wood);
  border-radius: 0 16px 16px 0;
  padding: 20px 12px 24px;
  box-shadow: inset 12px 0 16px -12px rgba(62,39,35,0.18), 0 2px 8px rgba(62,39,35,0.06);
}
@media (min-width: 1100px) { .book-title { font-size: 36px; } .book-page { padding: 24px 24px 40px; } }
@media (max-width: 900px) { .book-page { padding: 16px 12px 24px; }
  .book-page-body { padding: 16px 8px 20px; border-left-width: 4px; } }
```

| 项 | 规格 |
|---|---|
| 顶栏 | `← 回书架`（复用 `.back-btn`：`min-height:56px`、20px、16px 圆角、主色深描边）+ 标题 `{板块名}书`，左对齐同一行，间距 16px |
| 标题 | 32px / 700（1024）× 36px（1180）；不显示「第几本」编号（Q5） |
| 内页容器 | 纸感底 `#FFFDF9` + 左侧 6px 木色书脊条 + 内阴影（12px 16px -12px），右侧 16px 圆角 |
| 页边距 | 20px 上 / 32px 下；左右 16px（1024）→ 24px（1180） |
| 列表 | 「共 N 种」`.list-count` 18px、右对齐、`margin-bottom:12px`；卡片网格 `.plant-grid`（`auto-fill minmax(220px,1fr)`）、首屏 16 / 步进 16、哨兵 `.load-sentinel` 56px 全部**原样沿用** |
| 滚动 | 书内页**允许页面纵向滚动**（列表很长），不与书架页的零溢出冲突；滚动记忆按书隔离（`sh:bookScroll:{code}`）由 R 负责 |

- **列数不回归验算**（红线：`.plant-card` 规格与字号、列数规则不变）
  - 1024：1024 − 32（页边距）− 24（内页左右 padding）− 6（书脊条）= **962** → (962 + 24)/244 = 4.04 → **4 列**（与改版前一致）。
  - 1180：1180 − 48 − 24 − 6 = 1102 → 4.61 → **4 列** ✓。
  - 768 竖屏：768 − 24 − 16 − 4 = 724 → 3.06 → **3 列**（与改版前一致）。
- **红线**：不得修改 `.plant-card`（圆角 20 / padding 16 / 阴影）、`.plant-card-zh` 24px、`.plant-card-pinyin|en` 16px、`.list-count` 18px、`.plant-grid` minmax(220px,1fr)；不得给内页容器再加额外左右 padding（会掉列）。

## U18-6. 封面 tile 资产规范（`/images/covers/{code}.jpg`）

| code | 母题（单一，重复） | 画法（最终参数） | 单母题外接盒（@1200） | 实测 tile 墨迹（8 张成品） |
|---|---|---|---|---|
| plant | 一片叶子 + 主脉 | 单色线描，主轮廓线宽 24px、叶脉 12px | 236 × 370 | **8.04%** |
| animal | 四趾爪印 | 扁平剪影（1 掌垫 + 4 趾），整体 `scale(0.93)` | 320 × 320 | **18.45%** |
| insect | 蝴蝶（左右对称） | 单色线描，线宽 22px，整体 `scale(0.68)` | 245 × 205 | **4.87%** |
| dinosaur | 三趾脚印 | 扁平剪影，整体 `scale(0.92)` | 300 × 340 | **18.93%** |
| letter | 「Aa」字形 | 单色字形，font-size **200px** + letter-spacing **-5** | 280 × 200 | **2.86%** |
| pinyin | 「a」字形 | 单色字形，font-size **220px** | 230 × 220 | **1.49%** |
| number | 「1 2 3」字形组（组内 3 字符 = 1 个母题） | 单色字形，font-size **140px** + letter-spacing **8** | 250 × 140 | **1.84%** |
| color | 实心圆点 | 单色实心，r=150（φ300） | φ300 | **19.70%** |

- **单母题占位**恒为 tile 墨迹的 1/4（2×2 四复制），故全部 ≤5% 硬上限：最大 color 4.93% / animal 4.61% / dinosaur 4.73%，余量最小但合规；字形类（letter / pinyin / number）远低于上限，不再放大（再放大将被封面窗口裁切，见下条）。
- 生成器：`scripts/generate-covers.mjs`（Playwright 渲染 SVG → `cjpeg -quality 82 -progressive`），参数改动须同步本表与实测值。

**统一规格**
| 项 | 值 |
|---|---|
| 画布 | **1200 × 1200**，`.jpg` 渐进式（`cjpeg -quality 82 -progressive`），单张 ≤180KB（纯色面，压缩率高） |
| 底色 | 纸白 `#FDFBF6`（全 8 张一致，Q12：无每本主色） |
| 墨色 | 单色 `#D9C9AE`（与底色对比 ≈1.53:1；**区间红线 1.4:1–1.8:1**，低于则不可见，高于则抢书名） |
| 母题数量 | 每 tile **2×2 = 4 个**，中心实际坐标 x=**377 / 823**、y=**300 / 900**（px @1200），旋转 -12° / 10° / 14° / -8° 轻微错落 |
| 中心内移原因 | 封面窗口 `.book-cover`（1024 档 186×242）只露出 tile 中间约 74% 宽度（左右各裁 32/250），x 取 377/823 恰好映射到**可见窗口**的 25% / 75%，母题不被左右裁切；y 映射 25% / 75% |
| 边距 | 母题外接盒距 tile 四边 ≥ **96px（8%）**，任何母题不跨 tile 边界 → 可无缝平铺（实测最紧为 dinosaur 上沿 99px） |
| 单母题占位 | **≤5%** 面积（Q11 上限 10%，此处取更严值，以保封面留白）：5% × 1200² = 72,000 px² 为硬上限 |
| 线宽 | 线描类 **22–24px**（plant 24 / insect 22；缩放到 250/270 显示宽后约 4.6–5px，保证不糊不掉线） |
| 禁止 | 填色渐变、投影、描边双层、>1 种母题、文字、边框、水印 |

**显示映射**：tile 以 `background-size: calc(var(--book-h) - 2px)` 缩放 → 1024 档 **250×250**、1180 档 **270×270**；母题显示尺寸约 **29–77px**（剪影 / 线描 42–77px，字形 29–46px），缩略密度适中、不显拥挤。

**验收算法（QA/R 可直接实现）**
1. **单母题占位率**（原图）：`area_motif / 1200² ≤ 5%`，逐个母题（`number` 的「1 2 3」整组计 1 个）。
2. **tile 留白率**：`inkRate_tile = 非纸白像素 / 1200² ≤ 20%`（即留白 ≥80%，与 sprint-18 §三一致）。
3. **封面留白率**（验收 78 的 ≥60%）：`ρ = (coverW × coverH) / (tileW × tileH)`（1024 档 0.720 / 1180 档 0.733），`whitespace_cover = 1 − inkRate_tile / ρ`，要求 **≥60%**（本规范值 ≥72%）。
4. **可见母题数**：在封面区域内做墨色连通域计数，**只有连通域面积 ≥ 单母题面积的 30% 才计 1 个**（`number` 的「1 2 3」整组计 1），要求 **≤12**（本规范预期 **4**）。
5. 判定口径：以 1200×1200 原图计算 2/3，以 `background-size` 实际渲染尺寸采图计算 4；文字层（书名等 HTML）**不计入**墨迹统计。

## U18-7. 热区与溢出红线（增量复核）

| 项 | 红线 | 校验方式 |
|---|---|---|
| 书本 `.book` 热区 | 210×252 / 228×272，**≥56px** ✓ | `getBoundingClientRect` |
| 「← 回书架」`.back-btn` | `min-height:56px`、`padding:8px 20px`（复用既有） | 同上 |
| 详情页「← 回{板块名}书」 | 沿用 `.back-btn`，文案最长 7 字（「← 回英文字母书」）在 1024 下宽约 200px，不压 `.nav-btn`（76px 侧边留白内） | 同 Sprint 6 口径 |
| 分页 / 哨兵 `.load-sentinel` | 非可点元素，但保持 **56px** 高度占位（不设「加载更多」按钮） | DOM 检查 |
| 书架页页面级纵向溢出 | 1024×768 **0**（预算 732 ≤ 768）、1180×820 **0**（792 ≤ 820） | `documentElement.scrollHeight ≤ clientHeight` |
| 书架页水平溢出 | 944 ≤ 1024 / 1044 ≤ 1180，**0** | `scrollWidth ≤ clientWidth` |
| 竖屏 768×1024 | 允许纵向滚动；**水平溢出 0**；8 本分 4 行（2 列）完整可读，书本 180×216 ≥56px | 同上 |
| 对比度 | 书名 / 数量文字对纸白与母题均 **≥4.5:1** | 计算校验 |
| 键盘可达 | `.book` 支持 Tab 聚焦 + Enter 进入；`:focus-visible` 3px 主色深描边 | 手工 / E2E |
| 配色红线 | 8 本书**仅母题不同**，书脊 / 底 / 文字色完全统一，无每本主色（Q12） | 视觉走查 |
| 不回归 | `.plant-card` 规格 / 字号、`.list-count`、`.plant-grid` 列数、详情页版式与字号均不变 | E2E 复跑 |

- 加载态：分类接口失败显示「哎呀，出了点小问题，请稍后再试」（`.state-tip`，24px，复用）；未知 code「这本书还在路上哦」+「回书架」（`.back-btn` 视觉）；数量未就绪仅空出 20/22px 高度，不显示占位骨架、不显示 0。






