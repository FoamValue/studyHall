package com.studyhall.plants;

import com.studyhall.plants.model.Allusion;
import com.studyhall.plants.model.ApiResponse;
import com.studyhall.plants.model.Category;
import com.studyhall.plants.model.Plant;
import com.studyhall.plants.model.PlantCard;
import com.studyhall.plants.model.PlantPart;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.mongodb.MongoDBContainer;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Sprint 1 后端接口集成测试，覆盖 QA 手册 TC-01 ~ TC-09，另含 CORS 预检冒烟。
 * 容器在静态块中启动（早于 Spring 上下文创建，不依赖 JUnit 扩展执行顺序），
 * JVM 退出时通过关闭钩子回收；连接配置由 @ServiceConnection 推导，
 * @DynamicPropertySource 兜底（两者指向相同容器，值一致）。
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PlantApiIntegrationTest {

    @ServiceConnection
    static final MongoDBContainer MONGO = new MongoDBContainer(DockerImageName.parse("mongo:8.0.4"));

    @ServiceConnection
    static final MySQLContainer MYSQL = new MySQLContainer(DockerImageName.parse("mysql:8.0"))
            .withDatabaseName("studyhall_test")
            .withUsername("test")
            .withPassword("test");

    @ServiceConnection
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7"))
            .withExposedPorts(6379);

    static {
        MONGO.start();
        MYSQL.start();
        REDIS.start();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            REDIS.stop();
            MYSQL.stop();
            MONGO.stop();
        }));
    }

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.mongodb.uri", () -> MONGO.getReplicaSetUrl("studyhall_test"));
        registry.add("spring.data.redis.host", () -> REDIS.getHost());
        registry.add("spring.data.redis.port", () -> REDIS.getFirstMappedPort());
        registry.add("spring.datasource.url", () -> MYSQL.getJdbcUrl());
        registry.add("spring.datasource.username", () -> MYSQL.getUsername());
        registry.add("spring.datasource.password", () -> MYSQL.getPassword());
    }

    @Autowired
    ObjectMapper objectMapper;
    @Autowired
    MongoTemplate mongoTemplate;
    @Autowired
    StringRedisTemplate redisTemplate;
    @Autowired
    Environment environment;

    /** 板块分类 code 对应的图片前缀（单图条目的图片目录）。Sprint 15 增字母/拼音；Sprint 16 增数字/颜色。 */
    private static final Map<String, String> BOARD_IMAGE_PREFIX = Map.of(
            "animal", "/images/animals/",
            "insect", "/images/insects/",
            "dinosaur", "/images/dinosaurs/",
            "letter", "/images/letters/",
            "pinyin", "/images/pinyin/",
            "number", "/images/numbers/",
            "color", "/images/colors/");

    /** 字形类启蒙板块（字母 / 拼音）：名称仅符号本身，省略 pinyin/en/ipa。 */
    private static boolean isGlyphBoard(Plant p) {
        return p.categories().stream().anyMatch(c -> c.equals("letter") || c.equals("pinyin"));
    }

    List<Category> categories;
    List<Plant> plants;

    @BeforeEach
    void cleanAndSeed() throws Exception {
        // 测试隔离：清理 MongoDB（studyhall_test）与 Redis 后重新播种
        mongoTemplate.dropCollection("categories");
        mongoTemplate.dropCollection("plants");
        categories = ContentSeed.loadCategories(objectMapper);
        plants = ContentSeed.loadPlants(objectMapper);
        categories.forEach(mongoTemplate::save);
        plants.forEach(mongoTemplate::save);
        var keys = redisTemplate.keys("sh:*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    /** 基于随机端口新建客户端（轻量对象，避免依赖 Boot 专属测试工具类）。 */
    RestClient rest() {
        return RestClient.builder()
                .baseUrl("http://localhost:" + environment.getProperty("local.server.port"))
                .build();
    }

    private JavaType listOf(Class<?> elementType) {
        return objectMapper.getTypeFactory().constructCollectionType(List.class, elementType);
    }

    /** 发起 GET 并把统一响应体反序列化为 ApiResponse<T>。 */
    private <T> ApiResponse<T> get(String uri, JavaType dataType) {
        JavaType type = objectMapper.getTypeFactory()
                .constructParametricType(ApiResponse.class, dataType);
        String body = rest().get().uri(uri).retrieve().body(String.class);
        return objectMapper.readValue(body, type);
    }

    /** TC-01 健康检查。 */
    @Test
    void tc01_healthShouldReturnUp() {
        JavaType mapType = objectMapper.getTypeFactory()
                .constructMapType(Map.class, String.class, String.class);
        ApiResponse<Map<String, String>> resp = get("/api/health", mapType);
        assertThat(resp.code()).isZero();
        assertThat(resp.message()).isEqualTo("ok");
        assertThat(resp.data().get("status")).isEqualTo("UP");
    }

    /** TC-02 分类列表：条数 = content 实际分类数，按 order 升序，字段齐全（Sprint 9 起含 section）。 */
    @Test
    void tc02_categoriesShouldBeSortedByOrder() {
        ApiResponse<List<Category>> resp = get("/api/categories", listOf(Category.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).hasSize(categories.size());
        assertThat(resp.data()).extracting(Category::order)
                .containsExactlyElementsOf(categories.stream().map(Category::order).toList());
        assertThat(resp.data()).allSatisfy(c -> {
            assertThat(c.code()).isNotBlank();
            assertThat(c.nameZh()).isNotBlank();
            assertThat(c.pinyin()).isNotBlank();
            assertThat(c.nameEn()).isNotBlank();
            assertThat(c.section()).isIn("plant", "animal", "insect", "dinosaur", "letter", "pinyin", "number", "color");
        });
    }

    /** TC-03 条目列表-全部：条数等于 content/ 四个子目录实际条目数（130），卡片字段齐全。 */
    @Test
    void tc03_plantListShouldReturnAllSeeds() {
        List<String> expectedIds = plants.stream().map(Plant::id).toList();
        ApiResponse<List<PlantCard>> resp = get("/api/plants", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).hasSize(expectedIds.size());
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyInAnyOrderElementsOf(expectedIds);
        assertThat(resp.data()).allSatisfy(card -> {
            assertThat(card.id()).isNotBlank();
            assertThat(card.name()).isNotNull();
            assertThat(card.name().zh()).isNotBlank();
            assertThat(card.coverImage()).isNotBlank();
            assertThat(card.parts()).isNotEmpty();
        });
    }

    /** TC-04 植物列表-筛选：只返回 categories 含 flower 的植物。 */
    @Test
    void tc04_plantListShouldFilterByCategory() {
        List<String> expected = plants.stream()
                .filter(p -> p.categories().contains("flower"))
                .map(Plant::id)
                .toList();
        ApiResponse<List<PlantCard>> resp = get("/api/plants?category=flower", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyInAnyOrderElementsOf(expected);
    }

    /** TC-05 非法分类：code=40001，友好提示覆盖四板块。 */
    @Test
    void tc05_invalidCategoryShouldReturn40001() {
        ApiResponse<Void> resp = get("/api/plants?category=abc",
                objectMapper.getTypeFactory().constructType(Void.class));
        assertThat(resp.code()).isEqualTo(40001);
        assertThat(resp.message()).contains("昆虫");
    }

    /** TC-06 植物详情：向日葵完整文档，三语名称、三部位、说明与典故齐全。 */
    @Test
    void tc06_plantDetailShouldReturnFullDocument() {
        ApiResponse<Plant> resp = get("/api/plants/sunflower",
                objectMapper.getTypeFactory().constructType(Plant.class));
        assertThat(resp.code()).isZero();
        Plant sunflower = resp.data();
        assertThat(sunflower.id()).isEqualTo("sunflower");
        assertThat(sunflower.name().zh()).isEqualTo("向日葵");
        assertThat(sunflower.name().pinyin()).isNotBlank();
        assertThat(sunflower.name().en()).isEqualTo("Sunflower");
        assertThat(sunflower.name().ipa()).startsWith("/");
        assertThat(sunflower.parts().keySet()).containsExactlyInAnyOrder("flower", "leaf", "fruit");
        PlantPart flower = sunflower.parts().get("flower");
        assertThat(flower.description()).isNotBlank();
        assertThat(flower.images().getFirst().url()).isEqualTo("/images/plants/sunflower-flower.jpg");
        Allusion allusion = flower.allusion();
        assertThat(allusion).isNotNull();
        assertThat(allusion.text()).isNotBlank();
        assertThat(allusion.source()).isNotBlank();
        assertThat(allusion.explain()).isNotBlank();
    }

    /** TC-07 缺部位：银杏无 flower，列表封面回退到 leaf；maple 仅 leaf（Sprint 2 新增）。 */
    @Test
    void tc07_missingPartShouldFallbackCoverImage() {
        ApiResponse<Plant> resp = get("/api/plants/ginkgo",
                objectMapper.getTypeFactory().constructType(Plant.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data().parts()).doesNotContainKey("flower");
        assertThat(resp.data().parts().keySet()).containsExactlyInAnyOrder("leaf", "fruit");

        ApiResponse<List<PlantCard>> list = get("/api/plants", listOf(PlantCard.class));
        PlantCard ginkgo = list.data().stream()
                .filter(card -> card.id().equals("ginkgo"))
                .findFirst()
                .orElseThrow();
        assertThat(ginkgo.coverImage()).isEqualTo("/images/plants/ginkgo-leaf.jpg");

        // Sprint 2 新增：maple 仅有 leaf 部位
        ApiResponse<Plant> maple = get("/api/plants/maple",
                objectMapper.getTypeFactory().constructType(Plant.class));
        assertThat(maple.code()).isZero();
        assertThat(maple.data().parts().keySet()).containsExactly("leaf");
    }

    /** TC-08 不存在的植物：code=40401。 */
    @Test
    void tc08_unknownPlantShouldReturn40401() {
        ApiResponse<Void> resp = get("/api/plants/nope",
                objectMapper.getTypeFactory().constructType(Void.class));
        assertThat(resp.code()).isEqualTo(40401);
    }

    /** TC-09 缓存生效：写入 sh:plant:* 且 TTL ≤ 600s；删库后二次请求仍成功（证明命中 Redis）。 */
    @Test
    void tc09_cacheShouldServeSecondRead() {
        ApiResponse<List<PlantCard>> list = get("/api/plants", listOf(PlantCard.class));
        assertThat(list.code()).isZero();
        assertThat(redisTemplate.hasKey("sh:plants:list:all")).isTrue();

        ApiResponse<Plant> first = get("/api/plants/sunflower",
                objectMapper.getTypeFactory().constructType(Plant.class));
        assertThat(first.code()).isZero();
        assertThat(redisTemplate.hasKey("sh:plant:sunflower")).isTrue();
        Long ttl = redisTemplate.getExpire("sh:plant:sunflower");
        assertThat(ttl).isNotNull().isPositive().isLessThanOrEqualTo(600);

        // 删掉 Mongo 里的文档，第二次请求仍能返回 → 说明读的是 Redis 缓存
        mongoTemplate.remove(Query.query(Criteria.where("_id").is("sunflower")), "plants");
        ApiResponse<Plant> second = get("/api/plants/sunflower",
                objectMapper.getTypeFactory().constructType(Plant.class));
        assertThat(second.code()).isZero();
        assertThat(second.data().id()).isEqualTo("sunflower");
    }

    /** CORS 冒烟：Vite dev server 预检放行。 */
    @Test
    void corsShouldAllowViteDevServer() {
        ResponseEntity<String> resp = rest().method(HttpMethod.OPTIONS)
                .uri("/api/plants?category=flower")
                .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .retrieve()
                .toEntity(String.class);
        assertThat(resp.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(resp.getHeaders().getFirst(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN))
                .isEqualTo("http://localhost:5173");
    }

    /** TC-11 内容 schema 全量合规（数据驱动，Sprint 9 起含动物/昆虫/恐龙，Sprint 15 起含字母/拼音）：
     *  categories = parts 键集合、每部位 ≥1 图且图路径符合板块前缀、三语非空（字形类板块省略 pinyin/en/ipa）、
     *  allusion 有则文本与解释非空（source 可选）。 */
    @Test
    void tc11_allContentFilesShouldMatchSchema() {
        assertThat(plants).isNotEmpty();
        for (Plant p : plants) {
            boolean glyph = isGlyphBoard(p);
            assertThat(p.id()).isNotBlank();
            assertThat(p.categories()).containsExactlyInAnyOrderElementsOf(p.parts().keySet());
            assertThat(p.name().zh()).isNotBlank();
            if (!glyph) {
                assertThat(p.name().pinyin()).isNotBlank();
                assertThat(p.name().en()).isNotBlank();
                assertThat(p.name().ipa()).startsWith("/");
            }
            assertThat(p.sort()).as("条目 %s 缺少 sort", p.id()).isNotNull();
            p.parts().forEach((partCode, part) -> {
                assertThat(part.name().zh()).isNotBlank();
                if (!glyph) {
                    assertThat(part.name().pinyin()).isNotBlank();
                    assertThat(part.name().en()).isNotBlank();
                }
                assertThat(part.images()).isNotEmpty();
                String boardPrefix = BOARD_IMAGE_PREFIX.get(partCode);
                part.images().forEach(img -> {
                    assertThat(img.type()).isIn("illustration", "photo", "restore");
                    if (boardPrefix != null) {
                        assertThat(img.url()).startsWith(boardPrefix + p.id() + ".");
                    } else {
                        assertThat(img.url()).startsWith("/images/plants/" + p.id() + "-");
                    }
                });
                assertThat(part.description()).isNotBlank();
                if (part.allusion() != null) {
                    assertThat(part.allusion().text()).isNotBlank();
                    assertThat(part.allusion().explain()).isNotBlank();
                    // Sprint 13（v2.4）：小知识「有明确出处才填 source」，植物与板块统一口径
                    //（无合适古典诗文的植物以文化/自然常识回退，省略 source）；若填写则须非空
                    if (part.allusion().source() != null) {
                        assertThat(part.allusion().source()).isNotBlank();
                    }
                }
            });
        }
    }

    /** TC-12 图片资产齐备：JSON 引用的 photo/restore 图片在 frontend/public 下存在对应文件。 */
    @Test
    void tc12_photoAssetsShouldExistOnDisk() {
        Path publicDir = ContentSeed.contentDir().resolve("../frontend/public").normalize();
        assertThat(publicDir).isDirectory();
        for (Plant p : plants) {
            p.parts().forEach((partCode, part) ->
                    part.images().stream()
                            .filter(img -> img.type().equals("photo") || img.type().equals("restore"))
                            .forEach(img -> {
                                // url 形如 /images/plants/{id}-{part}.jpg 或 /images/animals/{id}.jpg，去掉前导斜杠映射到 public 下
                                Path file = publicDir.resolve(img.url().substring(1));
                                assertThat(Files.isRegularFile(file))
                                        .as("缺少图片资产 %s（条目 %s 部位 %s）", img.url(), p.id(), partCode)
                                        .isTrue();
                            }));
        }
    }

    /** TC-13 SB4 属性名生效：上下文经由 spring.mongodb.uri 连接成功（本类全部用例通过即证明），并显式断言属性已注册。 */
    @Test
    void tc13_sb4MongoPropertyShouldBeRegistered() {
        assertThat(environment.getProperty("spring.mongodb.uri")).startsWith("mongodb://");
        assertThat(environment.getProperty("spring.data.mongodb.uri")).isNull();
    }

    /** TC-24 低龄化文案（Sprint 3 新增）：每部位说明 ≤80 字且不含拉丁字母（拼音/英文名字段不在此列）。
     *  Sprint 15：字形类启蒙板块（字母/拼音）的说明按设计含英文示例词，豁免拉丁字母红线。 */
    @Test
    void tc24_descriptionsShouldBeToddlerFriendly() {
        assertThat(plants).isNotEmpty();
        for (Plant p : plants) {
            boolean glyph = isGlyphBoard(p);
            p.parts().forEach((partCode, part) -> {
                String desc = part.description();
                assertThat(desc.codePointCount(0, desc.length()))
                        .as("植物 %s 部位 %s 说明超过 80 字", p.id(), partCode)
                        .isLessThanOrEqualTo(80);
                if (!glyph) {
                    assertThat(desc)
                            .as("植物 %s 部位 %s 说明混入拉丁字母", p.id(), partCode)
                            .doesNotContainPattern("[A-Za-z]");
                }
            });
        }
    }

    /** TC-57 分类列表封面跟随分类（Sprint 7 / EX-1）：含花朵的植物在树叶/果实分类下取对应部位封面。 */
    @Test
    void tc57_categoryCoverImageShouldFollowCategory() {
        ApiResponse<List<PlantCard>> leafList = get("/api/plants?category=leaf", listOf(PlantCard.class));
        assertThat(leafList.code()).isZero();
        assertThat(findCard(leafList.data(), "apple").coverImage())
                .isEqualTo("/images/plants/apple-leaf.jpg");
        assertThat(findCard(leafList.data(), "anemone").coverImage())
                .isEqualTo("/images/plants/anemone-leaf.jpg");

        ApiResponse<List<PlantCard>> fruitList = get("/api/plants?category=fruit", listOf(PlantCard.class));
        assertThat(fruitList.code()).isZero();
        assertThat(findCard(fruitList.data(), "apple").coverImage())
                .isEqualTo("/images/plants/apple-fruit.jpg");
    }

    /** TC-58 「全部」与花朵分类封面回退顺序不变（回归 TC-07 语义，Sprint 7）。 */
    @Test
    void tc58_allAndFlowerCoverImageShouldKeepFallback() {
        ApiResponse<List<PlantCard>> all = get("/api/plants", listOf(PlantCard.class));
        assertThat(all.code()).isZero();
        assertThat(findCard(all.data(), "ginkgo").coverImage()).isEqualTo("/images/plants/ginkgo-leaf.jpg");
        assertThat(findCard(all.data(), "apple").coverImage()).isEqualTo("/images/plants/apple-flower.jpg");

        ApiResponse<List<PlantCard>> flower = get("/api/plants?category=flower", listOf(PlantCard.class));
        assertThat(flower.code()).isZero();
        assertThat(findCard(flower.data(), "apple").coverImage()).isEqualTo("/images/plants/apple-flower.jpg");
    }

    /** TC-71 板块列表（Sprint 9）：?section=plant 计数 = 该板块条目数（数据驱动）。 */
    @Test
    void tc71_sectionPlantShouldReturnBoardEntries() {
        long expected = plants.stream()
                .filter(p -> p.categories().stream().anyMatch(c -> "plant".equals(sectionOf(c))))
                .count();
        ApiResponse<List<PlantCard>> resp = get("/api/plants?section=plant", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).hasSize((int) expected);
    }

    /** TC-72 单图板块（Sprint 9）：?section=animal 计数 = 该板块条目数且每条 parts 恰 [animal]。 */
    @Test
    void tc72_sectionAnimalShouldReturnSinglePartEntries() {
        List<String> animalIds = plants.stream()
                .filter(p -> p.categories().contains("animal"))
                .map(Plant::id)
                .toList();
        ApiResponse<List<PlantCard>> resp = get("/api/plants?section=animal", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyInAnyOrderElementsOf(animalIds);
        assertThat(resp.data()).allSatisfy(card -> assertThat(card.parts()).containsExactly("animal"));
    }

    /** TC-73 未知板块（Sprint 9）：code=40002，友好提示。 */
    @Test
    void tc73_unknownSectionShouldReturn40002() {
        ApiResponse<Void> resp = get("/api/plants?section=nope",
                objectMapper.getTypeFactory().constructType(Void.class));
        assertThat(resp.code()).isEqualTo(40002);
        assertThat(resp.message()).contains("板块");
    }

    /** TC-74 单图板块封面（Sprint 9）：?category=animal 封面 = 该条目自身单图。 */
    @Test
    void tc74_categoryAnimalCoverShouldMatchItsImage() {
        ApiResponse<List<PlantCard>> resp = get("/api/plants?category=animal", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).isNotEmpty();
        assertThat(resp.data()).allSatisfy(card -> {
            Plant p = findPlant(card.id());
            assertThat(card.coverImage())
                    .isEqualTo(p.parts().get("animal").images().getFirst().url());
        });
    }

    /** TC-75 列表顺序稳定（Sprint 9 清排序技术债）：两次请求一致且 = sort ASC, id ASC。 */
    @Test
    void tc75_listShouldBeSortedBySortThenId() {
        Comparator<Plant> bySortThenId = Comparator
                .comparing(Plant::sort, Comparator.nullsFirst(Comparator.naturalOrder()))
                .thenComparing(Plant::id);

        ApiResponse<List<PlantCard>> first = get("/api/plants", listOf(PlantCard.class));
        ApiResponse<List<PlantCard>> second = get("/api/plants", listOf(PlantCard.class));
        assertThat(first.code()).isZero();
        List<String> expectedAll = plants.stream().sorted(bySortThenId).map(Plant::id).toList();
        assertThat(first.data()).extracting(PlantCard::id).containsExactlyElementsOf(expectedAll);
        assertThat(second.data()).extracting(PlantCard::id)
                .containsExactlyElementsOf(first.data().stream().map(PlantCard::id).toList());

        // 分类列表同样显式排序（替换原 findByCategoriesContains 未排序技术债）
        ApiResponse<List<PlantCard>> leaf = get("/api/plants?category=leaf", listOf(PlantCard.class));
        List<String> expectedLeaf = plants.stream()
                .filter(p -> p.categories().contains("leaf"))
                .sorted(bySortThenId)
                .map(Plant::id)
                .toList();
        assertThat(leaf.data()).extracting(PlantCard::id).containsExactlyElementsOf(expectedLeaf);
    }

    /** TC-143 字母板块（Sprint 15）：?section=letter 26 条、每条 parts 恰 [letter]、按 sort 升序首 letter-a 末 letter-z。 */
    @Test
    void tc143_letterSectionShouldReturn26GlyphCards() {
        List<Plant> letters = plants.stream()
                .filter(p -> p.categories().contains("letter"))
                .sorted(Comparator.comparing(Plant::sort))
                .toList();
        assertThat(letters).hasSize(26);
        ApiResponse<List<PlantCard>> resp = get("/api/plants?section=letter", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyElementsOf(letters.stream().map(Plant::id).toList());
        assertThat(resp.data()).allSatisfy(card -> assertThat(card.parts()).containsExactly("letter"));
        assertThat(resp.data().getFirst().id()).isEqualTo("letter-a");
        assertThat(resp.data().getLast().id()).isEqualTo("letter-z");
    }

    /** TC-144 拼音板块（Sprint 15）：?section=pinyin 26 条、每条 parts 恰 [pinyin]。 */
    @Test
    void tc144_pinyinSectionShouldReturn26GlyphCards() {
        List<Plant> pinyin = plants.stream()
                .filter(p -> p.categories().contains("pinyin"))
                .sorted(Comparator.comparing(Plant::sort))
                .toList();
        assertThat(pinyin).hasSize(26);
        ApiResponse<List<PlantCard>> resp = get("/api/plants?section=pinyin", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyElementsOf(pinyin.stream().map(Plant::id).toList());
        assertThat(resp.data()).allSatisfy(card -> assertThat(card.parts()).containsExactly("pinyin"));
        assertThat(resp.data().getFirst().id()).isEqualTo("pinyin-a");
        assertThat(resp.data().getLast().id()).isEqualTo("pinyin-z");
    }

    /** TC-145 分类齐备（Sprint 15 起；Sprint 16 扩至 10 条）：/api/categories 含字形类（letter/pinyin）与数字/颜色。 */
    @Test
    void tc145_categoriesShouldIncludeGlyphBoards() {
        ApiResponse<List<Category>> resp = get("/api/categories", listOf(Category.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).hasSize(10);
        assertThat(resp.data()).extracting(Category::code).contains("letter", "pinyin", "number", "color");
        Category letter = resp.data().stream().filter(c -> c.code().equals("letter")).findFirst().orElseThrow();
        assertThat(letter.nameZh()).isEqualTo("英文字母");
        assertThat(letter.section()).isEqualTo("letter");
        Category pinyin = resp.data().stream().filter(c -> c.code().equals("pinyin")).findFirst().orElseThrow();
        assertThat(pinyin.nameZh()).isEqualTo("汉语拼音");
        assertThat(pinyin.section()).isEqualTo("pinyin");
        Category number = resp.data().stream().filter(c -> c.code().equals("number")).findFirst().orElseThrow();
        assertThat(number.nameZh()).isEqualTo("数字");
        assertThat(number.section()).isEqualTo("number");
        Category color = resp.data().stream().filter(c -> c.code().equals("color")).findFirst().orElseThrow();
        assertThat(color.nameZh()).isEqualTo("颜色");
        assertThat(color.section()).isEqualTo("color");
    }

    /** TC-156 数字板块（Sprint 16）：?section=number 21 条、每条 parts 恰 [number]、sort 升序首 number-0 末 number-20。 */
    @Test
    void tc156_numberSectionShouldReturn21Cards() {
        List<Plant> numbers = plants.stream()
                .filter(p -> p.categories().contains("number"))
                .sorted(Comparator.comparing(Plant::sort))
                .toList();
        assertThat(numbers).hasSize(21);
        ApiResponse<List<PlantCard>> resp = get("/api/plants?section=number", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyElementsOf(numbers.stream().map(Plant::id).toList());
        assertThat(resp.data()).allSatisfy(card -> assertThat(card.parts()).containsExactly("number"));
        assertThat(resp.data().getFirst().id()).isEqualTo("number-0");
        assertThat(resp.data().getLast().id()).isEqualTo("number-20");
    }

    /** TC-157 颜色板块（Sprint 16）：?section=color 11 条、每条 parts 恰 [color]、首 color-black 末 color-grey。 */
    @Test
    void tc157_colorSectionShouldReturn11Cards() {
        List<Plant> colors = plants.stream()
                .filter(p -> p.categories().contains("color"))
                .sorted(Comparator.comparing(Plant::sort))
                .toList();
        assertThat(colors).hasSize(11);
        ApiResponse<List<PlantCard>> resp = get("/api/plants?section=color", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).extracting(PlantCard::id)
                .containsExactlyElementsOf(colors.stream().map(Plant::id).toList());
        assertThat(resp.data()).allSatisfy(card -> assertThat(card.parts()).containsExactly("color"));
        assertThat(resp.data().getFirst().id()).isEqualTo("color-black");
        assertThat(resp.data().getLast().id()).isEqualTo("color-grey");
    }

    /** TC-158 数字/颜色保留完整三语+音标（Sprint 16）：不豁免（区别字形类 letter/pinyin）。 */
    @Test
    void tc158_numberAndColorShouldKeepFullNames() {
        List<Plant> targets = plants.stream()
                .filter(p -> p.categories().contains("number") || p.categories().contains("color"))
                .toList();
        assertThat(targets).hasSize(32);
        for (Plant p : targets) {
            assertThat(p.name().zh()).isNotBlank();
            assertThat(p.name().pinyin()).isNotBlank();
            assertThat(p.name().en()).isNotBlank();
            assertThat(p.name().ipa()).startsWith("/");
            String partCode = p.parts().keySet().iterator().next();
            var part = p.parts().get(partCode);
            assertThat(part.name().pinyin()).isNotBlank();
            assertThat(part.name().en()).isNotBlank();
        }
    }

    /** 取分类 code 所属板块（无匹配返回 null）。 */
    private String sectionOf(String categoryCode) {
        return categories.stream()
                .filter(c -> c.code().equals(categoryCode))
                .map(Category::section)
                .findFirst()
                .orElse(null);
    }

    /** 取已播种的条目文档。 */
    private Plant findPlant(String id) {
        return plants.stream().filter(p -> p.id().equals(id)).findFirst()
                .orElseThrow(() -> new AssertionError("内容缺少条目 " + id));
    }

    private static PlantCard findCard(List<PlantCard> cards, String id) {
        return cards.stream().filter(c -> c.id().equals(id)).findFirst()
                .orElseThrow(() -> new AssertionError("列表缺少卡片 " + id));
    }
}
