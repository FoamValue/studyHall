#!/usr/bin/env node
/**
 * studyHall Sprint 1 — 植物内容导入脚本（AI 扩容通道）
 *
 * 用法（在仓库根目录执行，需 Node >= 22）：
 *   npm install                  # 首次运行前安装 mongodb / mysql2 / redis 依赖
 *   node scripts/import-plants.mjs
 *
 * 环境变量（均可省略，缺省连本机 Docker 端口）：
 *   MONGO_URI   默认 mongodb://localhost:27017
 *   MONGO_DB    默认 studyhall
 *   REDIS_URI   默认 redis://localhost:6379
 *   MYSQL_URI   默认 mysql://studyhall:studyhall@localhost:3306/studyhall
 *
 * 行为（幂等，可重复执行）：
 *   1. 读取 content/categories.json 与 content/plants/*.json，先整体校验，不合法立即报错退出；
 *   2. 按 _id=code/id UPSERT 进 MongoDB（同 id 覆盖，不产生重复）；
 *   3. SCAN 删除 Redis 中 sh:* 前缀缓存（后端 TTL 600s 兜底）；
 *   4. 确保 MySQL import_log 表存在，并为每个植物文件写入一条 UPSERT 审计记录。
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { MongoClient } from "mongodb";
import mysql from "mysql2/promise";
import { createClient } from "redis";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const MONGO_DB = process.env.MONGO_DB ?? "studyhall";
const REDIS_URI = process.env.REDIS_URI ?? "redis://localhost:6379";
const MYSQL_URI = process.env.MYSQL_URI ?? "mysql://studyhall:studyhall@localhost:3306/studyhall";

const VALID_PARTS = ["flower", "leaf", "fruit"];
const REPO_ROOT = path.resolve(import.meta.dirname, "..");

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

/** 校验分类字段（categories.json 数组元素）。 */
function validateCategory(cat, file) {
  const err = (m) => fail(`[校验失败] ${file}: ${m}`);
  if (!cat.code || typeof cat.code !== "string") err("缺少 code");
  if (!cat.nameZh || !cat.pinyin || !cat.nameEn) err("缺少 nameZh/pinyin/nameEn");
  if (!Number.isInteger(cat.order)) err("order 必须是整数");
}

/** 校验植物文档，schema 见 docs/design/backend-design.md §2。 */
function validatePlant(plant, file) {
  const err = (m) => fail(`[校验失败] ${file}: ${m}`);
  if (!plant.id || typeof plant.id !== "string") err("缺少 id");
  if (!Array.isArray(plant.categories) || plant.categories.length === 0) err("categories 不能为空");
  if (!plant.name?.zh || !plant.name?.pinyin || !plant.name?.en || !plant.name?.ipa) {
    err("name 缺少 zh/pinyin/en/ipa");
  }
  const partKeys = Object.keys(plant.parts ?? {});
  if (partKeys.length === 0) err("parts 不能为空");
  for (const key of partKeys) {
    if (!VALID_PARTS.includes(key)) err(`未知部位「${key}」，只允许 flower/leaf/fruit`);
    const part = plant.parts[key];
    if (!part.name?.zh) err(`parts.${key}.name 缺少 zh`);
    if (!Array.isArray(part.images) || part.images.length === 0) err(`parts.${key}.images 至少 1 张`);
    for (const img of part.images) {
      if (!img.url) err(`parts.${key}.images 缺少 url`);
      // 图片路径必须与 UI 命名规范一致：/images/plants/{id}-{part}.jpg
      if (img.type === "photo" && img.url !== `/images/plants/${plant.id}-${key}.jpg`) {
        err(`parts.${key} 图片路径应为 /images/plants/${plant.id}-${key}.jpg，当前是 ${img.url}`);
      }
    }
    if (part.description === undefined || part.description === "") err(`parts.${key} 缺少 description`);
    if (part.allusion) {
      for (const field of ["text", "source", "explain"]) {
        if (!part.allusion[field]) err(`parts.${key}.allusion 缺少 ${field}`);
      }
    }
  }
}

async function main() {
  const contentDir = path.join(REPO_ROOT, "content");
  const categories = JSON.parse(await readFile(path.join(contentDir, "categories.json"), "utf8"));
  const categoryFiles = categories.map((c) => "content/categories.json");
  categories.forEach((c, i) => validateCategory(c, categoryFiles[i]));

  const plantsDir = path.join(contentDir, "plants");
  const plantFiles = (await readdir(plantsDir)).filter((f) => f.endsWith(".json")).sort();
  if (plantFiles.length === 0) fail("content/plants/ 下没有任何植物 JSON");
  const plants = [];
  for (const file of plantFiles) {
    const plant = JSON.parse(await readFile(path.join(plantsDir, file), "utf8"));
    validatePlant(plant, `content/plants/${file}`);
    plants.push({ file: `content/plants/${file}`, plant });
  }
  console.log(`✓ 校验通过：${categories.length} 个分类，${plants.length} 种植物`);

  // ---- 1. MongoDB UPSERT（幂等：同 id 覆盖） ----
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db(MONGO_DB);
  try {
    for (const cat of categories) {
      const doc = { ...cat, _id: cat.code };
      delete doc.code;
      await db.collection("categories").replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
    for (const { plant } of plants) {
      const doc = { ...plant, _id: plant.id };
      delete doc.id;
      await db.collection("plants").replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
    console.log(`✓ MongoDB ${MONGO_DB}：分类 ${categories.length} 条、植物 ${plants.length} 条 UPSERT 完成`);
  } finally {
    await mongo.close();
  }

  // ---- 2. Redis：SCAN 删除 sh:* 缓存 ----
  const redis = createClient({ url: REDIS_URI });
  await redis.connect();
  try {
    let cursor = 0;
    let deleted = 0;
    do {
      // node-redis v5 的 scan 要求 cursor 与 COUNT 均为字符串
      const { cursor: next, keys } = await redis.scan(String(cursor), { MATCH: "sh:*", COUNT: "200" });
      cursor = Number(next);
      // node-redis v5 的 del 只接受单 key 或数组，可变参数形式仅删除第一个 key
      if (keys.length > 0) deleted += await redis.del(keys);
    } while (cursor !== 0);
    console.log(`✓ Redis：清除 sh:* 缓存 ${deleted} 个 key`);
  } finally {
    await redis.disconnect();
  }

  // ---- 3. MySQL：确保审计表存在并写入 import_log ----
  const conn = await mysql.createConnection(MYSQL_URI);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS import_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        source_file VARCHAR(255) NOT NULL,
        plant_id VARCHAR(64) NOT NULL,
        action VARCHAR(16) NOT NULL,
        imported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
    for (const { file, plant } of plants) {
      await conn.query(
        "INSERT INTO import_log (source_file, plant_id, action) VALUES (?, ?, ?)",
        [file, plant.id, "UPSERT"],
      );
    }
    console.log(`✓ MySQL：写入 import_log ${plants.length} 条`);
  } finally {
    await conn.end();
  }

  console.log(`✅ 导入完成：${plants.length} 种植物已就绪`);
}

main().catch((e) => fail(`导入失败：${e.message}`));
