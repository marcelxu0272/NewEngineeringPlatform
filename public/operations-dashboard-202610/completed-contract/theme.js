/** completed-contract: theme. Private page context; no cross-dashboard state. */
export function register(ctx) {
function applyTheme(name) {
    const t = ctx.THEMES[name] || ctx.THEMES.blue;
    Object.entries(t).forEach(([k, v]) => {
      document.documentElement.style.setProperty("--" + k.replace(/[A-Z]/g, m => "-" + m.toLowerCase()), v);
    });
    document.documentElement.dataset.theme = name || "blue";
    ctx.renderAllCharts();
  }

function applyFilter(payload) {
    if (!payload || typeof payload !== "object") return;
    ctx.state.year = 2026;
    if (typeof payload.unit === "string" && payload.unit) ctx.state.unit = payload.unit;
    document.getElementById("banner").textContent =
      "完成合同额看板 · 样例数据（demo） · " + ctx.state.year + " · " + ctx.state.unit;
  }
Object.assign(ctx,{applyTheme,applyFilter});
}
