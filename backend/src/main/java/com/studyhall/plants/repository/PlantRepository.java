package com.studyhall.plants.repository;

import com.studyhall.plants.model.Plant;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface PlantRepository extends MongoRepository<Plant, String> {

    /** 按分类集合筛选（categories 数组包含其中任一 code）；显式排序由调用方传入。 */
    List<Plant> findByCategoriesIn(Collection<String> categories, Sort sort);
}
