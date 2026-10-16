package com.studyhall.plants.repository;

import com.studyhall.plants.model.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CategoryRepository extends MongoRepository<Category, String> {
}
