# 后端开发设计文章 — Sprint 1

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-16 |
| 依据 | PRD v1.0 §8 技术约束、docs/product/iteration-1-requirements.md |

## 1. 工程结构
```
backend/
├── pom.xml                    # JDK 26 + Spring Boot（Central 当前兼容 JDK26 的稳定版）
├── Dockerfile                 # 多阶段：maven:3.9-eclipse-temurin-26 构建 → eclipse-temurin:26-jre 运行
└── src/main/java/com/studyhall/plants/
    ├── PlantsApplication.java
    ├── config/                # Mongo/Redis/MySQL 配置、CORS、全局异常
    ├── controller/            # PlantController
    ├── service/               # PlantService（含 Redis 缓存）
    ├── repository/            # Mongo Repository + JdbcTemplate
    ├── model/                 # Plant 文档模型、Category、ApiResponse
    └── mysql/                 # ImportLog 实体与写入
```

## 2. 数据模型
### MongoDB（库 `studyhall`，测试库 `studyhall_test`）
**categories**：
```json
{ "code": "flower", "nameZh": "花朵", "pinyin": "huā duǒ", "nameEn": "Flower", "order": 1 }
```
首批：flower(花朵)、leaf(树叶)、fruit(果实)。

**plants**（文档 schema，Sprint 1 唯一权威定义）：
```json
{
  "id": "sunflower",
  "categories": ["flower"],
  "name": { "zh": "向日葵", "pinyin": "xiàng rì kuí", "en": "Sunflower", "ipa": "/ˈsʌnˌflaʊər/" },
  "parts": {
    "flower": {
      "name": { "zh": "花", "pinyin": "huā", "en": "flower", "ipa": "/ˈflaʊər/" },
      "images": [ { "type": "photo", "url": "/images/plants/sunflower-flower.jpg" } ],
      "description": "低龄化中文说明，短句。",
      "allusion": { "text": "典故原文（古诗词/成语）", "source": "出处", "explain": "一句低龄化白话解释" }
    },
    "leaf": { "..." : "同上结构" },
    "fruit": { "..." : "同上结构" }
  }
}
```
- `parts` 键固定 ∈ {flower, leaf, fruit}，可缺省；`allusion` 可缺省。
- 唯一索引：`id`。

### MySQL（库 `studyhall`，测试库 `studyhall_test`）
```sql
CREATE TABLE import_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_file VARCHAR(255) NOT NULL,
  plant_id VARCHAR(64) NOT NULL,
  action VARCHAR(16) NOT NULL,           -- UPSERT / DELETE
  imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 3. API 契约（全部 GET，响应统一 `{ "code": 0, "data": ..., "message": "ok" }`）
| 接口 | 返回 data |
|---|---|
| `GET /api/health` | `{"status":"UP"}` |
| `GET /api/categories` | 按 order 升序的分类数组 |
| `GET /api/plants?category=flower` | 卡片数组：`{id, name, coverImage, parts:[...部位code]}`；category 缺省=全部；非法 category 返回 code=40001 |
| `GET /api/plants/{id}` | 完整植物文档；不存在返回 code=40401 |

- coverImage：请求带 category 时**优先取该分类对应部位**的第一张图，缺失则按 flower → leaf 缺省取 leaf → fruit 回退；category 缺省（全部）按 flower → leaf → fruit 回退。（Sprint 7 修订，见 S7-1）

## 4. Redis 缓存
- key：`sh:categories`、`sh:plants:list:{category|all}`、`sh:plant:{id}`；TTL 600s；JSON 序列化。
- 导入脚本导入后调用清缓存方式：脚本直接连 Redis `FLUSHDB` 限定前缀删除（SCAN `sh:*`）。

## 5. 内容导入通道（AI 扩容）
```
content/
├── categories.json          # 分类数组
└── plants/sunflower.json    # 一植物一文件，schema 同 §2
scripts/import-plants.mjs    # node:22 执行；读 content/ → upsert Mongo → SCAN 清 Redis sh:* → 写 MySQL import_log
```
- 幂等：同 id 重复导入为覆盖（UPSERT）。
- 运行：`node scripts/import-plants.mjs`，连接参数读环境变量 MONGO_URI/REDIS_URI/MYSQL_URI，缺省连 localhost。

## 6. 配置
- `application.yml` 默认本地开发值；容器内由环境变量覆盖（SPRING_DATA_MONGODB_URI、SPRING_DATA_REDIS_HOST/PORT、SPRING_DATASOURCE_URL/USERNAME/PASSWORD）。
- CORS：开发态放行 Vite 5173；生产同源经 nginx 反代 `/api`。

## 7. 后端测试（mvn test 必须全绿）
- 集成测试使用 Testcontainers（mongo:8.0.4 / mysql:8.0 / redis:7，本地已有镜像自动复用，库名加 `_test`）。
- 用例覆盖 QA 手册 TC-01 ~ TC-06 对应接口行为（分类、筛选、详情、缺部位、404、缓存命中、导入脚本幂等——导入幂等由脚本独立冒烟验证）。

---

# 后端开发设计文章 — Sprint 2（增量）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-2-requirements.md |

## S2-1. 技术债修复：SB4 Mongo 属性名
- `application.yml`：`spring.data.mongodb.uri` → `spring.mongodb.uri`（Spring Boot 4 更名）；仅改默认属性路径，值不变。
- docker-compose.yml 已用 `SPRING_MONGODB_URI`，不动。
- 测试 PlantApiIntegrationTest 的 `@DynamicPropertySource` 注册项同步改为 `spring.mongodb.uri`（否则测试内连接失败）。

## S2-2. 无 API 契约变更
- 30 种植物仍一次全量返回；images[].type 新增 `photo` 语义，后端原样透传，无代码改动。

## S2-3. 测试策略更新（配合 QA）
- 植物数量断言从固定值改为动态：以 ContentSeed 从 content/ 实际读入的清单为准。
- 新增数据驱动用例：遍历 content/plants/*.json 断言 schema 合规（categories 与 parts 键一致、每部位 ≥1 图、三语名称非空）。

---

# 后端开发设计文章 — Sprint 3（增量）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-3-requirements.md |

## S3-1. 无 API 契约变更
- 100 种植物仍一次全量返回；列表接口无分页（PO 裁决，数据量小）。

## S3-2. 测试策略更新（配合 QA）
- TC-11 同一 JSON 遍历中并入 TC-24：description ≤ 80 字、不含拉丁字母（拼音/英文字段不在此列）。
- TC-12 资产存在性检查自动覆盖 140 张新 SVG。
- 导入幂等（TC-10）在 100 种规模下复验。

---

# 后端开发设计文章 — Sprint 4（增量）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-4-requirements.md |

## S4-1. 数据来源确认（J-6）：无接口变更
- 详情页「相邻植物」由前端基于列表接口 `GET /api/plants`（可带 `?category=`）的顺序自行计算，**后端不新增接口、不改返回结构**。
- 顺序稳定性确认（读现有实现）：
  - 全部列表：`PlantService.getPlants(null)` → `plantRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))`，**按 `id` 升序稳定返回**。
  - 分类列表：`plantRepository.findByCategoriesContains(category)` —— **未显式排序**，顺序取决于 Mongo 自然序。
- 一致性结论：前端邻居始终由**同一份列表快照**计算（进入详情时由首页 `state` 传入，或深链接兜底拉一次），因此不依赖后端跨请求顺序稳定。**本迭代不改后端排序**（遵循最小改动，且不构成契约变更）。
- 遗留建议（非阻塞，下迭代评估）：为分类列表补 `Sort.by(ASC, "id")`，使跨请求顺序也可预测。

## S4-2. 缓存策略
- 邻居列表复用现有 Redis 缓存：key `sh:plants:list:{category|all}`，TTL 600s，JSON 序列化（见 Sprint 1 §4）。
- 深链接兜底拉「全部」列表命中 `sh:plants:list:all`，不产生额外数据库压力。
- 导入脚本导入后仍 SCAN `sh:*` 清缓存，无需改动。

## S4-3. 测试策略
- 后端**零代码变更**，`mvn test` 全量回归即可（TC-01~13、TC-24 数据驱动，数量自动跟随 `content/plants/`）。
- 新增/变更集中在前端，后端无新增测试用例。

## S4-4. 交付结论
- Sprint 4 后端交付物：本设计说明 + 顺序稳定性确认；无代码改动。

---

# 后端开发设计文章 — Sprint 5（增量）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-5-requirements.md |

## S5-1. 交付结论（J-7）：后端零代码变更
- 语音朗读由前端复用浏览器原生 `SpeechSynthesis` 实现，**后端不参与**：不新增接口、不改返回结构、不进缓存链路。
- 不改语料：`content/plants/*.json` 的 `name.zh` / `name.en` 即为朗读文本来源，无需新增字段（无「发音」数据需求）。
- 不引入拼音 / 音标转语音的后端逻辑（拼音、音标本就不朗读）。

## S5-2. 契约与缓存保持不变
- `GET /api/plants`、`GET /api/plants/{id}` 契约不变；Redis key 约定（`sh:categories`、`sh:plants:list:*`、`sh:plant:*`）不变，TTL 600s 不变。
- 导入脚本 `scripts/import-plants.mjs` 不变（无新增字段）。

## S5-3. 测试策略
- 后端**零代码变更**，`mvn test` 全量回归即可（TC-01~13、TC-24 数据驱动，数量自动跟随 `content/plants/`），无新增后端用例。
- 全部新增 / 变更集中在前端（见 frontend-design S5-1~S5-6 与 QA 手册 TC-41 起）。

---

# 后端开发设计文章 — Sprint 6（增量）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-6-requirements.md |

## S6-1. 交付结论（J-8）：后端零代码变更
- 本迭代为详情页前端溢出策略修复（纯 CSS），**后端不参与**：不新增 / 不修改接口，不改返回结构，不改缓存链路。
- 不改语料：`content/plants/*.json` 不变（不新增字段）。
- 导入脚本 `scripts/import-plants.mjs` 不变。

## S6-2. 契约与缓存保持不变
- `GET /api/plants`、`GET /api/plants/{id}`、`GET /api/categories` 契约不变；Redis key 约定与 TTL 600s 不变。

## S6-3. 测试策略
- 后端**零代码变更**，`mvn test` 全量回归即可，无新增后端用例。
- 全部新增 / 变更在前端（见 frontend-design S6-1~S6-7 与 QA 手册 TC-48 起）。

---

# 后端开发设计文章 — Sprint 7（PF 体验优化，EX-1）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-7-requirements.md、docs/product/experience-triage-v1.md |
| 范围 | 仅清单卡片封面选择逻辑（EX-1）；EX-2 / EX-3 为前端样式，后端不参与 |

## S7-1. 关键改动：封面跟随请求分类（EX-1，J-9）
- **现状（问题）**：`PlantService.coverImage(plant)` 固定按 `flower → leaf → fruit` 回退，`toCard(plant)` 不接收分类 → 「树叶 / 果实」分类下含花朵的植物（如苹果、银莲花）仍返回花朵封面，与当前分类不符。
- **目标**：请求带分类时，封面**优先取该分类对应部位的首图**；该植物无此部位时再按 `flower → leaf → fruit` 回退；`all`（未指定分类）维持原回退顺序。
- **实现要点**：
  - `getPlants(category)` 已有分类值，仅需**透传**到卡片生成：`findByCategoriesContains(category).stream().map(p -> toCard(p, category))`；`all` 分支传 `null`。
  - 签名调整为 `toCard(Plant plant, String category)` 与 `coverImage(Plant plant, String category)`（可见性按现状保留包级 / 私有，供测试使用）。
  - 封面顺序：`order = (category != null && plant.parts() 含 category) ? [category, 其余按 PART_ORDER] : PART_ORDER`；随后沿用现有「取首个非空部位的第一张图」逻辑。
- **不改动**：缓存 key 约定（`sh:plants:list:{category|all}` 已按分类区分，新语义天然隔离）、`GET /api/plants` 响应结构（仍为 `{id, name, coverImage, parts}`）、语料 schema、导入脚本。

## S7-2. 契约与缓存保持不变
- `GET /api/plants`、`GET /api/plants/{id}`、`GET /api/categories` 契约不变；Redis key 与 TTL 600s 不变。
- 「全部」列表封面语义不变（`flower → leaf → fruit` 回退），故既有 TC-07（银杏在全部列表回退到 leaf）等断言**保持成立**。

## S7-3. 需同步更新的断言与文档
- 核对 `PlantApiIntegrationTest`：TC-07（银杏全部列表封面 = `ginkgo-leaf.jpg`）不变；如需补充分类封面断言，新增用例（如 `?category=leaf` 下含花植物的封面为叶图）。
- 更新 `PlantCard` 的 `coverImage` 字段注释（原述「flower→leaf→fruit」改为「按请求分类优先，缺失回退」）。
- 同步更新本文档 §3 API 契约中「coverImage 取图」的说明。

## S7-4. 测试策略
- 新增后端用例：分类列表封面语义（对应 PRD §12.4 之 20）——用真实语料中「含花朵但被归入 leaf/fruit 分类」的植物（如 apple / anemone）断言 `?category=leaf` / `?category=fruit` 封面为对应部位图；`?category=flower` 或全部则维持回退顺序。
- 其余 `mvn test` 全量回归（TC-01~13、TC-24 数据驱动）须全绿。

---

# 后端开发设计文章 — Sprint 9（增量：v2.0 四板块 + 单键部位 + 小知识 + 音频 + sort）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 依据 | docs/product/iteration-9-requirements.md（Q2~Q7 冻结）、PRD §14（v2.0） |

## S9-1. 数据模型增量
- **`Category`**（`model/Category.java`）新增 `String section`（可空，向后兼容）：
  ```java
  @Document("categories")
  public record Category(@Id String code, String nameZh, String pinyin, String nameEn, int order, String section) {}
  ```
- **`Plant`**（`model/Plant.java`）新增 `Integer sort`（可空；`@Id String id, List<String> categories, I18nName name, Map<String,PlantPart> parts, Integer sort)`）。`parts` 键集合扩展为 `flower/leaf/fruit/animal/insect/dinosaur`（**结构不变**，Map 天然容纳单键）。
- **`I18nName`**（`model/I18nName.java`）新增可选 `String audioZh, String audioEn`（音频相对路径，如 `/audio/apple-zh.m4a`）；**可空**，缺省表示无音频。后端仅透传，无业务逻辑；前端按「字段存在即渲染喇叭」实现优雅降级（PRD §14.7-③）。
- `PlantPart` / `PlantImage` / `Allusion` **零改动**：动物/昆虫/恐龙仅用 `parts.{单个键}`，`images` 仅 1 张（`type` ∈ `photo|restore`），小知识沿用 `allusion` 结构。

## S9-2. 分类合法性校验与文案（J-14）
- `getPlants` 中 `categoryRepository.existsById(category)` 天然覆盖新分类。
- 40001 文案更新为覆盖四板块：「没有「%s」这个分类哦，试试花朵、树叶、果实、动物、昆虫或恐龙吧」。
- 新增 `section` 校验：未知 section → `ApiException(40002, "没有「%s」这个板块哦")`。

## S9-3. 「板块列表」查询：新增可选 `section` 参数（Q3/Q4）
- `PlantController.plants` 增加 `@RequestParam(required=false) String section`。
- `PlantService.getPlants(String category, String section)` 逻辑：
  - `category` 非空 → 校验存在 → `findByCategoriesIn(List.of(category), Sort.by(ASC,"sort","id"))`（**显式排序，替清 S4-1 技术债**）。
  - `category` 空、`section` 非空 → 取该 section 下全部分类 code（`findAll(Sort.by(ASC,"order"))` 过滤 `section`）→ 校验非空否则 40002 → `findByCategoriesIn(codes, Sort.by(ASC,"sort","id"))`。
  - 两者皆空 → `findAll(Sort.by(ASC,"sort","id"))`（跨板块全部，向后兼容；UI 不依赖）。
- `PlantRepository` 新增 `List<Plant> findByCategoriesIn(Collection<String> categories, Sort sort)`。
- **封面**：`coverImage(plant, category)` 逻辑不变；但 `PART_ORDER` 扩为 `flower,leaf,fruit,animal,insect,dinosaur`，使单图条目在 `?section=animal`（category 为空）时也能取到自身图片。
- **`partCodes`**：同用扩展后的 `PART_ORDER`，单图条目返回 `[animal]`。

## S9-4. `sort` 排序与缓存（J-16）
- 列表查询统一 `Sort.by(Sort.Direction.ASC, "sort", "id")`；空缺 `sort` 由 Mongo 升序排在数值前（重导后所有条目均带 `sort`）。
- 缓存 key 增量：新增 `sh:plants:list:section:{section}`（如 `sh:plants:list:section:plant`）；既有 `sh:plants:list:{category|all}` 不变。导入脚本 SCAN `sh:*` 已覆盖清理，**脚本 key 规则不改**。
- `GET /api/categories` 仍按 `order` 升序（`Sort.by(ASC,"order")`），多返回 `section` 字段。

## S9-5. 契约影响
- `GET /api/categories`：**增字段 `section`**（向后兼容）。
- `GET /api/plants`：**新增可选参数 `section`**；无参语义由「全部植物」变为「全部条目（跨板块）」（既有 100 植物仍全含）。
- `GET /api/plants/{id}`：响应 `Plant` 多出 `sort` 字段（向后兼容）。
- 错误码新增 **40002**（未知板块）。
- 路径与响应骨架不变；`ApiResponse` 不变。

## S9-6. 导入脚本影响（R-27 协同）
- **内容目录**：沿用 `content/plants/*.json`；新增 `content/animals/*.json`、`content/insects/*.json`、`content/dinosaurs/*.json`（一物一文件，schema 同植物但 `parts` 单键）。脚本改为读取这 4 个子目录的全部 `*.json`，统一 UPSERT 进同一 `plants` 集合（**集合名与既有 100 植物数据保留不变**）。
- 验证点扩展：`categories.json` 每条须含 `section` ∈ {plant,animal,insect,dinosaur}；`plants` 的 `parts` 键 ∈ `flower|leaf|fruit|animal|insect|dinosaur`；单键板块条目的单键必须 = 其 `categories` 唯一分类 code；`sort` 为整数校验（必填）。图片路径校验按板块前缀放宽（植物 `/images/plants/{id}-{part}.jpg`；动物 `/images/animals/{id}.jpg`、昆虫 `/images/insects/{id}.jpg`、恐龙 `/images/dinosaurs/{id}.jpg`）。音频资产存在性校验：`name.audioZh`/`audioEn` 存在时对应文件须存在。

## S9-7. 测试策略（配合 QA-20/QA-21）
- 更新：`PlantApiIntegrationTest` 的「全部计数」改为**数据驱动**（= content 实际条目数，130）；分类计数 3 → 6。
- 新增：`?section=plant` 计数 = 植物数；`?section=animal` = 10 且条目 `parts` 仅 `[animal]`；未知 section → 40002；`?category=animal` 封面 = 对应图；排序稳定性（两次请求顺序一致，且 = `sort ASC,id ASC`）。
- 回归：TC-01~13、TC-24、TC-57/58 全绿。




---

# 后端开发设计文章 — Sprint 10（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 结论 | **本迭代后端零改动**（J-13） |

- Sprint 10（v2.1）为纯前端体验回流（EX-4 / EX-5 / EX-6），不触碰后端代码。
- **不改**：Controller / Service / Repository / Entity / MongoDB 语料结构、`/api/categories`、`/api/plants`、`/api/plants/{id}` 契约与响应骨架、缓存 key 规则、导入脚本。
- 既有后端 21 用例（TC-01~TC-13、TC-24、TC-57/58、TC-71~TC-77）作为回归基线，退出码必须为 0。

---

# 后端开发设计文章 — Sprint 11（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-17 |
| 结论 | **本迭代后端零改动**（J-14）；纯内容扩容 |

- Sprint 11（v2.2）为内容扩容（动物 / 昆虫 / 恐龙各 10 → 30），不触碰后端代码。
- **不改**：Controller / Service / Repository / Entity / 契约（`/api/categories`、`/api/plants`、`/api/plants/{id}`）、响应骨架、缓存 key 规则、`section` 与 `sort` 查询逻辑。
- **天然覆盖**：导入校验已包含单键板块 `parts↔categories` 一致性、图片路径规则（`/images/{目录}/{id}.jpg`）、音频文件存在性；`?section=animal|insect|dinosaur` 各返回 30 条，顺序由既有 `Sort.by(ASC,"sort","id")` 保证。
- 既有后端 21 用例作为回归基线，退出码必须为 0（新增 60 条语料不改任何断言）。

---

# 后端开发设计文章 — Sprint 13（增量：无）

| 项 | 内容 |
|---|---|
| 作者 | J |
| 日期 | 2026-10-18 |
| 结论 | **本迭代后端零改动**（J-17）；纯语料增补（植物补齐 `allusion`）。 |

- Sprint 13（v2.4）为内容产线（植物 176 处小知识补齐），不触碰后端代码。
- **不改**：Controller / Service / Repository / Entity / 契约（`/api/categories`、`/api/plants`、`/api/plants/{id}`）、响应骨架、缓存 key 规则、`section` 与 `sort` 查询逻辑、导入脚本。
- **`Allusion` 数据模型零改动**：`{ text, source?, explain }` 结构不变；`source` 仍可选（植物典故为出处）。
- **天然覆盖**：既有后端 TC-24（文案限长，全量遍历 `description` ≤80 无拉丁字母、`allusion.text` ≤60、`explain` ≤50）将自动覆盖新增 176 条小知识文案；超长即失败。
- 既有后端 21 用例作为回归基线，退出码必须为 0。
- **门禁期测试口径对齐（D13-1）**：`PlantApiIntegrationTest.tc11_allContentFilesShouldMatchSchema` 原对植物部位强制 `allusion.source` 非空，与本迭代冻结口径 Q2「有明确出处才填 `source`」冲突（156 条常识型小知识按口径省略 `source`，且严禁杜撰出处）。已将该断言改为「`source` 可选，若填写则须非空」，与板块小知识（animal/insect/dinosaur）口径统一；**仅测试代码调整，Controller / Service / 模型 / 契约零改动**。调整后 21 用例全绿。
