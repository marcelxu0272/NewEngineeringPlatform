const { chromium } = require("playwright");
const path = require("path");
const OUT = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-blank-fix");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto("http://127.0.0.1:3001/operations-dashboard-202610/completed-contract.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT, "panel-tree-only.png") });
  await page.locator('section[aria-label="项目预警一览"]').screenshot({ path: path.join(OUT, "panel-alert-only.png") });
  const meta = await page.evaluate(() => {
    const te = document.getElementById("treeEmpty");
    const ae = document.getElementById("alertEmpty");
    const tc = document.getElementById("treeChart");
    const ac = document.getElementById("alertChart");
    return {
      bodyHasEmptyText: document.body.innerText.includes("未发现异常"),
      treeEmptyOffsetParentNull: te.offsetParent === null,
      alertEmptyOffsetParentNull: ae.offsetParent === null,
      treeEmptyH: te.getBoundingClientRect().height,
      alertEmptyH: ae.getBoundingClientRect().height,
      treeChartH: tc.getBoundingClientRect().height,
      alertChartH: ac.getBoundingClientRect().height,
      treePanelH: document.querySelector('section[aria-label="本月完成合同额情况"]').getBoundingClientRect().height,
      alertPanelH: document.querySelector('section[aria-label="项目预警一览"]').getBoundingClientRect().height,
      treeEmptyDisplay: getComputedStyle(te).display,
      alertEmptyDisplay: getComputedStyle(ae).display,
    };
  });
  console.log(JSON.stringify(meta, null, 2));
  await browser.close();
})();