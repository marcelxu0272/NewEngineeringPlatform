# 组织图板块/中心 → Board + unit 筛选（ep79）

- 日期：2026-11-03（Asia/Shanghai）
- 账本：组织图板块/中心点击跳转 Board 并带组织筛选
- 正式需求：`docs/需求文档/202611_组织图板块跳转Board筛选.md`
- **未 commit**

## 改动文件

- `public/operations-dashboard-202610/org-entry.html` — 12 叶子 `<a class="project-item" href=".../board?unit=..." target="_top">`；负责人按 wood-groupname；董事会仍默认 Board；EPC 不跳
- `app/operations-dashboard-202610/board/page.tsx` — 读 `?unit=` 预选壳组织板块；header 末段叶子=`UNIT value`，全部板块=`Board`

## AC（探针）

1. 12 叶子 href 含正确 `unit`（URL 编码）且 `target=_top`
2. 董事会 `board-entry-link` 无叶子 unit
3. 公司级 EPC 无 `board?unit`
4. Board `?unit=SAS170%20PMC板块` → 壳 Select 选中 + header 末段为该文案
5. Board 无 unit / 默认 → header 末段 `Board`
6. （回归）叶子态 `#pairRow` 带 `hidden`（不另开条）

## 自检

本机 Next 在 **3001**（3000 为其它服务）：

```
node docs/evidence/2026-11-03-ops-org-entry-unit-nav/probe-org-entry-unit-nav.cjs
```

结果：`probe-result.txt`（fail=0，全 PASS）。

## 已知与截图/口径差异

- 组织图旧图部分负责人已按 wood-groupname 更新（姚佳辉/潘颖/王培波/赵宏海 等）；项目群 header 仍链 `/dashboard/org/...`，未改跳 Board。
- 叶子态 `#pairRow` 验到 `hidden=true`；computed `display` 仍可能为 grid（浏览器对 `[hidden]` 与页面 CSS 叠加），以 hidden / 业务显隐函数为准，与 ep76 分条。
