# 全量回归测试报告 — v2.5（Sprint 14 交付后基线）

| 项 | 内容 |
|---|---|
| 报告编号 | REG-2026-10-18-v2.5 |
| 被测版本 | 本地 HEAD `f854810`（Sprint 14 交付 + 图片体积微调后） |
| 执行角色 | 资深QA自动化测试工程师（QA） |
| 执行日期 | 2026-10-18 |
| 执行方式 | studyHall 门禁六步（`studyhall-sprint-gate`）全量回归 |
| 测试结论 | ✅ **全绿 — 建议放行**（后端 21/21、前端 73/73、E2E 56/56，六步全部通过，无功能缺陷） |

---

## 一、测试目的与范围

本轮为**交付后独立全量回归**，不引入新功能，目的是在 v2.5 内容扩容（动物 / 昆虫 / 恐龙 各 30→50）与后续图片体积微调落地后，对整条链路做一次端到端复验，确认：

- 内容语料 / 图片 / 音频资产规模与完整性符合 v2.5 基线，且无回归；
- 后端接口契约、缓存与导入审计行为不回归；
- 前端组件与构建不回归；
- 容器部署可重建且健康；
- 内容导入通道保持幂等；
- 真实浏览器端到端行为（四板块导航、单图详情、音频、增量加载等）不回归。

范围覆盖 Sprint 1~14 全部已交付能力的回归切片，**不含**新需求验证。

---

## 二、执行环境

| 项 | 值 |
|---|---|
| 工作目录 | `/Users/chenxinjie/Mirror/github/studyHall` |
| 后端测试 | `maven:3.9-eclipse-temurin-26` 容器 + Testcontainers（真实中间件） |
| 前端测试 | Vitest 2.1.9 + Testing Library（jsdom）；`vite build` |
| E2E | Playwright（Chromium，6 workers），目标 `http://localhost`（nginx 80） |
| 部署 | Docker Compose 五容器（frontend / backend / mongo / mysql / redis） |
| 浏览器控制台 | 0 报错（E2E 断言覆盖） |

---

## 三、门禁六步结果总览

| 步骤 | 内容 | 预期 | 实测 | 结论 |
|---|---|---|---|---|
| 0 | 语料 / 资产校验 | total=250，分类 6 | total **250**（100/50/50/50）、分类 **6** | ✅ |
| 1 | 后端 `mvn test` | 退出码 0 | **21/21**，0 失败 / 0 错误 / 0 跳过，退出码 **0** | ✅ |
| 2 | 前端 `vitest run` + `vite build` | 全通过 + 退出码 0 | vitest **73/73**、build 退出码 **0** | ✅ |
| 3 | `docker compose up -d --build` + 健康 | `/api/health=UP` | 重建成功，**`{"status":"UP"}`** | ✅ |
| 4 | 两次导入幂等 | delta = 2×total | **+500 = 2×250**；Mongo 250/6；redis `sh:*`=0 | ✅ |
| 5 | `playwright test` | 全部通过 | **56/56**，退出码 **0** | ✅ |

---

## 四、详细证据

### 步骤 0 — 语料 / 资产校验

```
categories = 6
plants = 100 | animals = 50 | insects = 50 | dinosaurs = 50
TOTAL = 250
flower = 53 | leaf = 100 | fruit = 53
allusion coverage = 356/356 | missing = 0
jpg = 356 | m4a = 500
```

- 四板块计数 **100 / 50 / 50 / 50**，与 v2.5 交付后基线一致；
- 部位计数 `flower=53  leaf=100  fruit=53`，与植物板块基线一致（未回归）；
- **小知识（allusion）覆盖 356/356**，覆盖四板块全部部位（plant 206 + animal 50 + insect 50 + dinosaur 50），**缺失 0**；
- 图片 `.jpg` **356** 张（plants 206 + animals 50 + insects 50 + dinosaurs 50）；
- 音频 `.m4a` **500** 个 = 250 条 ×（zh + en），与 `total × 2` 期望一致。

### 步骤 1 — 后端单元 / 集成测试

```
Tests run: 21, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 11.89 s
   -- in com.studyhall.plants.PlantApiIntegrationTest
BACKEND_EXIT=0
```

- 21 个用例全部通过（Testcontainers 起真实 Mongo / Redis / MySQL）；
- 覆盖接口契约（`health` / `categories` / `plants` / `plants/{id}`）、缓存命中与回填、导入审计、文案长度与「无拉丁字母」红线、排序稳定性等。

> 备注（环境）：首轮执行时 `docker run` 未挂载 `/var/run/docker.sock`，Testcontainers 报 `Could not find a valid Docker environment`，退出码 1。**属命令环境缺参，非产品缺陷**；按门禁规范补挂 socket 与 `TESTCONTAINERS_*` 环境变量后重跑即 21/21 全绿（见「五、缺陷 / 环境问题记录」E-R1）。

### 步骤 2 — 前端单测与构建

```
Test Files  2 passed (2)
     Tests  73 passed (73)
vite v5.4.21 building for production...
✓ 1483 modules transformed.
✓ built in 1.39s
FRONTEND_EXIT=0
```

- 组件 / 钩子 / 样式断言 **73/73** 通过；
- 生产构建成功，产物 `index-*.js 278.44 kB（gzip 93.33 kB）`、`index-*.css 6.65 kB（gzip 1.80 kB）`。

### 步骤 3 — 部署重建与健康

```
Container studyhall-mysql Healthy
Container studyhall-mongo Healthy
Container studyhall-redis Healthy
HEALTH={"code":0,"data":{"status":"UP"},"message":"ok"}
COMPOSE_DONE
```

### 步骤 4 — 导入幂等与数据一致性

```
BASE=5180
IMP1_EXIT=0
IMP2_EXIT=0
AFTER=5680
DELTA=500
MONGO=250 6
REDIS_AFTER=0
API_ALL=250
API_PLANT=100
API_ANIMAL=50
API_INSECT=50
API_DINO=50
API_FLOWER=53
IMPORT_OK
```

- **幂等成立**：`import_log` 5180 → 5680，窗口 delta **+500 = 2 × 250**；
- MongoDB **250 条目 / 6 分类**，无重复；
- 导入后缓存清理有效：`redis sh:*` = **0**；
- API 计数与语料一致：all=**250**、plant=**100**、animal=**50**、insect=**50**、dinosaur=**50**、flower=**53**。

### 步骤 5 — 端到端（Playwright）

```
Running 56 tests using 6 workers
························································
  56 passed (13.9s)
E2E_EXIT=0
```

用例分布（按 spec）：

| 文件 | 覆盖重点 |
|---|---|
| `smoke.spec.js` | 首页加载、板块 / 分类、卡片与详情基础可用性 |
| `navigation.spec.js` | 沉浸式详情、上一条 / 下一条、首尾循环、返回恢复 |
| `responsive.spec.js` | iPad 横屏（1024×768）/ 1180×820 布局、无溢出、热区 |
| `speech.spec.js` | 预生成音频喇叭（渲染 / 不渲染） |
| `sprint9.spec.js` | 四板块导航、单图详情、排序一致性、小知识 |
| `sprint10.spec.js` | 小知识可见标题、单图横屏主图、增量加载 +「共 N 种」 |
| `sprint11.spec.js` | 内容扩容一（各 30 种）断言 |
| `sprint12.spec.js` | 返回文案按板块派生 |
| `sprint13.spec.js` | 植物小知识渲染与部位差异化 |
| `sprint14.spec.js` | 内容扩容二（各 50 种）：板块总量「共 50 种」、末位条目、新增图片 / 音频 HTTP 200 |

---

## 五、缺陷 / 环境问题记录

| 编号 | 类型 | 描述 | 处置 | 影响 |
|---|---|---|---|---|
| E-R1 | 环境（非产品） | 首轮后端测试命令未挂载 `/var/run/docker.sock`，Testcontainers 无法启动真实中间件，报 `Could not find a valid Docker environment`，退出码 1 | 按门禁规范补挂 socket + `TESTCONTAINERS_RYUK_DISABLED` / `TESTCONTAINERS_HOST_OVERRIDE` 后重跑，21/21 全绿 | 无产品影响；仅执行命令缺参 |
| — | 功能缺陷 | **无** | — | — |
| — | 流程缺陷 | **无**（本轮为既定门禁流程复跑，未触发新的流程问题） | — | — |

> 说明：E-R1 不计入产品缺陷率，仅作为执行环境提示记录，供后续门禁命令固化参考。

---

## 六、结论与放行意见

- 六步门禁 **全部通过**，各项计数与 v2.5 交付基线完全一致，**未发现功能回归与流程缺陷**；
- 语料 / 图片 / 音频资产规模与完整性达标，导入通道幂等有效，缓存清理正确，部署可重建且健康；
- 后端 21/21、前端 73/73、E2E 56/56 全绿，浏览器控制台无报错。

**【QA】放行意见：本轮全量回归通过，建议放行。** 本地当前 HEAD `f854810` 的 v2.5 基线质量状态可交付；后续若需对外发布，按既有约定由 Master 执行 commit / push，本报告不含发布动作。

### 待人工抽验（非阻塞，不计入本轮门禁）

- 新增 60 条内容文案的低龄化可读性与音频真机听感，需人工在 iPad 上抽验；
- 植物小知识部分来源出处真实性（jasmine / olive / jujube / pear / kumquat 等）需人工抽验。

---

*报告人：资深QA自动化测试工程师（QA）｜证据均绑定真实命令输出（退出码 / 计数 / 日志片段）｜生成于 2026-10-18*
