# Sprint 2 迭代需求文档

| 项 | 内容 |
|---|---|
| 作者 | PO |
| 日期 | 2026-10-17 |
| 依据 | PRD v1.0 + docs/iterations/sprint-2.md |
| 状态 | 已定稿（开发唯一依据） |

## 1. 本迭代需求清单
1. **内容扩容至 30 种**：新增 22 种植物 JSON（清单见 sprint-2.md），每种含三语名称、低龄化说明、典故（可无）；部位按清单执行，maple/willow/bamboo 仅 leaf，用于覆盖缺部位标签隐藏。
2. **简笔画资产扩容**：44 张新 SVG（22 种 × 各部位），风格沿用 ui-style-guide.md §5（viewBox 512、8–10px 粗描边、平涂、≤40KB）。
3. **AI 导入通道演练**：30 种植物经 `scripts/import-plants.mjs` 全量导入；验证 Mongo 幂等（id 唯一）、Redis `sh:*` 清空、MySQL 审计 30 条。
4. **真实照片字段就绪**：schema 已支持 `images[].type=photo`，本迭代仅演练——cherry 增加 1 张 photo 类型图片占位（URL 指向 SVG 亦可，仅验证字段透传），前端按 type 原样渲染，不做特殊 UI。
5. **低龄化体验打磨**：图片懒加载（`loading="lazy"`）；分类空态已有，保持；加载态已有 Spin，保持。不做结构性改版。
6. **技术债**：application.yml 改 SB4 新属性名 `spring.mongodb.uri`；`.gitignore` 追加 `test-results/`。

## 2. 角色提问与 PO 答复（裁决记录）
| 提问方 | 问题 | PO 裁决 |
|---|---|---|
| R | 30 种植物一次全量返回是否可接受？ | 可接受（≤100 条契约不变，Sprint 3 再评估分页） |
| R | 真实照片在前端要区分展示吗？ | 不区分，按 images 数组顺序渲染第一张即可；type 字段仅数据语义 |
| UI | 44 张 SVG 如何保持风格统一？ | 沿用 Sprint 1 规范；生成脚本/模板化产出，抽查 3 张人工核对风格 |
| J | 导入审计粒度？ | 维持 Sprint 1 契约：每植物文件 1 条 import_log（30 种 → 30 条） |
| J | application.yml 改名后 compose 环境变量要动吗？ | 不动，compose 已用 `SPRING_MONGODB_URI`；仅改 yml 默认值的属性路径 |
| QA | 后端测试断言数量硬编码（8）怎么办？ | QA 更新为动态断言：以 content/ 实际文件数为准；固定值断言仅保留分类数=3 |
| QA | 新增 22 种每种都写测试吗？ | 不写逐一用例；用数据驱动：全量读入 content/ 断言 schema 合规 + 每植物至少 1 部位 + 图片路径存在对应 SVG 文件 |
| PO 自检 | 新增植物分类归属与部位一致性？ | categories 数组 = parts 键集合（如 maple categories=["leaf"]） |

## 3. 数据内容格式（增量约束）
- 新增植物 schema 同 backend-design.md §2，`categories` 与 `parts` 键集合必须一致。
- 每张 SVG 在 JSON 中以 `/images/plants/{id}-{part}.svg` 引用；UI 产出的文件名必须与此一一对应。
- 文案低龄化：说明 ≤ 3 短句；典故可无，有则配白话解释。
- cherry 的 flower 部位 images 追加第二项：`{"type":"photo","url":"/images/plants/cherry-flower.svg"}`（占位演练字段透传）。

## 4. 本迭代不做
TTS、问答、进度、账号、管理后台、手机专项、分类新增（仍只有 flower/leaf/fruit）、列表分页（PRD §6，Sprint 3 评估）。
