# Board 经营全景同行等高 · Max 独立验收

- 总评：**FAIL**
- 对象：PR #5，分支 `cursor/board-panorama-peer-height-8501`，提交 `69bbce5db6b5cf8029e68ff5f6c5d01a8b8ef272`，基线 `09e4bec3a98582f75a286364bc527aad53852ca9`
- 口径：`docs/需求文档/202611_运营看板202610_Board目标态视觉与口径公共规格.md` 增补「Board 经营全景同行等高」；账本条 `2026-11-06 —— Issue 3 仓内正式镜像与 Board 经营全景同行等高公共规则`（状态：已确认）
- Issue #3 只作 tracker。本记录不采信 `probe.cjs` / `shell-probe.cjs` / `实现证据.md` 的结论。
- 实测：`http://127.0.0.1:3456/operations-dashboard-202610/index.html` 与壳 `/operations-dashboard-202610/board`。数据为页面内演示样例。
- 几何说明：同行外框高差为 0。记录里的像素是测量值，不是新的通过阈值，也不写回规格。

独立页探针 `max-peer-row-height.json` 的 `verdict` 是它自己那组宽度上的 PASS。壳层 760 把成对行标题和图上金额裁切，总评因此是 FAIL。

## 逐条结果

| 验收点 | 结果 | 关键几何 |
| --- | --- | --- |
| 经营全景每一行外框等高 | 通过 | 桌面 1440：KPI 两行各 128.9 / 128.9；现金流三卡 95.1；应收两行各 102.5；成对模块 403.6 / 403.6。高差都是 0。壳桌面同样高差 0。 |
| 内容长短不同，以及换行 | 通过 | 向第一张 KPI、第一张现金流、第一张应收写入换行长文后，同行另一张外框被拉到同一高度，正文落在卡片内。决定行高的一侧墨水到底边约 2.4px，较短一侧留下的是被拉高的内腔（现金流 maxInkSlack 37.7，应收 23.8）。下一行不被带高：KPI 133.7 对 116.3；应收 120.7 对 99.3。宽 680 时目标页签分成两行（top 985 与 1010），说明文变成 2 行且 `scrollWidth === clientWidth`，成对外框仍同为 467.5。 |
| 成对模块（板块目标达成 + 板块现金流贡献） | 桌面通过，壳窄屏失败 | 桌面两卡同高 403.6。目标侧贴内容（inkSlack 2.4），贡献侧内腔约 25.3，等于目标侧多出来的页签和一行说明，不是另插的空白块。四个页签切换后仍同高、说明未截断。壳视口 760 见阻断点。 |
| 变宽变窄后按新的同行再拉齐 | KPI / 现金流 / 应收通过；成对行未过 | 内容区变窄后列数会变：宽 560 时 KPI 变为 1 列，加长的第一张 144.7，其余三张 109.9，没有维持加长前的同一高度。现金流在 560 变成 2+1：加长行两张都是 153（较短一张 inkSlack 72.5），单独的「净现金流」回到 83.5。440 时现金流三张分成三行，高度 118.3 / 83.5 / 83.5。拉回 1440 后恢复 KPI 二乘二、现金流三卡一行。成对行在独立页测到 440、壳内容宽 312 时仍然是 2 列。 |
| 允许设计内边距；禁止无内容占位、截断正文、大块底部占位 | 桌面通过，壳窄屏截断正文 | 独立页未找到空白占位节点。板块之间的间距等于 `main` 的 gap（桌面 12，壳 10）。桌面决定行高的卡片贴着内容。现金流图下留白是故事 25 的设计内边距，图轴文字仍在图区内（桌面 chartLabelClips 为空）。壳 760 的成对行把标题和柱端数字裁出卡片，见阻断点。 |
| 不新设像素阈值 | 通过 | 本记录只引用测到的外框高度和溢出量，没有把某个像素数写成口径。 |
| 叶子板块隐藏成对行且不留空洞 | 通过 | 12 个叶子在独立页和壳深链 `?unit=` 上 `pairRow` 均为 `display:none`、高度 0。应收面板底到工作负荷顶的距离等于 `main` 的 gap（独立页 12，壳 10）。壳下拉选中「SAS530 银川中心」后 header 为该叶子，成对行同样隐藏。未改、未关「仅全部板块展示」那条账本。 |
| 工作负荷独占一行时偏矮、不无故撑高 | 桌面通过；极窄时右栏标题被裁 | 桌面高度 276.3，低于成对行 403.6 和现金流面板 439.4；`flex-grow: 0`；宽度占满该行；三栏宽度比 1:2:1，栏高高差 0。它没有和其他模块并成一行，因此不与别的行拉齐。壳 760 时模块仍矮（高 284，flex-grow 0），但右栏只有 56px，「项目交付保障活动」横向溢出约 35px。 |

板块轴上的 `SAS170...` 省略号属于仍在「实现中」的「完整显示名称」，本条不据此判失败，也不混关那条。

## 阻断点（请 Leo 返工，本验收不改业务源码）

壳视口 **760×1000**，左侧项目栏和看板目录都在。经营全景内容宽 **312px**。`#pairRow` 的 `data-peer-cols` 仍是 **2**，两张卡各 **127.5px**。

1. 贡献卡标题 `#contributionPanel .panel-title` 的 `scrollWidth` **176**、`clientWidth` **104**。「（万元）」和说明按钮被面板 `overflow: hidden` 裁出卡片。见 `max-shell-05-narrow-pair.png`、`max-shell-narrow-clips.json`。
2. 同一两列里，贡献图数据标签（`2,133.7`、`1,955.8` 等）相对图区横向溢出约 **23px**，目标图百分数标签溢出约 **15px**。图区把伸出的数字裁掉。共 24 处。
3. 同一宽度下 KPI、现金流、应收已经收成 1 列，主金额文字相对卡片的溢出为 0。成对行的列数只按页签按钮和 `strong` 的最小宽度往下收，标题和图上数字还没放得下时，两列已经保住了。结果是用裁切维持旧的两列，而不是收成新的一行再拉齐。

返工时：内容区窄到标题或柱端数字放不下，成对行应改成一列，再按这一列自己的内容定高；或者让标题换行，并让柱端数字完整留在卡片里。不要用裁切换两列等高。

同一窄屏下，工作负荷右栏宽 56px，标题「项目交付保障活动」横向溢出约 35px。模块没有被 flex 撑高。桌面三栏比例和偏矮仍然成立。若只修成对行的收列，请再看一眼这条右栏标题在壳 760 是否还被裁。

## 声明

- 未改业务源码（含 `public/operations-dashboard-202610/index.html`）。
- 未改变更账本，未改正式规格的状态或验收口径。
- 未 merge，未部署 PR #5。
- 未混验、未混关 Catalog、人力资源看板、完整显示名称、红绿灯、PDF 等未结项。
- 未覆盖 Leo 已有的 `probe*` / `shell-probe*` / `实现证据.md`。

## 证据

- `docs/evidence/2026-11-06-ops-board-peer-row-height/max-peer-row-height.cjs`
- `docs/evidence/2026-11-06-ops-board-peer-row-height/max-peer-row-height.json`
- `docs/evidence/2026-11-06-ops-board-peer-row-height/max-shell-peer-row-height.cjs`
- `docs/evidence/2026-11-06-ops-board-peer-row-height/max-shell-peer-row-height.json`
- `docs/evidence/2026-11-06-ops-board-peer-row-height/max-shell-narrow-clips.json`
- 截图：`max-01-desktop-top.png`、`max-02-desktop-pair.png`、`max-03-desktop-delivery.png`、`max-04-note-wrap-pair.png`、`max-05-unequal-content-wide.png`、`max-06-reflow-mid-unequal.png`、`max-07-reflow-narrow.png`、`max-08-leaf-yinchuan.png`、`max-09-leaf-delivery.png`、`max-10-target-tab-receipt.png`
- 壳截图：`max-shell-01-desktop.png`、`max-shell-02-leaf.png`、`max-shell-03-narrow.png`、`max-shell-04-narrow-kpi.png`、`max-shell-05-narrow-pair.png`
