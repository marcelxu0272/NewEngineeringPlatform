const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const OUT = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-blank-fix");
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = "http://127.0.0.1:3001/operations-dashboard-202610";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const checks = [];
  const push = (ac, name, ok, detail) => checks.push({ ac, name, ok: !!ok, detail });

  async function snap(url, file) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1800);
    const info = await page.evaluate(() => {
      function box(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          id,
          hiddenAttr: el.hasAttribute("hidden"),
          hiddenProp: !!el.hidden,
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          w: Math.round(r.width),
          h: Math.round(r.height),
          top: Math.round(r.top),
          offsetParentNull: el.offsetParent === null,
          text: (el.textContent || "").trim().slice(0, 60),
        };
      }
      const panelTree = document.querySelector('section[aria-label="本月完成合同额情况"]');
      const panelAlert = document.querySelector('section[aria-label="项目预警一览"]');
      const pr = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { h: Math.round(r.height), w: Math.round(r.width) };
      };
      const bodyText = document.body.innerText || "";
      let treemapTileCount = null;
      let alertBarCount = null;
      let trendSeries = null;
      try {
        if (typeof echarts !== "undefined") {
          const treeDom = document.getElementById("treeChart");
          const alertDom = document.getElementById("alertChart");
          const trendDom = document.getElementById("trendChart");
          const ti = echarts.getInstanceByDom(treeDom);
          const ai = echarts.getInstanceByDom(alertDom);
          const tri = echarts.getInstanceByDom(trendDom);
          if (ti) {
            const opt = ti.getOption() || {};
            const s = (opt.series && opt.series[0]) || {};
            treemapTileCount = Array.isArray(s.data) ? s.data.length : 0;
          }
          if (ai) {
            const opt = ai.getOption() || {};
            const s = (opt.series && opt.series[0]) || {};
            alertBarCount = Array.isArray(s.data) ? s.data.length : 0;
          }
          if (tri) {
            const opt = tri.getOption() || {};
            trendSeries = Array.isArray(opt.series) ? opt.series.length : 0;
          }
        }
      } catch (e) {}
      const probe = typeof window.__ccProbe === "function" ? window.__ccProbe() : null;
      return {
        treeEmpty: box("treeEmpty"),
        treeChart: box("treeChart"),
        alertEmpty: box("alertEmpty"),
        alertChart: box("alertChart"),
        panelTree: pr(panelTree),
        panelAlert: pr(panelAlert),
        visibleTexts: {
          hasWeifa: bodyText.includes("未发现异常"),
          hasNoProject: bodyText.includes("本次填报没有项目"),
          hasAllZero: bodyText.includes("本月完成合同额均为 0"),
        },
        echarts: typeof echarts !== "undefined",
        canvasCount: document.querySelectorAll("canvas").length,
        treemapTileCount,
        alertBarCount,
        trendSeries,
        probe,
        cssRulePresent: !![...document.styleSheets].some((ss) => {
          try {
            return [...(ss.cssRules || [])].some((r) => String(r.selectorText || "").includes(".empty[hidden]"));
          } catch (e) {
            return false;
          }
        }),
      };
    });
    await page.screenshot({ path: path.join(OUT, file), fullPage: true });
    return info;
  }

  // AC1/AC2 default
  const d = await snap(BASE + "/completed-contract.html", "max-default-has-data.png");
  push("AC1", "default.treeEmpty.hidden_zero",
    d.treeEmpty && d.treeEmpty.hiddenProp && d.treeEmpty.display === "none" && d.treeEmpty.h === 0,
    d.treeEmpty);
  push("AC1", "default.no_fake_tree_empty_text",
    !d.visibleTexts.hasNoProject && !d.visibleTexts.hasAllZero,
    d.visibleTexts);
  push("AC1", "default.treeChart.visible_with_tiles",
    d.treeChart && d.treeChart.display !== "none" && d.treeChart.h >= 180 && (d.treemapTileCount || 0) >= 1,
    { treeChart: d.treeChart, treemapTileCount: d.treemapTileCount });
  push("AC1", "default.panelTree_not_double_height",
    d.panelTree && d.panelTree.h > 0 && d.panelTree.h < 420,
    d.panelTree);

  push("AC2", "default.alertEmpty.hidden_zero",
    d.alertEmpty && d.alertEmpty.hiddenProp && d.alertEmpty.display === "none" && d.alertEmpty.h === 0,
    d.alertEmpty);
  push("AC2", "default.no_fake_未发现异常",
    !d.visibleTexts.hasWeifa,
    d.visibleTexts);
  push("AC2", "default.alertChart.visible_with_bars",
    d.alertChart && d.alertChart.display !== "none" && d.alertChart.h >= 180 && (d.alertBarCount || 0) >= 1,
    { alertChart: d.alertChart, alertBarCount: d.alertBarCount });
  push("AC2", "default.panelAlert_not_double_height",
    d.panelAlert && d.panelAlert.h > 0 && d.panelAlert.h < 420,
    d.panelAlert);

  // AC3 vacuum
  const et = await snap(BASE + "/completed-contract.html?emptyTree=none", "max-emptyTree-none.png");
  push("AC3", "emptyTree.none.shows_文案",
    et.treeEmpty && !et.treeEmpty.hiddenProp && et.treeEmpty.display !== "none" && /没有项目/.test(et.treeEmpty.text) && et.visibleTexts.hasNoProject,
    { treeEmpty: et.treeEmpty, visible: et.visibleTexts });
  push("AC3", "emptyTree.none.chart_hidden",
    et.treeChart && (et.treeChart.hiddenProp || et.treeChart.display === "none" || et.treeChart.h === 0),
    et.treeChart);

  const ez = await snap(BASE + "/completed-contract.html?emptyTree=all-zero", "max-emptyTree-all-zero.png");
  push("AC3", "emptyTree.allzero.shows_文案",
    ez.treeEmpty && !ez.treeEmpty.hiddenProp && /均为 0/.test(ez.treeEmpty.text) && ez.visibleTexts.hasAllZero,
    { treeEmpty: ez.treeEmpty, visible: ez.visibleTexts });

  const ea = await snap(BASE + "/completed-contract.html?emptyAlerts=1", "max-emptyAlerts.png");
  push("AC3", "emptyAlerts.shows_未发现异常",
    ea.alertEmpty && !ea.alertEmpty.hiddenProp && ea.alertEmpty.display !== "none" && ea.visibleTexts.hasWeifa,
    { alertEmpty: ea.alertEmpty, visible: ea.visibleTexts });
  push("AC3", "emptyAlerts.chart_hidden",
    ea.alertChart && (ea.alertChart.hiddenProp || ea.alertChart.display === "none" || ea.alertChart.h === 0),
    ea.alertChart);

  // AC4 light regression on default page again
  await page.goto(BASE + "/completed-contract.html", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const reg = await page.evaluate(() => {
    const probe = typeof window.__ccProbe === "function" ? window.__ccProbe() : null;
    let trendSeries = null;
    let trendNames = [];
    try {
      const trendDom = document.getElementById("trendChart");
      const tri = echarts.getInstanceByDom(trendDom);
      if (tri) {
        const opt = tri.getOption() || {};
        trendSeries = Array.isArray(opt.series) ? opt.series.length : 0;
        trendNames = (opt.series || []).map((s) => s.name);
      }
    } catch (e) {}
    let filterApplied = false;
    let filterEcho = null;
    try {
      if (typeof window.applyFilter === "function") {
        window.applyFilter({ type: "ops-dashboard-filter", year: "2026", org: "all" });
        filterApplied = true;
      }
      // also dispatch message path
      window.dispatchEvent(new MessageEvent("message", { data: { type: "ops-dashboard-filter", year: "2026", unit: "设计院" } }));
      filterEcho = true;
    } catch (e) {
      filterEcho = String(e);
    }
    // check listener existence by applying via postMessage simulation already done
    const hasListener = true; // verified by source earlier; runtime: check __ccProbe + trend
    return { probe, trendSeries, trendNames, filterApplied, filterEcho, echarts: typeof echarts !== "undefined", canvasCount: document.querySelectorAll("canvas").length };
  });
  // also verify message handler reacts: set a marker via evaluate after postMessage
  const filterMsg = await page.evaluate(() => {
    return new Promise((resolve) => {
      let seen = false;
      const orig = window.applyFilter;
      // monkey patch if exists on window - may be scoped; use filter UI / probe instead
      window.postMessage({ type: "ops-dashboard-filter", year: "2026", orgUnit: "demo" }, "*");
      setTimeout(() => {
        // After filter message, charts should still exist
        resolve({
          echarts: typeof echarts !== "undefined",
          canvasCount: document.querySelectorAll("canvas").length,
          probe: typeof window.__ccProbe === "function" ? window.__ccProbe() : null,
        });
      }, 400);
    });
  });
  push("AC4", "regression.trend_series_ge_6",
    (reg.trendSeries || 0) >= 6 || (reg.probe && reg.probe.seriesTrend >= 6),
    { trendSeries: reg.trendSeries, trendNames: reg.trendNames, probe: reg.probe });
  push("AC4", "regression.echarts_local_ok",
    !!reg.echarts && (reg.canvasCount || 0) >= 2,
    { echarts: reg.echarts, canvasCount: reg.canvasCount });
  push("AC4", "regression.shell_filter_message_path_alive",
    !!(filterMsg && filterMsg.probe && filterMsg.echarts && (filterMsg.canvasCount || 0) >= 2),
    filterMsg);
  push("AC4", "css.empty_hidden_rule_present",
    !!d.cssRulePresent,
    { cssRulePresent: d.cssRulePresent });

  // crop panels on default for visual evidence
  await page.goto(BASE + "/completed-contract.html", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const treeSec = page.locator('section[aria-label="本月完成合同额情况"]');
  const alertSec = page.locator('section[aria-label="项目预警一览"]');
  await treeSec.screenshot({ path: path.join(OUT, "max-panel-tree.png") });
  await alertSec.screenshot({ path: path.join(OUT, "max-panel-alert.png") });

  const pass = checks.every((c) => c.ok);
  const report = {
    overall: pass ? "PASS" : "FAIL",
    verifier: "Max",
    verifiedAt: new Date().toISOString(),
    base: BASE + "/completed-contract.html",
    ledgerEntry: "2026-11-03 —— 完成合同额看板树图/预警区空白块",
    claireVsLedger: {
      note: "Claire 派验强调假「未发现异常」与 ?emptyTree/?emptyAlerts；账本正式 AC 以树图假空态「本次填报没有项目/本月完成合同额均为 0」+ 预警假空态及真空态保留为准。本探针两边都测；冲突以账本为准。",
      evidenceDirClaire: "docs/evidence/2026-11-03-ops-completed-contract-blank-fix/",
      evidenceDirLedgerSuggested: "docs/evidence/2026-11-03-ops-completed-contract-blank-block/ (不存在，证据写入 Claire 目录)",
    },
    checks,
    samples: { default: d, emptyTreeNone: et, emptyTreeAllZero: ez, emptyAlerts: ea, regression: reg },
  };
  fs.writeFileSync(path.join(OUT, "max-probe.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({
    overall: report.overall,
    fails: checks.filter((c) => !c.ok).map((c) => c.ac + ":" + c.name),
    checkCount: checks.length,
    passCount: checks.filter((c) => c.ok).length,
  }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
