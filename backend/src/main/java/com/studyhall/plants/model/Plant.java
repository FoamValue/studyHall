package com.studyhall.plants.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

/**
 * 植物文档（MongoDB plants 集合）。
 * id 为主键（@Id → _id），即设计文档要求的唯一索引；
 * parts 的键固定 ∈ {flower, leaf, fruit}，可缺省。
 */
@Document("plants")
public record Plant(
        @Id String id,
        List<String> categories,
        I18nName name,
        Map<String, PlantPart> parts) {
}
