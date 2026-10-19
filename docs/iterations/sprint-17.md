# Sprint 17 — v2.8 植物板块重构：部位拆条 + 单图详情 + 取消二级筛选

| 项 | 内容 |
|---|---|
| 迭代目标 | 对「植物」板块进行结构性重构：取消花朵/树叶/果实二级分类，每株植物的每个部位拆为独立条目（100 株 → 206 条），详情页改为单图模式（移除部位切换），首页移除植物二级筛选条；详情页名称字号加大方便幼儿识字。其他板块（动物/昆虫/恐龙/字母/拼音/数字/颜色）不变。 |
| 状态 | ✅ 已完成（门禁全绿、QA 放行） |
| 依据 | 用户需求澄清（Q1~Q5 + 字号需求）；PO 冻结口径见下 |
| 类型 | **能力迭代**（前端 + 后端 + 内容 + 资产 + 测试全面改动） |
| 内容基线（Sprint 16 交付后） | 语料 **334**（plant100 / animal50 / insect50 / dinosaur50 / letter26 / pinyin26 / number21 / color11）、分类 **10**、图片 **440** `.jpg`、音频 **616** `.m4a` |
| 交付后基线 | 语料 **440**（plant **206** = 花 53 + 叶 100 + 果 53，其中 **2 条废弃**；其余不变）、分类 **8**（移除 flower/leaf/fruit，新增 plant）、图片 **440**（植物部位图 206 张**仅重命名** `/images/plants/{oldId}-{part}.jpg` → `/images/plants/{newId}.jpg`，总数不变）、音频 **1028**（+412 植物部位 zh/en；另存旧整株音频 200 个为未引用遗留资源） |

## 一、PO 冻结口径

| 项 | 决策 |
|---|---|
| id 命名 | `{原id}-{部位}`，如 `peach-fruit` / `peach-flower` / `peach-leaf` |
| 果实命名 | 惯用名特例表：ginkgo→白果、pine→松果、lotus→莲蓬、peach→桃子、apricot→杏子、jujube→枣子、plum→李子；其余用原名 |
| 花朵命名 | 原名+"花"（已含"花"保持原名）；英文避免 "XX Flower Flower" 重复 |
| 树叶命名 | 原名（去尾部"花"）+"花叶"，不叫"树叶"（如 苹果→苹果花叶、枫树→枫树花叶） |
| 排序 | 果实 sort=N，花朵 sort=N+1，树叶 sort=N+2（同株三部位连续，顺序果→花→叶） |
| 详情 | 单图模式，移除部位切换（所有条目 parts 均为单键） |
| 首页 | 移除植物二级筛选条（CategoryFilter） |
| 名称字号 | 详情 `.detail-zh` 48→56px（横屏 40→52px）；`.detail-en` 24→30px（横屏 20→26px） |
| 音频 | 为每个新条目名生成新音频（zh/en 各一），不复用原音频 |
| 命名冲突处置（交付后修正） | `peach-blossom-flower`/`peach-blossom-leaf`（原名「桃花/桃花叶」，与 `peach-flower`/`peach-leaf` 冲突）**不改名**：数据保留原名 + 顶层 `deprecated: true` 标记废弃（不物理删除），**页面不展示**（后端列表/详情统一过滤，详情按 40401 处理）；页面上「桃花/桃花叶」由 `peach` 侧条目唯一展示 |

## 二、迭代范围（Scope）

| 编号 | 范围项 | 说明 |
|---|---|---|
| S17-1 | **数据迁移** | 100 株植物 JSON → 206 条部位条目 JSON（花 53 + 叶 100 + 果 53）；图片重命名 `/images/plants/{oldId}-{part}.jpg` → `/images/plants/{newId}.jpg`；生成 412 个 `.m4a` 音频 |
| S17-2 | **categories.json** | 移除 flower/leaf/fruit，新增 plant（order 1），分类 10 → 8 |
| S17-3 | **import-plants.mjs** | `SINGLE_KEY_IMAGE_DIR` 加 fruit/flower/leaf→plants；`STRICT_KEY_EQUALS_CATEGORY` 排除植物部位；新增陈旧条目/分类清理逻辑 |
| S17-4 | **后端 PlantService** | 40001 报错文案"花朵、树叶、果实"→"植物"；coverImage 逻辑无需改（单部位条目自然取该部位图） |
| S17-5 | **前端 HomePage** | 移除 CategoryFilter import 与渲染；植物统一走 `getPlantsBySection('plant')`；移除 category state 与 getCategories/getPlants 依赖 |
| S17-6 | **前端 PlantCard** | `deriveCardTitle(plant)` 简化为直接返回 `plant.name.zh`；移除 category prop |
| S17-7 | **前端 PlantDetailPage** | `isSingleImageParts(parts)`：parts 单键即单图；移除 category 逻辑与默认部位跟随分类；所有条目走单图模式 |
| S17-8 | **前端 styles.css** | `.detail-zh` 48→56px（横屏 40→52px）；`.detail-en` 24→30px（横屏 20→26px） |
| S17-9 | **前后端测试 + E2E 适配** | 后端 27 用例全绿；前端 72/72；E2E 72/72 |

## 四、门禁证据（交付后修正复跑，全绿）

| 门禁项 | 结果 |
|---|---|
| 语料校验 | total=**440**（plant206/animal50/insect50/dinosaur50/letter26/pinyin26/number21/color11）、分类 **8** |
| 后端 `mvn test` | **28 用例**全绿（27 既有适配 deprecated 过滤 + 新增 TC-161） |
| 前端 `vitest run` | **72/72** 全绿（unhandled errors 清零） |
| 前端 `vite build` | 退出码 0 |
| `docker compose up -d --build` | `/api/health=UP` |
| 两次导入幂等 | import_log delta **+880 = 2×440**；Mongo **440 条目 / 8 分类**（含 deprecated 2 条，不物理删除）；`redis sh:*` = 0 |
| API 计数 | **plant=204**（206−2 废弃）/ all=**438** / animal=50 / insect=50 / dinosaur=50 / letter=26 / pinyin=26 / number=21 / color=11；废弃详情 `GET /api/plants/peach-blossom-flower` → 40401 |
| `npx playwright test` | **72/72** 全绿 |

## 五、关键技术决策

1. **导入脚本陈旧清理**：原脚本仅 UPSERT 不删除，导致植物拆分后旧整株 id 残留。新增按内容集 diff 删除陈旧条目与分类的逻辑，保证 MongoDB 与内容文件一致（废弃条目仍在内容集中，不会被清理）。
2. **单图判断泛化**：`isSingleImageParts(parts) = Object.keys(parts).length === 1`，覆盖植物部位（fruit/flower/leaf）及所有其他单图板块，无需维护 `SINGLE_IMAGE_KEYS` 白名单。
3. **命名冲突处置 = 废弃机制（交付后修正，替代改名方案）**：数据层顶层 `deprecated: true` 字段标记（导入脚本全字段透传进 Mongo，不物理删除）；后端 `Plant` 实体加 `deprecated` 字段，列表查询统一 `deprecated: {$ne: true}` 过滤（`$ne` 对字段缺省条目同样命中），详情对废弃条目按 40401 处理；页面上「桃花/桃花叶」由 `peach` 侧条目唯一展示。后续如有其他命名冲突，同样以 `deprecated: true` 标记即可，无需改名或删数据。
4. **附带修复**：`HomePage.jsx` 残留 `setCategory('all')` 调用（category state 已移除，板块切换时抛 ReferenceError，vitest unhandled errors 5 起），已删除。
