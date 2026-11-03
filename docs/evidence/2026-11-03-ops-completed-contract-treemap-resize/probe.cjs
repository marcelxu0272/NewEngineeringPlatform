const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
(async () => {
  const OUT = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-treemap-resize");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.goto("http://127.0.0.1:3001/operations-dashboard-202610/completed-contract.html", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  async function treeMeasure() {
    return page.evaluate(() => {
      const el = document.getElementById("treeChart");
      const box = el.getBoundingClientRect();
      const canvas = el.querySelector("canvas");
      const cr = canvas.getBoundingClientRect();
      const inst = echarts.getInstanceByDom(el);
      return {
        boxW: Math.round(box.width), boxH: Math.round(box.height),
        canvasW: Math.round(cr.width), canvasH: Math.round(cr.height),
        instW: inst.getWidth(), instH: inst.getHeight(),
        fill: cr.width / box.width
      };
    });
  }

  const base = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT, "treemap-base-1280.png") });

  // widen only the tree panel container to simulate shell widen without media flip
  await page.evaluate(() => {
    const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
    const row = panel.parentElement;
    row.style.gridTemplateColumns = "1.6fr 0.6fr";
    if (window.__ccResizeCharts) window.__ccResizeCharts();
  });
  await page.waitForTimeout(700);
  const wide = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT, "treemap-wide-col.png") });

  // shrink tree column
  await page.evaluate(() => {
    const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
    panel.parentElement.style.gridTemplateColumns = "0.9fr 1.3fr";
    if (window.__ccResizeCharts) window.__ccResizeCharts();
  });
  await page.waitForTimeout(700);
  const narrow = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT, "treemap-narrow-col.png") });

  // restore
  await page.evaluate(() => {
    const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
    panel.parentElement.style.gridTemplateColumns = "";
    if (window.__ccResizeCharts) window.__ccResizeCharts();
  });
  await page.waitForTimeout(400);

  // modals
  await page.click("#btnTreeMore");
  await page.waitForTimeout(300);
  const modalTree = await page.evaluate(() => ({
    open: document.getElementById("modal").classList.contains("open"),
    title: document.getElementById("modalTitle").textContent,
    hasView: /查看/.test(document.querySelector("#modalTable").innerText || "")
  }));
  await page.screenshot({ path: path.join(OUT, "modal-tree-detail.png") });
  await page.click("#modalClose");
  await page.waitForTimeout(200);
  await page.click("#btnAlertMore");
  await page.waitForTimeout(300);
  const modalAlert = await page.evaluate(() => ({
    open: document.getElementById("modal").classList.contains("open"),
    title: document.getElementById("modalTitle").textContent,
    hasView: /查看/.test(document.querySelector("#modalTable").innerText || "")
  }));
  await page.screenshot({ path: path.join(OUT, "modal-alert-detail.png") });
  await page.click("#modalClose");

  // trend tooltip via dispatchAction + DOM read
  await page.evaluate(() => {
    const el = document.getElementById("trendChart");
    el.scrollIntoView();
    const inst = echarts.getInstanceByDom(el);
    inst.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: 3 });
  });
  await page.waitForTimeout(400);
  const tip = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("div")).filter(d => {
      const s = getComputedStyle(d);
      return s.position === "absolute" && d.innerText && d.innerText.includes("完成合同额·当月") && d.innerText.includes("万");
    });
    // echarts tooltip usually .innerHTML with markers
    const tipEl = document.querySelector(".echarts-tooltip") || nodes.sort((a,b) => b.innerText.length - a.innerText.length)[0];
    if (!tipEl) return { found: false };
    const r = tipEl.getBoundingClientRect();
    const text = tipEl.innerText || "";
    const names = ["完成合同额·当月","完成开票额·当月","完成回款额·当月","完成合同额·累计","完成开票额·累计","完成回款额·累计"];
    return {
      found: true,
      w: Math.round(r.width),
      h: Math.round(r.height),
      text: text.slice(0, 400),
      hasAllNames: names.every(n => text.includes(n)),
      nameCount: names.filter(n => text.includes(n)).length,
      hasWan: /万/.test(text),
      // heuristic: not absurdly wide empty
      reasonableWidth: r.width > 120 && r.width < 420
    };
  });
  await page.locator("#trendChart").screenshot({ path: path.join(OUT, "trend-tooltip.png") });

  const guards = await page.evaluate(() => ({
    drawer: !!document.getElementById("drawer"),
    jiaoShangQi: (document.body.innerText.match(/较上期/g)||[]).length,
    jiaoShangYiQi: document.body.innerText.includes("较上一期"),
    emptyDisplay: getComputedStyle(document.getElementById("treeEmpty")).display,
    viewBtns: Array.from(document.querySelectorAll("button")).filter(b => (b.textContent||"").trim()==="查看").length,
    detailBtns: Array.from(document.querySelectorAll("button")).filter(b => /查看明细/.test(b.textContent||"")).length,
    hasResize: typeof window.__ccResizeCharts === "function",
    tipConfined: (() => {
      const el = document.getElementById("trendChart");
      const opt = echarts.getInstanceByDom(el).getOption();
      const t = Array.isArray(opt.tooltip) ? opt.tooltip[0] : opt.tooltip;
      return !!(t && t.confine && typeof t.formatter === "function");
    })()
  }));

  const checks = [];
  const add = (n, ok, d) => checks.push({ name: n, ok: !!ok, detail: d });
  add("base.fill", base.fill >= 0.98, base);
  add("wide.fill", wide.fill >= 0.98 && wide.instW > base.instW + 40, { base, wide });
  add("narrow.fill", narrow.fill >= 0.98 && narrow.instW < base.instW - 40, { base, narrow });
  add("modal.tree", modalTree.open && /本月完成合同额情况/.test(modalTree.title) && !modalTree.hasView, modalTree);
  add("modal.alert", modalAlert.open && /项目预警一览/.test(modalAlert.title) && !modalAlert.hasView, modalAlert);
  add("tooltip.found", tip.found && tip.hasAllNames && tip.reasonableWidth, tip);
  add("guards", !guards.drawer && guards.jiaoShangQi===3 && !guards.jiaoShangYiQi && guards.emptyDisplay==="none" && guards.viewBtns===0 && guards.detailBtns===2 && guards.hasResize && guards.tipConfined, guards);

  const pass = checks.every(c => c.ok);
  fs.writeFileSync(path.join(OUT, "probe.json"), JSON.stringify({ pass, checks, base, wide, narrow, modalTree, modalAlert, tip, guards }, null, 2));
  fs.writeFileSync(path.join(OUT, "README.md"), `# 完成合同额看板 · treemap 自适应 + 查看明细 modal + 走势 tooltip\n\n- 日期：2026-11-03（Asia/Shanghai）\n- 文件：\`public/operations-dashboard-202610/completed-contract.html\`\n- 勿 commit\n\n## 本回合交付\n\n1. **treemap 自适应**：ResizeObserver + 双 rAF \`chart.resize({width,height})\` + visualViewport；容器 \`min-width:0\` 撑满\n2. **查看明细 modal**（已恢复）：\n   - 「本月完成合同额情况」→ 查看明细\n   - 「项目预警一览」→ 查看明细\n   - 无 Drawer、无行内「查看」列\n3. **月度走势 tooltip**：去掉易坏的 \`valueFormatter\`，改自定义 formatter（系列名+数值同行）+ \`confine:true\` + 限宽\n\n## 保留\n空白口径 \`.empty[hidden]\`；KPI「较上期」右侧\n\n## 自检\nprobe: **${pass ? "PASS" : "FAIL"}**\n\n## 截图\n- treemap-base-1280.png / treemap-wide-col.png / treemap-narrow-col.png\n- modal-tree-detail.png / modal-alert-detail.png\n- trend-tooltip.png\n`);
  console.log(JSON.stringify({ pass, fails: checks.filter(c => !c.ok).map(c => c.name), tipW: tip.w, tipNames: tip.nameCount }, null, 2));
  await browser.close();
  process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });