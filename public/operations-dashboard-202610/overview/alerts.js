/** overview: alerts. Private page context; no cross-dashboard state. */
export function register(ctx) {
function alerts(){
    const last=ctx.model.n,net=ctx.model.net.at(-1),outDelta=(ctx.model.outflow.at(-1)-ctx.model.outflow.at(-2))/ctx.model.outflow.at(-2)*100;
    return [
      {level:'danger',title:'回款进度预警',detail:`年度回款目标达成 ${ctx.pct(ctx.model.totals.receipt/ctx.model.targets.receipt*100)}`,date:`${ctx.state.year}-${String(last).padStart(2,'0')}-28`,explain:'演示规则：年度回款目标达成率低于90%时提醒。仅用于原型展示，实际阈值可配置。',action:'receipt'},
      {level:net<0?'warning':'success',title:net<0?'现金净流出提醒':'现金流入增长',detail:`${last}月${net<0?'净流出':'净流入'} ${ctx.money(Math.abs(net))} 万元`,date:`${ctx.state.year}-${String(last).padStart(2,'0')}-31`,explain:`${last}月现金流入${ctx.money(ctx.model.inflow.at(-1))}万元，流出${ctx.money(ctx.model.outflow.at(-1))}万元，净额${ctx.money(net)}万元。现金流出较上期${outDelta>=0?'+':''}${ctx.pct(outDelta)}。`,action:'cash'},
      {level:'secondary',title:'项目交付风险',detail:`${ctx.model.projects.filter(p=>p.status==='风险').length} 项待跟进 · 0 项逾期`,date:`${ctx.state.year}-${String(last).padStart(2,'0')}-24`,explain:'演示清单中的风险项目尚未逾期，当前风险为设计校审待完成。点击可查看相关项目。',action:'projects'}
    ];
  }

function renderAlerts(){ ctx.$('alertList').innerHTML=ctx.alerts().map((a,i)=>`<button class="alert-item tone-${a.level}" data-alert="${i}" data-tip="${ctx.safe(a.explain)}"><span class="alert-dot">${ctx.icon(a.level==='secondary'?'info':'warning')}</span><div><strong>${a.title}</strong><p>${a.detail}</p></div><time>${a.date.slice(5)}</time>${ctx.icon('chevron')}</button>`).join('');}
Object.assign(ctx,{alerts,renderAlerts});
}
