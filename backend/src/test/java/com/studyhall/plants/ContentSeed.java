package com.studyhall.plants;

import com.studyhall.plants.model.Category;
import com.studyhall.plants.model.Plant;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * 测试播种器：直接读取仓库 content/ 下的真实内容文件
 * （categories.json + plants/ + animals/ + insects/ + dinosaurs/ 下的 *.json），
 * 与导入脚本走同一份 schema，顺便验证内容文件本身的合法性。
 */
final class ContentSeed {

    /** 内容子目录（Sprint 9：植物 + 动物/昆虫/恐龙；Sprint 15：+ 字母/拼音）。 */
    private static final List<String> PLANT_DIRS =
            List.of("plants", "animals", "insects", "dinosaurs", "letters", "pinyin");

    private ContentSeed() {
    }

    /** 兼容多种运行目录：backend/（mvn 默认）、仓库根、容器内挂载点 /content。 */
    static Path contentDir() {
        for (Path candidate : List.of(Path.of("../content"), Path.of("content"), Path.of("/content"))) {
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("找不到 content 目录，请在仓库根或 backend/ 下运行测试");
    }

    static List<Category> loadCategories(ObjectMapper objectMapper) throws IOException {
        JavaType type = objectMapper.getTypeFactory()
                .constructCollectionType(List.class, Category.class);
        return objectMapper.readValue(contentDir().resolve("categories.json").toFile(), type);
    }

    static List<Plant> loadPlants(ObjectMapper objectMapper) throws IOException {
        List<Plant> plants = new ArrayList<>();
        for (String dir : PLANT_DIRS) {
            Path dirPath = contentDir().resolve(dir);
            if (!Files.isDirectory(dirPath)) {
                continue;
            }
            try (Stream<Path> files = Files.list(dirPath)) {
                List<Path> jsonFiles = files
                        .filter(p -> p.getFileName().toString().endsWith(".json"))
                        .sorted()
                        .toList();
                for (Path file : jsonFiles) {
                    plants.add(objectMapper.readValue(file.toFile(), Plant.class));
                }
            }
        }
        return plants;
    }
}
