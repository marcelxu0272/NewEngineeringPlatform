# 运营看板顶部四 KPI 子目标与 12 段进度条 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 本计划已获准**串行**执行（用户授权，无须再询问执行方式）。本文件是规划阶段产物，写于业务代码动工前。

**Goal:** 在 Board 树顶「运营看板」顶部四张 KPI 卡（新签合同额 / 完成合同额 / 完成开票额 / 完成回款额）内加入 EPC、PMC、设计及咨询三行演示子目标、一个默认关的「显示子目标」开关，并把主条与子条改成 12 等分刻度、连续填充的轨道。

**Architecture:** 金额拆分、百分比与轨道宽度全部放进一个无依赖的纯函数文件 `public/operations-dashboard-202610/kpi-subgoals.js`（浏览器挂 `window.KpiSubgoals`，Node 可 `require`），用 0.01 万元为单位的 BigInt 整数做最大余数法。`index.html` 只负责：读主卡最终展示字符串 → 调纯函数 → 拼 HTML；开关状态是 iframe 内存里的 `state.showSubgoals`，壳层切组织只 `postMessage` 不重载 iframe，所以天然保持、刷新即复位。同行等高沿用现有 `syncPeerRows()`，只把子行文字宽度算进最小列宽。

**Tech Stack:** 静态单页 HTML + 原生 JS（`public/operations-dashboard-202610/index.html`，内嵌 Highcharts 12.4.0）；Next.js 14 壳页 `app/operations-dashboard-202610/board/page.tsx`（本需求不改）；测试：Node 22 内置 `node:test` + `node:assert/strict`（零新依赖）、Playwright 1.63（已在 `devDependencies`）。

## 依据与基线

- 正式需求：`docs/需求文档/202611_运营看板四KPI子目标与12段进度条.md`（下称「需求正文」）。
- 账本条：`docs/变更账本.md` 末条 `2026-11-09 —— 运营看板顶部四 KPI 子目标与 12 段进度条（设计草稿）`，状态 **已确认**，未实现、未验收。
- 并列正式口径：`docs/需求文档/202611_运营看板202610_Board目标态视觉与口径公共规格.md`（Issue #3 仓内镜像，只读）。
- 规划基线：远端 `main` = `232cadfe0dfff742561491b71cdd977047bbc9c7`（2026-11-09 02:35 UTC 重新 fetch 核对，未变化）。
- 承接提交：本地分支 `cursor/kpi-subgoal-12seg-plan-2915` 的 `2ec911b8098ad43e3001873e5a7ba1c61cb76e6c`（正文 + 账本条）。

## Global Constraints

逐条摘自需求正文，每个 Task 都隐含遵守：

- 范围只限树顶「运营看板」顶部四张 KPI 卡；数据停在演示，不接真实接口，不改生产数据。
- 三行顺序固定：`EPC`、`PMC`、`设计及咨询`；13 个组织（全部板块 + 12 个叶子）每个都显示三行。组织「SAS170 PMC板块」≠ 业务类型「PMC」，不合并、不替代。
- 金额单位万元，2 位小数 + 千分位；最小显示单位 0.01 万元（= 100 元）。
- 分配基准 = 主卡**最终展示**的完成额、目标额字符串，换成 `×100` 整数；完成额与目标额分开拆。
- 每类精确值 = 主卡整数 × 权重 / 权重和；先取整数部分，余数（0/1/2）按精确小数部分从大到小各补 1，平手按 EPC、PMC、设计及咨询；同类最多补 1；用精确分数判断，不用浮点。
- 演示权重是显式参数，标明「仅演示、非业务默认」；不得复用「设计咨询 / 项目管理 / 工程服务」(`DEMO_DATA.businesses`) 或其它页面/种子数据的 EPC/PMC/设计及咨询数字。
- 比例 = 完成额整数 ÷ 目标额整数（未舍入）；条宽用未舍入比例，上限 100%；主条、子条都是视觉等宽 12 段刻度，填充连续，不吸附到段边界。
- 百分比文字四舍五入 2 位；主卡「占总目标」与主条比例同口径 2 位；「当月新增 / 上月新增」旁的「占目标」维持现行 1 位。
- 目标整数为 0：不除，百分比「—」，标「无目标」，轨道保留、填充 0。有效完成额 0：`0.00`、`0.00%`、填充 0，不标缺失/无目标。缺失：类别名保留，完成额/目标额/百分比都「—」，不补 0，不标无目标（除非目标已知为 0），轨道不填充。
- 开关文案「显示子目标」，默认关；只控制三行显隐；切组织保持；刷新回到关；不写 localStorage / sessionStorage / cookie / URL。
- 子行不带当月新增、上月新增、占目标；不新开弹窗；主卡明细弹窗仍只呈现主口径。
- 展开后同行外框跟最高内容；收起回到紧凑高度不留空位；类别、金额、百分比不截断；变窄重排后按新行拉齐。叶子组织下「板块现金流贡献」「板块目标达成」继续整块隐藏。
- 颜色跟随当前主题（CSS 变量），不写死参考图色值。
- 不改 Highcharts 全局主题/选项与任何图表系列；不恢复壳级「业务类型」下拉；不扩子行新增额或弹窗。
- 测试例 13.23%、115.68% 只出现在测试/探针夹具里，标明「仅测试」，不写入演示主数据。
- 不改 `CLAUDE.md`（仓内当前不存在）、`AGENTS.md`、Issue #3 镜像正文、其它账本条目；不改需求口径与 AC 措辞。
- 禁止：push、创建/更新 PR、合 main、部署/Publish、发外部消息（另得明确授权除外）。凭据不入库。

---

## 现状要点（基于 `232cadf` 实读）

| 位置 | 现状 | 本需求影响 |
| --- | --- | --- |
| `index.html:678-681` `METRICS` | 四卡名称、年度目标 | 不改 |
| `index.html:683-686` `DEMO_DATA.current / monthAdd / prevMonthAdd` | 主卡演示金额与新增额 | 不改；子目标从主卡展示金额往下拆 |
| `index.html:693` `DEMO_DATA.businesses` | 设计咨询 .64 / 项目管理 .22 / 工程服务 .14 | **禁止**当作三类映射 |
| `index.html:700` `state` | 无子目标开关 | 新增 `showSubgoals:false` |
| `index.html:702` `money / pct` | `pct` 默认 1 位 | 「占总目标」改走纯函数 2 位；「占目标」仍用 `pct()` 1 位 |
| `index.html:710-711` `buildModel` | `totals` 已取 2 位；`targets` 未取整，展示靠 `money()` | 拆分基准取 `money()` 展示串，保证「最终展示」 |
| `index.html:751-763` `renderKpis` | 主条 `<div class="progress-track"><i style="width:min(100,rate)%">`，`rate` 用未取整原值，占总目标 1 位 | 改为 12 段轨道 + 整数比例 + 2 位 |
| `index.html:920-985` `syncPeerRows` | KPI 2 列优先，按 `.kpi-value, strong` 与 `.kpi-delta` 宽度收列 | 把子行 token 宽度纳入最小列宽 |
| `index.html:35` `.kpi-card{overflow:hidden}` | 卡片裁切 | 探针必须检查卡内无溢出/裁切 |
| `index.html:221-237` `main` | 覆盖为 flex 纵向流 | 开关条可直接插在 `#kpiGrid` 前 |
| `index.html:1083-1096` `message` 监听 | 壳级筛选/主题经 `postMessage` 注入，调用 `render()` | 开关状态存 `state`，跨组织天然保持 |
| `board/page.tsx:687-701` | 运营看板 iframe 常驻，切组织不改 `src` | 无需改壳 |

仓内无单元测试框架，惯例是 `scripts/test-*.cjs`（`node:assert`）与 `docs/evidence/<日期-主题>/probe.cjs`（Playwright，file:// 打开页面，`postMessage` 切 13 组织）。本计划沿用。

## 文件结构

| 动作 | 路径 | 职责 |
| --- | --- | --- |
| Create | `public/operations-dashboard-202610/kpi-subgoals.js` | 纯函数：展示串↔整数、最大余数分配、百分比、填充宽度、行视图、轨道/子行 HTML |
| Modify | `public/operations-dashboard-202610/index.html` | 引入脚本；演示权重配置；`state.showSubgoals`；开关条；`renderKpis`；点击分支；`syncPeerRows` 最小宽度；CSS |
| Create | `scripts/test-ops-kpi-subgoals.cjs` | 纯函数单元测试（`node --test`） |
| Create | `docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs` | 页面级 DOM 真实渲染探针（AC1–7） |
| Create | `docs/evidence/2026-11-09-ops-kpi-subgoals/shell-probe.cjs` | Board 壳层探针（真实 antd 下拉切 13 组织、刷新、壳视口响应式） |
| Create | `docs/evidence/2026-11-09-ops-kpi-subgoals/实现证据.md` | 实现记录（不是验收关账） |
| 运行产物 | `docs/evidence/2026-11-09-ops-kpi-subgoals/*.json, *.png` | 探针结果与截图 |

不改：`app/**`（含壳页）、`completed-contract.html`、`org-entry.html`、Highcharts 内嵌代码、`docs/变更账本.md`（实现阶段由需求/协调角色改状态）、需求正文、Issue #3 镜像、`AGENTS.md`、`README.md`。

## AC → Task / 测试 映射

| AC | 内容 | 实现 Task | 单元测试 | DOM 探针 `probe.cjs` | 壳层 `shell-probe.cjs` |
| --- | --- | --- | --- | --- | --- |
| 1 覆盖 | 4×13，三行顺序、金额、12 段、百分比；SAS170 下齐全 | T4 | `rowView`/`subRowsHtml` 顺序 | 13 组织 × 4 卡逐一检查 | 13 组织经真实下拉 |
| 2 两类金额加总 | 去千分位后三行之和 = 主卡；仅测试权重、不能整除；分开补余数 | T1、T4 | 验算例、平手、5000 组随机仅测试权重性质测试、完成/目标分开 | 13×4 从 DOM 文本求和 | — |
| 3 开关/组织/刷新 | 默认关、无空位、打开出现、切 13 组织保持、刷新复位、不持久化 | T4 | — | 初始/切换/reload/storage 键不变 | 真实下拉切换 + `page.reload()` |
| 4 零/缺失/超额 | 0.00/0.00%/0 宽；无目标「—」；缺失「—」；115.68% 满条 | T1、T4 | `percentText`/`fillPercent`/`rowView` | 「仅测试」夹具注入真实卡片测像素 | — |
| 5 12 段连续填充 | 主条关态也 12 段；子条 12 段；13.23% 在第 2 段内部；主题跟随；Highcharts 不变 | T3、T4 | `fillPercent`、`trackHtml` 12 刻度 | 刻度等宽、夹具 13.23% 像素、三主题取色、图表系列签名对比 | — |
| 6 不截断与同行等高 | 展开/收起/变窄后同行等高、完整可见、紧凑高度、叶子成对模块隐藏；不关 11-06 条 | T5 | — | 6 档宽度 × 开/关；叶子 pairRow `display:none` | 壳视口 1440/1024/760 |
| 7 主文案不回退 | 名称、万元、目标、占总目标 2 位且与主条一致、新增文案与占目标 1 位、子行无新增文案、主题切换 | T3 | `percentText` | 正则 + 与纯函数重算比对 | 抽查 |

---

### Task 0: 环境与基线

**Files:** 无代码改动。

- [ ] **Step 1: 核对远端与写流**

```bash
cd /agent/repos/NewEngineeringPlatform
git fetch origin main && git rev-parse origin/main        # 期望仍为 232cadfe…；若变化见「main 更新时的处理」
gh pr list --state open                                  # 期望仅 #9、#6（均不碰 index.html）
git status -sb                                           # 期望在 cursor/kpi-subgoal-12seg-plan-2915，工作区干净
```

- [ ] **Step 2: 安装依赖与浏览器**（当前 VM 无 `node_modules`、无 Playwright 浏览器；npm 源已验证可达）

```bash
npm ci
npx playwright install chromium   # 若缺系统库再试：npx playwright install --with-deps chromium
```

Expected: `node -e "require('playwright')"` 无报错。

- [ ] **Step 3: 跑 11-06 现有探针作基线（只读运行，不改其文件）**

```bash
node docs/evidence/2026-11-06-ops-board-peer-row-height/probe.cjs
node scripts/test-yinchuan-ui.cjs
```

Expected: 记录各自 verdict 到 `实现证据.md` 草稿，作为「改前」对照。`probe.cjs` 会改写同目录 `probe-result.json`；跑完执行 `git checkout -- docs/evidence/2026-11-06-ops-board-peer-row-height/` 还原，避免混入他条证据。

---

### Task 1: 纯函数模块 + 单元测试（AC2、AC4、AC5 的算法部分）

**Files:**
- Create: `public/operations-dashboard-202610/kpi-subgoals.js`
- Test: `scripts/test-ops-kpi-subgoals.cjs`

**Interfaces:**
- Produces（`window.KpiSubgoals` / `module.exports`）：
  - `CATEGORIES: readonly ['EPC','PMC','设计及咨询']`，`SEGMENTS = 12`
  - `unitsFromDisplay(text: string) → bigint`（`'9,234.31' → 923431n`；非「非负 2 位小数」抛 `RangeError`）
  - `formatUnits(units: bigint) → string`
  - `allocate(totalUnits: bigint, weights: [int,int,int]) → [bigint,bigint,bigint]`
  - `splitKpi(mainDoneText: string, mainTargetText: string, weights: {done:[int,int,int], target:[int,int,int]}) → Array<{category, done: bigint, target: bigint}>`
  - `percentText(done: bigint|null, target: bigint|null) → string`（`'13.23%'` / `'—'`）
  - `fillPercent(done, target) → number`（0–100，未舍入）
  - `rowView(category: string, record: {done?: bigint|null, target?: bigint|null} | null) → {category, missing, noTarget, doneText, targetText, pctText, fill}`
  - `trackHtml(fill: number, label: string) → string`
  - `subRowsHtml(kpiName: string, rows: ReturnType<rowView>[]) → string`

- [ ] **Step 1: 写失败的单元测试** `scripts/test-ops-kpi-subgoals.cjs`

```js
// 运营看板顶部四 KPI 子目标纯函数单测：node --test scripts/test-ops-kpi-subgoals.cjs
// 文中权重与 13.23% / 115.68% 均为「仅测试」，不是演示主数据或业务比例。
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const KS = require(path.join(__dirname, '../public/operations-dashboard-202610/kpi-subgoals.js'));

test('展示金额换 0.01 万元整数并写回千分位', () => {
  assert.equal(KS.unitsFromDisplay('1.00'), 100n);
  assert.equal(KS.unitsFromDisplay('9,234.31'), 923431n);
  assert.equal(KS.unitsFromDisplay('0.00'), 0n);
  assert.equal(KS.formatUnits(923431n), '9,234.31');
  assert.equal(KS.formatUnits(5n), '0.05');
  assert.equal(KS.formatUnits(123456789n), '1,234,567.89');
  assert.throws(() => KS.unitsFromDisplay('1.0'), RangeError);
  assert.throws(() => KS.unitsFromDisplay('-1.00'), RangeError);
  assert.throws(() => KS.unitsFromDisplay('—'), RangeError);
});

test('验算例：主额 1.00、仅测试权重 1:1:1 → 0.34 / 0.33 / 0.33', () => {
  assert.deepEqual(KS.allocate(100n, [1, 1, 1]), [34n, 33n, 33n]);
  assert.deepEqual(KS.allocate(100n, [1, 1, 1]).map(KS.formatUnits), ['0.34', '0.33', '0.33']);
});

test('余数按精确小数部分从大到小，平手按 EPC、PMC、设计及咨询', () => {
  assert.deepEqual(KS.allocate(101n, [1, 1, 1]), [34n, 34n, 33n]);
  // 10×[1,2,4]/7：1+3/7、2+6/7、5+5/7 → 余 2 给 PMC(6/7)、设计及咨询(5/7)
  assert.deepEqual(KS.allocate(10n, [1, 2, 4]), [1n, 3n, 6n]);
  assert.deepEqual(KS.allocate(0n, [3, 2, 1]), [0n, 0n, 0n]);
  assert.deepEqual(KS.allocate(600n, [1, 2, 3]), [100n, 200n, 300n]);
});

test('权重必须是 3 个正整数', () => {
  assert.throws(() => KS.allocate(100n, [0, 1, 1]), RangeError);
  assert.throws(() => KS.allocate(100n, [1.5, 1, 1]), RangeError);
  assert.throws(() => KS.allocate(100n, [1, 1]), RangeError);
  assert.throws(() => KS.allocate(100, [1, 1, 1]), RangeError);
  assert.throws(() => KS.allocate(-1n, [1, 1, 1]), RangeError);
});

test('仅测试正权重 × 不能整除金额：合计严格相等，余数规则成立', () => {
  let seed = 20261109;
  const rnd = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  for (let k = 0; k < 5000; k += 1) {
    const T = BigInt(rnd(5000000));
    const w = [rnd(97) + 1, rnd(97) + 1, rnd(97) + 1];
    const out = KS.allocate(T, w);
    const W = BigInt(w[0] + w[1] + w[2]);
    const fl = w.map(x => (T * BigInt(x)) / W);
    const rem = w.map(x => (T * BigInt(x)) % W);
    assert.equal(out.reduce((a, b) => a + b, 0n), T);
    const plus = out.map((v, i) => v - fl[i]);
    plus.forEach(p => assert.ok(p === 0n || p === 1n));
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        if (plus[i] === 1n && plus[j] === 0n) {
          assert.ok(rem[i] > rem[j] || (rem[i] === rem[j] && i < j), JSON.stringify({ T: String(T), w }));
        }
      }
    }
  }
});

test('完成额与目标额分开拆，余数不互相挪；类别顺序固定', () => {
  const rows = KS.splitKpi('1.00', '2.00', { done: [1, 1, 1], target: [1, 1, 1] });
  assert.deepEqual(rows.map(r => r.category), ['EPC', 'PMC', '设计及咨询']);
  assert.deepEqual(rows.map(r => r.done), [34n, 33n, 33n]);
  assert.deepEqual(rows.map(r => r.target), [67n, 67n, 66n]);
  const big = KS.splitKpi('9,234.31', '9,950.00', { done: [7, 5, 3], target: [11, 13, 17] });
  assert.equal(big.reduce((a, r) => a + r.done, 0n), 923431n);
  assert.equal(big.reduce((a, r) => a + r.target, 0n), 995000n);
});

test('百分比文字四舍五入 2 位；目标为 0 不除', () => {
  assert.equal(KS.percentText(1323n, 10000n), '13.23%');
  assert.equal(KS.percentText(11568n, 10000n), '115.68%');
  assert.equal(KS.percentText(1n, 3n), '33.33%');
  assert.equal(KS.percentText(2n, 3n), '66.67%');
  assert.equal(KS.percentText(1n, 20000n), '0.01%');
  assert.equal(KS.percentText(0n, 5000n), '0.00%');
  assert.equal(KS.percentText(5n, 0n), '—');
  assert.equal(KS.percentText(null, 100n), '—');
  assert.equal(KS.percentText(2000000n, 10n), '20,000,000.00%');
});

test('轨道填充用未舍入比例、上限 100%，不吸附到 1/12', () => {
  const f = KS.fillPercent(1323n, 10000n);
  assert.ok(Math.abs(f - 13.23) < 1e-9);
  assert.ok(f > 100 / 12 && f < 200 / 12);
  assert.equal(KS.fillPercent(11568n, 10000n), 100);
  assert.equal(KS.fillPercent(0n, 5000n), 0);
  assert.equal(KS.fillPercent(1n, 0n), 0);
  assert.equal(KS.fillPercent(null, 10n), 0);
  assert.ok(Math.abs(KS.fillPercent(1n, 7n) - 100 / 7) < 1e-9);
});

test('行视图：有效 0、无目标、缺失彼此区分', () => {
  assert.deepEqual(KS.rowView('EPC', { done: 0n, target: 5000n }),
    { category: 'EPC', missing: false, noTarget: false, doneText: '0.00', targetText: '50.00', pctText: '0.00%', fill: 0 });
  assert.deepEqual(KS.rowView('PMC', { done: 0n, target: 0n }),
    { category: 'PMC', missing: false, noTarget: true, doneText: '0.00', targetText: '0.00', pctText: '—', fill: 0 });
  assert.deepEqual(KS.rowView('设计及咨询', null),
    { category: '设计及咨询', missing: true, noTarget: false, doneText: '—', targetText: '—', pctText: '—', fill: 0 });
  assert.deepEqual(KS.rowView('EPC', { done: null, target: 0n }),
    { category: 'EPC', missing: true, noTarget: true, doneText: '—', targetText: '—', pctText: '—', fill: 0 });
  const over = KS.rowView('PMC', { done: 11568n, target: 10000n });
  assert.equal(over.pctText, '115.68%');
  assert.equal(over.fill, 100);
});

test('HTML：12 刻度轨道、三行顺序、无新增文案、无目标标记', () => {
  const t = KS.trackHtml(13.23, '仅测试');
  assert.equal((t.match(/<b><\/b>/g) || []).length, 12);
  assert.match(t, /class="seg12-fill" style="width:13\.23%"/);
  const rows = KS.splitKpi('1.00', '0.00', { done: [1, 1, 1], target: [1, 1, 1] }).map(r => KS.rowView(r.category, r));
  const html = KS.subRowsHtml('新签合同额', rows);
  const cats = [...html.matchAll(/data-category="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(cats, ['EPC', 'PMC', '设计及咨询']);
  assert.equal((html.match(/无目标/g) || []).length, 3);
  assert.doesNotMatch(html, /当月新增|上月新增|占目标/);
  assert.equal((html.match(/<b><\/b>/g) || []).length, 36);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/test-ops-kpi-subgoals.cjs`
Expected: FAIL，`Cannot find module '.../kpi-subgoals.js'`。

- [ ] **Step 3: 写最小实现** `public/operations-dashboard-202610/kpi-subgoals.js`

```js
/* 运营看板202610 · 顶部四 KPI 子目标与 12 段轨道（演示）
 * 金额一律用 0.01 万元整数（BigInt）运算，保证三行展示值之和等于主卡展示值。
 * 浏览器挂 window.KpiSubgoals；Node 可 require（scripts/test-ops-kpi-subgoals.cjs）。
 * 口径：docs/需求文档/202611_运营看板四KPI子目标与12段进度条.md */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KpiSubgoals = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const CATEGORIES = Object.freeze(['EPC', 'PMC', '设计及咨询']);
  const SEGMENTS = 12;
  const DASH = '—';

  const groupThousands = digits => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const twoDecimals = n => groupThousands((n / 100n).toString()) + '.' + (n % 100n).toString().padStart(2, '0');

  function unitsFromDisplay(text) {
    const m = /^([\d,]+)\.(\d{2})$/.exec(String(text).trim());
    if (!m) throw new RangeError('不是非负 2 位小数金额：' + text);
    return BigInt(m[1].replace(/,/g, '') + m[2]);
  }

  function formatUnits(units) {
    return twoDecimals(units);
  }

  function allocate(totalUnits, weights) {
    if (typeof totalUnits !== 'bigint' || totalUnits < 0n) throw new RangeError('totalUnits 须为非负 BigInt');
    if (!Array.isArray(weights) || weights.length !== CATEGORIES.length
      || !weights.every(w => Number.isSafeInteger(w) && w > 0)) {
      throw new RangeError('权重须为 3 个正整数');
    }
    const ws = weights.map(BigInt);
    const sumW = ws.reduce((a, b) => a + b, 0n);
    const parts = ws.map((w, i) => ({ i, q: (totalUnits * w) / sumW, r: (totalUnits * w) % sumW }));
    const out = parts.map(p => p.q);
    let left = totalUnits - out.reduce((a, b) => a + b, 0n);
    // 同分母 sumW，比较余数 r 即比较精确小数部分；平手按类别顺序
    const order = parts.slice().sort((a, b) => (a.r === b.r ? a.i - b.i : (a.r > b.r ? -1 : 1)));
    for (let k = 0; left > 0n; k += 1, left -= 1n) out[order[k].i] += 1n;
    return out;
  }

  function splitKpi(mainDoneText, mainTargetText, weights) {
    const done = allocate(unitsFromDisplay(mainDoneText), weights.done);
    const target = allocate(unitsFromDisplay(mainTargetText), weights.target);
    return CATEGORIES.map((category, i) => ({ category, done: done[i], target: target[i] }));
  }

  function percentText(done, target) {
    if (done == null || target == null || target === 0n) return DASH;
    const hundredths = (done * 20000n + target) / (2n * target);
    return twoDecimals(hundredths) + '%';
  }

  function fillPercent(done, target) {
    if (done == null || target == null || target === 0n) return 0;
    return Math.min(1, Number(done) / Number(target)) * 100;
  }

  function rowView(category, record) {
    const done = record && record.done != null ? record.done : null;
    const target = record && record.target != null ? record.target : null;
    const missing = done === null || target === null;
    return {
      category,
      missing,
      noTarget: target === 0n,
      doneText: missing ? DASH : formatUnits(done),
      targetText: missing ? DASH : formatUnits(target),
      pctText: missing ? DASH : percentText(done, target),
      fill: missing ? 0 : fillPercent(done, target),
    };
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function trackHtml(fill, label) {
    return '<div class="progress-track seg12" role="progressbar" aria-label="' + esc(label)
      + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + fill + '">'
      + '<i class="seg12-fill" style="width:' + fill + '%"></i>'
      + '<span class="seg12-ticks" aria-hidden="true">' + '<b></b>'.repeat(SEGMENTS) + '</span></div>';
  }

  function subRowsHtml(kpiName, rows) {
    return '<div class="kpi-subgoals" data-kpi-subgoals>' + rows.map(r =>
      '<div class="kpi-sub-row" data-category="' + esc(r.category) + '"'
      + (r.missing ? ' data-missing="true"' : '') + (r.noTarget ? ' data-no-target="true"' : '') + '>'
      + '<div class="kpi-sub-line"><span class="kpi-sub-name">' + esc(r.category) + '</span>'
      + '<span class="kpi-sub-amount"><b class="kpi-sub-done">' + r.doneText + '</b> / <span class="kpi-sub-target">'
      + r.targetText + '</span></span></div>'
      + '<div class="kpi-sub-bar">' + trackHtml(r.fill, kpiName + ' ' + r.category + ' 进度')
      + '<span class="kpi-sub-pct">' + r.pctText + '</span>'
      + (r.noTarget ? '<span class="kpi-sub-flag">无目标</span>' : '')
      + '</div></div>').join('') + '</div>';
  }

  return { CATEGORIES, SEGMENTS, unitsFromDisplay, formatUnits, allocate, splitKpi, percentText, fillPercent, rowView, trackHtml, subRowsHtml };
});
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test scripts/test-ops-kpi-subgoals.cjs`
Expected: `# pass 10`、`# fail 0`。

- [ ] **Step 5: 本地提交（不 push）**

```bash
git add public/operations-dashboard-202610/kpi-subgoals.js scripts/test-ops-kpi-subgoals.cjs
git commit -m "feat(运营看板202610): KPI 子目标纯函数（0.01 万元整数最大余数法）与单测"
```

---

### Task 2: 先写 DOM 真实渲染探针（红灯）

**Files:**
- Create: `docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs`

**Interfaces:**
- Consumes: Task 1 的 `kpi-subgoals.js`（Node 侧 `require` 重算期望；页面侧 `window.KpiSubgoals` 注入「仅测试」夹具）。
- Produces（后续 Task 依赖的 DOM 约定）：`#kpiToolbar`、`#kpiSubgoalSwitch[role=switch][aria-checked]`、卡内 `.kpi-content > .progress-track.seg12`、`.seg12-fill`、`.seg12-ticks > b`×12、`.kpi-subgoals > .kpi-sub-row[data-category]`、`.kpi-sub-name / .kpi-sub-done / .kpi-sub-target / .kpi-sub-pct / .kpi-sub-flag`。

- [ ] **Step 1: 写探针**

```js
/**
 * 运营看板顶部四 KPI 子目标与 12 段进度条 — 页面级 DOM 真实渲染探针（实现证据，非验收关账）
 * 对照：docs/需求文档/202611_运营看板四KPI子目标与12段进度条.md 验收条件 1–7
 * 运行：node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs
 * 夹具中的 13.23% / 115.68% / 0 / 缺失 均为「仅测试」，只注入 DOM 测量，不写入演示主数据。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const KS = require(path.resolve('public/operations-dashboard-202610/kpi-subgoals.js'));

const OUT = __dirname;
const FILE = 'file://' + path.resolve('public/operations-dashboard-202610/index.html');
const UNITS = ['全部板块', 'SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块', 'SAS650 新材料板块',
  'SAS710 生命科学板块', 'SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块',
  'SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心', 'SAS530 银川中心'];
const KPIS = { contract: ['新签合同额', '当月新增'], completed: ['完成合同额', '上月新增'], invoice: ['完成开票额', '当月新增'], receipt: ['完成回款额', '当月新增'] };
const CATS = ['EPC', 'PMC', '设计及咨询'];
const WIDTHS = [1440, 1280, 1024, 760, 520, 312];
const PCT2 = /^\d{1,3}(,\d{3})*\.\d{2}%$/;
const PCT1 = /^\d{1,3}(,\d{3})*\.\d%$/;
const MONEY = /^\d{1,3}(,\d{3})*\.\d{2}$/;

const results = [];
const fails = [];
function check(ok, name, detail) {
  const row = { name, ok: !!ok, detail: detail == null ? null : detail };
  results.push(row);
  if (!ok) fails.push(row);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (!ok && detail != null ? '  ' + JSON.stringify(detail) : ''));
}
const units = t => (MONEY.test(String(t)) ? KS.unitsFromDisplay(t) : null);
const rgb = hex => 'rgb(' + hex.slice(1).match(/.{2}/g).map(x => parseInt(x, 16)).join(', ') + ')';
const ticksOk = t => !!t && t.segs === 12 && Math.max(...t.tickW) - Math.min(...t.tickW) <= 1;

async function setUnit(page, unit) {
  await page.evaluate(u => window.postMessage({ type: 'ops-dashboard-filter', year: 2026, unit: u }, '*'), unit);
  await page.waitForFunction(u => window.dashboard && window.dashboard.state.unit === u, unit);
}
async function setTheme(page, theme) {
  await page.evaluate(t => window.postMessage({ type: 'ops-dashboard-theme', theme: t }, '*'), theme);
  await page.waitForFunction(t => window.dashboard.state.theme === t, theme);
}
async function setSwitch(page, on) {
  const cur = await page.getAttribute('#kpiSubgoalSwitch', 'aria-checked');
  if ((cur === 'true') !== on) await page.click('#kpiSubgoalSwitch');
  await page.waitForFunction(v => document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked') === v, String(on));
  await page.waitForTimeout(50);
}

async function snap(page) {
  return page.evaluate(() => {
    const R = el => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
    const txt = el => (el ? el.textContent.trim() : null);
    const textRect = node => { const g = document.createRange(); g.selectNodeContents(node); const r = g.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }; };
    const track = el => {
      if (!el) return null;
      const fill = el.querySelector('.seg12-fill');
      const ticks = [...el.querySelectorAll('.seg12-ticks > b')];
      return { segs: ticks.length, tickW: ticks.map(b => b.getBoundingClientRect().width), trackW: el.getBoundingClientRect().width,
        fillW: fill ? fill.getBoundingClientRect().width : null, fillBg: fill ? getComputedStyle(fill).backgroundImage : null,
        trackBg: getComputedStyle(el).backgroundColor };
    };
    const sw = document.getElementById('kpiSubgoalSwitch');
    const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')].map(card => {
      const cr = R(card);
      const tokens = [...card.querySelectorAll('.kpi-title, .kpi-value, .kpi-meta > span, .kpi-delta-row, .kpi-sub-name, .kpi-sub-amount, .kpi-sub-pct, .kpi-sub-flag')];
      const clipped = tokens.filter(n => { const t = textRect(n); return t.w > 0 && (t.l < cr.l - 1 || t.r > cr.r + 1 || t.t < cr.t - 1 || t.b > cr.b + 1); }).map(n => n.textContent.trim());
      const ellipsis = tokens.filter(n => getComputedStyle(n).textOverflow === 'ellipsis' && n.scrollWidth > n.clientWidth + 1).map(n => n.textContent.trim());
      const delta = card.querySelector('.kpi-delta');
      const subs = card.querySelector('.kpi-subgoals');
      let overlap = 0;
      if (delta && subs) {
        const a = R(delta), b = R(subs);
        overlap = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
      }
      return {
        kpi: card.dataset.kpi, rect: cr,
        scroll: { sh: card.scrollHeight, ch: card.clientHeight, sw: card.scrollWidth, cw: card.clientWidth },
        title: txt(card.querySelector('.kpi-title')), unit: txt(card.querySelector('.kpi-title .unit')),
        value: txt(card.querySelector('.kpi-value')), target: txt(card.querySelector('.kpi-meta b')),
        metaText: txt(card.querySelector('.kpi-meta')), rate: txt(card.querySelector('.kpi-meta em')),
        deltaLabels: [...card.querySelectorAll('.kpi-delta-label')].map(txt), deltaNums: [...card.querySelectorAll('.kpi-delta-num')].map(txt),
        mainTrack: track(card.querySelector('.kpi-content > .progress-track')),
        subText: subs ? subs.textContent : '',
        rows: [...card.querySelectorAll('.kpi-sub-row')].map(r => ({
          cat: r.dataset.category, name: txt(r.querySelector('.kpi-sub-name')), done: txt(r.querySelector('.kpi-sub-done')),
          target: txt(r.querySelector('.kpi-sub-target')), pct: txt(r.querySelector('.kpi-sub-pct')),
          flag: txt(r.querySelector('.kpi-sub-flag')), track: track(r.querySelector('.progress-track')) })),
        clipped, ellipsis, overlap,
      };
    });
    const pair = document.getElementById('pairRow');
    let storage;
    try { storage = { local: Object.keys(localStorage), session: Object.keys(sessionStorage) }; } catch (e) { storage = { error: String(e) }; }
    const charts = JSON.stringify(Object.entries(window.dashboard.charts).filter(([, c]) => c && c.series)
      .map(([id, c]) => [id, c.series.map(s => [s.type, s.name, String(s.color), JSON.stringify(s.options.data)])]));
    return { unit: window.dashboard.state.unit, theme: window.dashboard.state.theme,
      switchChecked: sw ? sw.getAttribute('aria-checked') : null, switchRole: sw ? sw.getAttribute('role') : null, switchLabel: txt(sw),
      toolbarText: txt(document.getElementById('kpiToolbar')), cards,
      pairDisplay: pair ? getComputedStyle(pair).display : null, storage, charts, cookie: document.cookie, search: location.search };
  });
}

function peerRows(cards) {
  const g = new Map();
  cards.forEach(c => { const k = Math.round(c.rect.t); if (!g.has(k)) g.set(k, []); g.get(k).push(c); });
  return [...g.values()];
}
function assertLayout(tag, s) {
  peerRows(s.cards).forEach((row, i) => {
    const hs = row.map(c => c.rect.h);
    check(Math.max(...hs) - Math.min(...hs) <= 1, `${tag} 第${i + 1}行同行等高`, hs);
  });
  s.cards.forEach(c => {
    check(c.scroll.sh <= c.scroll.ch + 1 && c.scroll.sw <= c.scroll.cw + 1, `${tag} ${c.kpi} 卡内无溢出`, c.scroll);
    check(c.clipped.length === 0 && c.ellipsis.length === 0, `${tag} ${c.kpi} 类别/金额/百分比不截断`, { clipped: c.clipped, ellipsis: c.ellipsis });
    check(c.overlap === 0, `${tag} ${c.kpi} 新增块不压住子目标`, c.overlap);
  });
}
function assertMain(tag, s) {
  check(s.cards.length === 4, `${tag} 四张主卡`, s.cards.length);
  s.cards.forEach(c => {
    const [name, addLabel] = KPIS[c.kpi];
    check(c.title && c.title.startsWith(name) && c.unit === '（万元）', `${tag} ${c.kpi} 名称与万元`, c.title);
    check(/目标/.test(c.metaText) && /占总目标/.test(c.metaText), `${tag} ${c.kpi} 保留目标/占总目标`, c.metaText);
    check(PCT2.test(c.rate) && c.rate === KS.percentText(units(c.value), units(c.target)), `${tag} ${c.kpi} 占总目标 2 位且与主条同口径`, { rate: c.rate, value: c.value, target: c.target });
    const fillExp = KS.fillPercent(units(c.value), units(c.target)) / 100 * c.mainTrack.trackW;
    check(Math.abs(c.mainTrack.fillW - fillExp) <= 0.6, `${tag} ${c.kpi} 主条宽按未舍入比例`, { fillW: c.mainTrack.fillW, fillExp });
    check(ticksOk(c.mainTrack), `${tag} ${c.kpi} 主条 12 等分`, c.mainTrack && c.mainTrack.tickW);
    check(c.deltaLabels[0] === addLabel && c.deltaLabels[1] === '占目标' && PCT1.test(c.deltaNums[1]), `${tag} ${c.kpi} 新增文案与占目标 1 位`, { l: c.deltaLabels, n: c.deltaNums });
  });
}
function assertSubs(tag, s) {
  s.cards.forEach(c => {
    check(c.rows.length === 3 && c.rows.map(r => r.cat).join() === CATS.join() && c.rows.map(r => r.name).join() === CATS.join(), `${tag} ${c.kpi} 三行顺序`, c.rows.map(r => r.name));
    const doneSum = c.rows.reduce((a, r) => (a === null || units(r.done) === null ? null : a + units(r.done)), 0n);
    const targetSum = c.rows.reduce((a, r) => (a === null || units(r.target) === null ? null : a + units(r.target)), 0n);
    check(doneSum !== null && doneSum === units(c.value), `${tag} ${c.kpi} 三行完成额之和 = 主完成额`, { rows: c.rows.map(r => r.done), main: c.value });
    check(targetSum !== null && targetSum === units(c.target), `${tag} ${c.kpi} 三行目标额之和 = 主目标额`, { rows: c.rows.map(r => r.target), main: c.target });
    c.rows.forEach(r => {
      check(r.pct === KS.percentText(units(r.done), units(r.target)) && ticksOk(r.track), `${tag} ${c.kpi} ${r.cat} 百分比与 12 段`, { pct: r.pct, segs: r.track && r.track.segs });
      const fillExp = KS.fillPercent(units(r.done), units(r.target)) / 100 * r.track.trackW;
      check(Math.abs(r.track.fillW - fillExp) <= 0.6, `${tag} ${c.kpi} ${r.cat} 子条宽按未舍入比例`, { fillW: r.track.fillW, fillExp });
    });
    check(!/当月新增|上月新增|占目标/.test(c.subText), `${tag} ${c.kpi} 子行无新增/占目标文案`, c.subText);
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(FILE);
  await page.waitForFunction(() => document.body.dataset.ready === 'true' && window.KpiSubgoals);

  // AC3/AC7：进入页面
  const s0 = await snap(page);
  check(s0.switchChecked === 'false' && s0.switchRole === 'switch' && s0.switchLabel === '显示子目标', 'AC3 进入页面开关为关', { c: s0.switchChecked, l: s0.switchLabel });
  check(/仅演示、非业务默认/.test(s0.toolbarText || ''), '演示权重标明「仅演示、非业务默认」', s0.toolbarText);
  check(s0.cards.every(c => c.rows.length === 0 && !c.subText), 'AC3 关闭时无子行', null);
  assertMain('AC5/AC7 关态 1440', s0);
  await page.screenshot({ path: path.join(OUT, 'kpi-off-1440.png'), clip: { x: 0, y: 0, width: 1440, height: 520 } });

  // AC1/AC2/AC3：打开并遍历 13 组织
  await setSwitch(page, true);
  const s1 = await snap(page);
  check(s1.charts === s0.charts, 'AC5 开关不改 Highcharts 系列', null);
  check(JSON.stringify(s1.storage) === JSON.stringify(s0.storage) && s1.cookie === s0.cookie && s1.search === s0.search, 'AC3 开关不写持久化', { s0: s0.storage, s1: s1.storage });
  await page.screenshot({ path: path.join(OUT, 'kpi-on-1440.png'), clip: { x: 0, y: 0, width: 1440, height: 760 } });
  for (const unit of UNITS) {
    await setUnit(page, unit);
    const s = await snap(page);
    check(s.switchChecked === 'true', `AC3 ${unit} 切换后开关保持`, s.switchChecked);
    assertMain(`AC7 ${unit}`, s);
    assertSubs(`AC1/AC2 ${unit}`, s);
    assertLayout(`AC6 ${unit} 1440`, s);
    if (unit !== '全部板块') check(s.pairDisplay === 'none', `AC6 ${unit} 成对模块整块隐藏`, s.pairDisplay);
    if (unit === 'SAS170 PMC板块' || unit === 'SAS530 银川中心') {
      await page.screenshot({ path: path.join(OUT, `kpi-on-${unit.split(' ')[0]}.png`), clip: { x: 0, y: 0, width: 1440, height: 760 } });
    }
  }
  await setUnit(page, '全部板块');

  // AC6：变窄重排、展开/收起
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 1000 });
    await setSwitch(page, false);
    await page.waitForTimeout(150);
    const off = await snap(page);
    assertLayout(`AC6 关 ${w}`, off);
    await setSwitch(page, true);
    await page.waitForTimeout(150);
    const on = await snap(page);
    assertLayout(`AC6 开 ${w}`, on);
    assertSubs(`AC2 开 ${w}`, on);
    await page.screenshot({ path: path.join(OUT, `kpi-on-${w}.png`), fullPage: false });
    await setSwitch(page, false);
    await page.waitForTimeout(150);
    const back = await snap(page);
    const dh = back.cards.map((c, i) => Math.abs(c.rect.h - off.cards[i].rect.h));
    check(Math.max(...dh) <= 0.5 && back.cards.every(c => c.rows.length === 0), `AC6 收起回到紧凑高度 ${w}`, dh);
    await setSwitch(page, true);
  }
  await setUnit(page, 'SAS530 银川中心');
  await page.setViewportSize({ width: 312, height: 1000 });
  await page.waitForTimeout(150);
  assertLayout('AC6 叶子 312', await snap(page));
  await setUnit(page, '全部板块');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(150);

  // AC5/AC7：主题跟随
  const themes = await page.evaluate(() => Object.fromEntries(Object.entries(window.dashboard.THEMES).map(([k, v]) => [k, { primary: v.primary, track: v.track }])));
  for (const [name, t] of Object.entries(themes)) {
    await setTheme(page, name);
    const s = await snap(page);
    const tracks = s.cards.flatMap(c => [c.mainTrack, ...c.rows.map(r => r.track)]);
    check(tracks.every(tr => tr.fillBg.includes(rgb(t.primary)) && (!t.track || tr.trackBg === rgb(t.track))), `AC5 主题 ${name} 主条/子条跟随`, tracks[0]);
    await page.screenshot({ path: path.join(OUT, `kpi-theme-${name}.png`), clip: { x: 0, y: 0, width: 1440, height: 760 } });
  }
  await setTheme(page, 'blue');

  // AC4/AC5：「仅测试」夹具注入真实卡片
  const fx = await page.evaluate(() => {
    const KSx = window.KpiSubgoals;
    const host = document.querySelector('#kpiGrid > .kpi-card .kpi-content');
    const box = document.createElement('div');
    box.id = 'fixtureBox';
    box.innerHTML = KSx.subRowsHtml('仅测试', [
      KSx.rowView('EPC', { done: 1323n, target: 10000n }),
      KSx.rowView('PMC', { done: 11568n, target: 10000n }),
      KSx.rowView('设计及咨询', { done: 0n, target: 5000n }),
    ]) + KSx.subRowsHtml('仅测试', [
      KSx.rowView('EPC', { done: 0n, target: 0n }),
      KSx.rowView('PMC', null),
      KSx.rowView('设计及咨询', { done: null, target: 0n }),
    ]);
    host.appendChild(box);
    host.querySelector(':scope > .progress-track').outerHTML = KSx.trackHtml(KSx.fillPercent(1323n, 10000n), '仅测试 主条');
    const m = host.querySelector(':scope > .progress-track');
    const read = el => ({ cat: el.dataset.category, done: el.querySelector('.kpi-sub-done').textContent, target: el.querySelector('.kpi-sub-target').textContent,
      pct: el.querySelector('.kpi-sub-pct').textContent, flag: el.querySelector('.kpi-sub-flag') ? el.querySelector('.kpi-sub-flag').textContent : null,
      missing: el.dataset.missing === 'true', trackW: el.querySelector('.progress-track').getBoundingClientRect().width,
      fillW: el.querySelector('.seg12-fill').getBoundingClientRect().width });
    return { rows: [...box.querySelectorAll('.kpi-sub-row')].map(read),
      main: { trackW: m.getBoundingClientRect().width, fillW: m.querySelector('.seg12-fill').getBoundingClientRect().width } };
  });
  await page.screenshot({ path: path.join(OUT, 'fixture-test-only.png'), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  const inSeg2 = b => { const seg = b.trackW / 12; return b.fillW > seg + 0.5 && b.fillW < 2 * seg - 0.5 && Math.abs(b.fillW / b.trackW - 0.1323) <= 0.6 / b.trackW + 1e-3; };
  const [r1323, r11568, rZero, rNoTgt, rMiss, rMissNoTgt] = fx.rows;
  check(r1323.pct === '13.23%' && inSeg2(r1323), 'AC5 仅测试 13.23% 子条落第 2 段内部', r1323);
  check(inSeg2(fx.main), 'AC5 仅测试 13.23% 主条落第 2 段内部', fx.main);
  check(r11568.pct === '115.68%' && Math.abs(r11568.fillW - r11568.trackW) <= 0.5, 'AC4 仅测试 115.68% 满条且文字照实', r11568);
  check(rZero.done === '0.00' && rZero.pct === '0.00%' && rZero.fillW === 0 && !rZero.flag && !rZero.missing, 'AC4 有效完成额 0', rZero);
  check(rNoTgt.target === '0.00' && rNoTgt.pct === '—' && rNoTgt.flag === '无目标' && rNoTgt.fillW === 0, 'AC4 目标 0 无目标', rNoTgt);
  check(rMiss.done === '—' && rMiss.target === '—' && rMiss.pct === '—' && !rMiss.flag && rMiss.fillW === 0 && rMiss.missing, 'AC4 缺失不补 0', rMiss);
  check(rMissNoTgt.flag === '无目标' && rMissNoTgt.pct === '—' && rMissNoTgt.missing, 'AC4 缺失且目标已知为 0', rMissNoTgt);
  check(units(rMiss.done) === null, 'AC4 缺失行不能参与合计判通过', rMiss.done);

  // AC3：刷新复位
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  const s9 = await snap(page);
  check(s9.switchChecked === 'false' && s9.cards.every(c => c.rows.length === 0), 'AC3 刷新后恢复为关', s9.switchChecked);

  await browser.close();
  const verdict = fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'probe-result.json'), JSON.stringify({ file: FILE, verdict, fails, results }, null, 2));
  console.log('verdict=' + verdict + ' pass=' + (results.length - fails.length) + ' fail=' + fails.length);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
```

- [ ] **Step 2: 运行确认红灯**

Run: `node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs`
Expected: 非零退出；首批 FAIL 为「AC3 进入页面开关为关」（`#kpiSubgoalSwitch` 不存在）。若 `setSwitch` 因元素不存在直接抛错（退出码 2）也视为预期红灯。

- [ ] **Step 3: 本地提交**

```bash
git add docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs
git commit -m "test(运营看板202610): 四 KPI 子目标 DOM 真实渲染探针（先红）"
```

---

### Task 3: 主卡 12 段轨道 + 占总目标 2 位（AC5 主条、AC7）

**Files:**
- Modify: `public/operations-dashboard-202610/index.html`（`</script>` 与主脚本 `<script>` 之间、`renderKpis` 761 行、`<style>` 末尾）

**Interfaces:**
- Consumes: `KS.unitsFromDisplay / percentText / fillPercent / trackHtml`。
- Produces: 页面常量 `KS`（`window.KpiSubgoals` 别名），供 Task 4 使用。

- [ ] **Step 1: 引入脚本**——在第 668 行主脚本 `<script>`（以 `/* 公司运营看板 · 单文件原型` 开头那段）**之前**插入一行：

```html
<script src="kpi-subgoals.js"></script>
```

相对路径同时适用于 `file://` 探针与 Next 的 `/operations-dashboard-202610/index.html`。

- [ ] **Step 2: 主脚本取别名**——在 `const THEMES = window.DASHBOARD_THEMES;` 下一行加：

```js
  const KS = window.KpiSubgoals;
```

- [ ] **Step 3: 改 `renderKpis` 主卡部分**——把 761 行 `return` 模板中的主卡段替换为（新增额段保持原样）：

```js
      const valText=money(val),targetText=money(target);
      const mainDone=KS.unitsFromDisplay(valText),mainTarget=KS.unitsFromDisplay(targetText);
      const noTarget=mainTarget===0n;
      return `<article class="kpi-card" data-kpi="${key}" tabindex="0" role="button" aria-label="${m.name} ${valText}万元，查看明细" data-tip="${m.definition} 点击查看明细。"><div class="kpi-icon">${icon(m.icon)}</div><div class="kpi-content"><div class="kpi-title">${m.name}<span class="unit">（万元）</span></div><strong class="kpi-value">${valText}</strong><div class="kpi-meta"><span>目标 <b>${targetText}</b></span><span>占总目标 <em>${KS.percentText(mainDone,mainTarget)}</em></span>${noTarget?'<span class="kpi-sub-flag">无目标</span>':''}</div>${KS.trackHtml(KS.fillPercent(mainDone,mainTarget),m.name+' 占总目标')}</div><div class="kpi-delta" data-kpi-delta="${key}"><span class="kpi-delta-row"><span class="kpi-delta-label">${addLabel}</span> <b class="kpi-delta-num">${money(addRaw)}</b></span><span class="kpi-delta-row"><span class="kpi-delta-label">占目标</span> <b class="kpi-delta-num">${pct(addShare)}</b></span></div></article>`;
```

并删除原 `const val=…,rate=val/target*100;` 中不再使用的 `rate`（`val`、`target` 保留）。

- [ ] **Step 4: 加 12 段轨道 CSS**——在主 `<style>` 末尾（`</style>` 前）追加：

```css
/* 顶部四 KPI：12 段刻度轨道，填充连续（按未舍入比例），颜色取主题变量 */
.progress-track.seg12{position:relative}
.progress-track.seg12>.seg12-fill{position:absolute;left:0;top:0;bottom:0;display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--primary),var(--accent))}
.seg12-ticks{position:absolute;inset:0;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));pointer-events:none}
.seg12-ticks>b{border-right:1px solid var(--surface)}
.seg12-ticks>b:last-child{border-right:0}
```

- [ ] **Step 5: 跑测试**

```bash
node --test scripts/test-ops-kpi-subgoals.cjs
node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs
```

Expected: 单测全绿；探针中 `AC5/AC7 关态 1440 … 占总目标 2 位 / 主条宽 / 主条 12 等分 / 新增文案与占目标 1 位` 变 PASS；开关相关仍 FAIL（Task 4 解决）。

- [ ] **Step 6: 本地提交**

```bash
git add public/operations-dashboard-202610/index.html
git commit -m "feat(运营看板202610): 四 KPI 主条 12 段连续填充，占总目标 2 位同口径"
```

---

### Task 4: 子目标三行 + 「显示子目标」开关 + 演示权重（AC1–AC4、AC5 子条）

**Files:**
- Modify: `public/operations-dashboard-202610/index.html`（`DEMO_DATA` 后、`state`、`#kpiGrid` 前、`renderKpis`、全局点击处理、`<style>` 末尾）

**Interfaces:**
- Consumes: `KS.splitKpi / rowView / subRowsHtml`；Task 3 的 `KS`。
- Produces: `state.showSubgoals: boolean`；`DEMO_SUBGOAL_WEIGHTS[kpiKey] = {done:[int,int,int], target:[int,int,int]}`；DOM `#kpiToolbar`、`#kpiSubgoalSwitch`。

- [ ] **Step 1: 演示权重配置**——紧接 `const DEMO_DATA = {…};` 之后加：

```js
  /* 顶部四 KPI 子目标拆分权重：仅演示、非业务默认。
     正整数，只表示 EPC / PMC / 设计及咨询 的相对比例，用来把主卡展示金额拆成三行；
     不是业务比例，不来自 DEMO_DATA.businesses（设计咨询/项目管理/工程服务）或其它页面、种子数据。 */
  const DEMO_SUBGOAL_WEIGHTS = {
    contract:{done:[5,3,2],target:[9,6,5]},
    completed:{done:[6,2,2],target:[11,5,4]},
    invoice:{done:[4,3,3],target:[8,7,5]},
    receipt:{done:[5,2,3],target:[10,4,6]}
  };
```

- [ ] **Step 2: 状态**——`state` 字面量末尾加 `showSubgoals:false`（不读写任何存储）：

```js
  const state={year:2026,unit:'全部板块',business:'全部业务类型',theme:'teal',dimension:'department',target:'contract',showSubgoals:false};
```

- [ ] **Step 3: 开关条 HTML**——在 `<section id="kpiGrid" …>` 前插入：

```html
  <div id="kpiToolbar" class="kpi-toolbar"><button type="button" id="kpiSubgoalSwitch" class="kpi-switch" role="switch" aria-checked="false"><span class="kpi-switch-track" aria-hidden="true"><span class="kpi-switch-thumb"></span></span><span class="kpi-switch-label">显示子目标</span></button><span class="kpi-toolbar-note">子目标拆分权重仅演示、非业务默认</span></div>
```

- [ ] **Step 4: `renderKpis` 生成子行**——函数开头（`$('kpiGrid').innerHTML=` 之前）加：

```js
    const sw=$('kpiSubgoalSwitch');if(sw)sw.setAttribute('aria-checked',String(state.showSubgoals));
```

在 `const noTarget=…;` 之后加：

```js
      const subs=state.showSubgoals?KS.subRowsHtml(m.name,KS.splitKpi(valText,targetText,DEMO_SUBGOAL_WEIGHTS[key]).map(r=>KS.rowView(r.category,r))):'';
```

并把模板中的 `${KS.trackHtml(KS.fillPercent(mainDone,mainTarget),m.name+' 占总目标')}</div>` 改为 `${KS.trackHtml(KS.fillPercent(mainDone,mainTarget),m.name+' 占总目标')}${subs}</div>`。关态不输出任何子行节点，因此不留空位。

- [ ] **Step 5: 点击分支**——全局 `click` 处理里 `if(b.dataset.kpi)openKpi(b.dataset.kpi);` 之后加：

```js
    else if(b.id==='kpiSubgoalSwitch'){state.showSubgoals=!state.showSubgoals;renderKpis();applyPeerLayout();}
```

开关是原生 `<button>`，Enter/Space 由浏览器触发 click；不在 `.kpi-card` 内，不会误开主卡明细。`applyHostFilter → render()` 会重绘四卡但读同一个 `state.showSubgoals`，所以切组织保持；刷新后脚本重新执行，回到 `false`。

- [ ] **Step 6: 子行与开关 CSS**——`<style>` 末尾、Task 3 CSS 之后追加：

```css
/* 顶部四 KPI：显示子目标开关与三行子目标；文字只换行不省略 */
.kpi-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px;flex:0 0 auto}
.kpi-switch{display:inline-flex;align-items:center;gap:8px;border:0;background:none;padding:2px 0;color:var(--ink);font-size:12px;cursor:pointer}
.kpi-switch-track{position:relative;width:30px;height:16px;border-radius:8px;background:var(--track);transition:background .15s}
.kpi-switch-thumb{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--surface);box-shadow:0 1px 2px rgba(var(--shadow-rgb),.25);transition:left .15s}
.kpi-switch[aria-checked="true"] .kpi-switch-track{background:var(--primary)}
.kpi-switch[aria-checked="true"] .kpi-switch-thumb{left:16px}
.kpi-switch:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
.kpi-toolbar-note{color:var(--muted);font-size:11px}
.kpi-subgoals{display:flex;flex-direction:column;gap:6px;margin-top:10px;padding-top:8px;border-top:1px dashed var(--line)}
.kpi-sub-row{display:flex;flex-direction:column;gap:3px;min-width:0}
.kpi-sub-line,.kpi-sub-bar{display:flex;align-items:center;flex-wrap:wrap;gap:2px 8px;min-width:0}
.kpi-sub-name{font-size:11px;font-weight:600;color:var(--ink);white-space:nowrap}
.kpi-sub-amount{margin-left:auto;font-size:11px;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.kpi-sub-amount b{color:var(--primary);font-weight:600}
.kpi-content .kpi-sub-bar .progress-track{flex:1 1 120px;min-width:96px;margin-top:0}
.kpi-sub-pct{font-size:11px;font-weight:600;color:var(--primary);white-space:nowrap;font-variant-numeric:tabular-nums}
.kpi-sub-flag{font-size:10px;color:var(--muted);white-space:nowrap}
```

- [ ] **Step 7: 跑测试**

```bash
node --test scripts/test-ops-kpi-subgoals.cjs
node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs
```

Expected: AC1–AC5、AC7 全部 PASS；AC6 窄屏（≤760）可能仍有「不截断 / 同行等高 / 新增块不压住子目标」FAIL，交 Task 5。

- [ ] **Step 8: 本地提交**

```bash
git add public/operations-dashboard-202610/index.html
git commit -m "feat(运营看板202610): 四 KPI 三行演示子目标与「显示子目标」开关"
```

---

### Task 5: 同行等高、不截断、窄屏重排（AC6）

**Files:**
- Modify: `public/operations-dashboard-202610/index.html`（`syncPeerRows` 内 `minContentWidth`，约 947-964 行；必要时 `<style>` 末尾）

**Interfaces:**
- Consumes: Task 4 的 `.kpi-sub-name / .kpi-sub-amount / .kpi-sub-pct`。
- Produces: 无新接口。

- [ ] **Step 1: 子行纳入最小列宽**——把 `minContentWidth` 的返回逻辑改为「主区（含右上新增块）与子行各自求宽取大」，避免子行被挤到省略或溢出时还保持 2 列：

```js
      let sub=0;
      el.querySelectorAll('.kpi-sub-name, .kpi-sub-amount, .kpi-sub-pct').forEach(n=>{sub=Math.max(sub,textWidth(n));});
      const icon=el.querySelector(':scope > .mini-icon, :scope > .kpi-icon');
      const iconW=icon?icon.getBoundingClientRect().width:0;
      const gap=icon?(parseFloat(cs.columnGap||cs.gap)||8):0;
      const delta=el.querySelector(':scope > .kpi-delta');
      const deltaW=delta?delta.getBoundingClientRect().width+8:0;
      return Math.ceil(Math.max(text+deltaW,sub)+iconW+gap+pad+border+2);
```

（替换原 `const icon=…` 至 `return Math.ceil(text+iconW+gap+deltaW+pad+border+2);` 这 6 行；`sub` 为 0 时结果与原式相同，关态行为不变。）

- [ ] **Step 2: 跑探针看 AC6**

Run: `node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs`
Expected: 全部 PASS。若仍有「新增块不压住子目标」FAIL（右上 `.kpi-delta` 为绝对定位），在 `<style>` 末尾追加并重跑：

```css
.kpi-subgoals{clear:both;position:relative;z-index:1}
.kpi-card:has(.kpi-subgoals) .kpi-content{justify-content:flex-start}
```

若仍压住，说明 `.kpi-delta` 底边低于主条：改为给 `.kpi-subgoals` 加 `margin-top:max(10px, calc(var(--kpi-delta-bottom,0px) - var(--kpi-sub-top,0px)))` 之类的方案前，**先停下记录现象并回报**，不擅自改动新增块位置（新增块文案与位置属 AC7 不回退范围）。

- [ ] **Step 3: 逐档人工看截图**——打开 `kpi-on-1440/1280/1024/760/520/312.png`、`kpi-on-SAS170.png`、`kpi-on-SAS530.png`，确认无省略号、无重叠、同行等高。

- [ ] **Step 4: 本地提交**

```bash
git add public/operations-dashboard-202610/index.html docs/evidence/2026-11-09-ops-kpi-subgoals/
git commit -m "fix(运营看板202610): 子目标行纳入同行最小列宽，展开/收起/窄屏按新行拉齐"
```

---

### Task 6: 壳层探针与回归（AC3、AC6 壳层；11-06 不回退）

**Files:**
- Create: `docs/evidence/2026-11-09-ops-kpi-subgoals/shell-probe.cjs`

- [ ] **Step 1: 起 dev server（tmux）**

```bash
SESSION_NAME="ops-dev-server"; tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION_NAME" 2>/dev/null || tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION_NAME" -c "$PWD" -- "${SHELL:-bash}" -l
tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION_NAME:0.0" 'npm run dev' C-m
# 等待：curl -sf http://127.0.0.1:3000/operations-dashboard-202610/board >/dev/null && echo up
```

- [ ] **Step 2: 写壳层探针**

```js
/**
 * 四 KPI 子目标 · Board 壳层探针（实现证据，非验收关账）
 * 前置：npm run dev（127.0.0.1:3000）
 * 运行：node docs/evidence/2026-11-09-ops-kpi-subgoals/shell-probe.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = __dirname;
const URL = 'http://127.0.0.1:3000/operations-dashboard-202610/board';
const UNITS = ['全部板块', 'SAS170 PMC板块', 'SAS610 咨询板块', 'SAS680 数字技术板块', 'SAS650 新材料板块',
  'SAS710 生命科学板块', 'SAS690 COII板块', 'SAS720 模块化板块', 'SAS670 供应链板块',
  'SAS520 金山中心', 'SAS560 沈阳中心', 'SAS550 惠湛中心', 'SAS530 银川中心'];
const results = [];
const fails = [];
const check = (ok, name, detail) => { const r = { name, ok: !!ok, detail: detail ?? null }; results.push(r); if (!ok) fails.push(r); console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (!ok && detail != null ? '  ' + JSON.stringify(detail) : '')); };

const opsFrame = page => page.frames().find(f => /operations-dashboard-202610\/index\.html/.test(f.url()));
async function ready(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('iframe')].some(f => /index\.html/.test(f.src)));
  const f = opsFrame(page);
  await f.waitForFunction(() => document.body.dataset.ready === 'true' && document.getElementById('kpiSubgoalSwitch'));
  return f;
}
async function pickUnit(page, frame, unit) {
  await page.click('[data-testid="shell-unit-select"]');
  await page.click(`.ant-select-item-option[title="${unit}"]`);
  await frame.waitForFunction(u => window.dashboard.state.unit === u, unit);
  await page.waitForTimeout(120);
}
const measure = frame => frame.evaluate(() => {
  const cards = [...document.querySelectorAll('#kpiGrid > .kpi-card')];
  const rows = new Map();
  cards.forEach(c => { const r = c.getBoundingClientRect(); const k = Math.round(r.top); if (!rows.has(k)) rows.set(k, []); rows.get(k).push(r.height); });
  return {
    checked: document.getElementById('kpiSubgoalSwitch').getAttribute('aria-checked'),
    subRows: cards.map(c => c.querySelectorAll('.kpi-sub-row').length),
    peer: [...rows.values()].map(hs => Math.max(...hs) - Math.min(...hs)),
    overflow: cards.filter(c => c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1).map(c => c.dataset.kpi),
    pair: getComputedStyle(document.getElementById('pairRow')).display,
  };
});

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  let frame = await ready(page);
  let m = await measure(frame);
  check(m.checked === 'false' && m.subRows.every(n => n === 0), '壳 进入页面开关为关', m);
  await frame.click('#kpiSubgoalSwitch');
  for (const unit of UNITS) {
    await pickUnit(page, frame, unit);
    m = await measure(frame);
    check(m.checked === 'true' && m.subRows.every(n => n === 3), `壳 ${unit} 开关保持且三行齐全`, m);
    check(m.peer.every(d => d <= 1) && m.overflow.length === 0, `壳 ${unit} 同行等高无溢出`, m);
    if (unit !== '全部板块') check(m.pair === 'none', `壳 ${unit} 成对模块整块隐藏`, m.pair);
  }
  await pickUnit(page, frame, '全部板块');
  for (const w of [1440, 1024, 760]) {
    await page.setViewportSize({ width: w, height: 1000 });
    await page.waitForTimeout(250);
    m = await measure(frame);
    check(m.peer.every(d => d <= 1) && m.overflow.length === 0, `壳 视口 ${w} 展开同行等高无溢出`, m);
    await page.screenshot({ path: path.join(OUT, `shell-on-${w}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload({ waitUntil: 'networkidle' });
  frame = await ready(page);
  m = await measure(frame);
  check(m.checked === 'false' && m.subRows.every(n => n === 0), '壳 刷新后恢复为关', m);
  await browser.close();
  const verdict = fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'shell-probe-result.json'), JSON.stringify({ url: URL, verdict, fails, results }, null, 2));
  console.log('verdict=' + verdict);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
```

- [ ] **Step 3: 运行全部验证**

```bash
node --test scripts/test-ops-kpi-subgoals.cjs                                  # 期望 pass 10 / fail 0
node docs/evidence/2026-11-09-ops-kpi-subgoals/probe.cjs                       # 期望 verdict=PASS
node docs/evidence/2026-11-09-ops-kpi-subgoals/shell-probe.cjs                 # 期望 verdict=PASS
node docs/evidence/2026-11-06-ops-board-peer-row-height/probe.cjs              # 回归：期望与 Task 0 基线一致
node docs/evidence/2026-11-06-ops-board-peer-row-height/shell-probe.cjs        # 回归：dev server 下运行
git checkout -- docs/evidence/2026-11-06-ops-board-peer-row-height/            # 还原他条证据产物
node scripts/test-yinchuan-ui.cjs                                              # 无关回归，期望不变
```

若 11-06 探针因新增 `#kpiToolbar` 改变「主栏首个子元素/间距」而失败：**不改 11-06 证据文件**，在 `实现证据.md` 记录失败项与原因并回报。

- [ ] **Step 4: 范围自检**

```bash
git diff --stat main...HEAD
git diff main...HEAD -- public/operations-dashboard-202610/index.html | grep -nE '^\+.*(Highcharts\.(chart|setOptions)|series|localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest|businesses|业务类型)'
```

Expected: 改动文件只在「文件结构」表内；第二条无输出（`DEMO_SUBGOAL_WEIGHTS` 注释里提到 `DEMO_DATA.businesses` 的那一行除外，人工确认是声明「不来自」）。

- [ ] **Step 5: 本地提交**

```bash
git add docs/evidence/2026-11-09-ops-kpi-subgoals/
git commit -m "test(运营看板202610): 四 KPI 子目标壳层探针与回归结果"
```

---

### Task 7: 实现证据、代码审查、收尾（不 push）

**Files:**
- Create: `docs/evidence/2026-11-09-ops-kpi-subgoals/实现证据.md`

- [ ] **Step 1: 写实现证据**（按 `docs/evidence/2026-11-06-ops-board-peer-row-height/实现证据.md` 体例）：日期、角色=实现（非验收关账）、基线 SHA、对照需求正文与账本条（状态仍「已确认」）、改了什么、怎么验（上列命令与 verdict）、尺寸要点、Task 0 基线与回归对比、演示权重值并注明「仅演示、非业务默认」、截图清单、未做事项（不接 API、不改 Highcharts、不加业务类型筛选、不扩子新增/弹窗、不关 11-06 条）。

- [ ] **Step 2: 代码审查**——使用 `requesting-code-review` 技能，派一个只读审查子代理，输入：需求正文、本计划、`git diff main...HEAD`。审查清单：
  1. 七项 AC 逐条对照，指出无测试覆盖的分支；
  2. 余数算法是否只用 BigInt 精确比较、平手顺序、完成/目标分开；
  3. 拆分基准是否为 `money()` 展示串；
  4. 无持久化、无网络、无 Highcharts/业务类型改动；
  5. 测试例数字只在测试/探针；
  6. CSS 无 `text-overflow:ellipsis` 作用到子行、颜色只用主题变量；
  7. 11-06 同行等高逻辑关态行为不变。
  按 `receiving-code-review` 技能逐条核实后修复，修复后重跑 Task 6 Step 3 全部命令。

- [ ] **Step 3: 完成前验证**——按 `verification-before-completion` 技能，贴出 Task 6 Step 3 的实际输出再下结论；不得写「验收通过」，只写「实现完成、实现侧探针 PASS，待验收角色复验」。

- [ ] **Step 4: 本地提交**

```bash
git add docs/evidence/2026-11-09-ops-kpi-subgoals/实现证据.md
git commit -m "docs(evidence): 四 KPI 子目标与 12 段进度条实现证据（非验收）"
```

- [ ] **Step 5: 停下回报**——不 push、不建/改 PR、不改账本状态；回报分支、本地 SHA、命令输出摘要、未结与风险，请协调侧决定账本状态（如「实现中/待验收」）由需求角色更新。

---

## main 更新时的处理

实施开始与结束各 `git fetch origin main` 一次。若 `origin/main` ≠ `232cadf`：

1. `git log --oneline 232cadf..origin/main` 与 `git diff 232cadf origin/main --stat`，确认是否碰 `docs/变更账本.md`、`public/operations-dashboard-202610/index.html`、需求正文。
2. 账本：不得用本分支整本覆盖。`git rebase origin/main`；若账本冲突，只保留远端全部内容并把本条（`### 2026-11-09 —— 运营看板顶部四 KPI 子目标与 12 段进度条（设计草稿）` 整段 17 行）精确追加在末尾；正文文件为新增文件，不会冲突。
3. `index.html` 若被他人改动（例如 PR #9 之后的同行等高返工），先停下回报，不强行合并。

## 风险与注意

- `.kpi-card{overflow:hidden}`：溢出会被静默裁掉，必须靠探针「卡内无溢出 / 文字在卡内」兜住。
- `.kpi-delta` 绝对定位在右上：子行若上移可能被压，探针有专项检查。
- `占总目标` 从「未取整原值比例、1 位」改为「展示整数比例、2 位」，数值末位可能与旧截图不同，这是需求正文要求的同口径，不是回退。
- 新增 `kpi-subgoals.js` 是单文件原型外的第二个静态文件；`completed-contract.html`、`org-entry.html` 不引用它。
- `<b></b>` ×12 刻度：极窄轨道（< 96px）时刻度线 1px 会显得密，已用 `min-width:96px` 限制子条。

## 自检记录

- 覆盖：需求正文「对象 / 合计 / 最小单位与余数 / 演示权重 / 比例轨道超额 / 异常 / 界面 / 系统边界 / 数据关系 / 验收 1–7」均有对应 Task 与测试（见映射表）。
- 占位扫描：无 TBD/TODO；Task 5 Step 2 的兜底 CSS 为条件分支，给出了完整代码与「停下回报」条件。
- 命名一致：`KS`、`DEMO_SUBGOAL_WEIGHTS`、`state.showSubgoals`、`#kpiSubgoalSwitch`、`#kpiToolbar`、`.seg12*`、`.kpi-sub-*` 在各 Task 中一致。
