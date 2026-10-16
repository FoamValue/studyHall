package com.studyhall.plants.model;

import java.util.List;

/**
 * 植物列表卡片：coverImage 依次回退 flower → leaf → fruit 的第一张图；
 * parts 为该植物实际拥有的部位 code，顺序固定 flower → leaf → fruit。
 */
public record PlantCard(String id, I18nName name, String coverImage, List<String> parts) {
}
