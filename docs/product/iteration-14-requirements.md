# 迭代需求文档 — Sprint 14（v2.5 内容扩容（二）：动物 / 昆虫 / 恐龙 各 30 → 50）

> 角色：【PO】整理并冻结；供 R / UI / QA 开工前对齐。
> 依据：`docs/product/PRD.md` §14 / §16 / §19；`docs/iterations/sprint-14.md`。
> 内容来源：AI 内容产线（`ai-content-pipeline`），仅改语料 / 图片 / 音频，**零代码改动**。

## 一、需求目标

在 v2.4（语料 190）基础上，将**动物 / 昆虫 / 恐龙**三个板块由**各 30 种**扩容至**各 50 种**（每板块 +20，共 +60），语料总数 190 → **250**。全部新增条目经 `scripts/import-plants.mjs` 导入通道落地，不改后端 / 前端代码、路由、接口契约与 schema。

## 二、冻结清单（60 个新增 id，`sort` 各板块续排 31…50）

### 2.1 动物板块（`content/animals/`，`categories:["animal"]`，`parts.animal`）

| sort | id | zh | pinyin | en | ipa |
|---|---|---|---|---|---|
| 31 | leopard | 豹 | bào | Leopard | /ˈlepəd/ |
| 32 | rhinoceros | 犀牛 | xī niú | Rhinoceros | /raɪˈnɒsərəs/ |
| 33 | gorilla | 大猩猩 | dà xīng xing | Gorilla | /ɡəˈrɪlə/ |
| 34 | chimpanzee | 黑猩猩 | hēi xīng xing | Chimpanzee | /ˌtʃɪmpænˈziː/ |
| 35 | crocodile | 鳄鱼 | è yú | Crocodile | /ˈkrɒkədaɪl/ |
| 36 | snake | 蛇 | shé | Snake | /sneɪk/ |
| 37 | turtle | 乌龟 | wū guī | Turtle | /ˈtɜːtl/ |
| 38 | frog | 青蛙 | qīng wā | Frog | /frɒɡ/ |
| 39 | shark | 鲨鱼 | shā yú | Shark | /ʃɑːk/ |
| 40 | seal | 海豹 | hǎi bào | Seal | /siːl/ |
| 41 | otter | 水獭 | shuǐ tǎ | Otter | /ˈɒtə/ |
| 42 | hedgehog | 刺猬 | cì wei | Hedgehog | /ˈhedʒhɒɡ/ |
| 43 | bat | 蝙蝠 | biān fú | Bat | /bæt/ |
| 44 | mouse | 老鼠 | lǎo shǔ | Mouse | /maʊs/ |
| 45 | hamster | 仓鼠 | cāng shǔ | Hamster | /ˈhæmstə/ |
| 46 | donkey | 驴 | lǘ | Donkey | /ˈdɒŋki/ |
| 47 | swan | 天鹅 | tiān é | Swan | /swɒn/ |
| 48 | eagle | 老鹰 | lǎo yīng | Eagle | /ˈiːɡl/ |
| 49 | peacock | 孔雀 | kǒng què | Peacock | /ˈpiːkɒk/ |
| 50 | ostrich | 鸵鸟 | tuó niǎo | Ostrich | /ˈɒstrɪtʃ/ |

### 2.2 昆虫板块（`content/insects/`，`categories:["insect"]`，`parts.insect`）

> 范围口径：沿用「常见小虫」（与 v2.0 / v2.2 一致，蜘蛛 / 蜗牛 / 蚯蚓 / 蜈蚣同类可并入）。

| sort | id | zh | pinyin | en | ipa |
|---|---|---|---|---|---|
| 31 | cockroach | 蟑螂 | zhāng láng | Cockroach | /ˈkɒkrəʊtʃ/ |
| 32 | scorpion | 蝎子 | xiē zi | Scorpion | /ˈskɔːpiən/ |
| 33 | millipede | 马陆 | mǎ lù | Millipede | /ˈmɪlɪpiːd/ |
| 34 | slug | 蛞蝓 | kuò yú | Slug | /slʌɡ/ |
| 35 | rhinoceros-beetle | 独角仙 | dú jiǎo xiān | Rhinoceros Beetle | /raɪˈnɒsərəs ˈbiːtl/ |
| 36 | stag-beetle | 锹甲虫 | qiāo jiǎ chóng | Stag Beetle | /stæɡ ˈbiːtl/ |
| 37 | dung-beetle | 屎壳郎 | shǐ ké làng | Dung Beetle | /dʌŋ ˈbiːtl/ |
| 38 | katydid | 纺织娘 | fǎng zhī niáng | Katydid | /ˈkeɪtɪdɪd/ |
| 39 | water-strider | 水黾 | shuǐ mǐn | Water Strider | /ˈwɔːtə ˈstraɪdə/ |
| 40 | woodlouse | 潮虫 | cháo chóng | Woodlouse | /ˈwʊdlaʊs/ |
| 41 | hermit-crab | 寄居蟹 | jì jū xiè | Hermit Crab | /ˈhɜːmɪt kræb/ |
| 42 | flea | 跳蚤 | tiào zǎo | Flea | /fliː/ |
| 43 | leech | 水蛭 | shuǐ zhì | Leech | /liːtʃ/ |
| 44 | antlion | 蚁狮 | yǐ shī | Antlion | /ˈæntlaɪən/ |
| 45 | silverfish | 衣鱼 | yī yú | Silverfish | /ˈsɪlvəfɪʃ/ |
| 46 | lacewing | 草蛉 | cǎo líng | Lacewing | /ˈleɪswɪŋ/ |
| 47 | leafhopper | 叶蝉 | yè chán | Leafhopper | /ˈliːfhɒpə/ |
| 48 | stink-bug | 椿象 | chūn xiàng | Stink Bug | /stɪŋk bʌɡ/ |
| 49 | diving-beetle | 龙虱 | lóng shī | Diving Beetle | /ˈdaɪvɪŋ ˈbiːtl/ |
| 50 | shrimp | 小虾 | xiǎo xiā | Shrimp | /ʃrɪmp/ |

### 2.3 恐龙板块（`content/dinosaurs/`，`categories:["dinosaur"]`，`parts.dinosaur`）

> 图片口径：**一律完整骨架化石**（§14.6 冻结，不做写实复原图）。

| sort | id | zh | pinyin | en | ipa |
|---|---|---|---|---|---|
| 31 | brontosaurus | 雷龙 | léi lóng | Brontosaurus | /ˌbrɒntəˈsɔːrəs/ |
| 32 | camarasaurus | 圆顶龙 | yuán dǐng lóng | Camarasaurus | /ˌkæmərəˈsɔːrəs/ |
| 33 | mamenchisaurus | 马门溪龙 | mǎ mén xī lóng | Mamenchisaurus | /mɑːˌmʌntʃiˈsɔːrəs/ |
| 34 | argentinosaurus | 阿根廷龙 | ā gēn tíng lóng | Argentinosaurus | /ˌɑːdʒənˌtiːnəˈsɔːrəs/ |
| 35 | amargasaurus | 阿马加龙 | ā mǎ jiā lóng | Amargasaurus | /əˌmɑːrɡəˈsɔːrəs/ |
| 36 | corythosaurus | 冠龙 | guān lóng | Corythosaurus | /kəˌrɪθəˈsɔːrəs/ |
| 37 | lambeosaurus | 兰伯龙 | lán bó lóng | Lambeosaurus | /ˌlæmbiəˈsɔːrəs/ |
| 38 | edmontosaurus | 埃德蒙顿龙 | āi dé méng dùn lóng | Edmontosaurus | /edˌmɒntəˈsɔːrəs/ |
| 39 | stegoceras | 剑角龙 | jiàn jiǎo lóng | Stegoceras | /stɛˈɡɒsərəs/ |
| 40 | centrosaurus | 尖角龙 | jiān jiǎo lóng | Centrosaurus | /ˌsentrəˈsɔːrəs/ |
| 41 | euoplocephalus | 包头龙 | bāo tóu lóng | Euoplocephalus | /juːˌɒpləˈsefələs/ |
| 42 | edmontonia | 埃德蒙顿甲龙 | āi dé méng dùn jiǎ lóng | Edmontonia | /ˌedmənˈtoʊniə/ |
| 43 | therizinosaurus | 镰刀龙 | lián dāo lóng | Therizinosaurus | /θəˌrɪzɪnəˈsɔːrəs/ |
| 44 | giganotosaurus | 南方巨兽龙 | nán fāng jù shòu lóng | Giganotosaurus | /ˌɡɪɡəˌnɒtəˈsɔːrəs/ |
| 45 | acrocanthosaurus | 高棘龙 | gāo jí lóng | Acrocanthosaurus | /ˌækrəˌkænθəˈsɔːrəs/ |
| 46 | utahraptor | 犹他盗龙 | yóu tā dào lóng | Utahraptor | /ˈjuːtɑːræptə/ |
| 47 | microraptor | 小盗龙 | xiǎo dào lóng | Microraptor | /ˈmaɪkrəʊræptə/ |
| 48 | troodon | 伤齿龙 | shāng chǐ lóng | Troodon | /ˈtroʊədɒn/ |
| 49 | plesiosaurus | 蛇颈龙 | shé jǐng lóng | Plesiosaurus | /ˌpliːziəˈsɔːrəs/ |
| 50 | pterodactyl | 翼手龙 | yì shǒu lóng | Pterodactyl | /ˌterəˈdæktɪl/ |

## 三、字段与文案口径（冻结）

1. **条目 schema**（与既有单键板块模板完全一致）：
   `{ id, categories:[<板块code>], sort, name{zh,pinyin,en,ipa,audioZh,audioEn}, parts:{ <板块code>{ name{zh,pinyin,en,ipa}, images:[{type:"photo",url}], description, allusion{text,explain} } } }`。
2. **命名路径规则**：图片 `type:"photo"`，url 固定 `/images/{animals|insects|dinosaurs}/{id}.jpg`；音频 `/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`（**必须实际存在**，否则导入校验 `existsSync` 报错）。
3. **`categories` 与 `parts` 键一致**：单键板块唯一键 = 分类 code（`animal`/`insect`/`dinosaur`）。
4. **文案红线**：`description` **≤80 字且不含拉丁字母**；`allusion.text` ≤60 字、`allusion.explain` ≤50 字；面向 3–6 岁低龄化、短句口语。
5. **`allusion.source`**：单键板块**可选**（沿用 §18 口径）；本迭代 60 条小知识均为常识型，**省略 `source`**。
6. **音频格式**：AAC `.m4a`，`say -v Tingting`（zh）/ `say -v Samantha`（en）预生成。

## 四、非目标

- 不改后端 / 前端代码、接口契约、路由、schema、样式。
- 不改植物板块内容与资产。
- 不做板块扩容到 100（后续 Sprint）；不做板块内二级分类；不做用户可见排序控件。
- 恐龙写实复原图须人工解冻 §14.6；手机端适配不在本次。

## 五、验收标准

见 `docs/iterations/sprint-14.md` §四（8 条 DoD）与 `docs/product/PRD.md` §19.5（增量验收 58~64）。

## 六、Q1~Q7 冻结口径（回应各角色提问）

| # | 问题 | 冻结口径 |
|---|---|---|
| Q1 | 新增 60 个 id、三语名、拼音、音标 | 见本文件 §二，拼音带声调、国际音标带 `/ /` |
| Q2 | 文案长度与低龄化 | `description` ≤80 且无拉丁字母；`allusion.text` ≤60、`explain` ≤50；`source` 可选 |
| Q3 | 恐龙图片口径 | **一律完整骨架化石**（§14.6 冻结） |
| Q4 | 昆虫板块范围边界 | 沿用「常见小虫」口径（蜘蛛/蜗牛/蚯蚓/蜈蚣同类可并入） |
| Q5 | 音频生成方式 | `say -v Tingting`(zh) / `say -v Samantha`(en) → AAC `.m4a` |
| Q6 | 新增条目 `sort` 取值 | 各板块续排 **31…50**（按 §二 清单顺序） |
| Q7 | 受影响断言与用例编号 | E2E 板块总量断言改「共 50 种」+ `loadAllCards(page,50)`；新增用例自 **TC-130** 起 |
