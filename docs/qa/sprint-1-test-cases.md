# Sprint 1 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-16 |
| 范围 | Sprint 1 全部自动化用例；全部通过前禁止 commit |
| 执行记录 | 2026-10-17 QA 装配执行：TC-01~TC-17 全部通过，放行（执行环境：macOS Docker Desktop；后端经 maven:3.9-eclipse-temurin-26 容器，Testcontainers 加 `-e TESTCONTAINERS_RYUK_DISABLED=true -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal`；E2E 证据截图 frontend/e2e/evidence/） |

## 一、后端接口测试（JUnit + Testcontainers：mongo:8.0.4 / mysql:8.0 / redis:7，`mvn test`）
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-01 | 健康检查 | GET /api/health | code=0，data.status=UP | 通过 |
| TC-02 | 分类列表 | 导入 categories 后 GET /api/categories | 返回 3 个分类且按 order 升序，字段含 code/nameZh/pinyin/nameEn | 通过 |
| TC-03 | 植物列表-全部 | 导入 8 种种子后 GET /api/plants | 返回 8 条，含 id/name/coverImage/parts | 通过 |
| TC-04 | 植物列表-筛选 | GET /api/plants?category=flower | 仅返回 categories 含 flower 的植物 | 通过（7 条，无银杏） |
| TC-05 | 非法分类 | GET /api/plants?category=abc | code=40001，友好 message | 通过 |
| TC-06 | 植物详情 | GET /api/plants/sunflower | 完整文档：三语名称、flower/leaf/fruit 三部位、说明、典故 | 通过 |
| TC-07 | 缺部位 | GET /api/plants/ginkgo（银杏无 flower） | parts 不含 flower；coverImage 回退到 leaf | 通过（coverImage=/images/plants/ginkgo-leaf.svg） |
| TC-08 | 不存在 | GET /api/plants/nope | code=40401 | 通过 |
| TC-09 | 缓存生效 | 同请求连续两次 | 第二次命中 Redis（耗时明显降低或验证 key 存在） | 通过（0.245s→0.021s；sh:categories 存在，TTL=600） |
| TC-10 | 导入幂等 | 重复执行 import-plants.mjs 两次 | Mongo 无重复（id 唯一），MySQL import_log 新增 2 条记录，Redis 缓存被清 | 通过（ Mongo plants=8 无重复、import_log 每次导入+8 条/两次共 16 条——按 backend-design §5「每植物文件 1 条审计」契约修正期望值；缓存 key 全部清除（见下方修复记录）） |

## 二、前端组件测试（Vitest + Testing Library，`npx vitest run`）
| 编号 | 用例 | 期望 | 状态 |
|---|---|---|---|
| TC-11 | 首页渲染分类按钮 | 全部/花朵/树叶/果实 四钮可见 | 通过 |
| TC-12 | 点击筛选 | 触发对应 category 请求并渲染过滤后的卡片列表 | 通过 |
| TC-13 | 空分类空态 | 无数据显示「这个分类还没有植物哦」 | 通过 |
| TC-14 | 详情部位切换 | 显示花/叶/果大按钮，点击切换内容区（图/名称/说明） | 通过 |
| TC-15 | 缺部位标签隐藏 | 银杏详情不显示「花」按钮，默认选中叶 | 通过 |
| TC-16 | 典故有/无 | 有典故渲染 AllusionCard；无典故不渲染 | 通过 |

## 三、E2E 冒烟（Playwright，`npx playwright test`）
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-17 | 浏览主流程 | 打开首页→点「花朵」→点向日葵卡片→点「果」部位 | 详情显示向日葵果实内容（葵花籽），页面无报错 | 通过（用例 frontend/e2e/smoke.spec.js；含无 console error 断言；截图 frontend/e2e/evidence/tc17-1~3.png） |

## 四、放行标准（QA 裁决）
1. TC-01 ~ TC-17 全部「通过」，无跳过。
2. `mvn test`、`npx vitest run`、`npx playwright test` 退出码均为 0。
3. `docker compose up -d` 后人工路径可复现 TC-17。
4. 全部满足 → QA 宣告放行，Master 执行 commit；任一失败 → 回阶段 3 修复，禁止 commit。

## 五、QA 执行修复记录（2026-10-17，均属测试/部署基础设施，未改业务逻辑）
1. **Testcontainers 容器内运行适配**：mvn 容器内拉取 ryuk 镜像超时（已从 docker.1ms.run 拉取并 retag `testcontainers/ryuk:0.14.0`）；ryuk 端口在 macOS Docker Desktop 不可达 → 以 `TESTCONTAINERS_RYUK_DISABLED=true`（测试类自带 shutdown hook 回收容器）+ `TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal` 运行，10 用例全绿。
2. **docker-compose.yml：`SPRING_DATA_MONGODB_URI` → `SPRING_MONGODB_URI`**：Spring Boot 4 将 Mongo 属性 `spring.data.mongodb.uri` 更名为 `spring.mongodb.uri`，旧环境变量被忽略导致 backend 连 `localhost:27017` 全 500。已修复 compose 并复验（hosts=[mongo:27017]）。⚠️ 移交 J：backend/src/main/resources/application.yml 中的 `spring.data.mongodb.uri` 同为旧属性名，建议下一迭代更正为 `spring.mongodb.uri`（不影响容器路径，仅本地默认值）。
3. **scripts/import-plants.mjs：`redis.del(...keys)` → `redis.del(keys)`**：node-redis v5 的可变参数 del 只删除第一个 key，导致导入后缓存清不干净（实测 4 个 key 只清 1 个）。已修复并复验（4 keys → 清除 4 → 0 keys）。
4. **frontend/vite.config.js**：vitest `include` 限定 `src/**`，避免扫描 e2e/（Playwright 用例）；新增 frontend/playwright.config.js + frontend/e2e/smoke.spec.js（TC-17），@playwright/test 为 devDependency。
