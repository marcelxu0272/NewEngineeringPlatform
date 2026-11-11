/** completed-contract: format. Private page context; no cross-dashboard state. */
export function register(ctx) {
function moneyWan(n) {
    if (n == null || isNaN(Number(n))) return "—";
    return Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

function formatWanFromYuan(yuan) {
    if (yuan == null || isNaN(Number(yuan))) return "—";
    return ctx.moneyWan(Number(yuan) / 10000);
  }

function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

function chartColors() {
    return {
      brand: ctx.cssVar("--success", "#007069") || "#007069",
      invoice: ctx.cssVar("--accent", "#4d8fa8"),
      payment: ctx.cssVar("--warning", "#c08a2e"),
      brandFill: "#d7ebe9",
      brandText: "#0c4f4a",
      dangerFill: "#f8d4d4",
      dangerText: "#9f2d2d",
      amber: ctx.cssVar("--warning", "#d97706"),
      muted: ctx.cssVar("--muted", "#6b7280"),
      faint: ctx.cssVar("--faint", "#9ca3af"),
      ink: ctx.cssVar("--ink", "#374151"),
      border: ctx.cssVar("--border", "#e5e7eb"),
      surface: ctx.cssVar("--surface", "#fff")
    };
  }

function tooltipBase(extra) {
    const c = ctx.chartColors();
    const baseCss = "border-radius:8px;box-shadow:0 4px 16px rgba(15,23,42,0.10);max-width:360px;width:auto;white-space:normal;";
    const rest = Object.assign({}, extra || {});
    const more = rest.extraCssText ? (";" + rest.extraCssText) : "";
    delete rest.extraCssText;
    return Object.assign({
      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: c.border,
      borderWidth: 1,
      padding: [8, 12],
      confine: true,
      appendToBody: false,
      extraCssText: baseCss + more,
      textStyle: { color: c.ink, fontSize: 12, lineHeight: 20 }
    }, rest);
  }

function tooltipFmtNum(v, suffix) {
    if (v == null || v === "" || isNaN(Number(v))) return "—";
    const n = Number(v).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return suffix ? (n + " " + suffix) : n;
  }

function tooltipRow(marker, name, valueHtml) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;line-height:1.7;">'
      + '<span style="display:inline-flex;align-items:center;gap:4px;min-width:0;">'
      + (marker || "") + '<span>' + (name || "") + "</span></span>"
      + '<span style="font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600;">' + valueHtml + "</span></div>";
  }

function tooltipAxisFormatter(items, valueFn) {
    const list = Array.isArray(items) ? items : (items ? [items] : []);
    if (!list.length) return "";
    const axis = list[0].axisValueLabel || list[0].name || "";
    const rows = list.map(function (it) {
      const raw = Array.isArray(it.value) ? it.value[1] : it.value;
      const name = it.seriesName || (it.data && it.data.label) || it.name || "";
      return ctx.tooltipRow(it.marker || "", name, valueFn ? valueFn(raw, it) : String(raw));
    }).join("");
    return (axis ? '<div style="font-weight:650;margin-bottom:4px;">' + axis + "</div>" : "") + rows;
  }

function truncateLabel(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
Object.assign(ctx,{moneyWan,formatWanFromYuan,cssVar,chartColors,tooltipBase,tooltipFmtNum,tooltipRow,tooltipAxisFormatter,truncateLabel});
}
