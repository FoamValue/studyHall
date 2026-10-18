---
name: studyhall-sprint-gate
description: studyHall 项目 Sprint 完成门禁全流程——后端 docker mvn test、前端 vitest/build、compose 重建与两次导入幂等、Playwright E2E，全绿后更新 QA 手册与 AGENTS.md 状态再 commit。用户说 Sprint 收尾、QA 放行、全量回归、开发完成执行吧时触发；纯需求讨论或单个用例调试不触发。
---

# studyHall Sprint 完成门禁

AGENTS.md 阶段 4 的可执行版本。任何「测试通过/发布成功」结论必须绑定真实命令输出（退出码、计数、日志片段），禁止无证据宣称成功。任一步失败即停止，回到阶段 3 修复，禁止 commit。

工作目录：仓库根 `/Users/chenxinjie/Mirror/github/studyHall`。

## 0. 先算动态预期值（禁止把数量写死）

```bash
node -e "
const fs=require('fs');
const ids=fs.readdirSync('content/plants').filter(f=>f.endsWith('.json'));
const svgs=new Set(fs.readdirSync('frontend/public/images/plants'));
let bad=0,flower=0,leaf=0,fruit=0;
for(const f of ids){
  const p=JSON.parse(fs.readFileSync('content/plants/'+f));
  if([...p.categories].sort().join(',')!==Object.keys(p.parts).sort().join(',')){console.log('MISMATCH',f);bad++;}
  if(p.parts.flower)flower++; if(p.parts.leaf)leaf++; if(p.parts.fruit)fruit++;
  for(const part of Object.values(p.parts))for(const img of part.images||[]){
    if(!svgs.has(img.url.replace('/images/plants/',''))){console.log('MISSING',img.url);bad++;}
  }
  // TC-24 低龄化文案：≤80 字、无拉丁字母
  for(const part of Object.values(p.parts)){
    const d=part.description||'';
    if([...d].length>80||/[A-Za-z]/.test(d)){console.log('TC24 BAD',f);bad++;}
  }
}
console.log(bad===0?'OK total='+ids.length+' flower='+flower+' leaf='+leaf+' fruit='+fruit:'BAD='+bad);
if(bad)process.exit(1);
"
```

记下输出的 total/flower/leaf/fruit，后续 API 与 E2E 断言以此为准。注意 fruit 基线随内容变化（银杏含白果），不要照抄历史文档数字。

四板块全量计数与资产普查（内容扩容类迭代必跑）：

```bash
node -e "
const fs=require('fs');
let t=0; const by={};
for(const d of ['plants','animals','insects','dinosaurs']){
  const n=fs.readdirSync('content/'+d).filter(f=>f.endsWith('.json')).length;
  by[d]=n; t+=n;
}
const jpg=(d)=>fs.readdirSync('frontend/public/images/'+d).filter(f=>f.endsWith('.jpg')).length;
const m4a=fs.readdirSync('frontend/public/audio').filter(f=>f.endsWith('.m4a')).length;
console.log('total='+t, JSON.stringify(by));
console.log('jpg='+(jpg('plants')+jpg('animals')+jpg('insects')+jpg('dinosaurs')), 'm4a='+m4a);
console.log('expect m4a=', t*2);
"
du -sh frontend/public/images       # 体积基线，优化类迭代须与目标比对
```

**导入幂等预期值 = 当前 import_log 基线 + 2 × total**，先查基线再推：

```bash
docker exec studyhall-mysql mysql -uroot -proot studyhall -N -e "SELECT COUNT(*) FROM import_log;"
```

基线随每次迭代累加（历史：1700 → 1900 → 2260 → 2520 → 3290 …），**禁止写死**。

## 1. 后端测试（约 3–5 分钟，后台跑）

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(pwd):/project" -w /project/backend \
  -e TESTCONTAINERS_RYUK_DISABLED=true \
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  maven:3.9-eclipse-temurin-26 mvn -q test
```

关键约束：挂载必须是仓库根（`-v $(pwd):/project`），只挂 backend 会找不到 content 目录；判据是**退出码 0**（`-q` 成功时无 Tests run 输出，勿因无输出误判失败）。

**后台并行与哨兵**：第 1 步（后端）与第 3 步（compose 重建 + 导入）互相独立，可同时后台跑，压缩总时长：

```bash
docker run ... mvn -q test 2>&1; echo "BACKEND_EXIT=$?"        # 后台 job A
docker compose up -d --build && ...导入两次...; echo "IMPORT_OK"  # 后台 job B
```

- 每个后台 job 结尾必须带**唯一哨兵串**（`BACKEND_EXIT=` / `IMPORT_OK`），读日志时直接 grep 哨兵，不要靠肉眼扫长日志
- 哨兵必须包住真实命令的退出码；写成 `cmd | tee log; echo EXIT=$?` 取到的是 `tee` 的码，会**误报成功**——先确认管道结构
- 前台 meanwhile 跑第 2 步（vitest/build），等待期间不空转

## 2. 前端单测与构建

```bash
cd frontend && npx vitest run && npx vite build
```

两者均须退出码 0。vitest 中读样式表用 `readFileSync('src/styles.css')`（cwd 是 frontend），不要用 `new URL(..., import.meta.url)`，vitest 会报 scheme 错。

## 3. 部署重建与导入幂等

```bash
docker compose up -d --build
# 轮询健康（容器重建后约 20s 就绪）
for i in $(seq 1 30); do curl -s http://localhost:8080/api/health | grep -q '"status":"UP"' && break; sleep 2; done
node scripts/import-plants.mjs && node scripts/import-plants.mjs   # 必须连跑两次
```

核对（数字替换为第 0 步实际值）：

```bash
curl -s "http://localhost:8080/api/plants"                       # total
curl -s "http://localhost:8080/api/plants?category=flower"       # flower
docker exec studyhall-mongo mongosh --quiet studyhall --eval "print(db.plants.countDocuments(), db.categories.countDocuments())"
docker exec studyhall-mysql mysql -uroot -proot studyhall -N -e "SELECT COUNT(*) FROM import_log;"  # 两次导入 = 2×total
docker exec studyhall-redis redis-cli --scan --pattern "sh:*" | wc -l   # 导入后应为 0
```

**资产类迭代追加核对**（图片 / 音频变更或扩容时必查）：

```bash
du -sh frontend/public/images          # 与优化目标比对（如 95.2MB → 54.9MB）
find frontend/public/images -name '*.jpg' | wc -l
find frontend/public/audio   -name '*.m4a' | wc -l   # 期望 = total × 2
sips -g pixelWidth -g pixelHeight <抽查图>            # 尺寸口径与规范一致（如 1600×1600）
```

尺寸 / 格式口径若发生变化，**必须同步三处**：`docs/design/ui-style-guide.md` 资产规范、`README.md` 资源说明、`AGENTS.md` §5 交付记录。三者缺一即文档与实现脱节。

MySQL 密码是 root/root（compose 配置），不是 studyhall。前端新增静态资源后必须 `--build` frontend 镜像，否则 nginx 容器里没有新 SVG。

## 4. E2E

```bash
cd frontend && npx playwright test
```

全部用例退出码 0。已验证的两个坑：

- 断言按钮尺寸/点击时用 `page.getByRole('button', { name: '花朵' })`；`getByText` 会命中按钮内 span（高度只有 28px）。
- 「某分类不应含某植物」的断言先回 content JSON 核实该植物 categories——例如银杏含 fruit（白果），果实列表里应当有它。

## 5. 文档收尾与 commit（全绿后才允许）

1. `docs/qa/sprint-N-test-cases.md`：执行记录写实（各层通过数、导入幂等结果），所有用例状态「待执行」→「通过」。
2. `docs/iterations/sprint-N.md`：状态改 ✅ 已完成；清单与实际内容不一致处顺手修正。
3. `AGENTS.md` 第五节「项目当前状态」更新阶段、当前迭代、技术债。
4. **资产规范同步**（仅资产类迭代）：`docs/design/ui-style-guide.md` 资产规格、`README.md` 资源说明。
5. Conventional Commits，如 `feat(sprint-n): ...`，正文列出内容/测试/验证证据；只提交本 Sprint 相关文件。

**提交前核对变更面**（防止误提交无关文件）：

```bash
git status --short | awk '{print $1}' | sort | uniq -c    # 变更类型统计
git status --short | grep -v '\.jpg$'                     # 非图片变更，逐个人工确认
```

## 6. 版本发布时追加洁净环境验收

```bash
docker compose down -v                 # 删三个数据卷（数据可由仓库内容重建，安全）
docker compose up -d --build
# 健康后先断言空库
curl -s http://localhost:8080/api/plants   # 必须 data:[]
node scripts/import-plants.mjs             # 首次导入
# 再跑第 3 步核对 + 第 4 步 E2E
```

PRD 状态从「待人工审核」改「已验收」，用 `chore(release):` 提交。
