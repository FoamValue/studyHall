package com.studyhall.plants.mysql;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * import_log 审计写入（表结构见 docs/design/backend-design.md §2）。
 * Sprint 1 的导入审计由 scripts/import-plants.mjs 直写 MySQL，本组件提供同构写入能力。
 */
@Component
public class ImportLogWriter {

    private final JdbcTemplate jdbcTemplate;

    public ImportLogWriter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 写入一条导入审计记录，返回影响行数。 */
    public int insert(String sourceFile, String plantId, String action) {
        return jdbcTemplate.update(
                "INSERT INTO import_log (source_file, plant_id, action) VALUES (?, ?, ?)",
                sourceFile, plantId, action);
    }
}
