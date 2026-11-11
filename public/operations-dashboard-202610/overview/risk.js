/** overview: risk. Private page context; no cross-dashboard state. */
export function register(ctx) {
function renderRisk(){
    const period=ctx.DEMO_DATA.riskPeriod;
    const revenue=(ctx.DEMO_DATA.revenue||3280.6)*(ctx.state.year===2026?1:0.94)*(ctx.state.unit==='全部板块'?1:(ctx.DEMO_DATA.departments.find(d=>d[1]===ctx.state.unit)?.[2]||0.08));
    const fmtPeriod=(key,delta)=>{
      const up=delta>=0;
      const good = key==='revenue' ? up : !up;
      const col = good ? ctx.colors.success : ctx.colors.danger;
      const arrow = up ? '↑' : '↓';
      const signed = (up?'+':'-') + ctx.pct(Math.abs(delta));
      return `<small class="risk-period" style="color:${col}">较上期 ${signed} ${arrow}</small>`;
    };
    const risk=[
      ['应收账款','receivables',ctx.model.receivables,period.receivables,'客户应收账款余额。副文案为较上期对比（非同比）。'],
      ['WIP','wip',ctx.model.wip,period.wip,'Work In Progress，已开展但尚未结算确认的工作量金额。'],
      ['存货','inventory',ctx.model.inventory,period.inventory,'所选板块截至数据日的存货账面余额。'],
      ['营业收入','revenue',revenue,period.revenue,'营业收入演示指标；副文案为较上期对比（非同比、非占应收总额）。']
    ];
    ctx.$('riskMetrics').innerHTML=risk.map((r,i)=>`<button class="risk-metric" data-risk="${i}" data-tip="${r[4]} 点击查看${i<2?'项目明细':'说明'}。"><span class="metric-label">${r[0]}</span><strong>${ctx.money(r[2])}</strong>${fmtPeriod(r[1],r[3])}</button>`).join('');
  }
Object.assign(ctx,{renderRisk});
}
