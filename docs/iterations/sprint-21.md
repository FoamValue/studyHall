# Sprint 21 — v3.2 数字卡片文案一致性修复

| 项 | 内容 |
|---|---|
| 迭代目标 | 修复 v3.1 遗留：数字卡图片已换朱砂小苹果，但 21 条语料 `description` 仍写「小圆点」，导致详情页文字与画面矛盾（人工复核发现）。统一为「小苹果」口径。 |
| 状态 | **已交付**（2026-10-24 门禁全绿、QA 放行） |
| 依据 | [PRD.md §25](file:///Users/chenxinjie/Mirror/github/studyHall/docs/product/PRD.md)（v3.2 增量，US-32，验收 98~101） |
| 类型 | **纯语料文案修复**（图片 / 前后端产品代码 / 路由 / 接口契约 / 音频零改动） |
| 基线（Sprint 20 交付后） | 语料 440 / 分类 8；图片 `.jpg` 448；音频 `.m4a` 1028；后端 28 / vitest 90 / E2E 87 |

## 一、范围

| 编号 | 范围项 | 认领 | 说明 |
|---|---|---|---|
| S21-1 | 21 条数字 `description` 文案改为「小苹果」 | PO + 内容 | `1`~`20`：「数一数，这里有 N 个小苹果，就是{中文名}。」；`0`：「一个苹果也没有，就是零。」 |
| S21-2 | 文档口径同步 | PO / UI / Master | PRD §25；UI 规范 U16-1 标注「已被 U20-1 取代」；本计划 |
| S21-3 | 测试夹具同步 | QA | `PlantDetailPage.test.jsx` 两处 mock 文案改「小苹果」（断言语义不变） |
| S21-4 | 门禁与放行 | QA | 六步门禁全绿；手册 `docs/qa/sprint-21-test-cases.md` |
| S21-5 | 状态更新与 commit | Master | AGENTS.md 阶段行 + commit（不 push） |

## 二、实现契约

- 仅修改 `content/numbers/number-{0..20}.json` 的 `parts.number.description` 字段；其余键零改动。
- 生效依赖 `node scripts/import-plants.mjs`（两次导入幂等，delta = 2×440）。
- 前端零改动；测试仅同步 mock 文案（`PlantDetailPage.test.jsx` L189 / L886）。

## 三、验收对应

| 验收 | 内容 | 落点 |
|---|---|---|
| 98 | 21 条文案统一、全库「圆点」残留 0 | S21-1 |
| 99 | 导入后 API 返回新文案 | S21-1 / 门禁第 4 步 |
| 100 | 三层测试全绿（28 / 90 / 87） | S21-3 / S21-4 |
| 101 | 详情页文字与画面一致 | 人工抽验 |

## 四、风险

| 编号 | 风险 | 对策 |
|---|---|---|
| R21-1 | 只改文案忘导入，线上仍旧文案 | 门禁第 4 步强制双导入 + API 抽验 |
| R21-2 | 文案超长 / 含拉丁字母触内容校验 | 模板固定、沿用既有红线；后端内容校验覆盖 |
| R21-3 | 图片与小知识文案口径再次不一致 | 本迭代只统一计数物称谓；小知识保持原样（无「圆点」表述） |

## 五、交付与门禁证据（2026-10-24，六步全绿）

| 步 | 内容 | 实测 |
|---|---|---|
| 0 | 语料 / 资产校验 | **PASS**：`categories=8`、`total=440`、`.jpg` 448、`.m4a` 1028；21 张数字图 1600×1600 渐进式（合计 986KB）；`content/` 内「圆点」**0 命中** |
| 1 | 后端 `mvn test` | **PASS**：surefire `tests=28 failures=0 errors=0 skipped=0`，退出码 0 |
| 2 | 前端 vitest / build | **PASS**：vitest **90/90**（4 文件）；`vite build` 退出码 0（CSS 13.72 kB / JS 280.84 kB） |
| 3 | compose 重建 + health | **PASS**：`/api/health=UP`、`/`=200、`/images/numbers/number-9.jpg`=200 |
| 4 | 两次导入幂等 | **PASS**：`import_log` 14872 → **15752**（delta **+880 = 2×440**）；Mongo **440 条目 / 8 分类**（deprecated 2 不物理删除）；`redis sh:*` = 0；API `number-9.description` = 「数一数，这里有 9 个小苹果，就是九。」；all=438 |
| 5 | E2E 全量 | **PASS**：`npx playwright test` **87/87**（6 workers，29.5s，退出码 0） |

### 5.1 缺陷记录

| # | 类型 | 描述 | 处理 | 状态 |
|---|---|---|---|---|
| D21-1 | 环境 / 流程（**非产品缺陷**） | 首次按精简命令启动后端测试容器时报 Testcontainers `Could not connect to Ryuk` | 改用项目既有门禁命令（`TESTCONTAINERS_RYUK_DISABLED=true` + `TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal` + 挂 docker socket + 仓库根挂载）→ 28/28 | **已修复** |
| D21-2 | 流程（**非产品缺陷**） | 首次校验 compose 时误用后端端口 `:8080/` 取静态资源，得 500 | 前端容器暴露 **80**，改 `http://localhost/` 校验 → 200；后端 8080 仅 `/api/**` | **已纠正** |

### 5.2 遗留待人工确认

- 数字详情页文案与画面一致性**真机抽验**（`/plants/number-{0,9,20}`）。
- 沿用历史遗留：字母 / 拼音 / 数字 / 颜色 / 植物部位音频真机听感；封面与过渡动画真机观感。
