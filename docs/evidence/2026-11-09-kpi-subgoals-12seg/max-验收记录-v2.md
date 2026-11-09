# Max 验收补记 v2

本文件是 v1 `max-验收记录.md` 的追加，不替换已收取的 44 个 v1 文件，不覆盖实现侧 `docs/evidence/2026-11-09-ops-kpi-subgoals/`。v1 报告哈希仍是 `7d1e7ffc05d7953a5a20a517655628f25f469458445bc5585bf6eea3f2f86e21`。

范围仍只是 2026-11-09 四 KPI 子目标与 12 段条。账本条保持已确认，未关账。11-06 同行等高、grill、名称、负荷、红绿灯仍不关闭。未 commit、未 push、未创建 PR，未改业务源码和正式文档。

## 1. 独立 build

命令在补丁已应用的工作区执行，不引用实现侧的 build 结果：

```bash
npm run build
```

退出码 **0**。日志 `max-v2-build.log`。末尾路由表含 `/operations-dashboard-202610/board`，并以 `BUILD_EXIT:0` 收尾。

## 2. tsc / lint / 银川的基线复现

v1 写「与本次业务文件无关」过强，只凭路径不相交不能证明既有。v2 在另一份云端 worktree 上复跑。

- worktree：`/tmp/max-baseline-232cadf`
- `git rev-parse HEAD` = `232cadfe0dfff742561491b71cdd977047bbc9c7`
- `package.json`、`package-lock.json` 与补丁树 `cmp` 相同。`node_modules` 是指向补丁树 `node_modules` 的符号链接，没有另装一套依赖。

同一会话、同一命令：

| 命令 | 基线退出码 | 补丁树退出码 | 签名 |
| --- | --- | --- | --- |
| `npx tsc --noEmit` | 2（73 条 `error TS`） | 2（73 条） | 排序后的 error 行相同 |
| `npm run lint` | 1（93 条 `Error:`） | 1（93 条） | 文件、行列、消息相同 |
| `node scripts/test-yinchuan-ui.cjs` | 1 | 1 | 都是 `Vue.component is not a function`，栈顶同为 `evalmachine.<anonymous>:896` |

原始日志：`max-v2-baseline-tsc.log`、`max-v2-patched-tsc.log`、`max-v2-baseline-lint.log`、`max-v2-patched-lint.log`、`max-v2-baseline-yinchuan.log`、`max-v2-patched-yinchuan.log`。对照摘要：`max-v2-baseline-compare.txt`。

因此这三项可以标成基线上已有的相同失败，不是本次补丁新引入的。它们不进入 AC1–7，也不把整仓说成通过。v1 那句「仅凭路径不相交」的表述以本补记为准，不再单独成立。

## 3. file:// 宽 760 的 169.3 与 109.9

v1 中间一轮关态读到卡高 169.296875 与 109.921875，随后把「收起高度是否回到上一次关态」改成列数相同才比较。这里补上当时缺的列数和几何，确认没有把同一行里的不等高放过去。

分组与 `max-page-probe.cjs` 的 `assertLayout` 相同：`getBoundingClientRect().top` 相差不超过 3px 算同一行。一行里至少两张卡时，高度差大于 1px 才算同行不等高。`sameCols` 只决定要不要拿两次关态的卡高互比，不参与这个行内比较。行内比较在关态和开态的 `assertLayout` 里照常执行，v1 终轮 AC6 仍是 0 失败。

### 169.297：2 列，新增块在文档流里

来源：`max-v2-760-geometry.cjs`，按 1440、1280、1024、760 走与页面探针相同的开关顺序。关态 `dataset.peerCols` 为 `"2"`，`grid-template-columns` 为 `351.5px 351.5px`。四张卡都是 169.297，没有子行，`.kpi-delta` 为 `static`。

| 卡 | top | left | 宽 | 高 | 行 |
| --- | --- | --- | --- | --- | --- |
| 新签 contract | 43.391 | 16 | 351.5 | 169.297 | 1 |
| 完成合同 completed | 43.391 | 377.5 | 351.5 | 169.297 | 1 |
| 开票 invoice | 222.688 | 16 | 351.5 | 169.297 | 2 |
| 回款 receipt | 222.688 | 377.5 | 351.5 | 169.297 | 2 |

第 1 行两张卡 top 同为 43.391，高度差 0。第 2 行两张卡 top 同为 222.688，高度差 0。两行 top 相差 179px，大于 3px，不会被并成一行。

### 109.921875：1 列，新增块绝对定位

来源：`max-v2-760-cols1.json`。新开页面直接把视口设为 760 再关开关。`peerCols` 为 `"1"`，grid 为 `713px`。四张卡高都是 109.921875，`.kpi-delta` 为 `absolute`，没有子行。再打开又关上，回到同一几何。

| 卡 | top | left | 宽 | 高 | 行 |
| --- | --- | --- | --- | --- | --- |
| contract | 43.390625 | 16 | 713 | 109.921875 | 1 |
| completed | 163.3125 | 16 | 713 | 109.921875 | 2 |
| invoice | 283.234375 | 16 | 713 | 109.921875 | 3 |
| receipt | 403.15625 | 16 | 713 | 109.921875 | 4 |

相邻 top 相差约 120px，都大于 3px。每一行只有一张卡，行内没有第二张高度可比较。这就是 v1 记到的 109.9，不是 2 列里某一张被压矮。

169.297 与 109.921875 是两种列数下的关态卡高，差约 59px，对应卡宽 351.5 时新增块换行（`static`）和卡宽 713 时新增块绝对定位。不把这两种高度拿来互比，没有放过同一行内的不等高。正式验收口径没有改。

同一视口下开态也分开记录，行内高度差仍是 0：

- 直接进入 760 再打开：2 列，卡宽 351.5，两行 top 为 43.390625 与 358.3125，行内高度都是 304.921875。
- 从 1024 走下来再打开：1 列，卡宽 713，四行 top 为 43.391、298.938、554.484、810.031，每张高 245.547。

## 结论

AC1–7 的 v1 结论不变，仍是通过。本补记只补 build、基线错误签名和 760 几何。未关账，未合入，未部署。
