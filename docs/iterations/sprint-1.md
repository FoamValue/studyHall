# Sprint 1 — 端到端 MVP 闭环

| 项 | 内容 |
|---|---|
| 迭代目标 | 打通「分类筛选浏览 → 植物详情部位切换」端到端最小闭环，8 种种子植物，Docker 一键部署，自动化测试全绿 |
| 状态 | 进行中 |

## 迭代范围（用户故事）
US-1 分类筛选、US-2 植物列表、US-3 部位切换、US-4 部位内容展示（PRD §3）。

## 总体路线图（Master）
| Sprint | 目标 |
|---|---|
| Sprint 1（本次） | 端到端 MVP：骨架 + 8 种种子植物 + 两个页面 + 部署 + 自动化测试 |
| Sprint 2 | 内容扩容至 30 种（AI 导入通道演练、真实照片支持）、Redis 缓存验证、低龄化体验打磨 |
| Sprint 3 | 扩容至 100 种、平板细节优化、按 PRD §7 逐条上线验收 |

## 任务拆解
| 编号 | 任务 | 角色 |
|---|---|---|
| J-1 | Spring Boot 工程初始化（JDK 26 + Maven + SB），健康检查接口 | J |
| J-2 | MongoDB 植物文档 schema + 数据访问层 | J |
| J-3 | API：`GET /api/categories`、`GET /api/plants?category=`、`GET /api/plants/{id}` | J |
| J-4 | Redis 缓存（分类/列表/详情）；MySQL 记录导入审计 | J |
| J-5 | 内容导入脚本（JSON → MongoDB，AI 扩容通道）+ 8 种种子数据 | J |
| J-6 | 后端自动化测试（API 集成测试） | J / QA |
| R-1 | Vite + React + Ant Design 工程初始化 | R |
| R-2 | 首页：分类筛选 + 植物网格卡片 | R |
| R-3 | 详情页：部位标签切换（花/叶/果，缺部位隐藏标签） | R |
| R-4 | 前端组件测试（Vitest + Testing Library） | R / QA |
| UI-1 | 视觉与交互规范（docs/design/ui-style-guide.md） | UI |
| UI-2 | 8 种植物部位简笔画（彩色 SVG，风格统一，可版本控制） | UI |
| D-1 | docker-compose（frontend/nginx + backend + mysql + redis + mongo）一键启动 | J / R |
| QA-1 | 迭代测试用例手册（docs/qa/sprint-1-test-cases.md） | QA |
| QA-2 | 装配并执行全部自动化测试，全绿后放行 | QA |

## 验收标准（Sprint 1 Definition of Done）
1. `docker compose up -d` 后浏览器打开即可浏览 8 种植物，分类筛选可用。
2. 详情页部位切换正确，缺部位植物不显示对应标签。
3. 后端 API 测试 + 前端组件测试 + E2E 冒烟测试全部通过。
4. 内容导入脚本可将一种新植物导入并直接展示（扩容演练）。
5. 以上全部满足后 QA 放行，Master 执行 commit。

## 种子植物（8 种，部位覆盖有意含缺失以验证标签逻辑）
向日葵（花/叶/果）、桃（花/叶/果）、荷花（花/叶/果）、苹果（花/叶/果）、银杏（叶/果，无花）、蒲公英（花/叶/果）、樱花（花/叶）、草莓（花/叶/果）
