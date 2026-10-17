# 迭代需求文档 — Sprint 9（v2.0 自然认知图鉴：能力先行）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 9 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §14（增量 v2.0）及其 §14.7 人工确认结论（七项全部按 PO 建议采纳）；人工裁决音频格式为 **AAC `.m4a`** |
| 作者 | PO |
| 状态 | 已冻结（阶段 2 基线；人工授权「剩下的 PO 决定，然后团队推进开发」后由 PO 一次冻结 Q2~Q7） |

## 一、需求基线（来源与 PO 冻结决策）
| 事项 | 冻结结论 |
|---|---|
| 来源 | 人工逐条答复 Q1~Q8（PRD §14.2）→ PO 落盘 §14 → 人工确认 §14.7 七项 → 人工追加裁决音频格式 **AAC `.m4a`**，并授权 PO 决断其余六问后团队直接推进开发 |
| 交付形态 | **能力先行**：站点改名 + 四板块两级导航 + 单图模型 + 小知识卡片 + 预生成音频 + `sort` 排序清技术债；内容仅「试点 10 种 / 板块」，后续分批扩容 |
| 影响面 | 后端（分类模型增 `section`、单键部位兼容、`section` 查询、`sort` 排序、显式排序清债）；前端（站点改名、板块导航、单图详情分支、小知识卡片、音频播放替换 `useSpeech`、`PART_ORDER` 扩展）；内容管道（导入校验扩展 + 试点内容与资产生产） |
| 版本 | v2.0 增量，PRD §14 |
| 不变量 | 既有 **100 种植物 / 206 张图 / 3 分类**全部保留、不改路径；接口 `/api/categories`、`/api/plants`、`/api/plants/{id}` **路径不变**；详情路由 `/plants/:id` 不变；US-6（全屏连续浏览）、US-7（名称朗读）、US-8（默认部位跟随分类）、Sprint 6 无滚动约束**不回归** |

## 二、Q2~Q7 冻结口径（PO 裁决，人工已授权）

### Q2 单键部位键名 → **复用 `parts` map，单键 = 板块/分类 code**
- 动物 / 昆虫 / 恐龙条目**不新增独立单图字段**，仍用现有 `parts: Map<String,PlantPart>`，其中**只含一个键**，键名即该板块的分类 code：`animal` / `insect` / `dinosaur`。
- 例：`{ "id":"giant-panda", "categories":["animal"], "name":{...}, "parts": { "animal": { "name":{...}, "images":[{ "type":"photo", "url":"/images/animals/giant-panda.jpg" }], "description":"...", "allusion":{...小知识...} } } }`
- **后端 `Plant` / `PlantPart` record 结构不变**（Map 天然容纳任意键）；仅扩展硬编码 `PlantService.PART_ORDER` 与前端 `PartSwitcher.PART_ORDER/PART_LABELS`（见 Q3/Q4）。
- 理由：最小改动、复用既有单图渲染/封面/详情链路；植物三部位行为完全不受影响。

### Q3 板块与分类的数据表达 → **分类增 `section` 字段 + 后端分类查询增可选 `section` 参数**
- `content/categories.json` 每条分类**新增 `section` 字段**（`plant` / `animal` / `insect` / `dinosaur`）：
  - 既有 flower/leaf/fruit → `section:"plant"`（order 1/2/3 不动）；
  - 新增 `{ code:"animal", nameZh:"动物", pinyin:"dòng wù", nameEn:"Animal", order:4, section:"animal" }`；
  - 新增 `{ code:"insect", nameZh:"昆虫", pinyin:"kūn chóng", nameEn:"Insect", order:5, section:"insect" }`；
  - 新增 `{ code:"dinosaur", nameZh:"恐龙", pinyin:"kǒng lóng", nameEn:"Dinosaur", order:6, section:"dinosaur" }`。
- 后端 `Category` record **新增 `String section`**（可空，向后兼容）；`GET /api/categories` 原样多返回该字段（**契约向后兼容**，前端分组用）。
- **板块（board）标签与顺序由前端常量持有**（`SECTIONS = [plant→植物, animal→动物, insect→昆虫, dinosaur→恐龙]`），不新建 Mongo 集合、不新增分类以外的数据源。
- 理由：分类本就数据驱动；`section` 为**纯增字段**，改动小且向后兼容；避免为 4 个固定板块引入新集合与接口。

### Q4 板块路由与列表接口 → **复用 `GET /api/plants`，板块用新可选参数 `section`，植物二级筛选沿用 `category`**
- **顶层板块列表**统一走新可选参数 `?section={plant|animal|insect|dinosaur}`：
  - 植物板块「全部」→ `GET /api/plants?section=plant`（该板块全部条目）；
  - 动物 / 昆虫 / 恐龙板块（平铺，无二级）→ `?section=animal|insect|dinosaur`。
- **植物板块二级筛选**沿用既有 `?category=flower|leaf|fruit`（行为与语义不变，`?category=leaf` 等既有断言继续成立）。
- **无参数 `GET /api/plants`** 保留「全部条目（跨板块）」语义（契约兼容；UI 不依赖）。
- **详情路由沿用 `/plants/:id`**；详情 `state` 携带 `{ section, category, list }`（`category` 仅植物板块非「全部」时有用）供返回记忆与邻株计算。
- 深链接兜底：详情页无 state 时按 `category ? {category} : {section}` 拉一次列表。
- **`/api/categories`、`/api/plants/{id}` 路径与响应结构不变**；`/api/plants` 仅**新增**可选 `section` 参数（向后兼容）。
- 理由：路径零变更、最小面改动；「全部」在跨板块后必须限定到板块内，`section` 参数能干净表达且不引入新端点。

### Q5 既有断言影响面 → 见本文档 §五（QA 必须逐条处理）
- 站点标题断言（「植物小花园 / Plant Garden」→「自然小图鉴 / Nature Guide」）须更新。
- 首页分类按钮结构由「1 组」变「1 板块导航 + 1 分类筛选」；若既有断言统计 `.filter-btn` **总数**须限定到 `.category-filter` 作用域。
- 后端「全部条目」计数：v2.0 后无参 `GET /api/plants` 覆盖四板块（100 植物 + 30 试点 = 130），凡以「100」硬编码的断言须改为**数据驱动计数**。
- 前端 `PART_ORDER` 扩展（尾部追加 animal/insect/dinosaur）：植物部位顺序断言（flower→leaf→fruit 在前）不受影响。
- 语料校验脚本输出计数由 `total=100` 变为 `total=130`（分类由 3 → 6）。

### Q6 试点内容清单 → 见本文档 §四（PO 出具，文案由 PO 审）
动物 / 昆虫 / 恐龙各 10 种（详见 §四·表）；低龄化说明 + 小知识正文 ≤60 字、解释 ≤50 字；恐龙一律**完整骨架化石**图。

### Q7 `sort` 取值口径 → **首版按语料既有顺序补 `sort`（1…n）**
- 既有 100 种植物：按 `content/plants/` 文件名字典序，`sort = 1…100`。
- 新增动物 / 昆虫 / 恐龙：各板块内 `sort = 1…10`（按 §四名单顺序）。
- 列表排序：`sort ASC, id ASC`（`Sort.by(ASC,"sort","id")`）。**空缺 `sort` 视为最小**（Mongo 升序天然将缺省值排前），重导后所有条目均有 `sort`。
- 后续内容维护再按「分布区域 → 季节 → 常见度」精修（§14.7-⑥），**本迭代不做**用户可见排序控件（§14.7-⑤）。

## 三、角色问答记录（阶段 2）
### J ↔ PO
- **J-13 单键部位如何进 `PART_ORDER`？** → PO：`PlantService.PART_ORDER` 由 `flower,leaf,fruit` 扩为 `flower,leaf,fruit,animal,insect,dinosaur`（尾部追加，植物顺序不变）；`partCodes` / `coverImage` 自动覆盖单图条目。
- **J-14 分类合法性校验与文案？** → PO：`categoryRepository.existsById(category)` 天然覆盖新分类；40001 文案由「试试花朵、树叶或果实吧」改为涵盖四板块（如「试试花朵、树叶、果实、动物、昆虫或恐龙吧」）。新增 `section` 校验：未知 section 返回 **40002**「没有「%s」这个板块哦」。
- **J-15 `section` 查询怎么实现？** → PO：新增仓库方法 `findByCategoriesIn(Collection<String> cats, Sort sort)`；`?section=plant` → 用 plant 板块的分类集合（flower/leaf/fruit）**并集**查询；`?section=animal` 等单分类板块同理（该板块全部分类并集）。排序统一 `Sort.by(ASC,"sort","id")`。
- **J-16 缓存 key 怎么变？** → PO：新增 `sh:plants:list:section:{section}`（如 `sh:plants:list:section:plant`）；既有 `sh:plants:list:{category|all}` 不变。导入脚本仍 SCAN `sh:*` 清缓存，无需改 key 规则。
- **J-17 分类列表顺序？** → PO：`GET /api/categories` 仍按 `order` 升序（flower1…dinosaur6）；前端据此 + 固定板块顺序渲染。

### R ↔ PO
- **R-28 板块导航形态与选中联动？** → PO：首页顶部为**板块导航**（植物/动物/昆虫/恐龙，一级），植物板块下再渲染既有分类筛选（全部/花朵/树叶/果实，二级）；其余板块平铺不渲染二级。切换板块时二级筛选重置（植物→「全部」）。
- **R-29 单图详情如何分支？** → PO：详情页判断当前条目**仅一个部位且该部位 ∈ {animal,insect,dinosaur}** → 走**单图分支**：不渲染 `PartSwitcher`、不渲染部位三语名行；直接大图 + 说明 + 小知识。植物条目分支完全不变（含 US-8 默认部位跟随分类、US-6/US-7 行为）。
- **R-30 小知识卡片实现？** → PO：**复用 `AllusionCard`** 数据与结构（`allusion.text/source/explain`），仅 `aria-label` 与视觉称谓由「植物小典故」改为「小知识」；无内容不渲染（沿用现状）。
- **R-31 音频播放如何替换？** → PO：新增 `useAudio`（`HTMLAudioElement` 单例）替代 `useSpeech`；详情页从语料读音路径播放 `.m4a`；喇叭交互（贴名称右侧、≥56px、播放/再点停止、中英互斥、换株/换部位/回花园/全屏进出/卸载停止）**沿用 §10/Sprint 5 约定**；**音频缺失则该喇叭不渲染，不回退 `speechSynthesis`**。
- **R-32 音频 URL 从哪来？** → PO：由语料读音字段承载（设计阶段定为 `/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`；`name` 增可选 `audioZh`/`audioEn`，缺省按上述路径推导）；英文名缺失则不渲染英文喇叭。
- **R-33 站点改名影响面？** → PO：仅首页标题中文/拼音/英文三处文本；不改路由、不改样式骨架。

### UI ↔ PO
- **UI-11 板块导航样式与热区？** → PO：沿用 `.filter-btn` 视觉（高度 ≥56px、圆角 16px、选中实底白字）；一级板块导航为一行，二级分类筛选为下一行；两行间距 ≥16px。
- **UI-12 单图详情版式？** → PO：横屏沿用既有「左图 + 右文字」两栏（Sprint 9 已交付的竖屏「上图下文」不变）；单图分支去掉部位切换条后，图片区可占用其让出的高度，图 `aspect-ratio:1/1` + `object-fit:contain` 完整不裁切。
- **UI-13 小知识卡片视觉？** → PO：完全沿用 `.allusion-card`（辅助色底 + 黄描边 + 引号装饰）；不新增样式体系。

### QA ↔ PO
- **QA-23 单键部位如何验？** → PO：后端集成断言 `?category=animal`（或 `?section=animal`）返回 item 的 `parts` 仅 1 键且为 `animal`；封面为该图。前端单测断言单图详情不渲染 `PartSwitcher`、渲染大图与说明。
- **QA-24 `section` 查询如何验？** → PO：后端断言 `?section=plant` 计数 = 植物数、`?section=animal` = 10；未知 section → code 40002。前端断言板块切换触发对应请求。
- **QA-25 音频如何验？** → PO：单测断言「有音频 → 渲染喇叭、点击调用 `audio.play`（stub）；无音频 → 不渲染且**不**出现 `speechSynthesis` 调用」；断言中英互斥、切场景 `pause`。
- **QA-26 `sort` 如何验？** → PO：后端断言两次请求列表顺序一致且 = `sort ASC, id ASC`（跨界对比）；替换技术债断言（`findByCategoriesContains` 已不存在 → 改用显式排序）。
- **QA-27 回归范围？** → PO：PRD §14.5 验收 26~33 + 既有 §7/§9.4/§10.4/§11.4/§12.4/§13.5 全量；重点防：站点标题、板块导航、单图详情、音频降级、排序稳定、100 植物图片与路径不变。

## 四、试点内容清单（PO 出具，人工如无异议即按此生产）
> 命名口径：`id` 用英文小写连字符；三语名称齐备（英文名缺失者仅中文，按 PRD 允许）；说明低龄化；小知识正文 ≤60 字、解释 ≤50 字；植物文案沿用既有。

### 动物板块（10，`section:animal`，分类 `animal`，写实照片 `/images/animals/{id}.jpg`）
| # | id | 中文 | 英文 |
|---|---|---|---|
| 1 | giant-panda | 大熊猫 | Giant Panda |
| 2 | tiger | 老虎 | Tiger |
| 3 | giraffe | 长颈鹿 | Giraffe |
| 4 | elephant | 大象 | Elephant |
| 5 | lion | 狮子 | Lion |
| 6 | rabbit | 兔子 | Rabbit |
| 7 | monkey | 猴子 | Monkey |
| 8 | penguin | 企鹅 | Penguin |
| 9 | dolphin | 海豚 | Dolphin |
| 10 | zebra | 斑马 | Zebra |

### 昆虫板块（10，`section:insect`，分类 `insect`，写实照片 `/images/insects/{id}.jpg`）
| # | id | 中文 | 英文 |
|---|---|---|---|
| 1 | butterfly | 蝴蝶 | Butterfly |
| 2 | bee | 蜜蜂 | Bee |
| 3 | ant | 蚂蚁 | Ant |
| 4 | ladybug | 瓢虫 | Ladybug |
| 5 | dragonfly | 蜻蜓 | Dragonfly |
| 6 | mantis | 螳螂 | Mantis |
| 7 | cricket | 蟋蟀 | Cricket |
| 8 | cicada | 蝉 | Cicada |
| 9 | firefly | 萤火虫 | Firefly |
| 10 | beetle | 甲虫 | Beetle |

### 恐龙板块（10，`section:dinosaur`，分类 `dinosaur`，**一律完整骨架化石** `/images/dinosaurs/{id}.jpg`）
| # | id | 中文 | 英文 |
|---|---|---|---|
| 1 | tyrannosaurus | 霸王龙 | Tyrannosaurus |
| 2 | triceratops | 三角龙 | Triceratops |
| 3 | stegosaurus | 剑龙 | Stegosaurus |
| 4 | brachiosaurus | 腕龙 | Brachiosaurus |
| 5 | velociraptor | 迅猛龙 | Velociraptor |
| 6 | ankylosaurus | 甲龙 | Ankylosaurus |
| 7 | parasaurolophus | 副栉龙 | Parasaurolophus |
| 8 | pteranodon | 翼龙 | Pteranodon |
| 9 | spinosaurus | 棘龙 | Spinosaurus |
| 10 | diplodocus | 梁龙 | Diplodocus |

> 若某写作「写实照片」不可得（如已灭绝恐龙不做复原图，一律骨架化石），按 PRD §14.4.3 口径：**动物/昆虫无法实拍者用 `type:"restore"` 写实复原图；恐龙**一律* 骨架化石照片**。

## 五、既有断言影响面清单（QA 逐条处理）
| # | 受影响项 | 处理 |
|---|---|---|
| 1 | 首页站点标题断言（`植物小花园` / `zhí wù xiǎo huā yuán` / `Plant Garden`） | 更新为 `自然小图鉴` / `zì rán xiǎo tú jiàn` / `Nature Guide` |
| 2 | 首页 `.filter-btn` 总数断言（若存在） | 限定作用域：板块导航 `.section-nav` 4 个；植物分类 `.category-filter` 4 个（全部+3） |
| 3 | 后端「全部条目」计数（原 100） | 改数据驱动（130 = 100 植物 + 30 试点）；分类计数 3 → 6 |
| 4 | 语料校验脚本输出（`total=100 flower=53 leaf=100 fruit=53`） | 预期改为 `total=130`（分类 6）；植物三分类计数不变 |
| 5 | `getOrderedParts` / `PART_ORDER` 顺序断言 | 植物仍 `flower,leaf,fruit` 在前，断言不变；新增项仅在无对应部位的植物上不出现 |
| 6 | 封面回退断言（Sprint 7 TC-57/58） | 不变；单图条目新增断言（`?category=animal` 封面为对应图） |
| 7 | 详情默认部位断言（Sprint 8 TC-65/66） | 不变；新增「单图条目无部位切换」断言 |
| 8 | E2E 首页/详情导航（TC-22/26/36 等） | 按植物板块「全部」语义仍成立；补板块切换用例 |

## 六、验收对照表（PRD §14.5 → Sprint 9 用例）
| PRD §14.5 | 验收点 | 主验方式 |
|---|---|---|
| 26 | 站点改名「自然小图鉴 / zì rán xiǎo tú jiàn / Nature Guide」 | 前端单测 + E2E（TC-71 起） |
| 27 | 四板块顶层两级导航；植物板块二级筛选（全部/花朵/树叶/果实）；其余板块平铺 | 前端单测 + E2E |
| 28 | 动物/昆虫/恐龙单图详情，无部位切换；植物部位切换不回归 | 后端集成 + 前端单测 + E2E |
| 29 | 小知识卡片各板块可渲染；正文 ≤60、解释 ≤50；无内容不渲染 | 数据驱动语料校验 + 前端单测 |
| 30 | 详情中/英喇叭播放**预生成音频（AAC `.m4a`）**；跨设备一致；缺失不渲染、不回退合成 | 前端单测 + E2E |
| 31 | 列表顺序 = `sort ASC + id ASC`，重复请求稳定（替清排序技术债） | 后端集成 |
| 32 | 既有 v1.0~v1.5 验收（§7/§9.4/§10.4/§11.4/§12.4/§13.5）不回归 | 全量回归 |
| 33 | 平板横竖屏板块导航与单图详情正常；热区 ≥56px | E2E |

用例编号自主 **TC-71** 起（Sprint 8 已用到 TC-70）。

## 七、非目标（同 PRD §14.6）
- 动物/昆虫/恐龙由 10 种扩容到 100 种（后续 Sprint，仅走导入通道）。
- 恐龙写实复原图（一律完整骨架化石）。
- 用户可见排序控件；板块内二级分类（动物/昆虫/恐龙平铺）。
- 手机端专项适配。
