/** timesheet: layout. Private page context; no cross-dashboard state. */
export function register(ctx) {
function resizeCharts(){ctx.lifecycle.frame(()=>{Object.entries(ctx.charts).forEach(([id,chart])=>{if(!ctx.$(id).hidden && ctx.$(id).clientWidth>0)chart.resize();});});}
Object.assign(ctx,{resizeCharts});
}
