package com.studyhall.plants.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * 分类文档（MongoDB categories 集合），code 为主键。
 */
@Document("categories")
public record Category(
        @Id String code,
        String nameZh,
        String pinyin,
        String nameEn,
        int order) {
}
