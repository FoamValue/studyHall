package com.studyhall.plants.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

/**
 * 植物文档（MongoDB plants 集合）。
 * id 为主键（@Id → _id），即设计文档要求的唯一索引；
 * parts 的键 ∈ {flower, leaf, fruit, animal, insect, dinosaur, letter, pinyin, number, color}，可缺省；
 * sort 为板块内排序值，可空（Mongo 升序时缺省排在数值之前）；
 * deprecated=true 表示命名冲突等历史原因废弃的条目：数据保留（不物理删除），页面不展示（列表与详情均过滤）。
 */
@Document("plants")
public record Plant(
        @Id String id,
        Boolean deprecated,
        List<String> categories,
        I18nName name,
        Map<String, PlantPart> parts,
        Integer sort) {
}
