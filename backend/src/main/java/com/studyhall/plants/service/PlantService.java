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
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * 植物/分类查询服务：MongoDB 提供数据，Redis 缓存读结果（TTL 600s 兜底）。
 * 缓存 key 约定：sh:categories、sh:plants:list:{category|all}、sh:plants:list:section:{section}、
 * sh:plant:{id}（JSON 序列化）。
 */
@Service
public class PlantService {

    /** 部位固定顺序（植物三项在前），部位标签展示与封面回退都依赖此顺序。
     *  Sprint 15：尾部追加认知启蒙板块键（letter/pinyin/number/color），
     *  使单图条目（含字母/拼音）的 partCodes 与封面回退正确。 */
    private static final List<String> PART_ORDER =
            List.of("flower", "leaf", "fruit", "animal", "insect", "dinosaur",
                    "letter", "pinyin", "number", "color");

    /** 列表统一排序：sort 升序，其次 id 升序（空缺 sort 由 Mongo 升序排前）。 */
    private static final Sort LIST_SORT = Sort.by(Sort.Direction.ASC, "sort", "id");

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

    /**
     * 列表查询：category 优先（二级筛选），否则 section（板块），两者皆空为全部条目（跨板块）。
     * 合法性校验均放在查缓存之前，非法值不落缓存。
     */
    public List<PlantCard> getPlants(String category, String section) {
        if (category != null && !category.isBlank()) {
            if (!categoryRepository.existsById(category)) {
                throw new ApiException(40001,
                        "没有「%s」这个分类哦，试试植物、动物、昆虫、恐龙、英文字母或汉语拼音吧"
                                .formatted(category));
            }
            return cachedList(KEY_PLANT_LIST_PREFIX + category, PlantCard.class,
                    () -> plantRepository.findActiveByCategoriesIn(List.of(category), LIST_SORT)
                            .stream().map(plant -> toCard(plant, category)).toList());
        }
        if (section != null && !section.isBlank()) {
            // 取该板块下全部分类 code（按 order 升序），无匹配分类即未知板块
            List<String> codes = categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "order")).stream()
                    .filter(c -> section.equals(c.section()))
                    .map(Category::code)
                    .toList();
            if (codes.isEmpty()) {
                throw new ApiException(40002, "没有「%s」这个板块哦".formatted(section));
            }
            return cachedList(KEY_PLANT_LIST_PREFIX + "section:" + section, PlantCard.class,
                    () -> plantRepository.findActiveByCategoriesIn(codes, LIST_SORT)
                            .stream().map(plant -> toCard(plant, null)).toList());
        }
        return cachedList(KEY_PLANT_LIST_PREFIX + "all", PlantCard.class,
                () -> plantRepository.findAllActive(LIST_SORT)
                        .stream().map(plant -> toCard(plant, null)).toList());
    }

    /** 详情：废弃条目（deprecated=true）数据保留但页面不展示，按不存在处理（40401）。 */
    public Plant getPlant(String id) {
        String key = KEY_PLANT_PREFIX + id;
        String cached = redis.opsForValue().get(key);
        if (cached != null) {
            return objectMapper.readValue(cached, Plant.class);
        }
        Plant plant = plantRepository.findById(id)
                .filter(p -> !Boolean.TRUE.equals(p.deprecated()))
                .orElseThrow(() -> new ApiException(40401, "这株植物还没准备好哦，换一株看看吧"));
        redis.opsForValue().set(key, objectMapper.writeValueAsString(plant), cacheTtl);
        return plant;
    }

    PlantCard toCard(Plant plant, String category) {
        return new PlantCard(plant.id(), plant.name(), coverImage(plant, category), partCodes(plant));
    }

    private List<String> partCodes(Plant plant) {
        if (plant.parts() == null) {
            return List.of();
        }
        return PART_ORDER.stream().filter(plant.parts()::containsKey).toList();
    }

    /**
     * 封面：请求带分类时优先取该分类对应部位的首图，缺失再按 PART_ORDER 回退；
     * 未指定分类（全部/板块列表）保持 PART_ORDER 顺序（单图板块条目取自身单图）。
     */
    private String coverImage(Plant plant, String category) {
        if (plant.parts() == null) {
            return null;
        }
        List<String> order = new ArrayList<>(PART_ORDER);
        if (category != null && plant.parts().containsKey(category)) {
            order.remove(category);
            order.addFirst(category);
        }
        return order.stream()
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
