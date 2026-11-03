const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const OUT = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-blank-fix");
  fs.mkdirSync(OUT, { recursive: true });
  const BASE = "http://127.0.0.1:3001/operations-dashboard-202610";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  async function measure(url, tag) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      function box(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          id,
          hiddenAttr: el.hasAttribute("hidden"),
          hiddenProp: el.hidden,
          display: cs.display,
          visibility: cs.visibility,
          w: Math.round(r.width),
          h: Math.round(r.height),
          top: Math.round(r.top),
          text: (el.textContent || "").trim().slice(0, 40),
        };
      }
      const treeEmpty = box("treeEmpty");
      const treeChart = box("treeChart");
      const alertEmpty = box("alertEmpty");
      const alertChart = box("alertChart");
      const panelTree = document.querySelector('section[aria-label="本月完成合同额情况"]');
      const panelAlert = document.querySelector('section[aria-label="项目预警一览"]');
      const pr = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { h: Math.round(r.height), w: Math.round(r.width) };
      };
      return {
        treeEmpty,
        treeChart,
        alertEmpty,
        alertChart,
        panelTree: pr(panelTree),
        panelAlert: pr(panelAlert),
        hasWeifa: document.body.innerText.includes("未发现异常"),
        echarts: typeof echarts !== "undefined",
        canvasCount: document.querySelectorAll("canvas").length,
      };
    });
    await page.screenshot({ path: path.join(OUT, tag + ".png"), fullPage: true });
    return info;
  }

  const results = {};
  results.default = await measure(BASE + "/completed-contract.html", "default-has-data");
  results.emptyTreeNone = await measure(BASE + "/completed-contract.html?emptyTree=none", "emptyTree-none");
  results.emptyTreeAllZero = await measure(BASE + "/completed-contract.html?emptyTree=all-zero", "emptyTree-all-zero");
  results.emptyAlerts = await measure(BASE + "/completed-contract.html?emptyAlerts=1", "emptyAlerts");

  // Assertions for default (has data)
  const d = results.default;
  const checks = [];
  function check(name, ok, detail) {
    checks.push({ name, ok: !!ok, detail });
  }
  check("default.treeEmpty.hidden", d.treeEmpty && d.treeEmpty.hiddenProp && d.treeEmpty.display === "none" && d.treeEmpty.h === 0, d.treeEmpty);
  check("default.alertEmpty.hidden", d.alertEmpty && d.alertEmpty.hiddenProp && d.alertEmpty.display === "none" && d.alertEmpty.h === 0, d.alertEmpty);
  check("default.no_未发现异常", !d.hasWeifa, { hasWeifa: d.hasWeifa });
  check("default.treeChart.visible", d.treeChart && d.treeChart.display !== "none" && d.treeChart.h >= 180, d.treeChart);
  check("default.alertChart.visible", d.alertChart && d.alertChart.display !== "none" && d.alertChart.h >= 180, d.alertChart);
  check("default.canvases", d.canvasCount >= 2, { canvasCount: d.canvasCount });

  // Empty demos still show empty
  const et = results.emptyTreeNone;
  check("emptyTree.none.shows", et.treeEmpty && !et.treeEmpty.hiddenProp && et.treeEmpty.display !== "none" && /没有项目/.test(et.treeEmpty.text), et.treeEmpty);
  check("emptyTree.none.chartHidden", et.treeChart && (et.treeChart.display === "none" || et.treeChart.h === 0), et.treeChart);

  const ez = results.emptyTreeAllZero;
  check("emptyTree.allzero.shows", ez.treeEmpty && !ez.treeEmpty.hiddenProp && /均为 0/.test(ez.treeEmpty.text), ez.treeEmpty);

  const ea = results.emptyAlerts;
  check("emptyAlerts.shows", ea.alertEmpty && !ea.alertEmpty.hiddenProp && ea.hasWeifa && ea.alertEmpty.display !== "none", ea.alertEmpty);
  check("emptyAlerts.chartHidden", ea.alertChart && (ea.alertChart.display === "none" || ea.alertChart.h === 0), ea.alertChart);

  const pass = checks.every((c) => c.ok);
  const report = { pass, checks, results };
  fs.writeFileSync(path.join(OUT, "probe.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ pass, fails: checks.filter((c) => !c.ok).map((c) => c.name), checkCount: checks.length }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});