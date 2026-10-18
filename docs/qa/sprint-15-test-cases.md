# Sprint 15 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-18 |
| 范围 | Sprint 15 新增用例（编号接 TC-133，自 **TC-134** 起）+ Sprint 1~14 全量回归 + PRD §20 增量验收矩阵（65~75，本迭代主验 65~68/71~74）；**全部通过前禁止 commit** |
| 依据 | [iteration-15-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-15-requirements.md)、[sprint-15.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/iterations/sprint-15.md)、PRD §20 |
| 执行记录 | 2026-10-18 门禁六步全绿（详见第八节） |

> **编号口径**：本迭代后端**新增 3 条**（TC-143/144/145，section=letter/pinyin 计数 + categories=8）；前端单测**更新** TC-79/TC-80a、新增 **TC-146/TC-147**（卡片名称条件渲染 / 详情名称区）；E2E **更新** TC-89/TC-90、新增 **TC-134~TC-142**。

## 一、第 0 步 语料与资产校验（脚本）
| 编号 | 检查项 | 期望 | 状态 |
|---|---|---|---|
| C15-A | 语料计数 | `OK total=302 plant=100 animal=50 insect=50 dinosaur=50 letter=26 pinyin=26 flower=53 leaf=100 fruit=53`（分类 **8**） | 通过 |
| C15-B | 条目一致性 | 每条 `categories` 与 `parts` 键一致；单键板块（animal/insect/dinosaur/letter/pinyin）键 = 唯一分类 code | 通过 |
| C15-C | 文案合规 | **非 letter/pinyin** 部位 `description` ≤80 且无 `[A-Za-z]`；letter/pinyin `description` 豁免拉丁字母（仍 ≤80）；全部 `allusion.text` ≤60、`explain` ≤50、无拉丁字母 | 通过 |
| C15-D | 图片资产 | `letters/` **26** 张、`pinyin/` **26** 张 `.jpg`；`.jpg` 合计 **408**；均 1600×1600 渐进式 | 通过 |
| C15-E | 音频资产 | `letter-*-en.m4a` **26**、`pinyin-*-zh.m4a` **26**；`.m4a` 合计 **552** | 通过 |
| C15-F | 名称省略 | letter 条目 `name.{pinyin,en,ipa}` 均缺失；pinyin 条目同 | 通过 |

## 二、后端集成测试（Maven，`mvn test`）— 新增 + 更新
| 编号 | 说明 | 状态 |
|---|---|---|
| TC-143（新增） | `?section=letter` 返回 **26** 条，每条 `parts` = `[letter]`，顺序 = `sort ASC + id ASC`（首 `letter-a`、末 `letter-z`） | 通过 |
| TC-144（新增） | `?section=pinyin` 返回 **26** 条，每条 `parts` = `[pinyin]`，首 `pinyin-a`、末 `pinyin-z` | 通过 |
| TC-145（新增） | `/api/categories` 返回 **8** 条（新增 letter/pinyin，`section` 各自 code） | 通过 |
| TC-02（更新） | `section` 断言集合扩为 `plant/animal/insect/dinosaur/letter/pinyin`（数据驱动，随分类 8） | 通过 |
| TC-11（更新） | 数据驱动 schema：letter/pinyin 条目跳过 `name.pinyin/en/ipa` 与 `part.name.pinyin/en` 非空断言；`BOARD_IMAGE_PREFIX` 增 `letter:/images/letters/`、`pinyin:/images/pinyin/` | 通过 |
| TC-24（更新） | 仅对**非 letter/pinyin** 部位校验「≤80 字、无拉丁字母」 | 通过 |
| TC-01/03/04/05/06/07/08/09/12/13/57/58/71~75（回归） | 既有基线，退出码须为 0 | 通过 |

## 三、前端组件测试（Vitest，`npx vitest run`）— 更新 + 新增
| 编号 | 说明 | 状态 |
|---|---|---|
| TC-79（更新） | 站点三行标题 = `rèn zhī xiǎo tú jiàn` / `认知小图鉴` / `Cognitive Guide`；旧「自然小图鉴」「Nature Guide」不再出现 | 通过 |
| TC-80a（更新） | 板块导航渲染 **8** 个 `.filter-btn`（两组「自然认知 / 认知启蒙」），默认选中「植物」 | 通过 |
| TC-146（新增） | `PlantCard` 名称条件渲染：`name.pinyin`/`name.en` 缺失的卡片（如字母 `Aa`）不渲染 `.plant-card-pinyin` / `.plant-card-en` | 通过 |
| TC-147（新增） | `PlantDetailPage` 单图分支含 letter/pinyin：`SINGLE_IMAGE_KEYS` 生效，`Aa` 详情无 `.detail-pinyin`/`.detail-en`，仅英文喇叭 | 通过 |
| TC-11/12/13/20/21/25/25b/45e/59/64/106/107/108/108b/123/124（回归） | 既有基线全绿 | 通过 |

## 四、E2E（Playwright，`npx playwright test`）— 更新 + 新增
> 前置：`docker compose up -d --build` 已重建（新图片 / 音频须 `--build` 才进 nginx）、`nginx`/后端健康、导入已完成。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-89（更新） | 站点更名 | `goto /` | `.site-title-zh`=「认知小图鉴」、`.site-title-pinyin`=`rèn zhī xiǎo tú jiàn`、`.site-title-en`=`Cognitive Guide`；「自然小图鉴」计数 0 | 通过 |
| TC-90（更新） | 8 板块两组导航 | `goto /` | 板块导航 `.filter-btn` = **8**；组标题「自然认知」「认知启蒙」可见；植物二级筛选仍 4 钮；切「动物」→ `loadAllCards(page,50)` | 通过 |
| TC-134 | 更名 + 两组导航 | `goto /` | 标题三行新文案；`.section-group-title` 两组文本正确；8 板块按钮可见 | 通过 |
| TC-135 | 英文字母板块 | 点「英文字母」→ 等首卡 `Aa` → `loadAllCards(page,26)` | 「共 26 种」；26 张卡；首卡 `Aa`、末卡 `Zz` | 通过 |
| TC-136 | 汉语拼音板块 | 点「汉语拼音」→ 等首卡 `a` → `loadAllCards(page,26)` | 「共 26 种」；26 张卡；首卡 `a`、末卡 `z` | 通过 |
| TC-137 | 字母详情单图 | `goto /plants/letter-a` | `.detail-zh`=`Aa`；`.detail-body` 含 `single-image`；`[role="tab"]`=0；`.detail-pinyin`/`.detail-en` 计数 0；仅「朗读英文名」喇叭 | 通过 |
| TC-138 | 拼音详情单图 | `goto /plants/pinyin-a` | `.detail-zh`=`a`；单图分支；无 `.detail-pinyin`/`.detail-en`；仅「朗读中文名」喇叭 | 通过 |
| TC-139 | 单语音频请求契约 | route 桩住 `**/audio/*.m4a`；`letter-a` 点英文喇叭、`pinyin-a` 点中文喇叭 | 请求 `/audio/letter-a-en.m4a`、`/audio/pinyin-a-zh.m4a` | 通过 |
| TC-140 | 返回按钮文案派生 | 从字母/拼音板块进详情看返回按钮 | 「← 回字母乐园」「← 回拼音角」 | 通过 |
| TC-141 | 新增 52 图契约可取 | 对 26+26 个 id 逐个 `request.get('/images/{letters,pinyin}/{id}.jpg')` | 全部 HTTP **200** | 通过 |
| TC-142 | 新增 52 音频契约可取 | 对 52 条逐个 `request.get('/audio/letter-{x}-en.m4a'\|'/audio/pinyin-{x}-zh.m4a')` | 全部 HTTP **200** | 通过 |
| TC-114 / TC-130~TC-133（回归） | 三板块 50 种 | 动物/昆虫/恐龙各滚动至 50 | 不回归 | 通过 |

## 五、PRD §20.6 验收矩阵 → 用例对照
| PRD §20.6 | 验收点 | 主验方式 | 用例 |
|---|---|---|---|
| 65 | 产品名「认知小图鉴」；两组 8 板块；植物二级筛选 4 钮 | 前端单测 + E2E | TC-79 / TC-80a / TC-134 / TC-89 / TC-90 |
| 66 | `letter=26 / pinyin=26`；总数 302；分类 8 | 脚本 + 后端 + E2E | C15-A / TC-145 / TC-135 / TC-136 |
| 67 | 英文字母 A–Z 26 大小写同卡、`sort` 1…26、无三语 | 脚本 + 后端 | C15-A / C15-F / TC-143 / TC-137 |
| 68 | 汉语拼音 a–z 26 按序、`sort` 1…26、无三语 | 脚本 + 后端 | C15-A / C15-F / TC-144 / TC-138 |
| 71 | 各 26 图 1600×1600；字母 en 单语 / 拼音 zh 单语 | 脚本 + E2E | C15-D / C15-E / TC-141 / TC-142 / TC-139 |
| 72 | `?section=letter\|pinyin` 各 26 且顺序稳定；categories=8；未知板块 40002 | 后端集成 | TC-143 / TC-144 / TC-145 / TC-73 |
| 73 | 8 板块导航；单图详情；名称仅符号；喇叭按音频渲染；「共 26 种」；返回文案派生 | E2E | TC-134 / TC-135~TC-140 |
| 74 | 四新增板块 `allusion` 非空、`text` ≤60、`explain` ≤50 | 脚本 | C15-C |
| 75 | 既有 v1.0~v2.5 验收全量不回归 | 全量回归 | 全量 |

## 六、受影响断言清单（QA-33 出具）
| # | 文件 / 用例 | 现状 | 处理 |
|---|---|---|---|
| 1 | `backend/.../ContentSeed.java` | `PLANT_DIRS` 仅 4 目录 | 增 `letters`、`pinyin` |
| 2 | `backend` TC-02 | `section` ∈ 4 板块 | 扩为含 letter/pinyin（数据驱动） |
| 3 | `backend` TC-11 | letter/pinyin 条目名不全 + 图片前缀缺失 | 分支跳过名称断言；`BOARD_IMAGE_PREFIX` 增 letter/pinyin |
| 4 | `backend` TC-24 | 全部位禁拉丁字母 | 仅非 letter/pinyin 校验 |
| 5 | `backend` TC-05 | 40001 文案含「昆虫」 | 新文案仍含「昆虫」，不回归 |
| 6 | `frontend` `HomePage.test.jsx` TC-79 | 旧站名三行 | 改新站名三行 |
| 7 | `frontend` `HomePage.test.jsx` TC-80a | 4 钮 | 改 8 钮（两组）；`CATEGORIES` mock 增 letter/pinyin |
| 8 | `frontend/e2e/sprint9.spec.js` TC-89 | 旧站名 | 改新站名 |
| 9 | `frontend/e2e/sprint9.spec.js` TC-90 | `.filter-btn` 4 | 改 8；断言两组标题 |
| 10 | 门禁脚本输出 | `total=250` 分类 6 | 预期 `total=302` / 分类 8 / `.jpg` 408 / `.m4a` 552 |
| 11 | 导入幂等 import_log | 基线 **5680** | delta = **+604 = 2×302**；Mongo **302 / 8** |
| 12 | 植物断言（100/53/100/53） | 不变 | 不受影响 |
| 13 | TC-106「共 N 种」/ TC-114 三板块 50 | mock / 数据驱动 | 不受影响 |

## 七、执行记录（2026-10-18 门禁六步全绿）
| 层级 | 命令 | 结果 | 证据 |
|---|---|---|---|
| 0. 语料/资产 | 校验脚本 | ✅ `total=302`（plant100/animal50/insect50/dinosaur50/letter26/pinyin26）/ `flower=53 leaf=100 fruit=53` / 分类 **8** / `.jpg` **408** / `.m4a` **552** / 52 新增图 1600×1600 渐进式 / allusion 全覆盖、text≤60、explain≤50 | import_log 基线 **5680** |
| 1. 后端 | `docker mvn test` | ✅ 退出码 **0**，`Tests run: 24, Failures: 0, Errors: 0, Skipped: 0`（21 既有 + TC-143/144/145） | surefire-reports |
| 2. 前端 | `npx vitest run` / `vite build` | ✅ vitest **76 passed (76)**（+TC-146/147a/147b）；`vite build` 退出码 **0** | frontend 输出 |
| 3. 部署与导入 | `docker compose up -d --build` + 两次导入 | ✅ 重建后 `/api/health=UP`；两次各写 302 条 → import_log **6284**（delta **+604 = 2×302**）；Mongo **302 / 8**；导入后 `redis sh:*` 清除 0；API all=302 / plant=100 / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / flower=53 / leaf=100 / fruit=53 | 容器与接口输出 |
| 4. E2E | `npx playwright test` | ✅ **65 passed (65)**（既有 56 + TC-134~TC-142） | playwright 输出 |

## 八、缺陷与流程问题（门禁后回填）

| # | 类型 | 描述 | 定位 | 处理 | 状态 |
|---|---|---|---|---|---|
| D15-1 | 测试缺陷 | TC-140 首版在字母详情页内直接点击「汉语拼音」板块钮，但详情页无板块导航 → 点击超时 | `frontend/e2e/sprint15.spec.js` | 改为先点返回按钮回首页、再切板块（**仅测试层改动**，无产品代码/契约变更） | ✅ 已修复，复跑全绿 |
| D15-2 | 流程问题 | 门禁第 1 步后端测试与第 4 步 E2E 并行争用资源，TC-114 偶发失败（`.plant-card` 停 16/50） | 门禁编排 | 隔离复跑即通过（56 卡滚载正常）；后续门禁按 Skill 把 E2E 排在资源空闲窗口执行 | ✅ 已规避 |

