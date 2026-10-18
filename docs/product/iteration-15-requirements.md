# 迭代需求文档 — Sprint 15（v2.6 认知启蒙一：底座升级 + 英文字母 A–Z + 汉语拼音 a–z）

| 项 | 内容 |
|---|---|
| 作者 | PO |
| 日期 | 2026-10-18 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §20 增量 v2.6（US-21~US-25，验收 65~75）、[sprint-15.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-15.md) |
| 状态 | **冻结**（2026-10-18 人工「好的，执行吧」授权；本迭代为**能力迭代**，非纯内容） |
| 范围 | 底座升级（更名 + 两大组导航 + 后端 section/part 泛化 + 导入校验泛化 + 前端启蒙板块适配） + 首批两板块内容：英文字母 A–Z 26 + 汉语拼音 a–z 26 |

## 一、需求基线（来源与冻结决策）

- 人工口径（2026-10-18 原话）：「新需求添加颜色、数字、中文字母、英文字母」→「认知启蒙，产品定位升级，分迭代做；汉语拼音；按英文最多的颜色；数字到 100；英文字母大小写同卡」→「数字从 0 到 20；拼音 26 个字母，按顺序；产品名修改认知小图鉴；拼音、字母不分中英文名，这部分省略」。
- 交付方式：**分迭代**。**Sprint 15 = 底座升级 + 英文字母 + 汉语拼音**；Sprint 16 = 数字 0–20 + 颜色 11 色。
- 本迭代**不改**「自然认知」四板块内容与资产（植物 100 / 动物 50 / 昆虫 50 / 恐龙 50 不变）。

## 二、冻结口径（Q1~Q8，PO 裁决）

### Q1 产品更名与导航分组 → **「认知小图鉴」/ Cognitive Guide；两大组 8 板块**
- 站点三行标题：拼音 `rèn zhī xiǎo tú jiàn` / 中文 `认知小图鉴` / 英文 `Cognitive Guide`；`<title>` 同步为「认知小图鉴 Cognitive Guide」。
- 首页板块导航分**两组**：`自然认知`（plant/animal/insect/dinosaur）+ `认知启蒙`（letter/pinyin/number/color），共 **8 板块**（number/color 本迭代仅占位不落内容，Sprint 16 落内容）。
- 分组标题文案：`自然认知`、`认知启蒙`；二级分类筛选**仅植物板块**保留（全部/花朵/树叶/果实 4 钮，不变）。

### Q2 英文字母板块（section=`letter`）→ **26 条 A–Z，大小写同卡**
- id 命名：`letter-a` … `letter-z`（前缀避免与拼音 id 冲突）；`sort` 1…26 按 A→Z。
- 主标题（`name.zh`）= 符号本身**大小写同卡**：`Aa` … `Zz`。
- **省略** `name.pinyin` / `name.en` / `name.ipa`（按人工口径「不分中英文名，省略」）。
- 音频：**en 单语** `/audio/letter-{x}-en.m4a`（读字母名，如 A /eɪ/）；**无** `audioZh`。
- 图片：`/images/letters/letter-{x}.jpg`（大小写字形卡）。

### Q3 汉语拼音板块（section=`pinyin`）→ **26 条 a–z，按序**
- id 命名：`pinyin-a` … `pinyin-z`；`sort` 1…26 按 a→z。
- 主标题 = 符号本身**小写**：`a` … `z`。
- **省略** `name.pinyin` / `name.en` / `name.ipa`。
- 音频：**zh 单语** `/audio/pinyin-{x}-zh.m4a`；**无** `audioEn`。
- 图片：`/images/pinyin/pinyin-{x}.jpg`（字形卡）。

### Q4 内容模型（单图 + 小知识）
- `parts` 单键 = 板块 section code：字母条目 `parts.letter`、拼音条目 `parts.pinyin`。
- `parts.<key>.name.zh` = 与主标题相同的符号（如 `Aa` / `a`）；`name.pinyin/en/ipa` 同省略。
- `images`：仅 1 张，`type="photo"`（走图片存在性校验），`url` 见 Q2/Q3。
- `description`：低龄化一句话（**允许含拉丁字母**，见 Q6）。
- `allusion`（小知识）：**每条均需一条**（联想/常识型），`text` ≤60、`explain` ≤50；**不填 `source`**（无古典出处）。

### Q5 音频资产口径
- 字母 = 英文读音**单语**；拼音 = 汉语读音**单语**；沿用 `say -v Tingting`(zh) / `Samantha`(en) → `afconvert -f m4af -d aac@22050 -b 32000 -r 22050` 输出 AAC `.m4a`。
- 字母 / 拼音**各 26 个**音频（合计 **+52**）；缺失则导入校验报错。

### Q6 文案红线豁免 → **仅 letter/pinyin 的 `description` 豁免「无拉丁字母」**
- 字母 / 拼音条目本体即拉丁字母，其 `description` 与符号含拉丁字母属**豁免**范围。
- 其余板块 `description`（≤80 字、无拉丁字母）与全部 `allusion`（≤60/≤50、无拉丁字母）红线**不变**。

### Q7 名称展示（前端渲染分支）
- 卡片：`name.zh` 主标题恒显示；`name.pinyin` / `name.en` **字段缺失时不渲染该行**（避免空白行）。
- 详情头：`.detail-pinyin` 缺失不渲染；`.detail-en` / `.detail-ipa` 缺失不渲染。
- 音频喇叭：按**实际存在的音频字段**渲染（字母仅英文喇叭 1 个、拼音仅中文喇叭 1 个、数字/颜色 Sprint 16 双语）。

### Q8 返回按钮文案与导航标签 → **新增两板块纳入派生映射**
- `SECTION_HOME` 新增：`letter` → `字母乐园`、`pinyin` → `拼音角`；（Sprint 16 预留 `number` → `数字屋`、`color` → `颜色屋`）。
- 板块导航挂载标签：`英文字母`、`汉语拼音`（与分类 `nameZh` 一致）。

## 三、功能明细（按范围项）

| 范围项 | 明细 |
|---|---|
| S15-1 更名 + 两大组导航 | `HomePage.jsx` 标题三行更名；`index.html` `<title>`；`SectionNav.jsx` 改为两组渲染（组标题 + 组内板块按钮）；README 同步 |
| S15-2 后端 section/part 泛化 | `PlantService.PART_ORDER` 扩键 `letter/pinyin/number/color`；`getPlants` 错误文案更新（覆盖新分类）；section 校验本为数据驱动随新分类自动生效 |
| S15-3 导入校验泛化 | `scripts/import-plants.mjs`：`VALID_PARTS`/`VALID_SECTIONS` 扩 4 键；新增 `content/letters`、`content/pinyin` 子目录；`SINGLE_KEY_IMAGE_DIR` 增 letter→letters / pinyin→pinyin / number→numbers / color→colors；**允许省略** `name.pinyin/en/ipa`（仅 letter/pinyin 板块）；letter/pinyin `description` 拉丁字母豁免；音频存在性校验按板块字段 |
| S15-4 英文字母内容 | 26 条 `content/letters/*.json`（Q2） |
| S15-5 汉语拼音内容 | 26 条 `content/pinyin/*.json`（Q3） |
| S15-6 资产 | 52 图（1600×1600 渐进式 `.jpg`）+ 52 音频 `.m4a` |
| S15-7 前端适配 | `PlantDetailPage.jsx`：`SINGLE_IMAGE_KEYS` 增 letter/pinyin；`SECTION_HOME` 增键；名称行条件渲染；喇叭按可用字段渲染。`PlantCard.jsx`：拼音/英文行条件渲染 |
| S15-8 断言与用例 | 后端 TC-02/TC-11/TC-24 适配新板块；前端 TC-79/TC-80a 更名与 8 板块；E2E TC-89/TC-90 更名与分组；新增 **TC-134** 起 |
| S15-9 门禁 | 六步全绿后放行、commit（不 push） |

## 四、验收标准（同 PRD §20.6 第 65~75，本迭代主验 65~68/71/73/74）

65. 产品名与导航：《认知小图鉴》；两组 8 板块；植物二级筛选仍 4 钮。
66. 语料校验：`letter=26 / pinyin=26`（本迭代）；总数 **302**；分类 **8**；`flower=53 leaf=100 fruit=53` 不变。（number=21/color=11 与总数 334 属 Sprint 16）
67. 英文字母：A–Z 26，大小写同卡（Aa…Zz），`sort` 1…26；无拼音/英文名/音标。
68. 汉语拼音：a–z 26 按序，`sort` 1…26；无拼音/英文名/音标。
71. 资产：各 26 图（1600×1600 `.jpg`，`.jpg` 合计 **408**）；字母 `-en` 单语、拼音 `-zh` 单语（`.m4a` 合计 **552**）；缺失即导入报错。
72. 接口契约：`?section=letter|pinyin` 各 26，顺序 `sort ASC + id ASC`；`/api/categories` 返回 **8**；未知板块仍 `code=40002`。
73. 前端行为：8 板块导航切换正确；字母/拼音单图详情（无部位切换）；名称仅符号本身；喇叭按可用音频渲染；「共 26 种」；返回按钮文案随板块派生。
74. 小知识：字母/拼音各条目 `allusion` 非空、`text` ≤60、`explain` ≤50。
75. 既有 v1.0~v2.5 验收项不回归；三层测试全绿。

## 五、风险与约束（承接 sprint-15 §五）
- `PART_ORDER` 硬编码 → 必须扩键，否则 `partCodes` 返回空、单图逻辑失效。
- `name.pinyin/en/ipa` 省略与既有必填校验/渲染分支冲突 → 后端断言（TC-11）与前端渲染均须按 Q7 兼容。
- 更名牵动 `index.html`/`HomePage`/`README`/`AGENTS`/前端 2 测试/E2E TC-89 → 全量 grep 同步。
- 新图片须 `docker compose up -d --build` 才进 nginx。
- 分类 6 → 8，`plantCategories` 过滤须继续只出植物 4 钮。
