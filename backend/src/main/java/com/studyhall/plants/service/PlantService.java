package com.studyhall.plants.service;

import com.studyhall.plants.config.ApiException;
import com.studyhall.plants.model.Category;
import com.studyhall.plants.model.Plant;
import com.studyhall.plants.model.PlantCard;
import com.studyhall.plants.model.PlantPart;
import com.studyhall.plants.repository.CategoryRepository;
import com.studyhall.plants.repository.PlantRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;
import java.util.function.Supplier;

/**
 * 植物/分类查询服务：MongoDB 提供数据，Redis 缓存读结果（TTL 600s 兜底）。
 * 缓存 key 约定：sh:categories、sh:plants:list:{category|all}、sh:plant:{id}（JSON 序列化）。
 */
@Service
public class PlantService {

    /** 部位固定顺序，部位标签展示与封面回退都依赖此顺序。 */
    private static final List<String> PART_ORDER = List.of("flower", "leaf", "fruit");

    static final String KEY_CATEGORIES = "sh:categories";
    static final String KEY_PLANT_LIST_PREFIX = "sh:plants:list:";
    static final String KEY_PLANT_PREFIX = "sh:plant:";

    private final PlantRepository plantRepository;
    private final CategoryRepository categoryRepository;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final Duration cacheTtl;

    public PlantService(PlantRepository plantRepository,
                        CategoryRepository categoryRepository,
                        StringRedisTemplate redis,
                        ObjectMapper objectMapper,
                        @Value("${studyhall.cache.ttl-seconds:600}") long cacheTtlSeconds) {
        this.plantRepository = plantRepository;
        this.categoryRepository = categoryRepository;
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.cacheTtl = Duration.ofSeconds(cacheTtlSeconds);
    }

    public List<Category> getCategories() {
        return cachedList(KEY_CATEGORIES, Category.class,
                () -> categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "order")));
    }

    public List<PlantCard> getPlants(String category) {
        if (category == null || category.isBlank()) {
            return cachedList(KEY_PLANT_LIST_PREFIX + "all", PlantCard.class,
                    () -> plantRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                            .stream().map(this::toCard).toList());
        }
        // 分类合法性校验放在查缓存之前，非法分类不落缓存
        if (!categoryRepository.existsById(category)) {
            throw new ApiException(40001, "没有「%s」这个分类哦，试试花朵、树叶或果实吧".formatted(category));
        }
        return cachedList(KEY_PLANT_LIST_PREFIX + category, PlantCard.class,
                () -> plantRepository.findByCategoriesContains(category)
                        .stream().map(this::toCard).toList());
    }

    public Plant getPlant(String id) {
        String key = KEY_PLANT_PREFIX + id;
        String cached = redis.opsForValue().get(key);
        if (cached != null) {
            return objectMapper.readValue(cached, Plant.class);
        }
        Plant plant = plantRepository.findById(id)
                .orElseThrow(() -> new ApiException(40401, "这株植物还没准备好哦，换一株看看吧"));
        redis.opsForValue().set(key, objectMapper.writeValueAsString(plant), cacheTtl);
        return plant;
    }

    PlantCard toCard(Plant plant) {
        return new PlantCard(plant.id(), plant.name(), coverImage(plant), partCodes(plant));
    }

    private List<String> partCodes(Plant plant) {
        if (plant.parts() == null) {
            return List.of();
        }
        return PART_ORDER.stream().filter(plant.parts()::containsKey).toList();
    }

    private String coverImage(Plant plant) {
        if (plant.parts() == null) {
            return null;
        }
        // 封面回退：flower → leaf → fruit，各取第一张图
        return PART_ORDER.stream()
                .map(plant.parts()::get)
                .filter(part -> part != null && part.images() != null && !part.images().isEmpty())
                .map(part -> part.images().getFirst().url())
                .findFirst()
                .orElse(null);
    }

    /** 通用列表缓存：命中直接反序列化，未命中加载后写回缓存。 */
    private <T> List<T> cachedList(String key, Class<T> elementType, Supplier<List<T>> loader) {
        String cached = redis.opsForValue().get(key);
        if (cached != null) {
            JavaType listType = objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, elementType);
            return objectMapper.readValue(cached, listType);
        }
        List<T> value = loader.get();
        redis.opsForValue().set(key, objectMapper.writeValueAsString(value), cacheTtl);
        return value;
    }
}
