const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const ROOT = path.resolve(".");
  const BASE = "http://127.0.0.1:3001/operations-dashboard-202610/completed-contract.html";
  const OUT_KPI = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-kpi-delta");
  const OUT_TREE = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-treemap-resize");
  const OUT_TIP = path.resolve("docs/evidence/2026-11-03-ops-completed-contract-tooltip-all");
  [OUT_KPI, OUT_TREE, OUT_TIP].forEach((d) => fs.mkdirSync(d, { recursive: true }));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const checksA = [];
  const checksB = [];
  const push = (arr, ac, name, ok, detail) => arr.push({ ac, name, ok: !!ok, detail });

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1600);

  // ========== A: KPI + drawer/modal ==========
  const aInfo = await page.evaluate(() => {
    function deltaRect(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const row = el.closest(".kpi-main-row");
      const main = row ? row.querySelector(".kpi-main") : null;
      const mr = main ? main.getBoundingClientRect() : null;
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent || "").trim(),
        top: Math.round(r.top),
        left: Math.round(r.left),
        mainTop: mr ? Math.round(mr.top) : null,
        mainRight: mr ? Math.round(mr.right) : null,
        sameRow: mr ? Math.abs(r.top - mr.top) < 14 : false,
        toRight: mr ? r.left >= mr.right - 6 : false,
        inMainRow: !!(row && row.contains(el)),
        display: cs.display,
      };
    }
    const bodyText = document.body.innerText || "";
    const html = document.documentElement.innerHTML || "";
    const buttons = Array.from(document.querySelectorAll("button")).map((b) => (b.textContent || "").trim());
    const detailBtns = buttons.filter((t) => /查看明细/.test(t));
    const viewOnlyBtns = buttons.filter((t) => t === "查看");
    const drawerLike = !!document.getElementById("drawer")
      || !!document.querySelector(".drawer,[class*='Drawer'],[class*='drawer']")
      || /ant-drawer|el-drawer/i.test(html);
    const modalEl = document.getElementById("modal");
    const modalMask = document.getElementById("modalMask");
    return {
      completion: deltaRect("kpiCompletionDelta"),
      stockContract: deltaRect("kpiStockContractDelta"),
      stockInvoice: deltaRect("kpiStockInvoiceDelta"),
      hasJiaoShangYiQi: bodyText.includes("较上一期") || html.includes("较上一期"),
      jiaoShangQiCount: (bodyText.match(/较上期/g) || []).length,
      detailBtnCount: detailBtns.length,
      detailBtnIds: ["btnTreeMore", "btnAlertMore"].map((id) => {
        const el = document.getElementById(id);
        return { id, text: el ? (el.textContent || "").trim() : null, exists: !!el };
      }),
      viewOnlyBtnCount: viewOnlyBtns.length,
      hasDrawer: drawerLike,
      hasModal: !!modalEl,
      hasModalMask: !!modalMask,
      hasModalClose: !!document.getElementById("modalClose"),
      hasModalTable: !!document.getElementById("modalTable"),
      treeEmpty: (() => {
        const el = document.getElementById("treeEmpty");
        if (!el) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { hidden: el.hidden || el.hasAttribute("hidden"), display: cs.display, h: Math.round(r.height), text: (el.textContent || "").trim() };
      })(),
      alertEmpty: (() => {
        const el = document.getElementById("alertEmpty");
        if (!el) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { hidden: el.hidden || el.hasAttribute("hidden"), display: cs.display, h: Math.round(r.height), text: (el.textContent || "").trim() };
      })(),
      canvasCount: document.querySelectorAll("canvas").length,
      echarts: typeof echarts !== "undefined",
      charts: typeof echarts !== "undefined" ? ["treeChart", "alertChart", "trendChart"].map((id) => {
        const el = document.getElementById(id);
        const inst = el ? echarts.getInstanceByDom(el) : null;
        return { id, hasInst: !!inst };
      }) : [],
    };
  });

  await page.locator("section.kpi-card").screenshot({ path: path.join(OUT_KPI, "max-kpi-delta-inline.png") });
  await page.screenshot({ path: path.join(OUT_KPI, "max-full-default.png"), fullPage: true });

  // open tree modal
  await page.click("#btnTreeMore");
  await page.waitForTimeout(350);
  const modalTree = await page.evaluate(() => {
    const modal = document.getElementById("modal");
    const mask = document.getElementById("modalMask");
    const table = document.getElementById("modalTable");
    const ths = Array.from(table.querySelectorAll("thead th")).map((t) => (t.textContent || "").trim());
    const rows = table.querySelectorAll("tbody tr").length;
    const body = (table.innerText || "");
    return {
      open: modal && modal.classList.contains("open"),
      maskOpen: mask && mask.classList.contains("open"),
      title: (document.getElementById("modalTitle") || {}).textContent || "",
      ths,
      rows,
      hasViewCol: ths.some((t) => t === "查看") || /(^|\n)查看(\n|$)/.test(body),
      sample: body.slice(0, 200),
    };
  });
  await page.screenshot({ path: path.join(OUT_KPI, "max-modal-tree-detail.png") });
  await page.click("#modalClose");
  await page.waitForTimeout(250);
  const modalClosed1 = await page.evaluate(() => !document.getElementById("modal").classList.contains("open"));

  await page.click("#btnAlertMore");
  await page.waitForTimeout(350);
  const modalAlert = await page.evaluate(() => {
    const modal = document.getElementById("modal");
    const mask = document.getElementById("modalMask");
    const table = document.getElementById("modalTable");
    const ths = Array.from(table.querySelectorAll("thead th")).map((t) => (t.textContent || "").trim());
    const rows = table.querySelectorAll("tbody tr").length;
    const body = (table.innerText || "");
    return {
      open: modal && modal.classList.contains("open"),
      maskOpen: mask && mask.classList.contains("open"),
      title: (document.getElementById("modalTitle") || {}).textContent || "",
      ths,
      rows,
      hasViewCol: ths.some((t) => t === "查看") || /(^|\n)查看(\n|$)/.test(body),
      sample: body.slice(0, 200),
    };
  });
  await page.screenshot({ path: path.join(OUT_KPI, "max-modal-alert-detail.png") });
  await page.click("#modalClose");
  await page.waitForTimeout(250);
  const modalClosed2 = await page.evaluate(() => !document.getElementById("modal").classList.contains("open"));

  // PM table: no 查看 column / no drawer path
  const pmInfo = await page.evaluate(() => {
    const sec = document.querySelector('section[aria-label="按项目经理汇总"]');
    if (!sec) return { exists: false };
    const ths = Array.from(sec.querySelectorAll("thead th, th")).map((t) => (t.textContent || "").trim());
    const viewCells = Array.from(sec.querySelectorAll("td,button,a")).filter((el) => ((el.textContent || "").trim() === "查看"));
    return { exists: true, ths, viewCellCount: viewCells.length, textHasChakan: /查看/.test(sec.innerText || "") };
  });

  function isDeltaOk(d) {
    return d && /^较上期\s*[+\-−–]?\s*[\d,.]+/.test(d.text) && d.sameRow && d.toRight && d.inMainRow;
  }

  push(checksA, "A1", "completion.sameRowRight", isDeltaOk(aInfo.completion), aInfo.completion);
  push(checksA, "A1", "stockContract.sameRowRight", isDeltaOk(aInfo.stockContract), aInfo.stockContract);
  push(checksA, "A1", "stockInvoice.sameRowRight", isDeltaOk(aInfo.stockInvoice), aInfo.stockInvoice);
  push(checksA, "A2", "label.较上期", aInfo.jiaoShangQiCount === 3 && !aInfo.hasJiaoShangYiQi, {
    count: aInfo.jiaoShangQiCount, hasYiQi: aInfo.hasJiaoShangYiQi,
    texts: [aInfo.completion && aInfo.completion.text, aInfo.stockContract && aInfo.stockContract.text, aInfo.stockInvoice && aInfo.stockInvoice.text],
  });
  push(checksA, "A3", "detail.btns", aInfo.detailBtnCount === 2 && aInfo.detailBtnIds.every((x) => x.exists), aInfo.detailBtnIds);
  push(checksA, "A3", "modal.tree.openClose", modalTree.open && modalTree.maskOpen && /本月完成合同额情况/.test(modalTree.title) && modalTree.rows >= 1 && modalClosed1, modalTree);
  push(checksA, "A3", "modal.alert.openClose", modalAlert.open && modalAlert.maskOpen && /项目预警一览/.test(modalAlert.title) && modalAlert.rows >= 1 && modalClosed2, modalAlert);
  push(checksA, "A4", "no.drawer", !aInfo.hasDrawer, { hasDrawer: aInfo.hasDrawer });
  push(checksA, "A4", "no.viewOnlyBtn", aInfo.viewOnlyBtnCount === 0, { count: aInfo.viewOnlyBtnCount });
  push(checksA, "A5", "modal.noViewCol", !modalTree.hasViewCol && !modalAlert.hasViewCol, { tree: modalTree.ths, alert: modalAlert.ths });
  push(checksA, "A5", "pm.noView", pmInfo.exists && pmInfo.viewCellCount === 0 && !pmInfo.ths.includes("查看"), pmInfo);
  push(checksA, "A6", "blank.defaultNoFakeEmpty", aInfo.treeEmpty && aInfo.treeEmpty.display === "none" && aInfo.alertEmpty && aInfo.alertEmpty.display === "none", {
    treeEmpty: aInfo.treeEmpty, alertEmpty: aInfo.alertEmpty,
  });
  push(checksA, "A6", "charts.alive", aInfo.echarts && aInfo.canvasCount >= 3 && aInfo.charts.every((c) => c.hasInst), { canvasCount: aInfo.canvasCount, charts: aInfo.charts });

  // ========== B: treemap resize + all tooltips ==========
  async function treeMeasure() {
    return page.evaluate(() => {
      const el = document.getElementById("treeChart");
      const box = el.getBoundingClientRect();
      const canvas = el.querySelector("canvas");
      const cr = canvas ? canvas.getBoundingClientRect() : { width: 0, height: 0 };
      const inst = echarts.getInstanceByDom(el);
      const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
      const pr = panel.getBoundingClientRect();
      return {
        boxW: Math.round(box.width), boxH: Math.round(box.height),
        canvasW: Math.round(cr.width), canvasH: Math.round(cr.height),
        instW: inst.getWidth(), instH: inst.getHeight(),
        fillW: box.width > 0 ? cr.width / box.width : 0,
        fillH: box.height > 0 ? cr.height / box.height : 0,
        panelW: Math.round(pr.width),
      };
    });
  }

  // reset viewport baseline
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.waitForTimeout(700);
  await page.evaluate(() => { if (window.__ccResizeCharts) window.__ccResizeCharts(); });
  await page.waitForTimeout(500);
  const base = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT_TREE, "max-treemap-base-1280.png") });

  // widen column
  await page.evaluate(() => {
    const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
    panel.parentElement.style.gridTemplateColumns = "1.7fr 0.5fr";
    if (window.__ccResizeCharts) window.__ccResizeCharts();
  });
  await page.waitForTimeout(700);
  const wide = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT_TREE, "max-treemap-wide-col.png") });

  // narrow column
  await page.evaluate(() => {
    const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
    panel.parentElement.style.gridTemplateColumns = "0.85fr 1.35fr";
    if (window.__ccResizeCharts) window.__ccResizeCharts();
  });
  await page.waitForTimeout(700);
  const narrow = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT_TREE, "max-treemap-narrow-col.png") });

  // viewport widen
  await page.evaluate(() => {
    const panel = document.querySelector('section[aria-label="本月完成合同额情况"]');
    panel.parentElement.style.gridTemplateColumns = "";
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => { if (window.__ccResizeCharts) window.__ccResizeCharts(); });
  await page.waitForTimeout(500);
  const vpWide = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT_TREE, "max-treemap-vp-1600.png") });

  // viewport narrow
  await page.setViewportSize({ width: 1100, height: 1000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => { if (window.__ccResizeCharts) window.__ccResizeCharts(); });
  await page.waitForTimeout(500);
  const vpNarrow = await treeMeasure();
  await page.locator('section[aria-label="本月完成合同额情况"]').screenshot({ path: path.join(OUT_TREE, "max-treemap-vp-1100.png") });

  // restore viewport for tooltip tests
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.waitForTimeout(700);
  await page.evaluate(() => { if (window.__ccResizeCharts) window.__ccResizeCharts(); });
  await page.waitForTimeout(400);

  const tipMeta = await page.evaluate(() => {
    function tipOf(id) {
      const el = document.getElementById(id);
      const inst = echarts.getInstanceByDom(el);
      const opt = inst.getOption() || {};
      const t = Array.isArray(opt.tooltip) ? opt.tooltip[0] : opt.tooltip;
      return {
        id,
        confine: !!(t && t.confine),
        hasFormatter: !!(t && typeof t.formatter === "function"),
        extra: (t && t.extraCssText) || "",
        hasMaxWidth: /max-width/i.test((t && t.extraCssText) || ""),
      };
    }
    function runFmt(id, payload) {
      const inst = echarts.getInstanceByDom(document.getElementById(id));
      const opt = inst.getOption() || {};
      const t = Array.isArray(opt.tooltip) ? opt.tooltip[0] : opt.tooltip;
      return String(t.formatter(payload) || "");
    }
    const treeData = (((echarts.getInstanceByDom(document.getElementById("treeChart")).getOption().series || [])[0] || {}).data) || [];
    const treeHtml = runFmt("treeChart", { data: treeData[0] });
    const alertPoint = (((echarts.getInstanceByDom(document.getElementById("alertChart")).getOption().series || [])[0] || {}).data || [])[0] || {};
    const alertHtml = runFmt("alertChart", [{ marker: "●", data: alertPoint, value: alertPoint.value, name: alertPoint.label || alertPoint.name }]);
    const names = ["完成合同额·当月", "完成开票额·当月", "完成回款额·当月", "完成合同额·累计", "完成开票额·累计", "完成回款额·累计"];
    const trendHtml = runFmt("trendChart", names.map((seriesName, i) => ({ marker: "●", seriesName, value: 10 + i, axisValueLabel: "4月" })));
    return {
      meta: [tipOf("treeChart"), tipOf("alertChart"), tipOf("trendChart")],
      treeHtml,
      alertHtml,
      trendHtml,
      treeOk: /本月完成合同额|项目号|项目经理/.test(treeHtml) && /[\d,.]+/.test(treeHtml),
      alertOk: /(条|预警|异常)/.test(alertHtml) || /[\d]/.test(alertHtml),
      trendOk: names.every((n) => trendHtml.includes(n)) && /万/.test(trendHtml),
      namesHit: names.filter((n) => trendHtml.includes(n)).length,
      hasResizeHook: typeof window.__ccResizeCharts === "function",
      chartIds: ["treeChart", "alertChart", "trendChart"],
    };
  });

  async function captureTip(chartId, seriesIndex, dataIndex, outName) {
    await page.evaluate(({ chartId, seriesIndex, dataIndex }) => {
      const el = document.getElementById(chartId);
      el.scrollIntoView({ block: "center" });
      const inst = echarts.getInstanceByDom(el);
      inst.dispatchAction({ type: "hideTip" });
      inst.dispatchAction({ type: "showTip", seriesIndex, dataIndex });
    }, { chartId, seriesIndex, dataIndex });
    await page.waitForTimeout(350);
    const tipDom = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll("div")).filter((d) => {
        const s = getComputedStyle(d);
        if (s.position !== "absolute" && s.position !== "fixed") return false;
        if (!d.innerText || d.innerText.trim().length < 2) return false;
        if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
        const r = d.getBoundingClientRect();
        return r.width > 40 && r.height > 20 && r.width < 800;
      });
      // Prefer echarts tooltip class
      let tipEl = document.querySelector("div[class*='echarts-tooltip']");
      if (!tipEl) {
        tipEl = candidates.sort((a, b) => (b.innerText || "").length - (a.innerText || "").length)[0];
      }
      if (!tipEl) return { found: false };
      const r = tipEl.getBoundingClientRect();
      const text = (tipEl.innerText || "").trim();
      const html = tipEl.innerHTML || "";
      // empty-space heuristic: huge width with little text
      const chars = text.replace(/\s+/g, "").length;
      const density = chars / Math.max(r.width, 1);
      return {
        found: true,
        w: Math.round(r.width),
        h: Math.round(r.height),
        text: text.slice(0, 500),
        hasFlexRow: /display:\s*flex/i.test(html) || /justify-content:\s*space-between/i.test(html),
        reasonableWidth: r.width >= 80 && r.width <= 420,
        density,
        notSparse: density > 0.15 || r.width < 360,
      };
    });
    await page.locator("#" + chartId).screenshot({ path: path.join(OUT_TIP, outName) });
    await page.evaluate((chartId) => {
      const inst = echarts.getInstanceByDom(document.getElementById(chartId));
      inst.dispatchAction({ type: "hideTip" });
    }, chartId);
    return tipDom;
  }

  const tipTreeDom = await captureTip("treeChart", 0, 0, "max-tooltip-treemap.png");
  const tipAlertDom = await captureTip("alertChart", 0, 0, "max-tooltip-alert.png");
  const tipTrendDom = await captureTip("trendChart", 0, 3, "max-tooltip-trend.png");

  // light blank regression: default already checked; also emptyTree=none should show empty
  await page.goto(BASE + "?emptyTree=none", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const emptyTreeState = await page.evaluate(() => {
    const el = document.getElementById("treeEmpty");
    const cs = getComputedStyle(el);
    return { display: cs.display, hidden: el.hidden, text: (el.textContent || "").trim().slice(0, 80), h: Math.round(el.getBoundingClientRect().height) };
  });
  await page.screenshot({ path: path.join(OUT_TREE, "max-emptyTree-none.png"), fullPage: false });

  await page.goto(BASE + "?emptyAlerts=1", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const emptyAlertState = await page.evaluate(() => {
    const el = document.getElementById("alertEmpty");
    const cs = getComputedStyle(el);
    return { display: cs.display, hidden: el.hidden, text: (el.textContent || "").trim().slice(0, 80), h: Math.round(el.getBoundingClientRect().height) };
  });
  await page.screenshot({ path: path.join(OUT_TIP, "max-emptyAlerts.png"), fullPage: false });

  push(checksB, "B1", "base.fill", base.fillW >= 0.97 && base.fillH >= 0.97, base);
  push(checksB, "B2", "wide.resizeFill", wide.fillW >= 0.97 && wide.instW > base.instW + 30, { base, wide });
  push(checksB, "B2", "narrow.resizeFill", narrow.fillW >= 0.97 && narrow.instW < base.instW - 30, { base, narrow });
  push(checksB, "B3", "vp.wide.fill", vpWide.fillW >= 0.97 && vpWide.instW !== base.instW, { base, vpWide });
  push(checksB, "B3", "vp.narrow.fill", vpNarrow.fillW >= 0.97, { base, vpNarrow });
  push(checksB, "B3", "resize.hook", tipMeta.hasResizeHook, { hasResizeHook: tipMeta.hasResizeHook });
  push(checksB, "B4", "emptyTree.vacuumShows", emptyTreeState.display !== "none" && emptyTreeState.h > 20, emptyTreeState);
  push(checksB, "B4", "emptyAlerts.vacuumShows", emptyAlertState.display !== "none" && /未发现异常/.test(emptyAlertState.text), emptyAlertState);
  tipMeta.meta.forEach((m) => {
    push(checksB, "B5", m.id + ".tooltip.meta", m.confine && m.hasFormatter && m.hasMaxWidth, m);
  });
  push(checksB, "B5", "tree.fmt.names", tipMeta.treeOk, tipMeta.treeHtml.slice(0, 220));
  push(checksB, "B5", "alert.fmt.names", tipMeta.alertOk, tipMeta.alertHtml.slice(0, 220));
  push(checksB, "B5", "trend.fmt.names", tipMeta.trendOk, { namesHit: tipMeta.namesHit, html: tipMeta.trendHtml.slice(0, 280) });
  push(checksB, "B5", "tree.tip.dom", tipTreeDom.found && tipTreeDom.reasonableWidth && tipTreeDom.notSparse, tipTreeDom);
  push(checksB, "B5", "alert.tip.dom", tipAlertDom.found && tipAlertDom.reasonableWidth && tipAlertDom.notSparse, tipAlertDom);
  push(checksB, "B5", "trend.tip.dom", tipTrendDom.found && tipTrendDom.reasonableWidth && tipTrendDom.notSparse && /完成合同额·当月/.test(tipTrendDom.text || ""), tipTrendDom);

  const passA = checksA.every((c) => c.ok);
  const passB = checksB.every((c) => c.ok);
  const failsA = checksA.filter((c) => !c.ok);
  const failsB = checksB.filter((c) => !c.ok);

  const probeA = {
    role: "Max",
    date: "2026-11-03",
    zone: "Asia/Shanghai",
    target: "public/operations-dashboard-202610/completed-contract.html",
    ledger: "2026-11-03 —— 完成合同额看板 KPI「较上期」布局 + 去不当抽屉",
    pass: passA,
    checks: checksA,
    aInfo,
    modalTree,
    modalAlert,
    pmInfo,
  };
  const probeB = {
    role: "Max",
    date: "2026-11-03",
    zone: "Asia/Shanghai",
    target: "public/operations-dashboard-202610/completed-contract.html",
    ledger: "2026-11-03 —— 完成合同额看板 treemap 自适应 + 全页图表 tooltip",
    pass: passB,
    checks: checksB,
    base,
    wide,
    narrow,
    vpWide,
    vpNarrow,
    tipMeta,
    tipTreeDom,
    tipAlertDom,
    tipTrendDom,
    emptyTreeState,
    emptyAlertState,
  };

  fs.writeFileSync(path.join(OUT_KPI, "max-probe.json"), JSON.stringify(probeA, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT_TREE, "max-probe.json"), JSON.stringify({ ...probeB, note: "treemap/resize + empty vacuum; tooltip details also in tooltip-all" }, null, 2), "utf8");
  fs.writeFileSync(path.join(OUT_TIP, "max-probe.json"), JSON.stringify(probeB, null, 2), "utf8");

  const mdA = `# Max 验收记录 · KPI「较上期」+ 去不当抽屉

- 日期：2026-11-03（Asia/Shanghai）
- 目标：\`public/operations-dashboard-202610/completed-contract.html\`
- 账本：完成合同额看板 KPI「较上期」布局 + 去不当抽屉（状态仍待落地，本记录不改账本）
- 结论：**${passA ? "PASS" : "FAIL"}**
- 阻断：${failsA.length ? failsA.map((f) => f.name).join(", ") : "无"}
- 入库：仍缓；未改实现 / 未 commit / 未 push / 未改账本

## 逐 AC

| AC | 检查 | 结果 |
|----|------|------|
${checksA.map((c) => `| ${c.ac} | ${c.name} | ${c.ok ? "PASS" : "FAIL"} |`).join("\n")}

## 证据

- max-kpi-delta-inline.png
- max-full-default.png
- max-modal-tree-detail.png
- max-modal-alert-detail.png
- max-probe.json
`;
  const mdB = `# Max 验收记录 · treemap 自适应 + 全页图表 tooltip

- 日期：2026-11-03（Asia/Shanghai）
- 目标：\`public/operations-dashboard-202610/completed-contract.html\`
- 账本：完成合同额看板 treemap 自适应 + 全页图表 tooltip（状态仍待落地，本记录不改账本）
- 结论：**${passB ? "PASS" : "FAIL"}**
- 阻断：${failsB.length ? failsB.map((f) => f.name).join(", ") : "无"}
- 入库：仍缓；未改实现 / 未 commit / 未 push / 未改账本

## 逐 AC

| AC | 检查 | 结果 |
|----|------|------|
${checksB.map((c) => `| ${c.ac} | ${c.name} | ${c.ok ? "PASS" : "FAIL"} |`).join("\n")}

## 证据

- treemap-resize/：max-treemap-*.png、max-emptyTree-none.png、max-probe.json
- tooltip-all/：max-tooltip-treemap.png、max-tooltip-alert.png、max-tooltip-trend.png、max-emptyAlerts.png、max-probe.json
`;

  fs.writeFileSync(path.join(OUT_KPI, "max-kpi-delta-验收记录.md"), mdA, "utf8");
  fs.writeFileSync(path.join(OUT_TREE, "max-treemap-resize-验收记录.md"), mdB, "utf8");
  fs.writeFileSync(path.join(OUT_TIP, "max-tooltip-all-验收记录.md"), mdB, "utf8");

  // also drop probe script for reproducibility
  // (written separately by shell)

  console.log(JSON.stringify({
    passA,
    passB,
    failsA: failsA.map((f) => ({ name: f.name, detail: f.detail })),
    failsB: failsB.map((f) => ({ name: f.name, detail: f.detail })),
    summary: {
      jiao: aInfo.jiaoShangQiCount,
      detailBtns: aInfo.detailBtnCount,
      drawer: aInfo.hasDrawer,
      baseFill: base.fillW,
      wideInst: wide.instW,
      narrowInst: narrow.instW,
      tipNames: tipMeta.namesHit,
      tipTrendW: tipTrendDom.w,
    },
  }, null, 2));

  await browser.close();
  process.exit(passA && passB ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
