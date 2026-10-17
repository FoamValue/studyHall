# Sprint 3 — 扩容至 100 种 + 平板细节优化 + PRD §7 上线验收

| 项 | 内容 |
|---|---|
| 迭代目标 | 植物库从 30 种扩容至 100 种（达成 PRD 规模上限），平板体验细节优化，按 PRD §7 逐条验收上线，自动化测试全绿 |
| 状态 | ✅ 已完成 |

## 迭代范围（用户故事）
US-2 植物列表（100 种规模下的性能与布局）、US-3/US-4 部位切换与内容展示（70 种新植物）、US-5 AI 内容更新通道（大规模扩容演练）、PRD §7 五条验收标准逐条验证。

## 总体路线图（Master）
| Sprint | 目标 |
|---|---|
| Sprint 1 | ✅ 端到端 MVP：骨架 + 8 种种子植物 + 两页面 + 部署 + 自动化测试 |
| Sprint 2 | ✅ 内容扩容至 30 种 + AI 导入通道演练 + SB4 属性名修正 + 低龄化体验打磨 |
| Sprint 3（本次） | 扩容至 100 种 + 平板细节优化 + PRD §7 逐条上线验收 |

## 任务拆解
| 编号 | 任务 | 角色 |
|---|---|---|
| C-2 | 新增 70 种植物结构化 JSON（content/plants/*.json） | PO/AI 工具 |
| UI-4 | 70 种植物对应部位 SVG 批量生成（扩展现有 generate-svgs.mjs，风格统一） | UI |
| R-7 | 平板细节优化：横屏网格列数（≥4 列）、触控目标 ≥44px、标题字号与间距放大、100 卡片滚动性能验证 | R |
| QA-5 | 迭代测试用例手册更新（docs/qa/sprint-3-test-cases.md），数量断言 30→100 | QA |
| QA-6 | PRD §7 逐条验收用例：≤3 次点击到达详情、无注册登录、部位内容四要素齐全、扩容演练、低龄化文案抽查 | QA |
| QA-7 | 全量回归：后端 + 前端 + E2E（100 种规模）+ 导入幂等，全绿放行 | QA |

## 新增 70 种植物清单（所有植物均含 leaf；花类 31 种 = flower+leaf，果类 39 种 = fruit+leaf）
| 编号 | id | 中文 | 部位 | 分类归属 |
|---|---|---|---|---|
| 1 | peach-blossom | 桃花 | flower / leaf | 花朵、树叶 |
| 2 | lily-of-the-valley | 铃兰 | flower / leaf | 花朵、树叶 |
| 3 | lavender | 薰衣草 | flower / leaf | 花朵、树叶 |
| 4 | daisy | 雏菊 | flower / leaf | 花朵、树叶 |
| 5 | violet | 紫罗兰 | flower / leaf | 花朵、树叶 |
| 6 | hyacinth | 风信子 | flower / leaf | 花朵、树叶 |
| 7 | iris | 鸢尾花 | flower / leaf | 花朵、树叶 |
| 8 | lilac | 丁香花 | flower / leaf | 花朵、树叶 |
| 9 | magnolia | 玉兰花 | flower / leaf | 花朵、树叶 |
| 10 | begonia | 海棠花 | flower / leaf | 花朵、树叶 |
| 11 | gardenia | 栀子花 | flower / leaf | 花朵、树叶 |
| 12 | chinese-rose | 月季 | flower / leaf | 花朵、树叶 |
| 13 | camellia | 山茶花 | flower / leaf | 花朵、树叶 |
| 14 | azalea | 杜鹃花 | flower / leaf | 花朵、树叶 |
| 15 | hibiscus | 芙蓉花 | flower / leaf | 花朵、树叶 |
| 16 | water-lily | 睡莲 | flower / leaf | 花朵、树叶 |
| 17 | marigold | 金盏花 | flower / leaf | 花朵、树叶 |
| 18 | pansy | 三色堇 | flower / leaf | 花朵、树叶 |
| 19 | forget-me-not | 勿忘我 | flower / leaf | 花朵、树叶 |
| 20 | poppy | 虞美人 | flower / leaf | 花朵、树叶 |
| 21 | cosmos | 波斯菊 | flower / leaf | 花朵、树叶 |
| 22 | cornflower | 矢车菊 | flower / leaf | 花朵、树叶 |
| 23 | honeysuckle | 金银花 | flower / leaf | 花朵、树叶 |
| 24 | orchid | 蝴蝶兰 | flower / leaf | 花朵、树叶 |
| 25 | narcissus | 水仙花 | flower / leaf | 花朵、树叶 |
| 26 | kapok | 木棉花 | flower / leaf | 花朵、树叶 |
| 27 | freesia | 小苍兰 | flower / leaf | 花朵、树叶 |
| 28 | anemone | 银莲花 | flower / leaf | 花朵、树叶 |
| 29 | geranium | 天竺葵 | flower / leaf | 花朵、树叶 |
| 30 | petunia | 矮牵牛 | flower / leaf | 花朵、树叶 |
| 31 | gladiolus | 剑兰 | flower / leaf | 花朵、树叶 |
| 32 | mango | 芒果 | fruit / leaf | 果实、树叶 |
| 33 | pineapple | 菠萝 | fruit / leaf | 果实、树叶 |
| 34 | kiwi | 猕猴桃 | fruit / leaf | 果实、树叶 |
| 35 | lemon | 柠檬 | fruit / leaf | 果实、树叶 |
| 36 | persimmon | 柿子 | fruit / leaf | 果实、树叶 |
| 37 | pomegranate | 石榴 | fruit / leaf | 果实、树叶 |
| 38 | fig | 无花果 | fruit / leaf | 果实、树叶 |
| 39 | coconut | 椰子 | fruit / leaf | 果实、树叶 |
| 40 | papaya | 木瓜 | fruit / leaf | 果实、树叶 |
| 41 | dragon-fruit | 火龙果 | fruit / leaf | 果实、树叶 |
| 42 | lychee | 荔枝 | fruit / leaf | 果实、树叶 |
| 43 | longan | 龙眼 | fruit / leaf | 果实、树叶 |
| 44 | mangosteen | 山竹 | fruit / leaf | 果实、树叶 |
| 45 | durian | 榴莲 | fruit / leaf | 果实、树叶 |
| 46 | blueberry | 蓝莓 | fruit / leaf | 果实、树叶 |
| 47 | raspberry | 树莓 | fruit / leaf | 果实、树叶 |
| 48 | mulberry | 桑葚 | fruit / leaf | 果实、树叶 |
| 49 | apricot | 杏 | fruit / leaf | 果实、树叶 |
| 50 | plum | 李子 | fruit / leaf | 果实、树叶 |
| 51 | hawthorn | 山楂 | fruit / leaf | 果实、树叶 |
| 52 | chestnut | 板栗 | fruit / leaf | 果实、树叶 |
| 53 | walnut | 核桃 | fruit / leaf | 果实、树叶 |
| 54 | peanut | 花生 | fruit / leaf | 果实、树叶 |
| 55 | corn | 玉米 | fruit / leaf | 果实、树叶 |
| 56 | pumpkin | 南瓜 | fruit / leaf | 果实、树叶 |
| 57 | cucumber | 黄瓜 | fruit / leaf | 果实、树叶 |
| 58 | eggplant | 茄子 | fruit / leaf | 果实、树叶 |
| 59 | chili | 辣椒 | fruit / leaf | 果实、树叶 |
| 60 | starfruit | 杨桃 | fruit / leaf | 果实、树叶 |
| 61 | cantaloupe | 哈密瓜 | fruit / leaf | 果实、树叶 |
| 62 | loquat | 枇杷 | fruit / leaf | 果实、树叶 |
| 63 | jujube | 枣 | fruit / leaf | 果实、树叶 |
| 64 | sugarcane | 甘蔗 | fruit / leaf | 果实、树叶 |
| 65 | passion-fruit | 百香果 | fruit / leaf | 果实、树叶 |
| 66 | avocado | 牛油果 | fruit / leaf | 果实、树叶 |
| 67 | date | 椰枣 | fruit / leaf | 果实、树叶 |
| 68 | olive | 橄榄 | fruit / leaf | 果实、树叶 |
| 69 | pomelo | 柚子 | fruit / leaf | 果实、树叶 |
| 70 | kumquat | 金桔 | fruit / leaf | 果实、树叶 |

## 扩容后分类规模预期
- 花朵 flower = 22 + 31 = **53**
- 树叶 leaf = 30 + 70 = **100**（所有植物均含叶）
- 果实 fruit = 14 + 39 = **53**

## 验收标准（Sprint 3 Definition of Done）
1. `content/plants/` 下共 100 种植物 JSON，schema 合规（TC-11 数据驱动断言自动覆盖）。
2. `frontend/public/images/plants/` 下新增 140 张 SVG（70 种 × 2 部位），命名 `{id}-{part}.svg`，viewBox 512、平涂、≤40KB。
3. `docker compose up -d` 后，前端可浏览全部 100 种；分类筛选数量正确（花朵 53、树叶 100、果实 53）。
4. PRD §7 逐条验收通过（见 QA 手册第五节验收矩阵）。
5. 平板横屏（1024×768）下列表网格 ≥4 列，按钮触控目标 ≥44px。
6. `import-plants.mjs` 将 100 种导入后，MongoDB 无重复、Redis `sh:*` 清空、MySQL `import_log` 每次 +100。
7. 后端 `mvn test` + 前端 `npx vitest run` + E2E `npx playwright test` 全部通过，退出码均为 0。
8. 以上全部满足后 QA 放行，Master 执行 commit。
