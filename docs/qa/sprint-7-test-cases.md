# Sprint 7 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 7 新增用例（编号接 TC-56，自 TC-57 起）+ Sprint 1~6 全量回归 + PRD §12.4 增量验收矩阵；全部通过前禁止 commit |
| 依据 | docs/product/iteration-7-requirements.md、docs/iterations/sprint-7.md、PRD §12 |
| 执行记录 | 2026-10-17 全量回归：第 0 步语料校验 `OK total=100 flower=53 leaf=100 fruit=53`；后端 `docker mvn test` 退出码 0（16 用例，0 失败/0 跳过，含新增 TC-57/TC-58）；前端 `npx vitest run` 38/38 通过（含新增 TC-59/TC-60）、`vite build` 退出码 0；`docker compose up -d --build` 重建后健康（`/api/health` = `{"code":0,"data":{"status":"UP"}}`）；导入幂等（Mongo 100 种 / 3 分类无重复、单次 delta +100、Redis `sh:*` 导入后为 0）；`npx playwright test` 24/24 通过（既有 20 + 新增 TC-61~TC-63）。QA 放行。 |

## 一、后端集成测试（Maven，`mvn test`）— 新增

> 语料事实：`apple` 的 `categories=[flower,leaf,fruit]`、三部位齐全（首图按 flower→leaf→fruit 为 `apple-flower.jpg`）；`anemone` 的 `categories=[flower,leaf]`、`parts=[flower,leaf]`。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-57 | 分类列表封面跟随分类（EX-1 正例） | `GET /api/plants?category=leaf`、`GET /api/plants?category=fruit`；取 `apple` 卡片 | `leaf` 分类下 `apple.coverImage` = `/images/plants/apple-leaf.jpg`；`fruit` 分类下 = `/images/plants/apple-fruit.jpg`；`anemone` 在 `?category=leaf` 下 = `/images/plants/anemone-leaf.jpg` | 通过 |
| TC-58 | 「全部」与花朵分类回退顺序不变（回归） | `GET /api/plants`、`GET /api/plants?category=flower`；取 `ginkgo` / `apple` 卡片 | 无 `flower` 的银杏在**全部**列表封面为 `/images/plants/ginkgo-leaf.jpg`（TC-07 语义不变）；`apple` 在全部与花朵分类下仍为 `apple-flower.jpg` | 通过 |

## 二、前端组件测试（Vitest，`npx vitest run`）— 新增

> 说明：jsdom 不计算级联样式，断言沿用既有做法——读取 `src/styles.css` 源文件做规则断言。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-59 | 卡片次级字号 16px（样式断言，EX-3） | 读 `src/styles.css` 的 `.plant-card-pinyin` / `.plant-card-en` 规则块 | `font-size: 16px`（不再为 14px） | 通过 |
| TC-60 | 横屏图片宽度上限 48%（样式断言，EX-2） | 读 `src/styles.css` 的横屏（`orientation: landscape`）覆盖块 | `.part-img` 含 `max-width: 48%`（不再为 40%）；`aspect-ratio: 1/1` 与 `object-fit: contain` 仍在 | 通过 |

## 三、E2E（Playwright，`npx playwright test`）— 新增

> 前置：进详情需先等列表就绪；横屏视口 1024×768 与 1180×820。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-61 | 横屏详情图片放大且无水平溢出（EX-2） | 视口 1024×768 / 1180×820 进详情，读取 `.part-img` 的 `boundingBox` | 图片像素宽度 ≥ 修复前基线（349px @1024×768）且明显增大；图片右边界在视口内（无水平溢出）；页面级溢出 ≤ 1 | 通过 |
| TC-62 | 长文案植物横屏不溢出（EX-2 边界，回归） | 视口 1024×768 选含 `.allusion-card` 的植物（azalea）进详情 | 页面级溢出 ≤ 1；`.part-desc` 与 `.allusion-text` 完整可见（放大图片后文字不被裁切） | 通过 |
| TC-63 | 分类页卡片封面与分类一致（EX-1 E2E） | 首页选「树叶」分类，等列表就绪；读取 `apple` 卡片的 `img` src | 卡片封面 URL = `/images/plants/apple-leaf.jpg`（不显花朵照片） | 通过 |

## 四、全量回归（Sprint 1~6 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24、TC-57、TC-58 | 100 种规模下全部通过（含新增封面分类用例） | 通过 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34、TC-41 ~ TC-45f、TC-53 ~ TC-60 | 全部通过（含 Sprint 5 语音、Sprint 6 无滚动与新增样式断言） | 通过 |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40、TC-46 ~ TC-52、TC-61 ~ TC-63 | 全部通过；TC-38 / TC-40 / TC-48 ~ TC-52 的溢出与无滚动断言为本次放大的直接回归项 | 通过 |
| 导入 | TC-10 幂等 | 导入两次：Mongo 总数 100 无重复、import_log delta = +200、Redis `sh:*` 导入后为 0 | 通过 |
| 语料校验 | 导入前第 0 步脚本 | `OK total=100 flower=53 leaf=100 fruit=53` | 通过 |

## 五、PRD §12.4 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §12.4-20 分类列表封面跟随分类，缺失才回退，「全部」沿用原顺序 | 后端接口断言「树叶/果实分类下含花植物封面为对应部位图」+「全部/花朵分类回退不变」+ E2E 分类页封面 URL | TC-57、TC-58、TC-63 |
| §12.4-21 横屏图片放大、留白减少、完整不裁切；长文案不溢出；无页面级滚动与退出全屏不回归 | E2E 横屏图片像素尺寸断言 + 无水平溢出 + 长文案可见 + TC-48~TC-52 重跑 | TC-61、TC-62、TC-48 ~ TC-52 |
| §12.4-22 卡片拼音/英文字号 ≥16px | 样式规则断言 + E2E 计算样式 | TC-59 |

## 六、放行标准（QA 裁决）
1. TC-57 ~ TC-63 全部「通过」，无跳过；§12.4 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-56 回归全部通过；其中 TC-07（银杏回退）语义不变，TC-48 ~ TC-52（无滚动）不回归。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立。
4. EX-2 放大图片不得重新引入横屏水平溢出（1024×768 / 1180×820 页面级溢出 ≤ 1）。
5. 以上全部满足后 QA 放行，Master 执行 commit。
