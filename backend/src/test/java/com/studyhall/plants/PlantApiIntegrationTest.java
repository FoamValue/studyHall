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
        registry.add("spring.data.mongodb.uri", () -> MONGO.getReplicaSetUrl("studyhall_test"));
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

    /** TC-02 分类列表：3 个分类，按 order 升序，字段齐全。 */
    @Test
    void tc02_categoriesShouldBeSortedByOrder() {
        ApiResponse<List<Category>> resp = get("/api/categories", listOf(Category.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).hasSize(3);
        assertThat(resp.data()).extracting(Category::order).containsExactly(1, 2, 3);
        assertThat(resp.data()).allSatisfy(c -> {
            assertThat(c.code()).isNotBlank();
            assertThat(c.nameZh()).isNotBlank();
            assertThat(c.pinyin()).isNotBlank();
            assertThat(c.nameEn()).isNotBlank();
        });
    }

    /** TC-03 植物列表-全部：8 条种子，卡片字段齐全。 */
    @Test
    void tc03_plantListShouldReturnAllSeeds() {
        List<String> expectedIds = plants.stream().map(Plant::id).toList();
        ApiResponse<List<PlantCard>> resp = get("/api/plants", listOf(PlantCard.class));
        assertThat(resp.code()).isZero();
        assertThat(resp.data()).hasSize(8);
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

    /** TC-05 非法分类：code=40001，友好提示。 */
    @Test
    void tc05_invalidCategoryShouldReturn40001() {
        ApiResponse<Void> resp = get("/api/plants?category=abc",
                objectMapper.getTypeFactory().constructType(Void.class));
        assertThat(resp.code()).isEqualTo(40001);
        assertThat(resp.message()).isNotBlank();
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
        assertThat(flower.images().getFirst().url()).isEqualTo("/images/plants/sunflower-flower.svg");
        Allusion allusion = flower.allusion();
        assertThat(allusion).isNotNull();
        assertThat(allusion.text()).isNotBlank();
        assertThat(allusion.source()).isNotBlank();
        assertThat(allusion.explain()).isNotBlank();
    }

    /** TC-07 缺部位：银杏无 flower，列表封面回退到 leaf。 */
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
        assertThat(ginkgo.coverImage()).isEqualTo("/images/plants/ginkgo-leaf.svg");
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
}
