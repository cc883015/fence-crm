# Fence CRM

围栏销售系统：官网在线报价 + CRM 客户看板 + 来源报表。
Cloudflare Workers (Hono) + D1 数据库 + React (Vite)。

```
fence-crm/
├── src/index.js            # 后端 API（Hono on Workers）
├── migrations/
│   ├── 0001_init.sql       # 建表
│   └── 0002_seed.sql       # 种子数据（3款产品 + 示例客户）
├── web/                    # 前端（React + Vite）
│   └── src/pages/          # Board 看板 / Website 官网 / Reports 报表
├── wrangler.toml           # Cloudflare 配置
└── package.json
```

---

## 快速跑起来（本地）

### 0. 前置
- 装 Node.js 18+
- 装 Cloudflare 工具并登录：
  ```bash
  npm install -g wrangler
  wrangler login
  ```

### 1. 安装依赖
```bash
npm install          # 根目录（后端 + wrangler）
cd web && npm install && cd ..   # 前端
```

### 2. 创建 D1 数据库
```bash
wrangler d1 create fence_crm
```
命令会输出一段 `database_id = "xxxxxxxx-..."`，
把它复制到 `wrangler.toml` 里替换 `REPLACE_WITH_YOUR_DB_ID`。

### 3. 建表 + 灌种子（本地库）
```bash
npm run db:local
npm run db:seed:local
```

### 4. 起两个终端

**终端 A — 后端：**
```bash
npm run dev          # wrangler dev，默认 http://localhost:8787
```

**终端 B — 前端：**
```bash
npm run web:dev      # vite，默认 http://localhost:5173
```

打开 http://localhost:5173 就能看到：
- **客户看板**：9 列流程 + 未付/已付定金/全款筛选 + 款式话术自动带出
- **官网预览**：在线报价表单，提交后进 CRM（带去重）
- **报表**：线索来源统计

> 前端已配好代理：`/api` 自动转发到 8787 后端。

---

## 部署上线

```bash
# 建远程库
npm run db:remote
npm run db:seed:remote

# 打包前端 + 部署（wrangler 会把 web/dist 作为静态资源一起发）
npm run web:build
npm run deploy
```

部署后 Workers 域名同时提供官网、CRM 和 API。

---

## 推到 GitHub 仓库（Cursor 里操作）

在 Cursor 打开本文件夹后，终端执行：
```bash
git init
git add .
git commit -m "init: fence CRM (website + CRM + D1)"
git branch -M main
git remote add origin https://github.com/<你的用户名>/fence-crm.git
git push -u origin main
```

`node_modules`、`dist`、`.wrangler` 已在 `.gitignore` 里，不会被提交。

---

## API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/health` | 健康检查 |
| GET  | `/api/products` | 产品列表（含话术） |
| POST | `/api/leads` | 官网提交线索（**含去重**） |
| GET  | `/api/customers` | 客户列表（带定金/全款状态） |
| GET  | `/api/customers/:id` | 客户详情 + 报价 + 付款 + 时间线 |
| POST | `/api/customers` | 新建客户 |
| PUT  | `/api/customers/:id` | 更新客户 |
| DELETE | `/api/customers/:id` | 删除客户 |
| POST | `/api/payments` | 记录付款（定金/全款） |
| GET  | `/api/reports/summary` | 统计 + 来源分布 |

---

## 分期路线

- **第一期（当前）**：官网报价 + 客户看板 + 定金追踪 + 来源报表 ✅
- **第二期**：自动报价 PDF、多销售登录鉴权、图片上传（R2）、客户时间线 UI
- **第三期**：项目案例 Gallery、导出中心（Excel/PDF）、Dashboard 图表

数据库表已为二三期预留（quotes / projects / users / activities）。

---

## 注意
- 种子数据只是让系统一启动就有东西看，可随时改 `0002_seed.sql`。
- 目前没有登录鉴权，属于开发原型；上线前务必在第二期加上 users 鉴权。
