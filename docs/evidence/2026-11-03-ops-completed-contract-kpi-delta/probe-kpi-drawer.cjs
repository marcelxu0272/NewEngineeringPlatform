const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
(async () => {
  const OUT = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-kpi-delta");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://127.0.0.1:3001/operations-dashboard-202610/completed-contract.html", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    function rect(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const main = el.closest(".kpi-main-row")?.querySelector(".kpi-main");
      const mr = main ? main.getBoundingClientRect() : null;
      return {
        text: (el.textContent || "").trim(),
        top: Math.round(r.top),
        left: Math.round(r.left),
        mainTop: mr ? Math.round(mr.top) : null,
        mainRight: mr ? Math.round(mr.right) : null,
        sameRow: mr ? Math.abs(r.top - mr.top) < 12 : false,
        toRight: mr ? r.left >= mr.right - 4 : false,
      };
    }
    return {
      completion: rect("kpiCompletionDelta"),
      stockContract: rect("kpiStockContractDelta"),
      stockInvoice: rect("kpiStockInvoiceDelta"),
      hasJiaoShangYiQi: document.body.innerText.includes("较上一期"),
      hasJiaoShangQi: (document.body.innerText.match(/较上期/g) || []).length,
      hasDrawer: !!document.getElementById("drawer"),
      hasModal: !!document.getElementById("modal"),
      hasMore: Array.from(document.querySelectorAll("button")).some((b) => /更多/.test(b.textContent || "")),
      hasChakan: document.body.innerText.includes("查看"),
      treeEmptyH: document.getElementById("treeEmpty")?.getBoundingClientRect().height || 0,
      alertEmptyH: document.getElementById("alertEmpty")?.getBoundingClientRect().height || 0,
      alertEmptyDisplay: getComputedStyle(document.getElementById("alertEmpty")).display,
      canvasCount: document.querySelectorAll("canvas").length,
      echarts: typeof echarts !== "undefined",
    };
  });
  await page.locator("section.kpi-card").screenshot({ path: path.join(OUT, "kpi-delta-inline.png") });
  await page.screenshot({ path: path.join(OUT, "full-default.png"), fullPage: true });
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
  add("completion.较上期", info.completion && /^较上期 /.test(info.completion.text), info.completion);
  add("completion.sameRowRight", info.completion && info.completion.sameRow && info.completion.toRight, info.completion);
  add("stockContract.较上期", info.stockContract && /^较上期 /.test(info.stockContract.text), info.stockContract);
  add("stockContract.sameRowRight", info.stockContract && info.stockContract.sameRow && info.stockContract.toRight, info.stockContract);
  add("stockInvoice.较上期", info.stockInvoice && /^较上期 /.test(info.stockInvoice.text), info.stockInvoice);
  add("stockInvoice.sameRowRight", info.stockInvoice && info.stockInvoice.sameRow && info.stockInvoice.toRight, info.stockInvoice);
  add("no.较上一期", !info.hasJiaoShangYiQi, info.hasJiaoShangYiQi);
  add("no.drawer", !info.hasDrawer, info.hasDrawer);
  add("no.modal", !info.hasModal, info.hasModal);
  add("no.更多", !info.hasMore, info.hasMore);
  add("no.查看", !info.hasChakan, info.hasChakan);
  add("blankFix.still", info.treeEmptyH === 0 && info.alertEmptyDisplay === "none", { treeEmptyH: info.treeEmptyH, alertEmptyDisplay: info.alertEmptyDisplay });
  add("charts.alive", info.echarts && info.canvasCount >= 2, { canvasCount: info.canvasCount });
  const pass = checks.every((c) => c.ok);
  fs.writeFileSync(path.join(OUT, "probe.json"), JSON.stringify({ pass, checks, info }, null, 2), "utf8");
  const readme = `# 完成合同额看板 · KPI「较上期」旁置 + 去抽屉/弹层\n\n- 日期：2026-11-03（Asia/Shanghai）\n- 文件：\`public/operations-dashboard-202610/completed-contract.html\`\n- 入库：暂缓（勿 commit）\n- 保留：空白返工 \`.empty[hidden]\`\n\n## AC\n\n1. 完成合同额 / 存量合同额 / 存量开票额：主金额右侧「较上期 ±xx 万」\n2. 无 Drawer、无 modal、无「更多」、无「查看」、图表 click 不钻取\n\n## 自检\n\nPlaywright probe：\`${pass ? "PASS" : "FAIL"}\`（见 probe.json）\n\n## 截图\n\n- kpi-delta-inline.png\n- full-default.png\n`;
  fs.writeFileSync(path.join(OUT, "README.md"), readme, "utf8");
  console.log(JSON.stringify({ pass, fails: checks.filter((c) => !c.ok).map((c) => c.name), 较上期: info.hasJiaoShangQi }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });