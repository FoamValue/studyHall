# Sprint 5 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 5 新增用例（TC-41 起）+ Sprint 1~4 全量回归 + PRD §10.4 增量验收矩阵；全部通过前禁止 commit |
| 依据 | docs/product/iteration-5-requirements.md、docs/iterations/sprint-5.md、PRD §10 |
| 执行记录 | 2026-10-17 全量回归：后端 `mvn test` 退出码 0（TC-01~13、TC-24 数据驱动 100 种全绿）；前端 `npx vitest run` 32/32 通过、`vite build` 成功；`docker compose up -d --build` 重建后健康（`/api/health` = `{"code":0,"data":{"status":"UP"}}`）；导入连跑两次：Mongo 100 种 / 3 分类无重复、import_log 900 → 1100（delta +200）、Redis `sh:*` 导入后为 0；`npx playwright test` 13/13 通过（既有 11 个：TC-22/23/26/27 + TC-35~TC-40，新增 TC-46/TC-47）。QA 放行。 |

## 一、前端组件测试（Vitest，`npx vitest run`）— 新增

> 前置调整：`PlantDetailPage.test.jsx` 需注入 `window.speechSynthesis` mock——`speak` / `cancel` 用 `vi.fn()`，`SpeechSynthesisUtterance` 用构造 mock 记录 `text` / `lang` / `rate`；`beforeEach` 安装、`afterEach` 还原。降级场景通过临时移除 `window.speechSynthesis` 模拟。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-41 | 中文喇叭朗读中文名 | 渲染详情（`name.zh` 非空），点中文喇叭 | `speak` 调用一次；utterance `text` = 中文名，`lang` = `zh-CN`，`rate` = `0.8` | 通过 |
| TC-42 | 英文喇叭朗读英文名 | 点英文喇叭 | `speak` 调用；`text` = `name.en`，`lang` = `en-US`，`rate` = `0.8` | 通过 |
| TC-43 | 两喇叭互斥（先 cancel 再 speak） | 先点中文喇叭（播放中）再点英文喇叭 | 第二次点击触发 `cancel`（≥1 次），随后 `speak` 文本为英文名 | 通过 |
| TC-44 | 再点同一喇叭停止 | 点中文喇叭（播放中）再点一次 | `cancel` 被调用，按钮 `aria-pressed` 复位为 `false` | 通过 |
| TC-45 | 场景自动停止 | ①播放中点另一部位 ②播放中点「下一株」 ③卸载组件 | 三种场景 `cancel` 均被调用，状态复位 | 通过 |
| TC-45b | 只读名称（不读拼音/部位名/说明/典故） | 播放中读取 utterance `text` | `text` 恰等于名称字段，不含拼音、部位名、说明、典故 | 通过 |
| TC-45c | 优雅降级 | 移除 `window.speechSynthesis` 后渲染详情 | `.speak-btn` 不渲染；部位切换、「上一株/下一株」、「回花园」正常 | 通过 |
| TC-45d | 无英文名隐藏英文喇叭 | 植物 `name.en` 为空 | 中文喇叭存在，英文喇叭不渲染 | 通过 |
| TC-45e | 首页不放喇叭 | 渲染 `HomePage` | 页面内不存在 `.speak-btn` | 通过 |
| TC-45f | 热区样式断言 | 读 `src/styles.css` | `.speak-btn` 规则含 `min-height ≥ 56px` 且 `min-width ≥ 56px` | 通过 |

## 二、E2E 冒烟（Playwright，`npx playwright test`）— 新增

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-46 | 喇叭存在且热区达标 | 进详情（1024×768） | 中文喇叭存在、英文喇叭存在（该植物有英文名）；两者 `boundingBox` 宽高均 ≥56px | 通过 |
| TC-47 | 点击触发朗读 + 离开详情停止 | `page.addInitScript` stub `window.speechSynthesis`（把 `speak` 的文本记入 `window.__spoken`、`cancel` 计数记入 `window.__cancelCount`）；进详情点中文喇叭；再点「← 回花园」 | `window.__spoken` 末尾等于该植物中文名；导航后 `window.__cancelCount ≥ 1` | 通过 |

> 说明：headless 环境无真实语音与语音包，E2E 只断言「点按触发了朗读调用、离开时停止」；真实发音与音质由人工在真机（含 iPad）抽验。

## 三、全量回归（Sprint 1~4 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24 | 100 种规模下全部通过（后端本迭代零改动，纯回归） | 通过 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34 | 全部通过 | 通过 |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40 | 全部通过 | 通过 |
| 导入 | TC-10 幂等 | 导入两次：Mongo 总数 100 无重复、import_log delta = +200、Redis `sh:*` 导入后为 0 | 通过 |

## 四、PRD §10.4 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §10.4-12 中/英各一喇叭，点按听对应语言名称 | mock 断言 `speak` 文本与 `lang` / E2E stub 断言调用 | TC-41、TC-42、TC-46、TC-47 |
| §10.4-13 喇叭只读名称 | utterance `text` 恰等于名称字段 | TC-45b |
| §10.4-14 两喇叭互斥、再点可停止 | `cancel`→`speak` 序列；`aria-pressed` 复位 | TC-43、TC-44 |
| §10.4-15 切场景立即停止 | 切部位 / 换株 / 卸载 / 离开详情时 `cancel` 被调用 | TC-45、TC-47 |
| §10.4-16 热区 ≥56px；不支持不渲染且功能正常 | 样式断言 + 降级渲染断言 + E2E 尺寸 | TC-45c、TC-45f、TC-46 |

## 五、放行标准（QA 裁决）
1. TC-41 ~ TC-47 全部「通过」，无跳过；§10.4 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-40 回归全部通过（后端零改动）。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立。
4. 以上全部满足后 QA 放行，Master 执行 commit。
