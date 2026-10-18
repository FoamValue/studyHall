# 迭代需求文档 — Sprint 16（v2.7 认知启蒙二：数字 0–20 + 颜色 11 色）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 16 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §20 增量 v2.6（US-24 / US-25），验收条目 65~75 |
| 冻结人 | PO（2026-10-18） |
| 状态 | 已冻结，允许阶段 3 开工 |
| 上游 | [sprint-16.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-16.md) |

## 一、口径冻结（Q&A）

本迭代为「认知启蒙二」，承接 Sprint 15 已建成的两大组 8 板块底座，补齐 **数字** 与 **颜色** 两板块内容。全部 32 条内容**保留中文名 / 拼音 / 英文名 / 音标**（与字母 / 拼音「仅符号」不同）。

| 编号 | 事项 | 冻结口径（结论） |
|---|---|---|
| Q1 | 数字范围与序 | **0…20 共 21 条**，`sort` = 数值本身（**0…20** 升序） |
| Q2 | 数字命名 | 保留 `name.zh`（中文数字）/ `pinyin` / `en`（英文数词）/ `ipa`；主标题显示中文数字 |
| Q3 | 颜色集合与序 | Berlin & Kay 11 基础色，**按黑→白→红→绿→黄→蓝→棕→紫→粉→橙→灰** 常见序，`sort` 1…11 |
| Q4 | 颜色命名 | `name.zh` = 「…色」（如「红色」）/ `pinyin` / `en`（如 Red）/ `ipa` |
| Q5 | 内容模型 | 单键 `parts.number` / `parts.color`，**无部位切换**（与动物/昆虫/恐龙/字母/拼音一致） |
| Q6 | 小知识 | 每板块每条 **`allusion` 必填**（`text` ≤60、`explain` ≤50，`source` 可选）；数字用字形联想，11~20 用「十」的成组联想 |
| Q7 | 文案红线 | `description` / `allusion` 沿用**「无拉丁字母」**红线（阿拉伯数字字符不算拉丁字母，允许出现在数字板块文案中） |
| Q8 | 图片 | 每条 1 张 **1600×1600 渐进式 `.jpg`**；数字 = 白底 + **大号数字 + 点数**；颜色 = 白底 + **居中大圆角纯色块**；路径 `/images/numbers/{id}.jpg`、`/images/colors/{id}.jpg` |
| Q9 | 音频 | 数字 / 颜色 **zh + en 各一**（`/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`），`say -v Tingting`(zh) / `Samantha`(en) → `afconvert` AAC `.m4a` |
| Q10 | 分类 | `categories.json` 追加 `number`（order 9）/ `color`（order 10），分类 **8 → 10** |
| Q11 | 导入通道 | 沿用 `scripts/import-plants.mjs`，泛化 `VALID_PARTS` / `VALID_SECTIONS` / `CONTENT_DIRS`；`GLYPH_SECTIONS` 维持 `["letter","pinyin"]`（number/color **不**豁免三语校验） |
| Q12 | 非目标 | 不做数字加减运算、不做颜色混色教学；不改自然认知四板块；不做手机端专项 |

## 二、内容清单 — 数字板块（section=`number`，21 条）

| id | sort | 中文名 | 拼音 | 英文名 | 音标 |
|---|---|---|---|---|---|
| number-0 | 0 | 零 | líng | Zero | /ˈzɪərəʊ/ |
| number-1 | 1 | 一 | yī | One | /wʌn/ |
| number-2 | 2 | 二 | èr | Two | /tuː/ |
| number-3 | 3 | 三 | sān | Three | /θriː/ |
| number-4 | 4 | 四 | sì | Four | /fɔː(r)/ |
| number-5 | 5 | 五 | wǔ | Five | /faɪv/ |
| number-6 | 6 | 六 | liù | Six | /sɪks/ |
| number-7 | 7 | 七 | qī | Seven | /ˈsevn/ |
| number-8 | 8 | 八 | bā | Eight | /eɪt/ |
| number-9 | 9 | 九 | jiǔ | Nine | /naɪn/ |
| number-10 | 10 | 十 | shí | Ten | /ten/ |
| number-11 | 11 | 十一 | shí yī | Eleven | /ɪˈlevn/ |
| number-12 | 12 | 十二 | shí èr | Twelve | /twelv/ |
| number-13 | 13 | 十三 | shí sān | Thirteen | /ˌθɜːˈtiːn/ |
| number-14 | 14 | 十四 | shí sì | Fourteen | /ˌfɔːˈtiːn/ |
| number-15 | 15 | 十五 | shí wǔ | Fifteen | /ˌfɪfˈtiːn/ |
| number-16 | 16 | 十六 | shí liù | Sixteen | /ˌsɪksˈtiːn/ |
| number-17 | 17 | 十七 | shí qī | Seventeen | /ˌsevnˈtiːn/ |
| number-18 | 18 | 十八 | shí bā | Eighteen | /ˌeɪˈtiːn/ |
| number-19 | 19 | 十九 | shí jiǔ | Nineteen | /ˌnaɪnˈtiːn/ |
| number-20 | 20 | 二十 | èr shí | Twenty | /ˈtwenti/ |

- **description 模板**：≥1 条，低龄化中文、无拉丁字母。0 = 「一个圆点也没有，就是零。」；1~20 = 「数一数，这里有 N 个小圆点，就是{中文名}。」（N = 数值）。
- **allusion**（小知识，字形/成组联想）：
  - 0「零，像一枚圆圆的鸡蛋。」/「什么都没有，就是零。」
  - 1「一，像一根直直的铅笔。」/「一表示只有一个。」
  - 2「二，像一只昂头的小鸭子。」/「二表示两个。」
  - 3「三，像一只在听声音的耳朵。」/「三表示三个。」
  - 4「四，像一面迎风的小旗子。」/「四表示四个。」
  - 5「五，像一把弯弯的秤钩。」/「五表示五个。」
  - 6「六，像一只响亮的哨子。」/「六表示六个。」
  - 7「七，像一把弯弯的镰刀。」/「七表示七个。」
  - 8「八，像一只可爱的葫芦。」/「八表示八个。」
  - 9「九，像一只飘起的气球。」/「九表示九个。」
  - 10「十，像一根筷子加一枚鸡蛋。」/「十个手指正好数完。」
  - 11~19「十再往下数 K 个，就是{中文名}。」/「两只手数完十，再接着数。」（K = 数值 − 10）
  - 20「两个十合在一起，就是二十。」/「二十是整整齐齐的两排十。」

## 三、内容清单 — 颜色板块（section=`color`，11 条）

| id | sort | 中文名 | 拼音 | 英文名 | 音标 |
|---|---|---|---|---|---|
| color-black | 1 | 黑色 | hēi sè | Black | /blæk/ |
| color-white | 2 | 白色 | bái sè | White | /waɪt/ |
| color-red | 3 | 红色 | hóng sè | Red | /red/ |
| color-green | 4 | 绿色 | lǜ sè | Green | /ɡriːn/ |
| color-yellow | 5 | 黄色 | huáng sè | Yellow | /ˈjeləʊ/ |
| color-blue | 6 | 蓝色 | lán sè | Blue | /bluː/ |
| color-brown | 7 | 棕色 | zōng sè | Brown | /braʊn/ |
| color-purple | 8 | 紫色 | zǐ sè | Purple | /ˈpɜːpl/ |
| color-pink | 9 | 粉色 | fěn sè | Pink | /pɪŋk/ |
| color-orange | 10 | 橙色 | chéng sè | Orange | /ˈɒrəndʒ/ |
| color-grey | 11 | 灰色 | huī sè | Grey | /ɡreɪ/ |

- **description / allusion**（低龄化中文、无拉丁字母）：
  - 黑色「黑夜是黑色的。」/「夜里天黑了，就是黑色。」
  - 白色「白云是白色的。」/「天上的白云是白色的。」
  - 红色「红红的苹果是红色。」/「红灯亮了要停下来。」
  - 绿色「小草和树叶是绿色。」/「春天的小草是绿色的。」
  - 黄色「香蕉和太阳是黄色。」/「弯弯的香蕉是黄色的。」
  - 蓝色「天空和大海是蓝色。」/「抬头看，天空是蓝色的。」
  - 棕色「树干和小熊是棕色。」/「小树的树干是棕色的。」
  - 紫色「葡萄是紫色。」/「一串串的葡萄是紫色的。」
  - 粉色「桃花和小猪是粉色。」/「粉粉的桃花真好看。」
  - 橙色「橘子是橙色。」/「圆圆的橘子是橙色的。」
  - 灰色「大象和小石头是灰色。」/「大象的皮肤是灰色的。」

> 颜色卡为「纯色块」：**white 卡块需加极浅灰描边**以在白色卡底上可辨（UI-20 规范）。

## 四、接口与资产契约

| 项 | 契约 |
|---|---|
| `GET /api/plants?section=number` | 返回 **21** 条，顺序 `sort ASC + id ASC`，首 `number-0` 末 `number-20` |
| `GET /api/plants?section=color` | 返回 **11** 条，顺序 `sort ASC + id ASC`，首 `color-black` 末 `color-grey` |
| `GET /api/categories` | 返回 **10** 条，新增 `number`（数字，section number，order 9）/ `color`（颜色，section color，order 10） |
| 图片 | `/images/numbers/{id}.jpg`（21）、`/images/colors/{id}.jpg`（11），均 1600×1600 渐进式 |
| 音频 | `/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`（数字 42 个 + 颜色 22 个 = 64 个） |

## 五、验收标准

见 [sprint-16.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-16.md) §四（定义 1~10），并对应 PRD §20.6 验收 65~75。

## 六、未决 / 待确认

无（口径全部冻结，人工已于 2026-10-18 澄清）。
