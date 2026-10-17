# Sprint 9 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 9 新增用例（编号接 TC-70，自 TC-71 起）+ Sprint 1~8 全量回归 + PRD §14.5 增量验收矩阵（26~33）；全部通过前禁止 commit |
| 依据 | docs/product/iteration-9-requirements.md、docs/iterations/sprint-9.md、PRD §14 |
| 执行记录 | 待阶段 4 填写 |

## 一、后端集成测试（Maven，`mvn test`）— 新增
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-71 | 分类列表含新板块与 `section` | `GET /api/categories` | 共 6 条、按 `order` 升序（flower1…dinosaur6）；每条含 `section`（flower/leaf/fruit=plant，animal/insect/dinosaur 同名） | 待执行 |
| TC-72 | 板块列表 `?section=plant` | `GET /api/plants?section=plant` | 计数 = 植物条目数（100）；条目的 `parts` ⊆ {flower,leaf,fruit} | 待执行 |
| TC-73 | 板块列表 `?section=animal`（单键） | `GET /api/plants?section=animal` | 计数 = 10；每条 `parts` 恰 1 键 = `[animal]`；`coverImage` = 对应动物图 | 待执行 |
| TC-74 | 分类列表 `?category=animal`（单键封面） | `GET /api/plants?category=animal` | 计数 = 10；封面为动物图（`category` 命中单键部位） | 待执行 |
| TC-75 | 未知板块 40002 | `GET /api/plants?section=nope` | `code=40002`，message 友好 | 待执行 |
| TC-76 | 排序稳定性（`sort ASC, id ASC`） | `?section=animal` 连续请求 2 次；对比 `?category=leaf` 顺序 | 两次顺序一致；等于按 `sort` 升序、同 `sort` 再按 `id` 升序 | 待执行 |
| TC-77 | 全部条目（无参，跨板块，兼容） | `GET /api/plants` | 计数 = 130（100 植物 + 30 试点）；无重复 id | 待执行 |

> TC-78 起（后端）如实现阶段确认需补异常分支，由 QA 在阶段 4 追加。

## 二、前端组件测试（Vitest，`npx vitest run`）— 新增
> 说明：jsdom 不计算级联样式，样式断言沿用既有做法（读 `src/styles.css` 源文件）；`Audio` 与 `speechSynthesis` 用 stub 注入。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-79 | 站点改名 | `render(<HomePage/>)` | 标题为 `自然小图鉴` / `zì rán xiǎo tú jiàn` / `Nature Guide`（无「植物小花园」残留） | 待执行 |
| TC-80 | 板块导航渲染与切换 | 渲染首页；点击「动物」板块按钮 | 出现 `.section-nav` 4 按钮；切到动物后请求 `?section=animal`（mock `getPlantsBySection` 断言调用）；植物二级筛选消失 | 待执行 |
| TC-81 | 植物二级筛选仅植物板块出现 | 切到「植物」板块 | 出现 `.category-filter`（全部/花朵/树叶/果实）；切到「昆虫」后消失 | 待执行 |
| TC-82 | 单图详情分支 | `render(<PlantDetailPage/>)`，输入单键条目（`parts:{animal:{...}}`） | **不渲染** `PartSwitcher`；渲染大图（`src` = 该图）与说明；渲染「小知识」卡片 | 待执行 |
| TC-83 | 植物详情分支不回归 | 输入 `apple`（三部位） | 仍渲染 `PartSwitcher`；US-8 默认部位跟随分类成立 | 待执行 |
| TC-84 | `PART_ORDER` 扩展 | 直接断言导出常量 | `PART_ORDER = ['flower','leaf','fruit','animal','insect','dinosaur']`；`getOrderedParts({animal:{}})` = `['animal']` | 待执行 |
| TC-85 | 音频播放（有音频） | 注入 `Audio` stub；点击中文喇叭 | 调用 `audio.play()`；`playingUrl` 高亮；再次点击 → `stop()`（`pause`）；**不调用** `speechSynthesis` | 待执行 |
| TC-86 | 音频降级（无音频） | 输入无 `audioZh`/文件缺失的条目 | **不渲染**该喇叭；**不**回退 `speechSynthesis`（断言未定义/未调用） | 待执行 |
| TC-87 | 中英互斥与场景停止 | 播中文 → 点左右换株 / 回花园 / 触发 `fullscreenchange` | 前一播放被 `pause`；至多一个在播 | 待执行 |
| TC-88 | 小知识卡片限长与不渲染 | 输入 `allusion` 正文 >60 / 解释 >50 的语料；与无 `allusion` 条目 | 语料校验阶段拦截超长（见 §四）；无内容不渲染卡片 | 待执行 |

## 三、E2E（Playwright，`npx playwright test`）— 新增
> 前置：`docker compose` 已启动、nginx 在 `http://localhost:80`、列表就绪（等 `.plant-card` 计数稳定）。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-89 | 站点标题 | 打开首页 | 标题 = `自然小图鉴` + `Nature Guide` | 待执行 |
| TC-90 | 四板块导航 | 依次点击 植物/动物/昆虫/恐龙 | 列表随板块切换（动物 10 / 昆虫 10 / 恐龙 10）；植物板块出现二级筛选 | 待执行 |
| TC-91 | 单图详情无部位切换 | 动物板块点「大熊猫」进详情 | 无 `.part-switcher`；大图 `/images/animals/giant-panda.jpg`；小知识卡片存在 | 待执行 |
| TC-92 | 恐龙骨架化石 | 恐龙板块点「霸王龙」进详情 | 大图为 `/images/dinosaurs/tyrannosaurus.jpg`（完整骨架） | 待执行 |
| TC-93 | 音频请求可见 | 详情点中文喇叭，观察网络请求 | 出现对 `/audio/{id}-zh.m4a` 的请求（200） | 待执行 |
| TC-94 | 排序稳定性端到端 | 进入动物板块、刷新/返回再进入 | 两次卡片顺序一致 | 待执行 |
| TC-95 | 植物板块「全部」限定板块内 | 植物板块「全部」 | 列表仅植物（无动物/昆虫/恐龙条目） | 待执行 |

## 四、语料与资产校验（导入前第 0 步 + 导入幂等）
| 编号 | 用例 | 期望 | 状态 |
|---|---|---|---|
| TC-96 | 语料 schema 全量 | 导入脚本第 0 步校验通过：分类 6 条（含 `section`）；植物/动物/昆虫/恐龙条目 schema 合规；`parts` 键合法；单键板块键 = 唯一分类 code | 待执行 |
| TC-97 | 小知识限长 | 数据驱动校验：动物/昆虫/恐龙 `allusion.text` ≤60 字、`explain` ≤50 字 | 待执行 |
| TC-98 | 图片资产存在性 | 30 张试点图存在（动物 10 / 昆虫 10 / 恐龙 10，恐龙为完整骨架化石）；既有 206 张植物图不变 | 待执行 |
| TC-99 | 音频资产存在性 | `/audio/{id}-zh.m4a`、`/{id}-en.m4a` 存在（植物 100×2 + 试点 30×2 ≈ 260） | 待执行 |
| TC-100 | 导入幂等 | 连跑两次：Mongo 条目与分类无重复、`import_log` delta = 2×总数、Redis `sh:*` 导入后为 0 | 待执行 |

## 五、全量回归（Sprint 1~8 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24、TC-57、TC-58 | 全量通过（含「全部计数」改数据驱动 = 130） | 待执行 |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34、TC-41 ~ TC-45f、TC-53 ~ TC-70 | 全部通过（含 US-6/US-7/US-8、Sprint 6 无滚动、Sprint 7 封面/字号、Sprint 8 派生） | 待执行 |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40、TC-46 ~ TC-52、TC-61 ~ TC-70 | 全部通过（首页标题类断言按改名更新后） | 待执行 |

## 六、PRD §14.5 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §14.5-26 站点改名「自然小图鉴 / zì rán xiǎo tú jiàn / Nature Guide」 | 单测 + E2E | TC-79、TC-89 |
| §14.5-27 四板块顶层两级导航；植物二级筛选；其余平铺 | 单测 + E2E | TC-80、TC-81、TC-90、TC-95 |
| §14.5-28 单图详情无部位切换；植物部位切换不回归 | 集成 + 单测 + E2E | TC-73、TC-82、TC-83、TC-91、TC-92 |
| §14.5-29 小知识卡片可渲染；正文 ≤60/解释 ≤50；无内容不渲染 | 语料校验 + 单测 | TC-88、TC-97 |
| §14.5-30 预生成音频（AAC `.m4a`）播放；跨设备一致；缺失不渲染不回退 | 单测 + E2E | TC-85、TC-86、TC-93 |
| §14.5-31 列表顺序 = `sort ASC + id ASC`，重复请求稳定 | 集成 + E2E | TC-76、TC-94 |
| §14.5-32 既有 v1.0~v1.5 验收不回归 | 全量回归 | §五 |
| §14.5-33 平板横竖屏板块导航与单图详情正常；热区 ≥56px | E2E + 样式断言 | TC-90、TC-91（热区沿用既有 TC-25/TC-40） |

## 七、放行标准（QA 裁决）
1. TC-71 ~ TC-100（本迭代新增）全部「通过」，无跳过；§六 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-70 回归全部通过（含 US-6/US-7/US-8、Sprint 6 无滚动、Sprint 7 封面/字号、Sprint 8 派生）。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立；语料校验 `total=130`、分类 6。
4. 接口路径不变；`/api/categories` 增 `section`、`/api/plants` 增 `section` 参数均为向后兼容；既有 100 植物路径与图片不变。
5. 以上全部满足后 QA 放行，Master 执行 commit。
