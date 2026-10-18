# Sprint 16 — v2.7 认知启蒙（二）：数字 0–20 + 颜色 11 色

| 项 | 内容 |
|---|---|
| 迭代目标 | 承接 Sprint 15 已建成的「认知小图鉴」两大组 8 板块底座，交付**认知启蒙组余下两个板块**——**数字 0–20（21 条）** 与 **颜色 11 色（11 条）**，把认知启蒙四板块（字母 / 拼音 / 数字 / 颜色）内容补齐，达成 PRD §20 增量 v2.6 的完整验收（语料 **302 → 334**、分类 **8 → 10**）。本迭代为**内容产线为主 + 配置/测试适配**，产品代码近乎零改动。 |
| 状态 | ✅ 已完成（2026-10-18 门禁全绿、QA 放行、Master commit） |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §20 增量 v2.6（US-24/US-25，验收 65~75）；迭代口径冻结于 `iteration-16-requirements.md` |
| 类型 | **内容产线 + 轻量配置/测试适配**（后端产品代码零改动、前端产品代码零改动） |
| 内容基线（Sprint 15 交付后） | 语料 **302**（plant100 / animal50 / insect50 / dinosaur50 / letter26 / pinyin26）、分类 **8**、图片 **408** `.jpg`、音频 **552** `.m4a`、import_log 基线 **6284** |
| 交付后基线 | 语料 **334**（+number 21 +color 11）、分类 **10**（+number/color）、图片 **440**（+32）、音频 **616**（+64：数字 zh/en 42 + 颜色 zh/en 22） |

## 一、迭代范围（Scope）

| 编号 | 范围项 | 对应 PRD | 说明 | 风险级 |
|---|---|---|---|---|
| S16-1 | **数字板块内容 0–20（21 条）** | §20.4.4 | `content/numbers/*.json` 共 21 个（`number-0` … `number-20`），单键 `parts.number`，`sort` **0…20** 升序；**保留** `name.zh / pinyin / en / ipa`（如 1「一 / yī / One / /wʌn/」）；`allusion` 必填；1 图 + zh/en 双语音频 | 中 |
| S16-2 | **颜色板块内容 11 色（11 条）** | §20.4.5 | `content/colors/*.json` 共 11 个（`color-{black,white,red,green,yellow,blue,brown,purple,pink,orange,grey}`），单键 `parts.color`，`sort` 按基础色常见序 **1…11**；**保留** 中文名/拼音/英文名/音标（如 red「红 / hóng / Red / /red/」）；`allusion` 必填；1 图 + zh/en 双语音频 | 中 |
| S16-3 | **分类新增 number / color（→10）** | §20.4.1 | `content/categories.json` 追加 `number`（order 9，section `number`）与 `color`（order 10，section `color`）；分类由 **8 → 10** | 低 |
| S16-4 | **导入校验 schema 泛化** | §20.4.6 | `scripts/import-plants.mjs`：`VALID_PARTS` / `VALID_SECTIONS` 追加 `number/color`；`CONTENT_DIRS` 追加 `numbers` / `colors`（`SINGLE_KEY_IMAGE_DIR` 已于 Sprint 15 预留） | 中 |
| S16-5 | **资产：32 图 + 64 音频** | §20.4.7/§20.4.8 | 数字卡 = 白底 + **大号数字 + 点数**；颜色卡 = **纯色块卡**；均 1600×1600 渐进式 `.jpg`（`cjpeg -quality 82 -progressive`）→ `/images/numbers/{id}.jpg`、`/images/colors/{id}.jpg`；音频 `/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`（`say -v Tingting`(zh) / `Samantha`(en) → `afconvert` AAC） | 中 |
| S16-6 | **后端测试适配** | §20.6 | `ContentSeed.PLANT_DIRS` 追加 `numbers`/`colors`；`PlantApiIntegrationTest`：section 白名单断言追加 `number/color`、分类数断言 8 → **10**、新增数字/颜色板块用例；**后端产品代码零改动** | 中 |
| S16-7 | **前端与既有断言适配** | §20.6 | 前端产品代码零改动（Sprint 15 已泛化 `SECTIONS` / `SINGLE_IMAGE_KEYS` / `PART_ORDER` / `SECTION_HOME`）；清理 `SectionNav.jsx` 过期注释；E2E 受影响断言复核（导航仍 8 钮不变）+ 新增数字/颜色用例 | 低 |
| S16-8 | **全量门禁与放行** | §20.6 | 六步门禁全绿（语料 total=**334** / 分类 **10** / 图片 **440** / 音频 **616**；后端 `mvn test` 退出码 0；前端 `vitest`/`vite build` 通过；compose 健康；两次导入幂等 delta **+668 = 2×334**、Mongo 334/10、`redis sh:*`=0；E2E 全通过）→ QA 放行 → Master commit（**不 push**） | 高 |

**不在本迭代范围**：数字的加减运算、颜色的混色教学；拼音「声母/韵母/整体认读」细分；汉字认字 / 笔画；「自然认知」四板块内容与资产改动；手机端专项适配；新后台；PF 阶段 5 四次回流（另立）。

## 二、总体路线图（Master）

| Sprint | 目标 | 状态 |
|---|---|---|
| Sprint 1~15 | v1.0 冻结 → v2.0 自然认知四板块 → v2.1~v2.3 PF 回流 → v2.2/v2.5 内容扩容 → v2.4 内容产线 → v2.6 更名 + 两大组导航 + 字母/拼音 | ✅ |
| **Sprint 16（本次）** | **v2.7 认知启蒙（二）：数字 0–20 + 颜色 11 色** | ✅ |
| 后续 | PF 阶段 5 四次回流；自然认知续扩（各 → ≤100） | ⏳ |

## 三、任务拆解

| 编号 | 任务 | 角色 |
|---|---|---|
| **_阶段 2：迭代准备（文档先行）_** | | |
| PO-16 | 《迭代需求文档》`docs/product/iteration-16-requirements.md`（冻结 32 条 id/命名/拼音/英标/排序/文案口径、数字含中文名与音标、颜色基础 11 色序、音频双语口径、验收标准） | PO |
| J-18 | 后端《开发设计文章》增量：确认 `PART_ORDER` 已含 number/color（零改动）、section 数据驱动、测试种子与断言适配 | J |
| R-39 | 前端《开发设计文章》增量：确认 `SECTIONS`/`SINGLE_IMAGE_KEYS`/`PART_ORDER`/`SECTION_HOME` 已覆盖 number/color（零改动），复核名称渲染分支对「保留中英文名」板块的表现 | R |
| UI-20 | UI 规范增量：数字卡（大号数字+点数）、颜色卡（纯色块）资产规范与命名 | UI |
| QA-35 | 《迭代测试用例手册》`docs/qa/sprint-16-test-cases.md`（编号接 TC-147，自 **TC-148** 起）+ 受影响断言清单 | QA |
| **_阶段 3：开发推进_** | | |
| R-40 | 内容生产：21 个数字 JSON + 11 个颜色 JSON（含 allusion），`sort` / 路径 / 音频字段按冻结口径 | R |
| UI-21 | 生成 32 张卡图片（1600×1600 渐进式 jpg）+ 64 个预生成音频 `.m4a` | UI |
| J-19 | `scripts/import-plants.mjs` 泛化（VALID_PARTS / VALID_SECTIONS / CONTENT_DIRS）+ `content/categories.json` 追加 number/color | J |
| **_阶段 4：完成门禁_** | | |
| QA-36 | 后端测试适配（ContentSeed 目录、section 白名单、分类数 10、新板块用例）+ E2E 新增数字/颜色用例 + 受影响断言复核 | QA |
| QA-37 | 全量回归与放行：语料校验（total=334 / 分类 10 / number=21 / color=11 / 图片 440 / 音频 616）+ 后端 `mvn test` + 前端 `vitest`/`vite build` + `docker compose up -d --build` 健康 + 两次导入幂等（import_log delta +668 = 2×334、Mongo 334/10、`redis sh:*`=0）+ `npx playwright test`，全绿后放行 | QA |

## 四、验收标准（Sprint 16 Definition of Done）

1. 语料校验：`number=21`、`color=11`，总数 **334**；分类 **10**（新增 number/color）；`plant100 / animal50 / insect50 / dinosaur50 / letter26 / pinyin26 / flower53 / leaf100 / fruit53` 不变。
2. 数字板块：**0…20 共 21** 条，`sort` **0…20** 升序，**保留** 中文名 / 拼音 / 英文名 / 音标；`parts.number` 单键。
3. 颜色板块：**11** 条英文基础色（black/white/red/green/yellow/blue/brown/purple/pink/orange/grey），`sort` 按基础色常见序，**保留** 中文名 / 拼音 / 英文名 / 音标；`parts.color` 单键。
4. 图片资产：数字 / 颜色各 21 / 11 张 1600×1600 渐进式 `.jpg`；`.jpg` 合计 **440**（数字 21 + 颜色 11 = +32）；命名/路径 `/images/numbers/{id}.jpg`、`/images/colors/{id}.jpg`。
5. 音频资产：数字 `-zh`/`-en` 各 21、颜色 `-zh`/`-en` 各 11；`.m4a` 合计 **616**（+64）。
6. 文案合规：数字 / 颜色 `description` 与 `allusion` 沿用「无拉丁字母」红线；`allusion` 非空且 `text` ≤60、`explain` ≤50；`source` 可选。
7. 接口契约：`/api/plants?section=number|color` 各返回 **21 / 11** 条，顺序 = `sort ASC + id ASC`；`/api/categories` 返回 **10** 条；未知板块仍 `code=40002`。
8. 前端行为：8 板块导航切换正确（数量不变）；数字 / 颜色为**单图详情（无部位切换）**；名称区**渲染中文名 + 拼音 + 英文名 + 音标**（与字母/拼音的「仅符号」不同）；音频喇叭**中英各一**渲染；「共 N 种」= 共 21 / 11 种；返回按钮文案随板块派生（「← 回数字屋 / ← 回颜色屋」）。
9. 既有 v1.0~v2.6 全部验收项（§7…§20.6 65~75）**不回归**；三层测试全绿。
10. 门禁全绿：后端 `mvn test` 退出码 0；前端 `vitest run` 全通过、`vite build` 退出码 0；compose 重建健康 `UP`；两次导入幂等（import_log 基线 6284 → 门禁窗口 delta **+668 = 2×334**；Mongo **334 条目 / 10 分类**；`redis sh:*`=0）；`npx playwright test` 全通过；全绿后放行、commit（不 push）。

## 五、风险与依赖

| 风险 / 依赖 | 影响 | 应对 |
|---|---|---|
| 数字/颜色**保留** `name.pinyin/en/ipa`，而导入脚本对 `GLYPH_SECTIONS`（letter/pinyin）才豁免 → 若误把 number/color 归入字形板块将放行缺失字段 | 详情渲染缺行、验收不符 | 明确 `GLYPH_SECTIONS` 维持 `["letter","pinyin"]` 不变；number/color 走**完整三语**校验 |
| 数字 `sort` 从 **0** 起（非 1），既有 `sort` 校验只要求整数 | 排序错乱 | 冻结 `sort` = 数值本身 0…20；QA 断言首 `number-0` 末 `number-20` |
| 数字/颜色图片为**确定性排版卡**（白底字形/色块），非 AI 插画 | 风格不一致 | UI-20 出规范：与字母/拼音卡同底色口径；数字卡=大号数字+点数、颜色卡=纯色块；`cjpeg -quality 82 -progressive` 统一编码 |
| 颜色卡「纯色块」与白色（white）可能白底白块不可辨 | 视觉歧义 | 颜色卡改为「白底 + 居中大圆角色块」；white 块加极浅灰描边以在浅底可辨 |
| 分类 8 → 10，`HomePage.plantCategories` 须继续仅植物 4 钮 | 植物筛选误渲染 | 该过滤按 `section==='plant'` 恒成立；QA-36 断言仍 4 钮 |
| 新图片需重建 frontend 镜像才被 nginx 提供 | 图片 404、E2E 红 | 门禁第 3 步 `docker compose up -d --build` |

## 六、评审与回顾（迭代完成后回填）

**交付摘要**：Sprint 16（v2.7 认知启蒙二）已完整交付，范围 S16-1~S16-8 全部落地（**内容产线为主 + 配置/测试适配**，前后端产品代码零改动）——① 数字板块 `content/numbers/*.json` **21** 条（`number-0`…`number-20`，单键 `parts.number`，`sort` **0…20** 升序，**保留** 中文名/拼音/英文名/音标，如 1「一 / yī / One / /wʌn/」）；② 颜色板块 `content/colors/*.json` **11** 条（black/white/red/green/yellow/blue/brown/purple/pink/orange/grey，单键 `parts.color`，`sort` 按基础色常见序 **1…11**，**保留** 完整三语+音标）；③ `content/categories.json` 追加 `number`（order 9）、`color`（order 10），分类 **8 → 10**；④ `scripts/import-plants.mjs` 泛化（`VALID_PARTS`/`VALID_SECTIONS`/`CONTENT_DIRS` 追加 number/color，`GLYPH_SECTIONS` 维持 `["letter","pinyin"]`，number/color 走完整三语校验）；⑤ 资产：数字 21 图（白底 + 大号数字 + 点数）+ 颜色 11 图（纯色块，white 加浅灰描边）共 **32** 张 1600×1600 渐进式 `.jpg`，预生成音频 **64** 个 `.m4a`（数字 zh/en 42 + 颜色 zh/en 22）；⑥ 后端测试适配（`ContentSeed.PLANT_DIRS` 扩目录、section 白名单/分类数断言更新、新增 TC-156/157/158）；⑦ 前端零改动，仅清理 `SectionNav.jsx` 过期注释，新增前端 TC-159/160 与 `e2e/sprint16.spec.js`（TC-148~TC-155）。

**门禁证据（2026-10-18，六步全绿）**：
- 第 0 步语料/资产校验：`categories=10`、`counts={plants:100,animals:50,insects:50,dinosaurs:50,letters:26,pinyin:26,numbers:21,colors:11}`、`TOTAL=334`、`flower=53 leaf=100 fruit=53`、`jpg=440`、`m4a=616`，EXIT=0。
- 第 1 步后端 `mvn test` 退出码 0（surefire **27** 用例 = 既有 24 + TC-156/157/158，0 失败/0 错误/0 跳过）。
- 第 2 步前端 `npx vitest run` **78/78**（新增 TC-159/160）、`vite build` 退出码 0。
- 第 3 步 `docker compose up -d --build` 重建后 `/api/health=UP`；两次导入各 **334** 条（`import_log` 基线 6284 → **6952**，门禁窗口 delta **+668 = 2×334**；Mongo **334 条目 / 10 分类**；导入后 `redis sh:*` = 0）。
- 第 4 步 `npx playwright test` **73/73**（既有 65 + TC-148~TC-155）。
- API 计数：all=334 / flower=53 / leaf=100 / fruit=53 / plant=100 / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / **number=21** / **color=11**；categories=10。

**缺陷与流程**：**无功能缺陷、无流程缺陷**，一次全绿。说明（非缺陷）：资产生成脚本的体积极小阈值沿用照片图标准，5 张纯色/单字形卡天然低于阈值被标 FAIL，经核验 32 张全为 1600×1600 渐进式 JPEG、md5 全唯一，文件合规。

**遗留待人工抽验**：字母/拼音/数字/颜色音频真机听感（无法自动化判定）。

**下一阶段入口**：Sprint 17 PF 阶段 5 四次体验回流；或「自然认知」四板块续扩（各 → ≤100，另立 Sprint）。

## 七、通过标准

- 阶段 2 四份文档齐备（需求冻结 / J 设计增量 / R 设计增量 / UI 规范增量 / QA 用例手册）后方进入阶段 3。
- 阶段 3 内容与资产经导入通道校验通过（`total=334`）。
- 阶段 4 六步门禁全绿 → QA 放行 → Master commit（不 push）→ 更新 AGENTS.md §5。
