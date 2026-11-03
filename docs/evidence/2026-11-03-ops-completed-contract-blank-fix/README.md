# 完成合同额看板 · 两处大块空白修复证据

- 日期：2026-11-03（Asia/Shanghai）
- 实现：Leo executor（本回合）
- 触发：用户截图「本月完成合同额情况」与「项目预警一览」上方大块空白；右区假空态「未发现异常」与六类预警 bar 并存
- 范围文件：
  - `public/operations-dashboard-202610/completed-contract.html`
- 未改：org-chart、public/202602、银川、catalog、源仓、账本状态；`vendor/echarts.min.js`；**勿 commit**

## 根因

`.empty { display:flex }` 与 HTML `hidden` 属性冲突：空态节点 `treeEmpty` / `alertEmpty` 在有数据时仍可能以 `flex:1; min-height:220px` 占位，与下方 `chart-box` 叠出大块空白 / 假空态「未发现异常」。

## 修复

1. CSS：`.empty[hidden],.chart-box[hidden]{display:none!important}`
2. JS：`renderTree` / `renderAlert` 显隐时同步 `hidden` + `style.display`（有数据 `none`；空态 `flex`），chart 同步 `el.hidden`

## 自检（Playwright @ 127.0.0.1:3001）

| # | 项 | 结果 |
|---|----|------|
| 1 | 默认态 treeEmpty / alertEmpty `display:none`、高度 0、offsetParent null | PASS |
| 2 | 默认态 `document.body` 无「未发现异常」 | PASS |
| 3 | 默认态 treemap / alert bar 可见（canvas=3）；两 panel 高 300（非双层约 500+） | PASS |
| 4 | `?emptyTree=none` →「本次填报没有项目」；chart 隐藏 | PASS |
| 5 | `?emptyTree=all-zero` →「本月完成合同额均为 0」 | PASS |
| 6 | `?emptyAlerts=1` →「未发现异常」；bar 隐藏 | PASS |

`probe.json`：11 checks all PASS。复测脚本 `recheck.cjs`。

## 截图

- `default-has-data.png` — 默认有数据全页
- `panel-tree-only.png` / `panel-alert-only.png` — 两区裁切
- `emptyTree-none.png` / `emptyTree-all-zero.png` / `emptyAlerts.png` — demo 空态对照

## demo 开关（保持）

- `?emptyTree=none` / `?emptyTree=all-zero`
- `?emptyAlerts=1`