const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
(async () => {
  const OUT = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-tooltip-all");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto("http://127.0.0.1:3001/operations-dashboard-202610/completed-contract.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const report = await page.evaluate(() => {
    function tipMeta(id) {
      const el = document.getElementById(id);
      const inst = echarts.getInstanceByDom(el);
      const t = (inst.getOption().tooltip || [])[0] || inst.getOption().tooltip;
      return { confine: !!t.confine, hasFormatter: typeof t.formatter === "function", extra: t.extraCssText || "", hasMax: /max-width/i.test(t.extraCssText||""), hasRadius: /border-radius/i.test(t.extraCssText||"") };
    }
    function runFmt(id, payload) {
      const inst = echarts.getInstanceByDom(document.getElementById(id));
      const t = (inst.getOption().tooltip || [])[0] || inst.getOption().tooltip;
      return String(t.formatter(payload) || "");
    }
    const treeData = ((echarts.getInstanceByDom(document.getElementById("treeChart")).getOption().series[0] || {}).data) || [];
    const treeHtml = runFmt("treeChart", { data: treeData[0] });
    const alertPoint = ((echarts.getInstanceByDom(document.getElementById("alertChart")).getOption().series[0] || {}).data || [])[0] || {};
    const alertHtml = runFmt("alertChart", [{ marker: "•", data: alertPoint, value: alertPoint.value, name: alertPoint.label }]);
    const names = ["完成合同额·当月","完成开票额·当月","完成回款额·当月","完成合同额·累计","完成开票额·累计","完成回款额·累计"];
    const trendHtml = runFmt("trendChart", names.map((seriesName, i) => ({ marker: "•", seriesName, value: 10+i, axisValueLabel: "4月" })));
    return {
      tree: tipMeta("treeChart"), alert: tipMeta("alertChart"), trend: tipMeta("trendChart"),
      treeOk: /本月完成合同额/.test(treeHtml) && /项目号/.test(treeHtml),
      alertOk: /条/.test(alertHtml),
      trendOk: names.every(n => trendHtml.includes(n)) && /万/.test(trendHtml),
      treeHtml: treeHtml.slice(0, 180), trendNames: names.filter(n => trendHtml.includes(n)).length,
      guards: {
        detail: Array.from(document.querySelectorAll("button")).filter(b => /查看明细/.test(b.textContent||"")).length,
        drawer: !!document.getElementById("drawer"),
        jiao: (document.body.innerText.match(/较上期/g)||[]).length,
        empty: getComputedStyle(document.getElementById("treeEmpty")).display,
        resize: typeof __ccResizeCharts === "function",
        noValueFormatter: !document.documentElement.innerHTML.includes("valueFormatter")
      }
    };
  });
  await page.mouse.move(200, 200);
  await page.locator("#treeChart").screenshot({ path: path.join(OUT, "tooltip-treemap.png") });
  await page.evaluate(() => echarts.getInstanceByDom(document.getElementById("alertChart")).dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: 2 }));
  await page.waitForTimeout(250);
  await page.locator("#alertChart").screenshot({ path: path.join(OUT, "tooltip-alert.png") });
  await page.evaluate(() => echarts.getInstanceByDom(document.getElementById("trendChart")).dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: 5 }));
  await page.waitForTimeout(250);
  await page.locator("#trendChart").screenshot({ path: path.join(OUT, "tooltip-trend.png") });

  const checks = [
    ["tree.meta", report.tree.confine && report.tree.hasFormatter && report.tree.hasMax && report.tree.hasRadius],
    ["alert.meta", report.alert.confine && report.alert.hasFormatter && report.alert.hasMax],
    ["trend.meta", report.trend.confine && report.trend.hasFormatter && report.trend.hasMax],
    ["tree.fmt", report.treeOk],
    ["alert.fmt", report.alertOk],
    ["trend.fmt", report.trendOk],
    ["guards", report.guards.detail===2 && !report.guards.drawer && report.guards.jiao===3 && report.guards.empty==="none" && report.guards.resize]
  ].map(([name, ok]) => ({ name, ok: !!ok }));
  const pass = checks.every(c => c.ok);
  fs.writeFileSync(path.join(OUT, "probe.json"), JSON.stringify({ pass, checks, report }, null, 2));
  fs.writeFileSync(path.join(OUT, "README.md"), `# 完成合同额看板 · 全页 ECharts tooltip 统一\n\n- 日期：2026-11-03（Asia/Shanghai）\n- 文件：\`public/operations-dashboard-202610/completed-contract.html\`\n- 勿 commit\n\n## 改了哪些 tooltip\n\n| Chart | 改动 |\n|-------|------|\n| treemap | \`tooltipBase\` confine/限宽 + 标签/值 flex 行 |\n| 预警 bar | 同上 + 类型标题/数量 |\n| 月度走势 | \`tooltipAxisFormatter\` 六系列名+万元 |\n\n公共：\`tooltipBase\` / \`tooltipRow\` / \`tooltipAxisFormatter\` / \`tooltipFmtNum\`\n\n保留：空白口径、KPI 较上期、两处查看明细 modal、treemap ResizeObserver\n\n## 自检\nprobe: **${pass ? "PASS" : "FAIL"}**（tree/alert/trend formatter + confine）\n`);
  console.log(JSON.stringify({ pass, fails: checks.filter(c => !c.ok).map(c => c.name), trendNames: report.trendNames }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });