package com.studyhall.plants.repository;

import com.studyhall.plants.model.Plant;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PlantRepository extends MongoRepository<Plant, String> {

    /** 按分类筛选（categories 数组包含该 code）。 */
    List<Plant> findByCategoriesContains(String category);
}
