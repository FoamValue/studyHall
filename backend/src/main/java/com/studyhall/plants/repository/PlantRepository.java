package com.studyhall.plants.repository;

import com.studyhall.plants.model.Plant;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Collection;
import java.util.List;

/**
 * Sprint 17 修正：废弃条目（deprecated=true，如命名冲突的 peach-blossom-flower/leaf）数据保留但不展示，
 * 列表查询统一以 {@code deprecated: {$ne: true}} 过滤（$ne 对字段缺省的普通条目同样命中）。
 */
public interface PlantRepository extends MongoRepository<Plant, String> {

    /** 按分类集合筛选且排除废弃条目（categories 数组包含其中任一 code）；显式排序由调用方传入。 */
    @Query("{ categories: { $in: ?0 }, deprecated: { $ne: true } }")
    List<Plant> findActiveByCategoriesIn(Collection<String> categories, Sort sort);

    /** 全部有效条目（排除废弃），排序由调用方传入。 */
    @Query("{ deprecated: { $ne: true } }")
    List<Plant> findAllActive(Sort sort);
}
