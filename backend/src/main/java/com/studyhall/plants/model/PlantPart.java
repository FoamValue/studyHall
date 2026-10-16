package com.studyhall.plants.model;

import java.util.List;

/**
 * 植物部位：三语名称 + 简笔画 + 低龄化说明 + 可选典故。
 */
public record PlantPart(I18nName name, List<PlantImage> images, String description, Allusion allusion) {
}
