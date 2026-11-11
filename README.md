# 工程平台（26_engineering-platform）

Wood 内部工程平台零星功能 / Demo 汇总仓（Next.js）。协作与口径以账本为准，不要只看本 README 的脚手架说明。

## 协作与文档

最短地图见 **[`AGENTS.md`](AGENTS.md)**。常用入口：

- 变更账本：[`docs/变更账本.md`](docs/变更账本.md)（正式需求 / 验收改动须先记账本）
- 用语与决策：[`GLOSSARY.md`](GLOSSARY.md)、[`docs/adr/`](docs/adr/)
- 验收证据：[`docs/evidence/`](docs/evidence/)
- 正式/设计稿：[`docs/需求文档/`](docs/需求文档/) 等（改口径须先记账本）

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

首次克隆若需 SQLite：`npm install` 后执行 `npm run db:init`、`npm run db:seed`，再 `npm run dev`。

## Cursor Live App

把本仓作为现有 GitHub 仓库部署（不要另起脚手架）。建议发布时的 App URL 填 `engineering-platform`。对话框里的域名后缀以 Cursor 为准（公开说明里的示例形如 `https://engineering-platform.apps.grok.bot`）。

不需要环境变量或密钥。演示数据是本地 SQLite：`npm start` 在 `data/platform.db` 不存在时自动 `db:init` + `db:seed`。数据库文件在 `.gitignore` 的 `/data/` 下，不会进仓库。公开发布时目录只读；人员名录不含姓名、邮箱和电话；银川绩效使用样例身份，不提供角色切换，也不展示合同额。第三方人员名册使用样例编号，不含手机号和小时单价。应用通过 Cursor 登录后才能打开，发布时请选择私人或团队。

生产进程监听 `0.0.0.0` 和 `PORT`（默认 3000）。目录首页 `/`、组织图入口 `/operations-dashboard-202610`、Board `/operations-dashboard-202610/board` 以及 catalog 里的其他路由都在同一个应用地址下。`next build` 不因历史 ESLint / `tsc` 报错失败（演示页里已有约 70 个类型错误）；需要时仍可单独跑 `npm run lint` 和 `npx tsc --noEmit`。原先 `src/pages/Detail/index.jsx` 不是合法页面，会被 Next 编成 `/Detail` 并在收集 page data 时崩溃；片段已挪到 `docs/snippets/src-pages-Detail-index.jsx`，正式明细页仍是 `/dashboard/detail`。

Preview 通过后，由 Ethan 在 Cursor 的 Preview / Publish 托盘里发布。本仓库不代点 Publish。

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
