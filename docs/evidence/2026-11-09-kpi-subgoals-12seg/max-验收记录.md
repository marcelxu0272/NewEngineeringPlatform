# Max 独立验收记录：顶部四 KPI 子目标与 12 段进度条

- 日期：2026-11-09
- 角色：验收。只读核验业务，新增本目录 `max-*` 证据。
- 结论：**AC1–AC7 通过。** 未关账，未 commit，未 push，未创建或更新 PR，未合入 main，未部署。
- 账本条状态保持 **已确认**。本记录不把该条写成已落地或已验收关账。

## 输入身份

| 项 | 值 |
| --- | --- |
| 实际 HEAD | `232cadfe0dfff742561491b71cdd977047bbc9c7`（与要求的基线一致，detached HEAD） |
| 实现补丁 | `kpi-subgoals-from-232cadf_43f2.patch` |
| 补丁字节 | 5198800 |
| 补丁 SHA256 | `688a5bfceefc5a43c6d42d1614681e1c78b64ac7e45bfcbe99e0d9bfe2573684`（与交接一致） |
| `git apply --check` | 退出码 0，40 个路径 |
| `git apply` | 退出码 0。账本补丁有 1 行 EOF 空白警告，已干净应用 |
| 声明的实现 SHA | `5a1191ac9f0c8b93e60756d0be434cd45ca005fe` |
| 该 SHA 是否在本机对象库 | **否**（`git cat-file` 失败）。本机不能 fetch。**没有**证明工作区等于该 commit |

本次验证的输入是：**基线 `232cadf` + 上述补丁哈希**。不是声明 SHA 的云端检出。

应用后业务文件：

| 文件 | SHA256 |
| --- | --- |
| `public/operations-dashboard-202610/index.html` | `398c273168cf5a263fa195c7f0bbb6a2c55df027c64568111f61b6293c27ae6b` |
| `public/operations-dashboard-202610/kpi-subgoals.js` | `eb42a5502def8cb44dc697bfa6378ea215d19e9863be28b3acd159452900f708` |

补丁文件清单与逐文件哈希见 `max-impl-input-files.txt`、`max-impl-input-hashes.txt`。业务改动只在上面两个文件；其余是文档、计划、实现侧证据和单测。

## 正式文档与账本

附件全文 SHA256 `5c3f06888741d2d2265708fce7a3dfffdcfcfc106dd38e2793ccc8f9ab3b9f63`。应用后的 `docs/需求文档/202611_运营看板四KPI子目标与12段进度条.md` 哈希相同。**附件与补丁内正式全文一致，没有口径冲突。**

基线账本没有 2026-11-09 这条。补丁追加的条目标题是 `2026-11-09 —— 运营看板顶部四 KPI 子目标与 12 段进度条（设计草稿）`，状态 **已确认**，正文仍写「未实现，未验收」「不改业务源码」。这与正式文档里的状态句一致。正式文档没有另指定证据目录，本记录放在 `docs/evidence/2026-11-09-kpi-subgoals-12seg/`，不覆盖实现侧的 `docs/evidence/2026-11-09-ops-kpi-subgoals/`。

过程观察（非阻断，不改账本）：同一补丁里已经有业务源码，账本条却仍写文档轮的「不改业务源码 / 未实现」。验收不据此改状态，也不把条目关成已落地。

`0f32e66f6116bcc9aaed62da6b327ac1dc855a43` 不在本克隆对象库。验收依据是已核对哈希的正式全文，不是那个 commit 对象。

## 本次不关闭的范围

以下保持原状态，不混关：

- `2026-11-02 —— 运营看板202610改版（grill-with-docs）`：已确认
- `2026-11-06 —— Issue 3 仓内正式镜像与 Board 经营全景同行等高公共规则`：已确认。PR #9 未合入。本需求只检查子目标展开造成的 KPI 行高度，不关闭 11-06 条
- 完整显示名称、负荷右栏溢出、经营红绿灯：本 SHA 账本无独立条目，不在本次关闭范围
- Board 目标态公共规格 `docs/需求文档/202611_运营看板202610_Board目标态视觉与口径公共规格.md` 正文未改。同行等高仍是已确认的规则，不是已验收结论

## 命令与退出码

均在本云端执行。实现侧自测数字只作线索。

| 命令 | 退出码 | 结果 |
| --- | --- | --- |
| `git apply --check` 实现补丁 | 0 | 40 文件可应用 |
| `git apply` 实现补丁 | 0 | 已应用，HEAD 仍是基线 |
| `node --test docs/evidence/2026-11-09-kpi-subgoals-12seg/max-unit.cjs` | 0 | 6 通过，0 失败。预期来自 `max-oracle.cjs`，不把 `kpi-subgoals.js` 当答案 |
| `node --test scripts/test-ops-kpi-subgoals.cjs` | 0 | 实现侧单测 10 通过。线索，不是验收依据 |
| `node docs/evidence/2026-11-09-kpi-subgoals-12seg/max-page-probe.cjs` | 0 | `pass=2377 fail=0`。日志 `max-page-probe.log`，结果 `max-page-result.json` |
| `node docs/evidence/2026-11-09-kpi-subgoals-12seg/max-shell-probe.cjs` | 0 | `pass=926 fail=0`。真实壳 `http://127.0.0.1:3000/operations-dashboard-202610/board`。日志 `max-shell-probe.log` |
| 壳宽与零目标明细（`widths.cjs`） | 0 | 见 `max-widths-dialog.log` |
| 未改的 `docs/evidence/2026-11-06-ops-board-peer-row-height/shell-probe.cjs` | 先 1，后 0 | 见下文。跑完已 `git checkout --` 该目录，没有留下对 11-06 证据文件的改动 |
| `npx tsc --noEmit` | 2 | 73 条 `error TS`。没有落在本次补丁文件上 |
| `npm run lint` | 1 | 93 条 `Error:`。文件都在既有 `app/`、`components/`、`lib/`，没有本次 HTML/JS |
| `node scripts/test-yinchuan-ui.cjs` | 1 | `Vue.component is not a function`。脚本和银川页面不在本次补丁 |

tsc / lint / 银川：本次补丁没有这些 ts/tsx 或银川脚本。报错文件清单在 `max-tsc-lint-summary.txt`。没有把整仓说成全绿。没有在还原基线后再跑一遍 tsc；归属依据是补丁文件清单与报错路径不相交。

## AC1–AC7

预期金额用独立 BigInt 余数法（`max-oracle.cjs`）：展示金额 × 100 得到 0.01 万元整数，按精确分数取整数部分，余数按小数部分从大到小补，平手按 EPC、PMC、设计及咨询。百分比用正数 half-up 到 0.01 个百分点。没有调用 `KpiSubgoals.allocate` / `percentText` / `fillPercent` 来生成预期。

页面权重从 `index.html` 的 `DEMO_SUBGOAL_WEIGHTS` 读出，与实现证据里的演示正整数一致：新签 5/3/2 与 9/6/5，完成合同 6/2/2 与 11/5/4，开票 4/3/3 与 8/7/5，回款 5/2/3 与 10/4/6。这些只是演示配置。

壳层组织切换只用方向键和 Enter，并要求活动项 `isConnected` 且仍在 `document` 里。没有点击可能被虚拟列表卸掉的 option。

| AC | 结论 | 依据 |
| --- | --- | --- |
| 1 覆盖 | **PASS** | 壳与页面都走完 4 KPI × 13 组织。打开时三行顺序为 EPC、PMC、设计及咨询。SAS170 PMC板块下仍有一行业务类型 PMC，组织名没有并进这一行。见 `max-shell-sas170.png` |
| 2 两类金额 | **PASS** | 每个组合的三行完成额、目标额分别等于主卡展示值，并且逐行等于独立余数。完成额和目标额分开补。单测覆盖 1.00、权重 1:1:1 → 0.34/0.33/0.33，以及 5000 组随机正权重。SAS170 新签主完成额 1,108.12 拆成 554.06 + 332.44 + 221.62；主目标 1,200.00 拆成 540.00 + 360.00 + 300.00。与 `max-shell-sas170.png` 上的字一致 |
| 3 开关、组织、刷新 | **PASS** | 进入为关，没有子行节点。打开后保持。13 个组织用真实键盘切换后仍为开。刷新后关，主题回到蓝，组织回到全部板块。开关不写 localStorage / sessionStorage / cookie / URL。见 `max-shell-refresh-off.png`、`max-shell-off-1440.png` |
| 4 零、缺失、超额 | **PASS** | 完成额 0.00、目标大于 0：文字 0.00%，填充 0，不标缺失、不标无目标。主目标 0.00：百分比「—」，标「无目标」，填充 0，占目标「—」，明细达成率「—」，没有 Infinity / NaN。SAS170 上三行目标都是 0.00 且仍是三类。缺失行是「—」不是 0.00，独立解析拒绝把它当 0 加总。115.68% 主条和子条都是满宽，文字 115.68%。见 `max-page-fixture-ratios.png`、`max-page-fixture-rows.png`、`max-widths-dialog.log` |
| 5 12 段与连续填充 | **PASS** | 关态主条也是 12 等分。13.23% 主条和子条的填充落在第 2 段内部，样式宽度是 `13.23%`，没有吸到 1/12 或 2/12。主题青绿、深蓝、暖棕的填充跟随 `--primary`。打开开关不改变 Highcharts 系列类型、名称、颜色和点数。见 `max-page-fixture-rows.png`、`max-shell-theme-wood.png`、`max-shell-on-1440.png` |
| 6 不截断与同行等高 | **PASS** | 桌面两列外框同高，类别、金额、百分比没有省略号，字形不互相压住。收起后没有子行节点。叶子组织 `pairRow` 为 `display:none`、`offsetHeight` 0，缝隙小于 40px；银川截图里 KPI 下面直接是现金流，没有板块现金流贡献和板块目标达成的空壳。760 的 iframe 内容宽 **312px**，780 为 **332px**。窄屏第四张卡要在主区域内滚动才完整进入视口；滚到「完成回款额」后金额、三行和新增块都完整，新增块在进度条下方，不盖住金额。见 `max-shell-760-receipt.png`、`max-shell-780.png`、`max-shell-leaf.png` |
| 7 主文案与其它图表 | **PASS** | 四张卡名称与万元单位仍在。完成合同额是「上月新增」，其余是「当月新增」。旁边「占目标」为 1 位小数；「占总目标」与主条同为 2 位且与独立百分比一致。子行没有这三句。暖棕主题下轨道和现金流柱都换成棕色，图表没有退回别的库。见 `max-shell-on-1440.png`、`max-shell-theme-wood.png`、`max-shell-refresh-off.png` |

页面探针按 AC 的通过数：AC1 80，AC2 532，AC3 25，AC4 12，AC5 895，AC6 514，AC7 317。壳层：AC1 68，AC2 256，AC3 29，AC5 258，AC6 115，AC7 196，另有 11-06 窄屏三句补测 3。失败数都是 0。

## 亲眼看过的截图

数字探针之外，打开并看过这些图：

- `max-page-on-1440.png`：两列四卡，新增块在右侧，子行金额和百分比完整
- `max-page-on-312.png`：未滚动时第四张卡被视口裁到金额处；这是主区域可滚动，不是字被省略
- `max-page-fixture-ratios.png`：13.23 短填充且文字 13.23%；115.68 满条且文字 115.68%；完成额 0.00；目标 0 标无目标
- `max-page-fixture-rows.png`：子条 13.23% 只铺到第 2 段内部；115.68% 铺满；缺失是破折号
- `max-shell-on-1440.png`：壳内两列等高，现金流 Highcharts 仍在
- `max-shell-760.png` 与 `max-shell-760-receipt.png`：内容宽 312px。视口里先看到前三张；滚到回款卡后三行和「当月新增」都完整且不重叠
- `max-shell-780.png`：回款卡完整，下面现金流仍在
- `max-shell-sas170.png`：业务 PMC 行还在，数字与独立余数一致
- `max-shell-leaf.png`：头是 SAS530 银川中心，两块贡献/目标没有出现。这张图里组织下拉还开着，挡住了第一张卡的一部分，遮挡来自下拉层，不是子目标块
- `max-shell-theme-wood.png`：轨道和现金流柱为暖棕。主题下拉还开着
- `max-shell-refresh-off.png`：开关关，没有子行，图表仍在

## 11-06 壳探针

实现侧文字写过：未改的 `shell-probe.cjs` 再跑退出码 1，13 个组织通过后第 103 行点击「全部板块」超时，选项脱离 DOM，780 的三句没有执行。该失败记录留在实现证据里，本验收没有改那个脚本，也没有把它改写成通过。

本云端两次执行同一未改脚本：

1. Playwright 自带 Chromium 尚未安装时，启动失败，退出码 1。这不是脱 DOM 失败。
2. 安装 Chromium 后再跑，退出码 0，`VERDICT PASS fails=0`。包括「壳窄屏现金流同行仍对齐」「壳窄屏成对模块对齐或已重排」「壳窄屏目标说明不截断」。日志 `max-repro-1106-shell.log`。

这次通过**不擦掉**实现侧那次退出码 1。两次都保留。跑完已还原 `docs/evidence/2026-11-06-ops-board-peer-row-height/`，没有把这次截图写进 11-06 目录。

本次自己的壳探针用键盘补上了 760（iframe 312px）、780（iframe 332px）以及那三句，结果通过。

## 两轴

### Spec

对照正式需求 AC1–7 和业务规则（合计、余数、12 段连续、无目标、缺失、开关、叶子两块、主文案）。**通过。** 没有把规范疑点写成新的验收口径。

### Standards

不升级为正式 AC：

- `fillPercent` 用 `Number` 相除。余数分配是 BigInt。本次像素差在 1.25px 以内，13.23% 没有吸到整段。浮点条宽仍是实现上的近似，不是这次的失败项。
- 账本条仍写未实现、不改业务源码，而补丁含业务源码。过程不一致。验收不改账本。
- `html,body,.app` 为 `overflow:hidden`，`main` 为 `overflow-y:auto`。窄屏四张展开卡高于一屏，必须滚动主区域才能看全第四张。滚动后文字完整。这符合「完整可见」，不是省略号截断。
- 页面探针中间一轮在 file:// 宽 760 的关态读到过卡高 169.3px 和 109.9px。差约 59px，对应新增块换行与单列绝对定位，当时没有子行节点。最终断言只在列数相同时比较高度，该轮不再判失败。不把列数切换升成验收失败。
- tsc 73、lint 93、银川 `Vue.component` 失败与本次业务文件无关。不能据此报全项目绿。
- 银川叶截图和暖棕截图里，antd 下拉在截图瞬间仍开着。选择结果本身已生效。

## 阻断与非阻断

- 阻断：无。
- 非阻断：上列 Standards 各项；声明 SHA 无法在本机证明；`0f32e66` 对象不在克隆中；11-06 原脚本的历史失败与本次再跑通过并存。

## 未覆盖

没有未覆盖的关键 AC。AC4 的 0 / 缺失 / 115.68% 是标明的测试例，做在页面夹具和主卡渲染路径上，没有写进演示主数据。13 个组织的金额是壳层逐行断言加抽样截图，不是 13 张截图各看一遍。

总体可以报 AC1–7 通过。账本未关，代码未合入、未部署。
