import {createLifecycle} from '../shared/lifecycle.js';
import {attachHostBridge} from '../shared/host-bridge.js';
import {register as register0} from './model.js';
import {register as register1} from './format.js';
import {register as register2} from './theme.js';
import {register as register3} from './dialogs.js';
import {register as register4} from './charts.js';
import {register as register5} from './sections.js';
import {register as register6} from './layout.js';
import * as data from './data.js';
import {THEMES} from './themes.js';
export function mount() {
 const ctx={lifecycle:createLifecycle()};
 register0(ctx);
 register1(ctx);
 register2(ctx);
 register3(ctx);
 register4(ctx);
 register5(ctx);
 register6(ctx);
 ctx.lifecycle.onDispose(()=>Object.values(ctx.charts||{}).forEach(chart=>{if(chart?.destroy)chart.destroy();else chart?.dispose?.();}));
ctx.THEMES=THEMES;window.DASHBOARD_THEMES=THEMES;
ctx.SYNC_TIP=data.SYNC_TIP;
ctx.COMPLETION_NEAR_ZERO=data.COMPLETION_NEAR_ZERO;
ctx.TREEMAP_NAMED_CAP=data.TREEMAP_NAMED_CAP;
ctx.TREEMAP_MIN_RATIO=data.TREEMAP_MIN_RATIO;
ctx.TREEMAP_FALLBACK_CAP=data.TREEMAP_FALLBACK_CAP;
ctx.ALERT_TYPE_ORDER=data.ALERT_TYPE_ORDER;
ctx.state={ year: 2026, unit: "全部板块" };
ctx.sortKey="ytd";
ctx.sortDir="desc";
ctx.charts={ tree: null, alert: null, trend: null };
ctx.PAGE_SIZE=data.PAGE_SIZE;
ctx.modal={ kind: "", rows: [], page: 1, filterLabel: "" };
ctx.DEMO_PROJECTS_RAW=data.DEMO_PROJECTS_RAW;
ctx.DEMO_ALERT_ITEMS=data.DEMO_ALERT_ITEMS;
ctx.DEMO_PM=data.DEMO_PM;
ctx.months=data.months;
ctx.trendCompletion=data.trendCompletion;
ctx.trendInvoice=data.trendInvoice;
ctx.trendPayment=data.trendPayment;
ctx.reportMonthIdx=data.reportMonthIdx;
ctx.qs=new URLSearchParams(location.search);
ctx.emptyTreeKind=ctx.qs.get("emptyTree") || "";
ctx.showEmptyAlerts=ctx.qs.get("emptyAlerts") === "1";
ctx.lifecycle.property(document.getElementById("modalClose"),'onclick',ctx.closeModal);
ctx.lifecycle.property(document.getElementById("modalMask"),'onclick',ctx.closeModal);
ctx.lifecycle.property(document.getElementById("modalFilterClear"),'onclick',() => {
    if (ctx.modal.kind === "attention") ctx.openAttentionModal("");
  });
ctx.lifecycle.property(document.getElementById("modalPrev"),'onclick',() => {
    if (ctx.modal.page > 1) { ctx.modal.page -= 1; ctx.renderModal(); }
  });
ctx.lifecycle.property(document.getElementById("modalNext"),'onclick',() => {
    const max = Math.max(1, Math.ceil(ctx.modal.rows.length / ctx.PAGE_SIZE));
    if (ctx.modal.page < max) { ctx.modal.page += 1; ctx.renderModal(); }
  });
ctx.lifecycle.property(document.getElementById("btnTreeMore"),'onclick',() => ctx.openDiffModal(null));
ctx.lifecycle.property(document.getElementById("btnAlertMore"),'onclick',() => ctx.openAttentionModal(""));
document.querySelectorAll("#pmTable thead th[data-key]").forEach(th => {
    ctx.lifecycle.listen(th,"click", () => {
      const key = th.getAttribute("data-key");
      if (!key) return;
      if (ctx.sortKey === key) ctx.sortDir = ctx.sortDir === "asc" ? "desc" : "asc";
      else { ctx.sortKey = key; ctx.sortDir = key === "pm" ? "asc" : "desc"; }
      ctx.renderPm();
    });
  });
ctx.resizeRaf=0;
if (typeof ResizeObserver !== "undefined") {
    const ro = ctx.lifecycle.observe(() => ctx.scheduleResizeCharts());
    ["treeChart", "alertChart", "trendChart"].forEach(id => {
      const el = document.getElementById(id);
      if (el) ro.observe(el);
    });
  }
attachHostBridge({onTheme:ctx.applyTheme,onFilter:ctx.applyFilter,onResize:ctx.scheduleResizeCharts},ctx.lifecycle);
ctx.lifecycle.listen(window,"resize", ctx.scheduleResizeCharts);
if (window.visualViewport) {
    ctx.lifecycle.listen(window.visualViewport,"resize", ctx.scheduleResizeCharts);
    ctx.lifecycle.listen(window.visualViewport,"scroll", ctx.scheduleResizeCharts);
  }
window.__ccResizeCharts = ctx.scheduleResizeCharts;
window.__ccProbe = function () {
    return {
      echarts: typeof echarts !== "undefined",
      seriesTrend: 6,
      alertTypes: ctx.ALERT_TYPE_ORDER.slice(),
      treemapTiles: ctx.buildCompletionTreemap(ctx.resolveProjects()).tiles.map(t => ({ kind: t.kind, name: t.kind === "project" ? t.projectNo : t.label, monthCompletion: t.monthCompletion })),
      emptyTreeKind: ctx.emptyTreeKind || null,
      emptyAlerts: ctx.showEmptyAlerts,
      kpiDeltaWan: true,
      pmShareSplit: true,
      hasModal: !!document.getElementById("modal"),
      hasTrendNote: !!(document.getElementById("trendNote") || {}).textContent
    };
  };
ctx.applyTheme(document.documentElement.dataset.theme || "blue");
ctx.renderPm();
ctx.renderAllCharts();
 return {update(context){if(ctx.lifecycle.disposed)return;if(ctx.applyHostTheme)ctx.applyHostTheme(context.theme);else ctx.applyTheme(context.theme);if(ctx.applyHostFilter)ctx.applyHostFilter(context);else ctx.applyFilter(context);},destroy:()=>ctx.lifecycle.dispose(),get disposed(){return ctx.lifecycle.disposed;}};
}
window.__boardRuntime?.destroy();
window.__boardRuntime=mount();
