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

- coverImage 取 flower 缺省取 leaf 缺省取 fruit 的第一张图。

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

