# Sprint 9 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 9 新增用例（编号接 TC-70，自 TC-71 起）+ Sprint 1~8 全量回归 + PRD §14.5 增量验收矩阵（26~33）；全部通过前禁止 commit |
| 依据 | docs/product/iteration-9-requirements.md、docs/iterations/sprint-9.md、PRD §14 |
| 执行记录 | 2026-10-17 全量回归：第 0 步语料校验通过 `total=130 flower=53 leaf=100 fruit=53 animal=10 insect=10 dinosaur=10`（分类 6 条含 `section`）；后端 `mvn test` 退出码 0（**21 用例，0 失败/0 错误/0 跳过**）；前端 `npx vitest run` **58/58** 通过、`vite build` 退出码 0；`docker compose up -d --build` 重建后健康（`/api/health` = UP）；导入连跑两次幂等（import_log 2260→2520，delta **+260 = 2×130**；Mongo **130 条目 / 6 分类**无重复；导入后立即 `redis sh:*` = 0）；`npx playwright test` **37/37** 通过。**门禁中发现并修复 1 个真实缺陷**（见 §八）。QA 放行。 |

> **编号口径（2026-10-17 阶段 4 修正）**：实现阶段曾出现后端 / 前端 / E2E 三层都从 TC-71 起编号的冲突。现统一以本手册为准：后端 TC-71~TC-77、前端 TC-79~TC-88、E2E TC-89~TC-95、语料与资产 TC-96~TC-100；新增子用例用字母后缀（如 TC-80a/TC-80b）。测试代码中的用例名已按此口径改名。

## 一、后端集成测试（Maven，`mvn test`）— 新增
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-71 | 板块列表 `?section=plant` | `GET /api/plants?section=plant` | 计数 = 植物条目数（100）；条目的 `parts` ⊆ {flower,leaf,fruit} | 通过 |
| TC-72 | 板块列表 `?section=animal`（单键） | `GET /api/plants?section=animal` | 计数 = 10；每条 `parts` 恰 1 键 = `[animal]`；`coverImage` = 对应动物图 | 通过 |
| TC-73 | 未知板块 40002 | `GET /api/plants?section=nope` | `code=40002`，message 友好 | 通过 |
| TC-74 | 分类列表含新板块与 `section` | `GET /api/categories` | 共 6 条、按 `order` 升序（flower1…dinosaur6）；每条含 `section`（flower/leaf/fruit=plant，animal/insect/dinosaur 同名） | 通过 |
| TC-75 | 排序稳定性（`sort ASC, id ASC`） | `?section=animal` 连续请求 2 次对比顺序 | 两次顺序一致；等于按 `sort` 升序、同 `sort` 再按 `id` 升序 | 通过 |
| TC-76 | 全部条目（无参，跨板块，兼容） | `GET /api/plants` | 计数 = 130（100 植物 + 30 试点）；无重复 id | 通过 |
| TC-77 | 分类列表 `?category=animal`（单键封面） | `GET /api/plants?category=animal` | 计数 = 10；封面为动物图（`category` 命中单键部位） | 通过 |

> 实测补充（QA 手工核对 API）：`?category=flower→53`、`?category=leaf→100`、`?category=fruit→53`、`?section=plant→100`、`?section=animal/insect/dinosaur→10/10/10`、`/api/categories→6`。

## 二、前端组件测试（Vitest，`npx vitest run`）— 新增
> 说明：jsdom 不计算级联样式，样式断言沿用既有做法（读 `src/styles.css` 源文件）；`Audio` 与 `speechSynthesis` 用 stub 注入。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-79 | 站点改名 | `render(<HomePage/>)` | 标题为 `自然小图鉴` / `zì rán xiǎo tú jiàn` / `Nature Guide`（无「植物小花园」残留） | 通过 |
| TC-80a | 板块导航渲染与切换 | 渲染首页；点击「动物」板块按钮 | 出现 `.section-nav` 4 按钮且默认选中「植物」；切到动物后二级筛选消失并渲染板块列表 | 通过 |
| TC-80b | 非植物板块空态 | 恐龙板块返回空列表 | 文案「这个板块还没有内容哦」 | 通过 |
| TC-81 | 植物二级筛选仅植物板块 / 切换触发板块请求 | 渲染首页 → 点「动物」→ 点回「植物」 | 植物板块出现 `.category-filter`（全部/花朵/树叶/果实）；其它板块不出现；请求带 `?section=`（mock `getPlantsBySection` 断言调用）；切回植物后回到「全部」 | 通过 |
| TC-82a | 单图详情分支 | 输入单键条目（`parts:{animal:{...}}`） | **不渲染** `PartSwitcher`；渲染大图（`src` = 该图）、说明与「小知识」卡片 | 通过 |
| TC-82b | 单图 + 缺英文音频 | 恐龙条目（`en` 有、`audioEn` 缺） | 不渲染部位切换；渲染中文喇叭；**不渲染**英文喇叭 | 通过 |
| TC-83 | 植物详情分支不回归 | 输入 `apple`（三部位） | 仍渲染 `PartSwitcher`；US-8 默认部位跟随分类成立 | 通过 |
| TC-84a | `PART_ORDER` / `PART_LABELS` 扩展 | 直接断言导出常量 | `PART_ORDER = ['flower','leaf','fruit','animal','insect','dinosaur']`；标签含板块部位 | 通过 |
| TC-84b | `getOrderedParts` 支持单键板块部位 | 传入单键/混合 `parts` | `{animal:{}}→['animal']`；`{insect:{},animal:{}}→['animal','insect']`；植物三部位顺序不变 | 通过 |
| TC-88 | 小知识卡片称谓与不渲染 | `allusion` 有/无内容 | `aria-label` 为「小知识」；无内容不渲染卡片 | 通过 |
| TC-25b | 样式断言（增量） | 读 `src/styles.css` | `.section-nav` 与 `.category-filter` 同组 flex 且 `gap ≥ 16px`、板块导航独立 `margin-bottom ≥ 16px`、`.filter-btn` 热区 ≥56px | 通过 |
| TC-11（更新） | 二级筛选过滤板块分类 | 渲染首页（`/api/categories` 含 6 条） | 筛选条恰 4 钮（全部/花朵/树叶/果实）；动物/昆虫/恐龙**不出现**在筛选条内 | 通过 |
| TC-85/86/87（音频：播放 / 降级 / 互斥与场景停止） | — | 由 Sprint 5 用例 `TC-45a ~ TC-45f` 覆盖（改用 `useAudio` 后重跑） | 点击喇叭 `audio.play()`、再点即 `pause`；无音频不渲染且**不调用** `speechSynthesis`；换株/切部位/回花园/全屏进出均停止 | 通过（见 §五 回归） |

## 三、E2E（Playwright，`npx playwright test`）— 新增
> 前置：`docker compose` 已启动、nginx 在 `http://localhost:80`、列表就绪（等 `.plant-card` 计数稳定）。

| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-89 | 站点标题 | 打开首页 | 标题 = `自然小图鉴` + `zì rán xiǎo tú jiàn` + `Nature Guide`；无「植物小花园」 | 通过 |
| TC-90 | 四板块导航 + 二级筛选归属 | 依次点击 植物/动物/昆虫/恐龙 | 板块导航 4 钮；植物板块出现二级筛选且**恰 4 钮**（不含板块分类）；动物/昆虫/恐龙各渲染 10 张卡片、无二级筛选 | 通过 |
| TC-91a | 动物单图详情无部位切换 | 动物板块点「大熊猫」进详情 | 无 `[role=tab]`；大图 `/images/animals/giant-panda.jpg`；说明与小知识卡片存在 | 通过 |
| TC-91b | 植物详情保留部位切换（单图分支不误伤） | `/plants/apple` @1024×768 与 768×1024 | 3 个部位标签；大图可见 | 通过 |
| TC-92 | 恐龙骨架化石 | 恐龙板块点「霸王龙」进详情 | 无部位切换；大图为 `/images/dinosaurs/tyrannosaurus.jpg`（完整骨架）；小知识卡片存在 | 通过 |
| TC-93 | 预生成音频（AAC `.m4a`） | 详情页点中文 / 英文喇叭（`page.route` 桩住音频响应） | 发出对 `/audio/giant-panda-zh.m4a`、`/audio/giant-panda-en.m4a` 的请求 | 通过 |
| TC-94 | 排序稳定性端到端 | 进动物板块记录卡片顺序 → 刷新重进 | 两次顺序完全一致，首项为「大熊猫」（`sort=1`） | 通过 |
| TC-95 | 植物板块「全部」限定板块内 | 植物板块「全部」 | 恰 100 张卡片；不含动物「大熊猫」与恐龙「霸王龙」条目 | 通过 |

> TC-93 采用 `page.route('**/audio/*.m4a')` 桩住响应后断言**请求 URL 契约**：headless Chromium 无 AAC 解码能力，故不依赖实际解码成功，只验证前端向预生成音频路径发请求（跨设备一致性的前端侧契约）。

## 四、语料与资产校验（导入前第 0 步 + 导入幂等）
| 编号 | 用例 | 期望 | 状态 |
|---|---|---|---|
| TC-96 | 语料 schema 全量 | 导入脚本第 0 步校验通过：分类 6 条（含 `section`）；植物/动物/昆虫/恐龙条目 schema 合规；`parts` 键合法；单键板块键 = 唯一分类 code | 通过 |
| TC-97 | 小知识与说明限长 | 数据驱动：板块 `allusion.text` ≤60 字、`explain` ≤50 字、`description` ≤80 字且无拉丁字母（后端 TC-24 覆盖全部 130 条） | 通过（实测 max text=28 / max explain=19） |
| TC-98 | 图片资产存在性 | 30 张试点图存在（动物 10 / 昆虫 10 / 恐龙 10，恐龙为完整骨架化石，1920×1920）；既有 206 张植物图不变（后端 TC-12 覆盖） | 通过 |
| TC-99 | 音频资产存在性 | `frontend/public/audio/` 共 260 个 `.m4a`（zh 130 + en 130）；导入脚本对字段指向的文件做存在性校验 | 通过 |
| TC-100 | 导入幂等 | 连跑两次：Mongo 条目与分类无重复、`import_log` delta = 2×总数、Redis `sh:*` 导入后为 0 | 通过（2260→2520，delta +260） |

## 五、全量回归（Sprint 1~8 用例）
| 范围 | 用例 | 期望 | 状态 |
|---|---|---|---|
| 后端 | TC-01 ~ TC-13、TC-24、TC-57、TC-58 | 全量通过（含「全部计数」改数据驱动 = 130；TC-11 对板块条目放宽 `source` 断言、植物保持严格） | 通过（21 用例） |
| 前端单测 | TC-11 ~ TC-21、TC-25、TC-12b、TC-28 ~ TC-34、TC-41 ~ TC-45f、TC-53 ~ TC-70 | 全部通过（含 US-6/US-7/US-8、Sprint 6 无滚动、Sprint 7 封面/字号、Sprint 8 派生；TC-45a~45f 已改用 `useAudio`） | 通过（58 用例） |
| E2E | TC-22、TC-23、TC-26、TC-27、TC-35 ~ TC-40、TC-46 ~ TC-52、TC-61 ~ TC-70 | 全部通过（首页标题类断言按改名更新后） | 通过（37 用例含新增） |

## 六、PRD §14.5 增量验收矩阵（QA 裁决依据）
| PRD 条款 | 验收方式 | 对应用例 |
|---|---|---|
| §14.5-26 站点改名「自然小图鉴 / zì rán xiǎo tú jiàn / Nature Guide」 | 单测 + E2E | TC-79、TC-89 |
| §14.5-27 四板块顶层两级导航；植物二级筛选；其余平铺 | 单测 + E2E | TC-80a、TC-80b、TC-81、TC-90、TC-95、TC-11 |
| §14.5-28 单图详情无部位切换；植物部位切换不回归 | 集成 + 单测 + E2E | TC-72、TC-82a、TC-82b、TC-83、TC-91a、TC-91b、TC-92 |
| §14.5-29 小知识卡片可渲染；正文 ≤60/解释 ≤50；无内容不渲染 | 语料校验 + 单测 | TC-88、TC-97 |
| §14.5-30 预生成音频（AAC `.m4a`）播放；跨设备一致；缺失不渲染不回退 | 单测 + E2E | TC-82b、TC-85/86/87（TC-45 家族）、TC-93 |
| §14.5-31 列表顺序 = `sort ASC + id ASC`，重复请求稳定 | 集成 + E2E | TC-75、TC-94 |
| §14.5-32 既有 v1.0~v1.5 验收不回归 | 全量回归 | §五 |
| §14.5-33 平板横竖屏板块导航与单图详情正常；热区 ≥56px | E2E + 样式断言 | TC-90、TC-91a、TC-91b、TC-25b |

## 七、放行标准（QA 裁决）
1. TC-71 ~ TC-100（本迭代新增，含字母后缀子用例）全部「通过」，无跳过；§六 验收矩阵逐条打勾。
2. 既有 TC-01 ~ TC-70 回归全部通过（含 US-6/US-7/US-8、Sprint 6 无滚动、Sprint 7 封面/字号、Sprint 8 派生）。
3. `mvn test`、`npx vitest run`、`vite build`、`npx playwright test` 退出码均为 0；`docker compose` 健康、导入两次幂等成立；语料校验 `total=130`、分类 6。
4. 接口路径不变；`/api/categories` 增 `section`、`/api/plants` 增 `section` 参数均为向后兼容；既有 100 植物路径与图片不变。
5. 以上全部满足后 QA 放行，Master 执行 commit。

## 八、门禁发现的缺陷与修复（QA 记录）
| 编号 | 现象 | 根因 | 修复 | 验证 |
|---|---|---|---|---|
| D9-1 | 首页植物板块二级筛选渲染 **7 个按钮**（全部/花朵/树叶/果实/动物/昆虫/恐龙） | `HomePage` 直接透传 `/api/categories` 的 6 条分类给 `CategoryFilter`，未按 `section` 过滤 | `HomePage` 新增 `plantCategories = categories.filter(c => c.section === 'plant')` 后再传入 | E2E TC-90 由失败转通过；新增 TC-11 断言（筛选条恰 4 钮且不含板块分类）；vitest 58/58、E2E 37/37 |
| D9-2 | 后端 / 前端 / E2E 三层用例编号均从 TC-71 起，编号冲突 | 阶段 3 各角色并行开发未对齐 QA 手册编号 | 统一按本手册口径改名：前端 TC-79~TC-88、E2E TC-89~TC-95 | 改名后三层用例全绿，编号无重叠 |
