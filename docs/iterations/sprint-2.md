# Sprint 2 — 内容扩容至 30 种 + AI 导入通道演练 + 技术债清理

| 项 | 内容 |
|---|---|
| 迭代目标 | 植物库从 8 种扩容至 30 种，AI 导入通道全链路演练通过，修复 SB4 属性名等技术债，自动化测试全绿 |
| 状态 | 已完成（QA 放行，TC-01~TC-23 全绿） |

## 迭代范围（用户故事）
US-1 分类筛选（验收新增分类下的植物展示）、US-2 植物列表（支持 30 种规模）、US-3 部位切换（缺部位标签隐藏）、US-4 部位内容展示（新增真实照片支持字段就绪）、US-5 AI 内容更新通道（导入脚本演练扩容）。

## 总体路线图（Master）
| Sprint | 目标 |
|---|---|
| Sprint 1 | ✅ 端到端 MVP：骨架 + 8 种种子植物 + 两页面 + 部署 + 自动化测试 |
| Sprint 2（本次） | 内容扩容至 30 种 + AI 导入通道演练 + SB4 属性名修正 + 低龄化体验打磨 |
| Sprint 3 | 扩容至 100 种、平板细节优化、按 PRD §7 逐条上线验收 |

## 任务拆解
| 编号 | 任务 | 角色 |
|---|---|---|
| C-1 | 新增 22 种植物结构化 JSON（content/plants/*.json） | PO/AI 工具 |
| UI-3 | 22 种植物对应部位简笔画 SVG 批量生成（风格统一） | UI |
| J-7 | `application.yml` 旧属性 `spring.data.mongodb.uri` → `spring.mongodb.uri` | J |
| R-5 | `frontend/test-results/` 加入 `.gitignore` | R |
| R-6 | 低龄化体验打磨：图片懒加载、空分类空态优化、加载态友好提示 | R |
| D-2 | 导入脚本演练：22 种新植物经 `import-plants.mjs` 入库，Redis 缓存被清空，MySQL 审计正确 | J |
| QA-3 | 迭代测试用例手册更新（docs/qa/sprint-2-test-cases.md），数量断言从 8→30 | QA |
| QA-4 | 全量回归：后端接口（30 种规模）+ 前端组件 + E2E 主流程 + 导入幂等，全绿放行 | QA |

## 新增 22 种植物清单（含部位，确保缺部位植物存在以覆盖标签隐藏逻辑）
| 编号 | id | 中文 | 部位 | 分类归属 |
|---|---|---|---|---|
| 1 | rose | 玫瑰 | flower / leaf | 花朵、树叶 |
| 2 | peony | 牡丹 | flower / leaf | 花朵、树叶 |
| 3 | chrysanthemum | 菊花 | flower / leaf | 花朵、树叶 |
| 4 | plum-blossom | 梅花 | flower / leaf | 花朵、树叶 |
| 5 | tulip | 郁金香 | flower / leaf | 花朵、树叶 |
| 6 | lily | 百合 | flower / leaf | 花朵、树叶 |
| 7 | morning-glory | 牵牛花 | flower / leaf | 花朵、树叶 |
| 8 | jasmine | 茉莉花 | flower / leaf | 花朵、树叶 |
| 9 | osmanthus | 桂花 | flower / leaf | 花朵、树叶 |
| 10 | carnation | 康乃馨 | flower / leaf | 花朵、树叶 |
| 11 | maple | 枫树 | leaf | 树叶（无花/果） |
| 12 | willow | 柳树 | leaf | 树叶（无花/果） |
| 13 | pine | 松树 | leaf / fruit | 树叶、果实 |
| 14 | bamboo | 竹子 | leaf | 树叶（无花/果） |
| 15 | mimosa | 含羞草 | leaf / flower | 树叶、花朵 |
| 16 | cactus | 仙人掌 | leaf / flower | 树叶、花朵 |
| 17 | banana | 香蕉 | fruit / leaf | 果实、树叶 |
| 18 | watermelon | 西瓜 | fruit / leaf | 果实、树叶 |
| 19 | grape | 葡萄 | fruit / leaf | 果实、树叶 |
| 20 | orange | 橙子 | fruit / flower / leaf | 果实、花朵、树叶 |
| 21 | tomato | 番茄 | fruit / flower / leaf | 果实、花朵、树叶 |
| 22 | pear | 梨 | fruit / flower / leaf | 果实、花朵、树叶 |

## 验收标准（Sprint 2 Definition of Done）
1. `content/plants/` 下共 30 种植物 JSON，schema 合规，无字段缺失。
2. `frontend/public/images/plants/` 下新增 22 种植物的 SVG 简笔画，命名 `{id}-{part}.svg` 正确，viewBox 512、9px 粗描边、平涂色、≤40KB。
3. `docker compose up -d` 后，前端可浏览全部 30 种植物；分类筛选正确（花朵 22 种、树叶 30 种、果实 13 种）。
4. 缺部位植物（maple、willow、bamboo）在详情页不显示缺失部位标签。
5. `import-plants.mjs` 将 30 种植物导入后，MongoDB 无重复、Redis `sh:*` 缓存被清空、MySQL `import_log` 新增 30 条记录。
6. `application.yml` 使用 SB4 新属性名 `spring.mongodb.uri`，本地开发默认值正常。
7. `frontend/test-results/` 已加入 `.gitignore`。
8. 后端 `mvn test` + 前端 `npx vitest run` + E2E `npx playwright test` 全部通过，退出码均为 0。
9. 以上全部满足后 QA 放行，Master 执行 commit。

## 技术债清单（来自 Sprint 1）
- [x] `backend/src/main/resources/application.yml`：`spring.data.mongodb.uri` → `spring.mongodb.uri`
- [x] `frontend/.gitignore`：追加 `test-results/`
