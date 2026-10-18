# 迭代测试用例手册 — Sprint 16（v2.7 认知启蒙二：数字 0–20 + 颜色 11 色）

| 项 | 内容 |
|---|---|
| 迭代 | Sprint 16 |
| 依据 | [PRD.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md) §20.6 验收 65~75；[iteration-16-requirements.md](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/iteration-16-requirements.md) |
| 编号起始 | **TC-148**（接 Sprint 15 的 TC-147b） |
| 放行口径 | 六步门禁全绿（后端退出码 0 / vitest 全通过 / vite build 0 / compose 健康 / 导入幂等 / E2E 全通过） |
| 状态 | ✅ 已执行，六步门禁全绿，QA 放行（2026-10-18） |

## 一、语料与资产校验（门禁第 0 步）

| 编号 | 用例 | 断言要点 | 状态 |
|---|---|---|---|
| TC-148a | 语料总量与分板块计数 | `total=334`；`plant100 / animal50 / insect50 / dinosaur50 / letter26 / pinyin26 / number21 / color11`；`flower53 / leaf100 / fruit53` | 通过 |
| TC-148b | 分类与资产计数 | 分类 **10**；图片 `.jpg` **440**；音频 `.m4a` **616** | 通过 |
| TC-148c | 新增图片规格 | 数字 21 + 颜色 11 共 **32** 张全为 **1600×1600 渐进式** JPEG | 通过 |
| TC-148d | 数字/颜色条目 schema | 每条单键 `parts.{number|color}`、`sort` 正确（数字 0…20、颜色 1…11）、`name.zh/pinyin/en/ipa` 非空、`description` 非空、`allusion.text/explain` 非空且 `text`≤60、`explain`≤50、无拉丁字母 | 通过 |

## 二、后端接口用例（`mvn test`）

| 编号 | 层级 | 用例 | 断言要点 | 状态 |
|---|---|---|---|---|
| TC-156 | 后端 | 数字板块列表 | `/api/plants?section=number` 返回 **21** 条，每条 `parts` = `["number"]`，顺序 `sort ASC + id ASC`，首 `number-0` 末 `number-20` | 通过 |
| TC-157 | 后端 | 颜色板块列表 | `/api/plants?section=color` 返回 **11** 条，每条 `parts` = `["color"]`，首 `color-black` 末 `color-grey` | 通过 |
| TC-158 | 后端 | 数字/颜色保留三语+音标 | 数字/颜色条目 `name.zh/pinyin/en/ipa` 非空（**不豁免**，区别于 letter/pinyin） | 通过 |
| TC-145（更新） | 后端 | 分类齐备 | `/api/categories` 由 8 → **10** 条，含 `number`/`color` 码与 `section` | 通过 |
| TC-02（更新） | 后端 | section 白名单 | 断言集合追加 `number`/`color` | 通过 |

## 三、前端组件用例（`vitest`）

| 编号 | 层级 | 用例 | 断言要点 | 状态 |
|---|---|---|---|---|
| TC-159 | 前端 | 数字详情单图分支 | `number-1` 详情：`.detail-body` = `single-image`、无 `[role=tab]`；`.detail-zh` = 「一」、`.detail-pinyin` 非空、`.detail-en` 非空；中文 + 英文喇叭各一 | 通过 |
| TC-160 | 前端 | 颜色详情单图分支 | `color-red` 详情：单图分支、无部位切换；名称三行渲染；中英喇叭各一 | 通过 |

## 四、E2E 用例（`npx playwright test`，新增 `sprint16.spec.js`）

| 编号 | 用例 | 步骤 / 断言要点 | 状态 |
|---|---|---|---|
| TC-148 | 数字板块导航与列表 | 切「数字」→ 板块列表首卡 `number-0`（`.plant-card-zh` = 「零」）出现；`loadAllCards(page,21)`；「共 21 种」；末卡「二十」 | 通过 |
| TC-149 | 颜色板块导航与列表 | 切「颜色」→ 首卡 `color-black`（「黑色」）出现；`loadAllCards(page,11)`；「共 11 种」；末卡「灰色」 | 通过 |
| TC-150 | 数字详情单图与名称 | 点 `number-1` 卡 → 详情：单图分支（无 `[role=tab]`）、`.detail-zh` = 「一」、`.detail-pinyin`/`.detail-en` 可见、中文喇叭 + 英文喇叭各一 | 通过 |
| TC-151 | 颜色详情单图 | 点 `color-red` 卡 → 单图分支、无部位切换、名称三行 | 通过 |
| TC-152 | 返回文案派生 | 数字详情返回按钮「← 回数字屋」；颜色详情返回按钮「← 回颜色屋」 | 通过 |
| TC-153 | 音频请求契约 | 数字详情触发 `/audio/number-1-zh.m4a` 与 `/audio/number-1-en.m4a`；颜色详情触发 `/audio/color-red-zh.m4a` | 通过 |
| TC-154 | 图片可达 | 数字 21 + 颜色 11 共 **32** 张 `/images/{numbers,colors}/{id}.jpg` 均 HTTP 200 | 通过 |
| TC-155 | 音频可达 | 数字/颜色共 **64** 个 `/audio/{id}-{zh,en}.m4a` 均 HTTP 200 | 通过 |

## 五、受影响断言清单（须同步复核）

| 层级 | 文件 / 用例 | 影响 | 处置 |
|---|---|---|---|
| 后端 | `ContentSeed.PLANT_DIRS` | 需读入 numbers/colors | **更新**：追加 `numbers`、`colors` |
| 后端 | TC-02（section 集合） | 新增 2 板块 | **更新**：追加 `number`/`color` |
| 后端 | TC-145（分类数 8） | 分类 8 → 10 | **更新**：改为 10，追加码断言 |
| 前端 | `SectionNav.jsx` 注释 | 过期注释 | **更新**：删除「本迭代无内容」句 |
| E2E | `sprint9.spec.js` TC-89/TC-90 | 站点名与导航数**不变**（仍 8 钮） | 复核**不改** |
| E2E | `sprint15.spec.js` TC-134~TC-142 | 字母/拼音板块断言**不受影响** | 复核**不改** |

## 六、不回归基线

- 后端既有 **24** 用例、前端既有 **76** 用例、E2E 既有 **65** 用例全部回归通过。
- PRD §7 / §9.4 / §10.4 / §11.4 / §12.4 / §13.5 / §14.5 / §15.5 / §16.5 / §17.5 / §18.5 / §19.5 / §20.6 全部不回归。

## 七、执行记录

| 步骤 | 结果 | 时间 |
|---|---|---|
| 0 语料/资产校验 | ✅ `categories=10`、`counts={plants:100,animals:50,insects:50,dinosaurs:50,letters:26,pinyin:26,numbers:21,colors:11}`、`TOTAL=334`、`flower=53 leaf=100 fruit=53`、`jpg=440`、`m4a=616`、`OK`；EXIT=0 | 2026-10-18 |
| 1 后端 `mvn test` | ✅ 退出码 0；surefire `Tests run: 27, Failures: 0, Errors: 0, Skipped: 0`（既有 24 + TC-156/157/158） | 2026-10-18 |
| 2 前端 `vitest`/`vite build` | ✅ `Test Files 2 passed (2)` / `Tests 78 passed (78)`；`✓ built in 1.49s`，`BUILD_EXIT=0` | 2026-10-18 |
| 3 compose 重建 + 两次导入幂等 | ✅ 重建后 `HEALTH_OK`；两次导入各 334 条（`IMPORT_OK`）；`import_log=6952`（= 基线 6284 + 668 = 2×334）；Mongo `plants/categories: 334 10`；`redis sh:*: 0` | 2026-10-18 |
| 4 E2E | ✅ `Running 73 tests using 6 workers` / `73 passed (15.5s)`，`E2E_EXIT=0`（既有 65 + TC-148~TC-155） | 2026-10-18 |
| 5 文档收尾与 commit | ✅ 文档回填 + Master commit（不 push） | 2026-10-18 |

**API 计数复核**：all=**334** / flower=53 / leaf=100 / fruit=53 / plant=100 / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / **number=21** / **color=11**；categories=10。

## 八、缺陷与流程问题（执行中记录）

**无功能缺陷、无流程缺陷**。本迭代为内容产线为主 + 配置/测试适配，产品代码零改动；六步门禁一次全绿，未发现需修复的缺陷。

- 说明（非缺陷）：`/tmp/s16-images.mjs` 的体积极小阈值（<20000 字节）沿用了照片图标准，5 张纯色 / 单字形卡（number-1 / color-black / color-white / color-brown / color-grey）压缩后天然低于该阈值被标 FAIL；经核验 32 张全为 1600×1600 渐进式 JPEG、md5 全唯一，**文件合规，非真实缺陷**，脚本未改动。
