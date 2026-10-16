package com.studyhall.plants.controller;

import com.studyhall.plants.model.ApiResponse;
import com.studyhall.plants.model.Category;
import com.studyhall.plants.model.Plant;
import com.studyhall.plants.model.PlantCard;
import com.studyhall.plants.service.PlantService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Sprint 1 全部接口（均为 GET），响应统一 {code, data, message}。
 */
@RestController
@RequestMapping("/api")
public class PlantController {

    private final PlantService plantService;

    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    /** 健康检查。 */
    @GetMapping("/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.ok(Map.of("status", "UP"));
    }

    /** 分类列表（按 order 升序）。 */
    @GetMapping("/categories")
    public ApiResponse<List<Category>> categories() {
        return ApiResponse.ok(plantService.getCategories());
    }

    /** 植物卡片列表；category 缺省 = 全部，非法分类返回 code=40001。 */
    @GetMapping("/plants")
    public ApiResponse<List<PlantCard>> plants(@RequestParam(required = false) String category) {
        return ApiResponse.ok(plantService.getPlants(category));
    }

    /** 植物完整文档；不存在返回 code=40401。 */
    @GetMapping("/plants/{id}")
    public ApiResponse<Plant> plant(@PathVariable String id) {
        return ApiResponse.ok(plantService.getPlant(id));
    }
}
