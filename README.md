<div align="center">

# 自然小图鉴 · Nature Guide

**面向 3–6 岁幼儿的「自然认知图鉴」网页应用**

打开即看 · 无需登录 · 平板优先 · 零后台运维

![板块](https://img.shields.io/badge/板块-植物%20%7C%20动物%20%7C%20昆虫%20%7C%20恐龙-4CAF50)
![前端](https://img.shields.io/badge/前端-React%2018%20%2B%20Ant%20Design-61DAFB)
![后端](https://img.shields.io/badge/后端-JDK%2026%20%2B%20Spring%20Boot%204-6DB33F)
![部署](https://img.shields.io/badge/部署-Docker%20Compose-2496ED)
![测试](https://img.shields.io/badge/门禁-后端21%20%2F%20前端67%20%2F%20E2E47-important)
![License](https://img.shields.io/badge/License-MIT-yellow)

</div>

---

## 一、这是什么

**自然小图鉴（Nature Guide）** 是一个为幼儿园学龄儿童（约 3–6 岁）设计的自然认知图鉴网站。孩子用平板浏览器打开就能看，不需要注册、不需要登录、没有广告、不收集任何个人信息。

项目围绕 **「认识身边的真实世界」** 展开，按四个板块组织内容：

| 板块 | 浏览粒度 | 内容模型 |
|---|---|---|
| 🌸 **植物** | 花朵 / 树叶 / 果实 二级分类 | **多部位切换**（花 / 叶 / 果各一图） |
| 🐾 **动物** | 板块即粒度 | 单图 + 一条小知识 |
| 🐛 **昆虫** | 板块即粒度 | 单图 + 一条小知识 |
| 🦕 **恐龙** | 板块即粒度 | 单图 + 一条小知识（一律完整骨架化石图） |

每个条目都提供 **拼音 + 中文名 / 英文名 + 音标**、**低龄化中文说明**、**小知识卡片**，以及 **预生成的中英文语音朗读**——让还不识字的孩子也能自己看懂、跟着念出来。

> 目标场景：家长把平板递给孩子，孩子自己点、自己看、自己听，不需要大人全程陪同。

---

## 二、核心特性

### 🎯 低龄友好的浏览体验
- **大字号、大按钮、大热区**：所有可交互元素点击热区 ≥ 56px，符合平板触控标准。
- **三步到达**：从打开首页到看到任意条目详情，操作不超过 3 次点击。
- **平板优先响应式**：以 iPad 横屏（1024×768）为基准设计，兼顾 1180×820 与常见平板尺寸。

### 🖼 沉浸式详情浏览（v1.1）
- 详情页默认**沉浸式全屏**：图片占满视口、隐藏站点标题与多余留白，无页面级滚动条。
- **左右滑动 / 两侧大按钮 / 键盘 ← →** 三种通道切换上一条目 / 下一条目，行为完全一致，支持**首尾循环**。
- 点部位按钮切换花 / 叶 / 果（仅植物板块），**同一手势不承担两种语义**。
- 另设「全屏」按钮触发系统 Fullscreen API，Esc 或退出按钮返回沉浸式态且浏览位置不丢。
- 返回首页后**精确恢复**此前的板块 / 分类筛选与列表滚动位置。

### 🔊 预生成语音朗读（v1.2 → v2.0）
- 详情页中文名、英文名各一个朗读喇叭，只读名称本身，帮助孩子跟读。
- v2.0 起升级为 **预生成 AAC `.m4a` 音频**（`/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`），**任何设备听感一致**。
- 音频缺失时喇叭不渲染，不做浏览器实时合成的静默回退。

### 🧠 小知识卡片（v2.0）
- 原「典故」卡片升级为 **「小知识」**：植物沿用古诗典故 + 白话解释；动物 / 昆虫 / 恐龙使用冷知识、习性、分布位置等。
- 卡片带用户可见的「小知识」标题，正文与解释均限长，保证低龄可读。

### 🔄 名实一致（v1.4 → v1.5）
- 卡片封面、卡片标题、详情默认部位**三者同时跟随入口分类**。
- 在「树叶」分类点苹果 → 卡片显示「苹果叶」、封面是叶、详情默认展示叶子图，不会出现「名字说苹果、图是叶子、点进去却是花」的混乱。

### 📥 AI 接管的内容扩容通道（零后台）
- 不开发管理后台、不设管理员账号。内容由 AI 依照约定 schema 生产，通过**导入脚本**灌入内容库。
- 新增内容**无需改一行代码**：Sprint 11 用该通道把动物 / 昆虫 / 恐龙从各 10 种扩到各 30 种，全程零代码改动。
- 导入**幂等**：同 `id` UPSERT 覆盖，重复执行不产生重复数据，并自动清理相关缓存。

---

## 三、技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 + React Router 6 + Ant Design 5 + Vite 5，生产由 **nginx** 承载静态资源并反代 `/api` |
| 后端 | **JDK 26** + Spring Boot 4.1 + Maven，REST 只读接口 |
| 中间件 | MongoDB（内容文档）、Redis（查询缓存，TTL 600s）、MySQL（导入审计 `import_log`） |
| 内容通道 | Node.js ≥ 22 脚本（`mongodb` / `mysql2` / `redis` 官方驱动） |
| 部署 | Docker + Docker Compose 一键编排（前端 / 后端 / 三中间件五容器） |
| 测试 | JUnit + Testcontainers（后端 21 用例）、Vitest + Testing Library（前端 67 用例）、Playwright（E2E 47 用例） |

**中间件版本**（每个版本均已本地实测通过）：MySQL `8.0` · Redis `7` · MongoDB `8.0.4` · nginx `alpine` · JDK `eclipse-temurin 26-jdk/26-jre` · Maven `3.9-eclipse-temurin-26` · Node `22-alpine`。

---

## 四、架构简介

```
客户端（平板浏览器）
      │
      ▼  http://<host>/            ├─ 静态资源（React 构建产物 dist/）
   nginx ─────────────────────────┤─ /images/**, /audio/** 同源托管
      │                           └─ /api/ 反代 → backend:8080（保留 /api 前缀）
      ▼
   backend (Spring Boot)
      │ 读路径：Redis 缓存 → 未命中查 MongoDB → 回填 Redis（TTL 600s）
      ▼
   MongoDB（内容文档 plants 集合）
```

- **读多写少**：前台纯只读、无用户输入，接口全部为 `GET`；查询结果走 Redis 缓存，导入通道负责清理缓存。
- **内容即数据**：所有条目以 JSON 语料形式入库，产品行为（板块、分类、排序）由数据驱动，代码不硬编码内容。
- **审计可追溯**：每次导入为每个条目写入 MySQL `import_log` 一条 UPSERT 记录。
- **排序稳定**：语料 `sort` 字段生效，列表统一按 `sort ASC + id ASC` 返回，跨请求顺序一致。

---

## 五、目录结构

```
studyHall/
├── content/                       # 内容语料（产品即数据）
│   ├── categories.json            # 6 个分类（含 section 板块归属 + order）
│   ├── plants/    (100 条)        # 植物：多部位（flower/leaf/fruit）
│   ├── animals/   ( 30 条)        # 动物：单键 parts.animal
│   ├── insects/   ( 30 条)        # 昆虫：单键 parts.insect
│   └── dinosaurs/ ( 30 条)        # 恐龙：单键 parts.dinosaur（骨架化石图）
├── backend/                       # Spring Boot 后端
│   ├── src/main/java/com/studyhall/plants/
│   │   ├── controller/            # PlantController（/api/health|categories|plants|plants/{id}）
│   │   ├── service/               # PlantService（缓存、分类、封面派生、排序）
│   │   ├── repository/            # Spring Data Mongo Repository
│   │   ├── model/                 # Plant/PlantCard/Category/I18nName/PlantImage...
│   │   ├── mysql/                 # ImportLog 审计写入
│   │   └── config/                # CORS、全局异常、ApiException
│   ├── src/test/java/             # 21 个用例（Testcontainers 起真实中间件）
│   └── Dockerfile                 # 多阶段：maven:3.9-temurin-26 构建 → temurin-26-jre 运行
├── frontend/                      # React 前端 + nginx
│   ├── src/
│   │   ├── pages/                 # HomePage（板块/分类 + 增量加载）、PlantDetailPage（沉浸式）
│   │   ├── components/            # PlantCard / CategoryFilter / SectionNav / PartSwitcher /
│   │   │                          # AllusionCard（小知识）/ SpeakButton / PartIcon
│   │   ├── hooks/                 # useAudio（预生成音频）/ usePlantNavigation / useSpeech
│   │   ├── api/client.js          # 统一 fetch 封装
│   │   └── __tests__/             # Vitest 组件测试
│   ├── e2e/                       # Playwright E2E（smoke/navigation/responsive/speech/sprint*）
│   ├── public/images/             # 图片资产（plants 206 jpg + 206 svg 回滚备份 / 三板块各 30 jpg）
│   ├── public/audio/              # 预生成音频（380 个 .m4a = 190 条 × zh/en）
│   ├── nginx.conf                 # SPA 路由回退 + /api 反代
│   └── Dockerfile                 # 多阶段：node:22-alpine 构建 → nginx:alpine 运行
├── scripts/
│   ├── import-plants.mjs          # 内容导入通道（校验 → UPSERT Mongo → 清 Redis → 写审计）
│   └── generate-svgs.mjs          # 早期 SVG 资产生成脚本（保留）
├── docs/                          # 项目文档（见第十节）
├── docker-compose.yml             # 五容器编排
├── package.json                   # 根目录脚本依赖（导入通道 + Playwright）
└── AGENTS.md                      # AI 团队协作规则与项目状态
```

---

## 六、快速开始

### 6.1 一键部署（推荐）

前置条件：已安装 **Docker** 与 **Node.js ≥ 22**（导入脚本需在宿主机运行）。

```bash
# 1. 启动五个容器（mysql / redis / mongo / backend / frontend）
docker compose up -d --build

# 2. 首次运行前安装导入脚本依赖（在仓库根目录）
npm install

# 3. 导入内容语料（幂等，可重复执行）
node scripts/import-plants.mjs
```

### ✅ 部署完成，访问地址

| 入口 | 地址 | 说明 |
|---|---|---|
| **前台页面** | <http://localhost> | 平板 / 电脑浏览器打开即用，推荐全屏体验 |
| 后端健康检查 | <http://localhost:8080/api/health> | 期望返回 `{"code":0,"data":{"status":"UP"},"message":"ok"}` |
| 局域网平板访问 | `http://<宿主机内网IP>`（如 `http://192.168.1.100`） | 无需任何额外配置，nginx 已同源托管页面、图片与语音 |

> 查询宿主机内网 IP：macOS 执行 `ipconfig getifaddr en0`，Windows 执行 `ipconfig`，Linux 执行 `hostname -I`。

### 6.2 本地开发

```bash
# 1. 只起三个中间件（前端/后端跑在宿主机）
docker compose up -d mysql redis mongo

# 2. 后端（默认连 localhost 中间件，端口 8080）
cd backend && mvn spring-boot:run

# 3. 前端（Vite dev server，默认 5173，已配置 /api → localhost:8080 代理）
cd frontend && npm install && npm run dev
```

**开发模式访问地址**：

| 入口 | 地址 |
|---|---|
| 前台页面（Vite dev server） | <http://localhost:5173> |
| 后端直连 | <http://localhost:8080/api/health> |

> 开发模式下页面由 Vite 提供，`/api` 请求自动代理到后端 8080；图片与语音由 `frontend/public/` 直接服务，与生产环境行为一致。

### 6.3 导入内容

```bash
node scripts/import-plants.mjs
```

可用环境变量覆盖连接目标（全部可省略，默认连本机 Docker 映射端口）：

| 变量 | 默认值 |
|---|---|
| `MONGO_URI` | `mongodb://localhost:27017` |
| `MONGO_DB` | `studyhall` |
| `REDIS_URI` | `redis://localhost:6379` |
| `MYSQL_URI` | `mysql://studyhall:studyhall@localhost:3306/studyhall` |

脚本行为（幂等）：

1. 读取 `content/categories.json` 与四个内容目录下所有条目 JSON，**先整体校验，不合法立即报错退出**（校验覆盖 schema、分类与部位键一致性、图片 / 音频文件是否存在、文案长度与「说明不含拉丁字母」等红线）；
2. 按 `_id = id` **UPSERT** 进 MongoDB（同 id 覆盖，不产生重复）；
3. `SCAN` 删除 Redis 中 `sh:*` 前缀缓存（后端 TTL 600s 兜底）；
4. 确保 MySQL `import_log` 表存在，并为每个条目写入一条 UPSERT 审计记录。

---

## 七、接口契约

所有接口均为 `GET`，响应统一封装为 `{ code, data, message }`（`code = 0` 表示成功）。

| 接口 | 说明 |
|---|---|
| `GET /api/health` | 健康检查，返回 `{ status: "UP" }` |
| `GET /api/categories` | 分类列表（按 `order` 升序），含 `section` 板块归属 |
| `GET /api/plants?category=&section=` | 条目卡片列表。`category`（二级筛选）优先于 `section`（板块），两者缺省 = 全部条目；非法分类返回 `code=40001`，未知板块返回 `code=40002` |
| `GET /api/plants/{id}` | 条目完整文档；不存在返回 `code=40401` |

**卡片列表返回结构（`PlantCard`）**：`id`、`name`（含中文 / 拼音 / 英文 / 音标与可选音频路径）、`coverImage`、`parts`（该条目实际拥有的部位 code，顺序固定）。其中 `coverImage` 在请求带分类时优先取该分类对应部位的首图，缺失则按 `flower → leaf → fruit → animal → insect → dinosaur` 回退。

加载策略：查询走 Redis 缓存（TTL 600s），未命中查 MongoDB 并回填；列表统一 `sort ASC + id ASC`。

---

## 八、内容数据模型

### 8.1 分类（`content/categories.json`）

```json
{ "code": "animal", "nameZh": "动物", "pinyin": "dòng wù",
  "nameEn": "Animal", "order": 4, "section": "animal" }
```

六个分类：`flower`/`leaf`/`fruit`（同属 `plant` 板块，有二级筛选）+ `animal`/`insect`/`dinosaur`（板块即粒度）。

### 8.2 条目（以 `content/animals/cat.json` 为例）

```json
{
  "id": "cat",
  "categories": ["animal"],
  "sort": 12,
  "name": {
    "zh": "猫", "pinyin": "māo", "en": "Cat", "ipa": "/kæt/",
    "audioZh": "/audio/cat-zh.m4a", "audioEn": "/audio/cat-en.m4a"
  },
  "parts": {
    "animal": {
      "name": { "zh": "猫", "pinyin": "māo", "en": "Cat", "ipa": "/kæt/" },
      "images": [{ "type": "photo", "url": "/images/animals/cat.jpg" }],
      "description": "猫有软软的毛和尖尖的小爪子。它喜欢白天晒太阳，晚上捉老鼠。",
      "allusion": {
        "text": "猫的胡须能帮它量一量，前面的洞能不能钻过去。",
        "explain": "胡子就像一把小尺子。"
      }
    }
  }
}
```

- 植物条目用 `parts.flower` / `parts.leaf` / `parts.fruit` 多键；动物 / 昆虫 / 恐龙用单键（键名 = 分类 code）。
- `parts` 键集合为 `{flower, leaf, fruit, animal, insect, dinosaur}`，可缺省；缺某部位则前端不显示对应标签。
- 每个部位可含多张图片，`type ∈ {photo, illustration}`。
- 拼音与音标为**独立字段**存储，不做运行时自动标注。
- 文案红线：植物 `description` 低龄化；动物 / 昆虫 / 恐龙 `description` ≤ 80 字且不含拉丁字母；`allusion.text` ≤ 60 字、`explain` ≤ 50 字。

### 8.3 图片与音频资产路径约定

| 类型 | 路径规则 |
|---|---|
| 植物部位图 | `/images/plants/{id}-{part}.jpg`（旧 `.svg` 保留作回滚备份） |
| 动物 / 昆虫 / 恐龙图 | `/images/{animals\|insects\|dinosaurs}/{id}.jpg` |
| 语音 | `/audio/{id}-zh.m4a`、`/audio/{id}-en.m4a`（AAC，中 / 英各一） |

> 图片统一 1920×1920；恐龙一律为**完整骨架化石**照片（博物馆陈列风格）。

---

## 九、测试与质量门禁

项目采用「**自动化测试全部通过才允许提交**」的硬性门禁。每个迭代收尾执行以下六步全量验证：

| 步骤 | 命令 | 当前基线 |
|---|---|---|
| 0. 语料校验 | `node scripts/import-plants.mjs`（校验阶段） | `total = 190`，分类 6 |
| 1. 后端测试 | `mvn test`（Testcontainers 起真实中间件） | **21** 用例，退出码 0 |
| 2. 前端测试 + 构建 | `npx vitest run` · `vite build` | **67 / 67**，构建退出码 0 |
| 3. 容器重建 | `docker compose up -d --build` | `/api/health = UP` |
| 4. 导入幂等 | 连续导入两次 | `import_log` delta = 2 × 条目数；Mongo 无重复；导入后 `redis sh:*` = 0 |
| 5. E2E | `npx playwright test` | **47 / 47**（目标 = nginx 80 入口，需先 `docker compose up -d` 并导入内容） |

> `docker compose up -d --build` 而非 `restart`：新增图片 / 音频为静态资源，必须重建 frontend 镜像才会被 nginx 提供。

---

## 十、内容规模

| 项 | 规模 |
|---|---|
| 条目总数 | **190**（植物 100 / 动物 30 / 昆虫 30 / 恐龙 30） |
| 分类 | 6（flower / leaf / fruit / animal / insect / dinosaur） |
| 图片 | 植物 206 张 `.jpg`（+ 206 张 `.svg` 回滚备份）、三板块各 30 张 = **296** 张 `.jpg` |
| 音频 | **380** 个 `.m4a`（190 条 × 中文 / 英文） |
| 后端源码 | 486 行（Java 459 + 配置 27） |
| 前端源码 | 1,524 行（非测试部分） |
| 测试代码 | 2,665 行（后端 559 / 前端单元 1,185 / E2E 921） |
| 项目文档 | 4,347 行（41 份 Markdown） |

内容扩容计划：四个板块上限均为 100 种，动物 / 昆虫 / 恐龙按批次经导入通道扩容（各 30 → ≤100），**全程零代码改动**。

---

## 十一、项目文档

完整的产品与工程文档收录在 [`docs/`](docs/) 目录：

| 目录 | 内容 |
|---|---|
| [`docs/product/`](docs/product/) | 产品需求手册（PRD）、各迭代需求文档、PF 体验裁决 |
| [`docs/iterations/`](docs/iterations/) | Scrum 迭代计划与回顾（sprint-1 ~ sprint-11） |
| [`docs/design/`](docs/design/) | 前端 / 后端开发设计文章、UI 样式与图标规范 |
| [`docs/experience/`](docs/experience/) | PF 浏览器体验报告（iPad 横屏为主，含证据截图） |
| [`docs/qa/`](docs/qa/) | 各迭代测试用例手册与执行记录 |

**推荐阅读顺序**：[产品需求手册 PRD](docs/product/PRD.md) → [后端设计](docs/design/backend-design.md) → [前端设计](docs/design/frontend-design.md) → [UI 规范](docs/design/ui-style-guide.md) → 最新迭代计划与测试用例。

---

## 十二、开发协作模式

本项目由一支 **七个角色的 AI 虚拟团队** 按 Scrum 流程协作开发，规则固化在 [`AGENTS.md`](AGENTS.md)：

| 角色 | 职责 |
|---|---|
| **PO** 资深产品经理 | 与人工澄清需求、编写 PRD、裁决需求与体验优先级 |
| **Master** 资深敏捷教练 | Scrum 流程主持、迭代拆分与排期 |
| **PF** 资深浏览器产品体验师 | 以 **iPad 横屏**实测已交付产品，产出体验报告 |
| **UI** 资深 UI 工程师 | 页面样式与图标设计、视觉与交互规范 |
| **R** 资深 React 工程师 | 前端开发与前端设计文章 |
| **J** 资深 Java 工程师 | 后端开发与后端设计文章 |
| **QA** 资深自动化测试工程师 | 测试用例手册、自动化测试、质量放行 |

**五阶段流程**：需求澄清（PO ↔ 人工）→ 迭代拆分（Master）→ 迭代准备（文档先行）→ 开发推进 → 完成门禁（测试全绿才 commit）→ 体验评审与优化回流（PF → PO → Master）。

**协作铁律**：
- **文档先行**：无《迭代需求文档》不开工，无《测试用例手册》不做收尾。
- **门禁硬性**：自动化测试全部通过后才允许 commit。
- **三轮未决即搁置**：同一事项三轮讨论无法裁决，记录至 `docs/pending-decisions.md` 交由人工终裁，不阻塞流程。

---

## 十三、版本演进

| 版本 | 迭代 | 内容 |
|---|---|---|
| v1.0 | Sprint 1–3 | 首个可交付版本：分类筛选 + 详情部位切换 + 100 种植物 + 写实图片，全量测试通过并冻结 |
| v1.1 | Sprint 4 | 详情页沉浸式全屏连续浏览（滑动 / 按钮 / 键盘换株，首尾循环） |
| v1.2 | Sprint 5 | 详情页中 / 英文名称朗读喇叭 |
| v1.3 | Sprint 6 | 修复 iPad Safari 全屏后出现滚动条与滚动退出全屏 |
| v1.4 | Sprint 7 | PF 体验优化：封面跟随分类、横屏详情版式、卡片次级字号 |
| v1.5 | Sprint 8 | 名实一致修复：卡片标题与详情默认部位跟随入口分类 |
| v2.0 | Sprint 9 | 升级为「自然认知图鉴」：四板块 + 单图模型 + 小知识 + 预生成音频 + `sort` 排序 |
| v2.1 | Sprint 10 | PF 体验回流：小知识可见标题、单图横屏主图放大、首页增量加载 + 「共 N 种」 |
| v2.2 | Sprint 11 | 内容扩容（一）：动物 / 昆虫 / 恐龙各 10 → 30（纯内容，零代码改动；内容已落盘、门禁全绿） |

---

## 十四、许可

本项目基于 [MIT License](LICENSE) 开源发布，版权所有 © 2026 陈鑫杰（[chenxinjie.cn](https://chenxinjie.cn)）。

任何个人或组织均可自由使用、复制、修改、合并、出版、分发、再许可及销售本软件副本，唯一条件是在所有副本或实质性部分中保留原始版权声明与许可声明。本软件按「现状」提供，不附带任何明示或默示的担保。

> 说明：`content/` 目录下的内容语料与 `frontend/public/` 下的图片、音频资产同样按 MIT 提供；其中恐龙板块采用完整骨架化石图片，仅作教育认知用途。

---

<div align="center">

**自然小图鉴 · Nature Guide** — 让孩子认识身边的真实世界 🌿

© 2026 陈鑫杰 · [chenxinjie.cn](https://chenxinjie.cn) · 以 [MIT](LICENSE) 协议开源

</div>
