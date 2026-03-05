# lib 目录说明

本目录只放**代码**（工具、数据库、类型），静态资源与脚本已迁出。**运行时数据全部来自 SQLite**，不再使用 `lib/data`。

## 静态资源（在 public/）

- **图片**：`public/images/`，页面引用 `/images/文件名`
- **中国地图 GeoJSON**：`public/geo/china.json`，营销看板通过 `fetch('/geo/china.json')` 加载

## 脚本与原始数据（在 scripts/）

- CSV / Jupyter 在 `scripts/`，不参与应用运行时

## lib 结构

- **`utils.ts`** - 通用工具（如 `cn`），被各组件引用
- **`types/`** - 共享类型，如 `esk.ts` 中的 `PersonCard`
- **`db/`** - SQLite 数据库层  
  - `client.ts` - 数据库连接（单例）  
  - `schema.ts` - 表结构  
  - `queries.ts` - 查询封装（API 调用）  
  - `seed.ts` - 首次把 `seed-sources` 里的数据导入 SQLite  
  - `init-db.ts` - 建表  
  - **`seed-sources/`** - 仅给 seed 用的数据文件（dashboard.ts、SME_Person_data.tsx、ESK_Person_data.tsx、ESK_Node_Data.tsx），运行时不读这里

## 数据流

- 页面通过 API（`/api/dashboard`、`/api/sme/personnel`、`/api/esk/people`、`/api/esk/tree`）取数
- API 使用 `lib/db/queries.ts` 从 SQLite 读取
- 数据库文件：项目根目录 `data/platform.db`（已 .gitignore）

## 首次部署 / 本地

```bash
npm run db:init   # 建表
npm run db:seed   # 从 lib/db/seed-sources 导入到 SQLite
```

然后执行 `npm run dev`。
