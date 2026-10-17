package com.studyhall.plants.model;

import java.util.List;

/**
 * 植物列表卡片：coverImage 请求带分类时优先取该分类对应部位的第一张图，
 * 缺失再依次回退 flower → leaf → fruit；
 * parts 为该植物实际拥有的部位 code，顺序固定 flower → leaf → fruit。
 */
public record PlantCard(String id, I18nName name, String coverImage, List<String> parts) {
}
