# Sprint 6 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 6 新增用例（编号接 TC-47，自 TC-48 起）+ Sprint 1~5 全量回归 + PRD §11.4 增量验收矩阵；全部通过前禁止 commit |
| 依据 | docs/product/iteration-6-requirements.md、docs/iterations/sprint-6.md、PRD §11 |
| 执行记录 | 2026-10-17 全量回归：第 0 步语料校验 `OK total=100 flower=53 leaf=100 fruit=53`；后端 `mvn test` 退出码 0；前端 `npx vitest run` 36/36 通过（含新增 TC-53~TC-56）、`vite build` 成功；`docker compose up -d --build` 重建后健康（`/api/health` = `{"code":0,"data":{"status":"UP"}}`）；导入连跑两次幂等（Mongo 100 种 / 3 分类无重复、import_log delta +200、Redis `sh:*` 导入后为 0）；`npx playwright test` 20/20 通过（既有 13 + 新增 TC-48~TC-52，共 7 条新用例）。QA 放行。 |

## 一、E2E（Playwright，`npx playwright test`）— 新增

> 前置：进详情需先等列表就绪（花朵分类 53 张）；全屏态用右上「全屏」按钮进入（headless Chromium 支持 Fullscreen API）。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-48 | iPad 横屏沉浸式态整屏不滚动 | 视口 1024×768 / 1180×820；进详情；断言页面级溢出与内容区可滚动性 | `documentElement.scrollHeight - clientHeight` ≤ 1；`.detail-body` 的 `scrollHeight - clientHeight` ≤ 1（内容区不可滚动） | 通过 |
| TC-49 | iPad 竖屏沉浸式态整屏不滚动 | 视口 768×1024 / 820×1180；进详情；同上断言 | 页面级溢出 ≤ 1；内容区不可滚动 | 通过 |
| TC-50 | 全屏态整屏不滚动且滚动不改变文档滚动位置 | 视口 1024×768；进详情 → 点「全屏」→ 在内容区与页面各派发一次滚动 | 全屏仍生效（`document.fullscreenElement` 非空）；页面级溢出 ≤ 1；`window.scrollY` / `documentElement.scrollTop` 在滚动前后不变（恒为 0） | 通过 |
| TC-51 | 图片完整不裁切（回归加强） | 上述任一视口进详情 | `.part-img` 的 `object-fit` = `contain`，且 `boundingBox` 在视口内（未溢出容器） | 通过 |
| TC-52 | 长文案植物（含典故）不产生页面滚动 | 选一株含 `.allusion-card` 的植物（如 azalea），视口 768×1024 | 页面级溢出 ≤ 1；文字完整可读（`.part-desc` 与 `.allusion-text` 可见） | 通过 |

## 二、前端组件测试（Vitest，`npx vitest run`）— 新增

> 说明：jsdom 不计算级联样式，样式类断言沿用既有做法——读取 `src/styles.css` 源文件做规则断言。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-53 | 容器脱离文档流（样式断言） | 读 `src/styles.css` 的 `.detail-immersive` 规则块 | 含 `position: fixed` 与 `inset: 0`；不含 `height: 100dvh` | 通过 |
| TC-54 | 内容区不可滚动（样式断言） | 读 `src/styles.css` 的 `.detail-body` 规则块 | `overflow: hidden`（非 `auto`） | 通过 |
| TC-55 | 滚动链式传递被阻断（样式断言） | 读 `.detail-immersive` 与 `.detail-body` 规则块 | 两者均含 `overscroll-behavior`；`.detail-body` 为 `contain` | 通过 |
| TC-56 | 图片按剩余空间自适应（样式断言） | 读 `.part-img` 与其横屏覆盖规则 | 含 `flex` 可收缩声明、`max-height: 100%`（横屏）与 `object-fit: contain` | 通过 |

## 三、全量回归（Sprint 1~5 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24 | 100 种规模下全部通过（后端本迭代零改动，纯回归） | 通过 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34、TC-41 ~ TC-45f | 全部通过（含 Sprint 5 语音用例） | 通过 |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40、TC-46、TC-47 | 全部通过；其中 TC-38 / TC-40 的页面级溢出断言为本次修复的直接回归项 | 通过 |
| 导入 | TC-10 幂等 | 导入两次：Mongo 总数 100 无重复、import_log delta = +200、Redis `sh:*` 导入后为 0 | 通过 |

## 四、PRD §11.4 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §11.4-17 iPad 横/竖屏、沉浸式与全屏态均无纵向滚动条且内容区不可滚动 | E2E 四视口 × 两态断言页面级溢出 0 + 内容区 `scrollHeight - clientHeight ≤ 1` | TC-48、TC-49、TC-50 |
| §11.4-18 详情页内不发生页面级滚动 | 滚动后断言 `window.scrollY` / 文档滚动位置不变 | TC-50 |
| §11.4-19 图片完整不裁切、文字完整；既有行为不回归 | `object-fit: contain` + 长文案可见 + TC-38/39/40 与 US-7 用例重跑 | TC-51、TC-52、TC-38、TC-40、TC-46、TC-47 |

## 五、放行标准（QA 裁决）
1. TC-48 ~ TC-56 全部「通过」，无跳过；§11.4 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-47 回归全部通过（后端零改动）。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立。
4. 「滚动后退出全屏」属 iPad Safari 专有行为，headless 无法复现：以机制消除为验收口径（页面级溢出 0 + 内容区不可滚动 + 滚动不改变文档滚动位置）；真机行为由人工在 iPad 上抽验。
5. 以上全部满足后 QA 放行，Master 执行 commit。
