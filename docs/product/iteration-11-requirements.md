# 迭代需求文档 — Sprint 11（v2.2 内容扩容一：动物 / 昆虫 / 恐龙 各 10 → 30）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 11 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §14（v2.0：每板块上限 100）与 §16（v2.2 增量）；[sprint-11.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-11.md) |
| 作者 | PO |
| 状态 | 已冻结（阶段 2 基线；人工已授权「开始导入动物、昆虫和恐龙内容」，PO 按 v2.0 既有口径一次冻结 Q1~Q7） |

## 一、需求基线（来源与 PO 冻结决策）

| 事项 | 冻结结论 |
|---|---|
| 来源 | 人工指令「进入 Sprint 11，开始动物/昆虫/恐龙内容扩容」→「开始导入动物、昆虫和恐龙内容」。属 v2.0「能力先行」后既定的**内容分批扩容**路径。 |
| 交付形态 | **纯内容扩容**：新增 60 个内容 JSON + 59 张图片 + 120 个音频；**后端 / 前端代码零改动**；不改接口契约、路由、图片与音频路径规则。 |
| 影响面 | 仅 `content/{animals,insects,dinosaurs}/`、`frontend/public/images/{animals,insects,dinosaurs}/`、`frontend/public/audio/`，以及受影响断言（板块总量）。 |
| 版本 | v2.2 增量，PRD §16 |
| 不变量 | 植物板块 **100 种 / 206 张部位图 / 3 分类** 全部保留；`/api/categories`、`/api/plants`、`/api/plants/{id}` 路径与响应结构不变；详情路由 `/plants/:id` 不变；US-6/US-7/US-8 与 Sprint 6 无滚动约束、Sprint 10 增量加载与「共 N 种」**不回归**。 |
| 板块规模 | 本迭代每板块 +20（10 → 30）；每板块上限仍为 100（后续 Sprint 续扩）。 |

## 二、Q1~Q7 冻结口径（PO 裁决）

### Q1 新增 id / 三语名 / 拼音 / 音标清单 → 见本文档 §四（20+20+20，共 60）
- `id` 用英文小写连字符；`name.zh/pinyin/en/ipa` 齐备（拼音带声调、音标带 `/ /`）。
- `audioZh = /audio/{id}-zh.m4a`、`audioEn = /audio/{id}-en.m4a`（路径规则不变）。
- 各板块内 `sort` 续排 **11…30**，与 §四清单顺序一致。

### Q2 文案长度与低龄化口径
- `description`：**2 个短句，总长 ≤80 字符，且不得包含任何拉丁字母**（仅中文 + 中文标点）。
- `allusion.text` ≤60 字符、`allusion.explain` ≤50 字符；面向 3–6 岁，讲一个有趣的习性 / 冷知识 / 生活地方；**不写 `source` 字段**（与 v2.0 非植物板块既有口径一致）。

### Q3 恐龙图片口径 → **一律完整骨架化石照片**
- `parts.dinosaur.images[0] = { type:"photo", url:"/images/dinosaurs/{id}.jpg" }`，画面为**完整骨架化石**（含头骨、脊柱、肋骨、四肢、尾），博物馆陈列风格。
- **不做**写实复原图（PRD §14.6 仍冻结；PF F4 未采纳）。

### Q4 昆虫板块范围边界 → **常见「小虫」并入昆虫板块**
- 蜘蛛 / 蜗牛 / 蚯蚓 / 蜈蚣等非严格昆虫的常见小动物**并入 `insect` 板块**（与 v2.0 试点口径一致），便于低龄用户按「小虫子」直觉认知；文档在此说明，供后续维护知悉。

### Q5 音频生成方式与格式 → **AAC `.m4a`，本机 `say` 预生成**
- 中文：`say -v Tingting -o <abs>-zh.m4a "<中文名>"`；英文：`say -v Samantha -o <abs>-en.m4a "<英文名>"`；落盘 `frontend/public/audio/`。
- 保证跨设备一致；**不回退**浏览器合成（沿用 v2.0 口径）。

### Q6 `sort` 取值 → **各板块内 11…30**
- 排序仍为 `sort ASC, id ASC`（后端既有实现，零改动）。

### Q7 受影响断言与用例编号 → **见 §五**
- E2E 板块总量断言「共 10 种」+ 10 卡 → 「共 30 种」+ 滚动加载至 30 卡；新增用例编号自 **TC-115** 起（Sprint 10 已用到 TC-114）。

## 三、角色问答记录（阶段 2）

### J ↔ PO
- **J-14 后端是否需改动？** → PO：**零改动**。导入校验的 `parts↔categories` 一致性、单键板块路径规则、`section` 查询、`sort` 排序均已覆盖新增条目；无需变更代码或契约。
- **J-15 缓存 key 是否新增？** → PO：否。导入脚本仍 `SCAN sh:*` 清缓存；`section`/`category` 缓存 key 规则不变。

### R ↔ PO
- **R-32 前端是否需改动？** → PO：**零改动**。板块导航、单图详情分支、音频播放、增量加载（首屏 16 + 步进 16）与「共 N 种」对 30 种板块天然成立。
- **R-33 内容 JSON 由谁产出？** → PO：由 R 按 §四清单与 §二口径批量产出，schema 与既有模板（如 `content/animals/dolphin.json`）完全一致。

### UI ↔ PO
- **UI-12 UI 规范是否需改动？** → PO：**零改动**。沿用既有单图卡片 / 详情版式 / 热区红线；新图片与既有同规格（1920×1920 方图）。
- **UI-13/UI-14 图片与音频产出？** → PO：UI 按 §二 Q3/Q5 口径产出 59 张图片（`bear.jpg` 已存在）与 120 个音频。

### QA ↔ PO
- **QA-26 受影响断言清单？** → PO：见 §五（板块总量类）。
- **QA-27 用例编号？** → PO：新增自 **TC-115**；TC-114 更新为「共 30 种」。
- **QA-28 回归范围？** → PO：PRD §16.5 验收 + §7/§9.4/§10.4/§11.4/§12.4/§13.5/§14.5/§15.5 全量；重点防植物计数、资产路径、排序稳定、增量加载。

## 四、新增内容清单（PO 出具）

### 动物板块（+20，`section:animal`，分类 `animal`，写实照片 `/images/animals/{id}.jpg`）
| sort | id | 中文 | 英文 |
|---|---|---|---|
| 11 | bear | 熊 | Bear |
| 12 | cat | 猫 | Cat |
| 13 | dog | 狗 | Dog |
| 14 | cow | 奶牛 | Cow |
| 15 | horse | 马 | Horse |
| 16 | pig | 猪 | Pig |
| 17 | sheep | 绵羊 | Sheep |
| 18 | goat | 山羊 | Goat |
| 19 | chicken | 鸡 | Chicken |
| 20 | duck | 鸭子 | Duck |
| 21 | owl | 猫头鹰 | Owl |
| 22 | fox | 狐狸 | Fox |
| 23 | deer | 鹿 | Deer |
| 24 | squirrel | 松鼠 | Squirrel |
| 25 | camel | 骆驼 | Camel |
| 26 | hippo | 河马 | Hippopotamus |
| 27 | kangaroo | 袋鼠 | Kangaroo |
| 28 | koala | 考拉 | Koala |
| 29 | wolf | 狼 | Wolf |
| 30 | whale | 鲸鱼 | Whale |

### 昆虫板块（+20，`section:insect`，分类 `insect`，写实照片 `/images/insects/{id}.jpg`）
| sort | id | 中文 | 英文 |
|---|---|---|---|
| 11 | moth | 飞蛾 | Moth |
| 12 | grasshopper | 蚱蜢 | Grasshopper |
| 13 | caterpillar | 毛毛虫 | Caterpillar |
| 14 | silkworm | 蚕 | Silkworm |
| 15 | wasp | 黄蜂 | Wasp |
| 16 | bumblebee | 熊蜂 | Bumblebee |
| 17 | stick-insect | 竹节虫 | Stick Insect |
| 18 | termite | 白蚁 | Termite |
| 19 | locust | 蝗虫 | Locust |
| 20 | damselfly | 豆娘 | Damselfly |
| 21 | fly | 苍蝇 | Fly |
| 22 | mosquito | 蚊子 | Mosquito |
| 23 | spider | 蜘蛛 | Spider |
| 24 | snail | 蜗牛 | Snail |
| 25 | earthworm | 蚯蚓 | Earthworm |
| 26 | centipede | 蜈蚣 | Centipede |
| 27 | aphid | 蚜虫 | Aphid |
| 28 | weevil | 象鼻虫 | Weevil |
| 29 | mayfly | 蜉蝣 | Mayfly |
| 30 | hornet | 大胡蜂 | Hornet |

### 恐龙板块（+20，`section:dinosaur`，分类 `dinosaur`，**完整骨架化石** `/images/dinosaurs/{id}.jpg`）
| sort | id | 中文 | 英文 |
|---|---|---|---|
| 11 | allosaurus | 异特龙 | Allosaurus |
| 12 | apatosaurus | 迷惑龙 | Apatosaurus |
| 13 | archaeopteryx | 始祖鸟 | Archaeopteryx |
| 14 | baryonyx | 重爪龙 | Baryonyx |
| 15 | carnotaurus | 食肉牛龙 | Carnotaurus |
| 16 | ceratosaurus | 角鼻龙 | Ceratosaurus |
| 17 | compsognathus | 美颌龙 | Compsognathus |
| 18 | deinonychus | 恐爪龙 | Deinonychus |
| 19 | dilophosaurus | 双脊龙 | Dilophosaurus |
| 20 | elasmosaurus | 薄片龙 | Elasmosaurus |
| 21 | gallimimus | 似鸡龙 | Gallimimus |
| 22 | iguanodon | 禽龙 | Iguanodon |
| 23 | maiasaura | 慈母龙 | Maiasaura |
| 24 | megalosaurus | 巨齿龙 | Megalosaurus |
| 25 | mosasaurus | 沧龙 | Mosasaurus |
| 26 | oviraptor | 窃蛋龙 | Oviraptor |
| 27 | pachycephalosaurus | 肿头龙 | Pachycephalosaurus |
| 28 | protoceratops | 原角龙 | Protoceratops |
| 29 | plateosaurus | 板龙 | Plateosaurus |
| 30 | styracosaurus | 戟龙 | Styracosaurus |

## 五、既有断言影响面清单（QA 逐条处理）

| # | 受影响项 | 现状 | 处理 |
|---|---|---|---|
| 1 | E2E TC-114「动物/昆虫/恐龙 各『共 10 种』且 10 卡」 | 板块 10 种 | 改「共 **30** 种」；用 `loadAllCards(page,30)` 滚动加载至 30 卡 |
| 2 | 语料校验输出（`total=130 animal=10 …`） | total=130 | 预期 `total=**190**`（animals/insects/dinosaurs 各 30）；植物三分类计数不变 |
| 3 | 导入幂等断言的 import_log 绝对值 | 2780 | 门禁按实际前值核对 **delta = +380 = 2×190**；Mongo 190 条目 / 6 分类 |
| 4 | 图片 / 音频资产计数 | 236 图（.jpg）/ 260 音频 | 预期 **296 图 / 380 音频** |
| 5 | 植物板块断言（100/53/100/53） | 不变 | **不受影响**（本迭代不触植物） |
| 6 | `sort ASC + id ASC` 排序断言 | 不变 | 不受影响；新增条目续排 11…30 自然满足 |

## 六、验收对照表（PRD §16.5 → Sprint 11 用例）

| PRD §16.5 | 验收点 | 主验方式 |
|---|---|---|
| 41 | 语料 total=190，四板块计数 100/30/30/30；条目 `categories` 与 `parts` 键一致 | 语料校验脚本 |
| 42 | 图片资产：animals/insects/dinosaurs 各 30 张；恐龙一律完整骨架化石 | 资产计数 + 抽查 |
| 43 | 音频资产：对全部 190 条目 zh/en 音频存在（380 个 `.m4a`） | 资产计数 + 导入校验 |
| 44 | 文案合规：description ≤80 且无拉丁字母；allusion.text ≤60、explain ≤50 | 脚本校验 |
| 45 | `?section=animal|insect|dinosaur` 各 30 条且顺序稳定；`/api/categories` 仍 6 条 | 后端集成 |
| 46 | 板块首屏 + 滚动增量加载至 30；「共 30 种」提示；单图详情与音频喇叭不回归 | E2E |
| 47 | 既有 v1.0~v2.1 验收全量不回归（植物 100/资产/排序/增量加载） | 全量回归 |

用例编号自主 **TC-115** 起（Sprint 10 已用到 TC-114）。

## 七、非目标（同 PRD §16.6）
- 任何后端 / 前端代码改动；接口契约 / 路由 / 路径规则改动。
- 板块扩容到 100（后续 Sprint）；板块内二级分类；用户可见排序控件。
- 恐龙写实复原图（§14.6 冻结）；手机端专项适配。
- 植物板块内容与资产改动。
