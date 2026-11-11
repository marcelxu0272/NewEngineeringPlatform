/** overview: charts. Private page context; no cross-dashboard state. */
export function register(ctx) {
function chart(id,options){if(ctx.charts[id])ctx.charts[id].destroy();ctx.charts[id]=Highcharts.chart(id,options);}
Object.assign(ctx,{chart});
}
