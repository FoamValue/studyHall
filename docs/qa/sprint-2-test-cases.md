# Sprint 2 测试用例手册

| 项 | 内容 |
|---|---|
| 作者 | QA |
| 日期 | 2026-10-17 |
| 范围 | Sprint 2 全部自动化用例；全部通过前禁止 commit |
| 执行记录 | 2026-10-17 执行：TC-01~TC-23 全部通过；mvn test（13 用例）/ npx vitest run（11 用例）/ npx playwright test（2 用例）退出码均为 0；导入幂等验证 Mongo 30 无重复、import_log 两次共 60 条、Redis sh:* 清空 |

## 一、后端接口测试（JUnit + Testcontainers，`mvn test`）
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-01 | 健康检查 | GET /api/health | code=0，data.status=UP | 通过 |
| TC-02 | 分类列表 | GET /api/categories | 3 个分类按 order 升序 | 通过 |
| TC-03 | 植物列表-全部 | GET /api/plants | 条数 = content/plants/ 实际文件数（30），卡片字段齐全 | 通过 |
| TC-04 | 植物列表-筛选 | GET /api/plants?category=flower | 仅返回含 flower 的植物（动态断言，预期 22） | 通过 |
| TC-05 | 非法分类 | GET /api/plants?category=abc | code=40001 | 通过 |
| TC-06 | 植物详情 | GET /api/plants/sunflower | 完整文档回归（三语、三部位、说明、典故） | 通过 |
| TC-07 | 缺部位 | GET /api/plants/ginkgo；另抽 maple | parts 不含缺失部位；coverImage 回退 | 通过 |
| TC-08 | 不存在 | GET /api/plants/nope | code=40401 | 通过 |
| TC-09 | 缓存生效 | 同请求连续两次 | 第二次命中 Redis，TTL ≤ 600 | 通过 |
| TC-10 | 导入幂等 | import-plants.mjs 执行两次 | Mongo 无重复（30）；import_log 每次 +30；Redis 清 sh:* | 通过 |
| TC-11 | 内容 schema 全量合规（新增，数据驱动） | ContentSeed 遍历 content/plants/*.json | 每植物：categories = parts 键集合；每部位 ≥1 图、三语非空、说明非空；allusion 有则三字段全 | 通过 |
| TC-12 | 图片资产齐备（新增） | 遍历 JSON 引用的 illustration 图片路径 | frontend/public 下存在对应 SVG 文件 | 通过 |
| TC-13 | SB4 属性名生效（新增） | 仅以 yml 默认配置启动上下文（测试内 DynamicPropertySource 已改 spring.mongodb.uri） | 应用正常连接 Mongo，无旧属性告警 | 通过 |

## 二、前端组件测试（Vitest，`npx vitest run`）
| 编号 | 用例 | 期望 | 状态 |
|---|---|---|---|
| TC-14 | 首页渲染分类按钮 | 全部/花朵/树叶/果实 四钮可见 | 通过 |
| TC-15 | 点击筛选 | 触发对应 category 请求并渲染过滤后的卡片 | 通过 |
| TC-16 | 空分类空态 | 显示「这个分类还没有植物哦」 | 通过 |
| TC-17 | 详情部位切换 | 点击切换内容区（图/名称/说明） | 通过 |
| TC-18 | 缺部位标签隐藏 | 仅 leaf 植物详情只渲染「叶」按钮 | 通过 |
| TC-19 | 典故有/无 | 有典故渲染 AllusionCard；无不渲染 | 通过 |
| TC-20 | 图片懒加载（新增） | 列表与详情 img 均带 loading="lazy" | 通过 |
| TC-21 | 30 条数据渲染（新增） | mock 30 卡片渲染无异常、无 key 重复告警 | 通过 |

## 三、E2E 冒烟（Playwright，`npx playwright test`）
| 编号 | 用例 | 步骤 | 期望 | 状态 |
|---|---|---|---|---|
| TC-22 | 浏览主流程（30 种规模） | 首页→点「花朵」→点玫瑰卡片→切「叶」 | 详情显示玫瑰叶内容，无 console error | 通过 |
| TC-23 | 缺部位流程（新增） | 首页→点「树叶」→点枫树卡片 | 详情仅显示「叶」标签，无花/果按钮 | 通过 |

## 四、放行标准（QA 裁决）
1. TC-01 ~ TC-23 全部「通过」，无跳过。
2. `mvn test`、`npx vitest run`、`npx playwright test` 退出码均为 0。
3. `docker compose up -d` 后人工路径可复现 TC-22、TC-23。
4. 全部满足 → QA 宣告放行，Master 执行 commit；任一失败 → 回阶段 3 修复，禁止 commit。
