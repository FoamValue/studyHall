package com.studyhall.plants.mysql;

import java.time.LocalDateTime;

/**
 * MySQL import_log 审计实体（Sprint 1 由导入脚本写入，本模型与表结构同构，供后续扩展查询）。
 */
public record ImportLog(Long id, String sourceFile, String plantId, String action, LocalDateTime importedAt) {
}
