/** completed-contract: layout. Private page context; no cross-dashboard state. */
export function register(ctx) {
function resizeOne(chart) {
    if (!chart) return;
    const el = chart.getDom && chart.getDom();
    if (!el) return;
    const w = Math.max(0, Math.floor(el.clientWidth));
    const h = Math.max(0, Math.floor(el.clientHeight));
    if (w < 8 || h < 8) return;
    chart.resize({ width: w, height: h, silent: true });
  }

function scheduleResizeCharts() {
    if (ctx.resizeRaf) ctx.lifecycle.cancelFrame(ctx.resizeRaf);
    ctx.resizeRaf = ctx.lifecycle.frame(() => {
      ctx.resizeRaf = ctx.lifecycle.frame(() => {
        ctx.resizeRaf = 0;
        Object.keys(ctx.charts).forEach(k => ctx.resizeOne(ctx.charts[k]));
      });
    });
  }
Object.assign(ctx,{resizeOne,scheduleResizeCharts});
}
