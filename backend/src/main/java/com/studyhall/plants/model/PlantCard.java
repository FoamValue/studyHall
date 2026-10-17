package com.studyhall.plants.model;

import java.util.List;

/**
 * 条目列表卡片：coverImage 请求带分类时优先取该分类对应部位的第一张图，
 * 缺失再按 flower → leaf → fruit → animal → insect → dinosaur 回退（单图板块条目取自身单图）；
 * parts 为该条目实际拥有的部位 code，顺序固定按上述顺序。
 */
public record PlantCard(String id, I18nName name, String coverImage, List<String> parts) {
}
