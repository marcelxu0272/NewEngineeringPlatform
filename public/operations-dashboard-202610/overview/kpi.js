/** overview: kpi. Private page context; no cross-dashboard state. */
export function register(ctx) {
function info(text){return `<button type="button" class="info-button" data-tip="${ctx.safe(text)}" aria-label="查看指标口径">${ctx.icon('info')}</button>`;}

function renderKpis(){
    const sw=ctx.$('kpiSubgoalSwitch');if(sw)sw.setAttribute('aria-checked',String(ctx.state.showSubgoals));
    const unitFactor=ctx.state.unit==='全部板块'?1:(ctx.DEMO_DATA.departments.find(d=>d[1]===ctx.state.unit)?.[2]||0.08);
    const bizFactor=ctx.state.business==='全部业务类型'?1:ctx.state.business==='设计咨询'?0.64:ctx.state.business==='项目管理'?0.22:0.14;
    const yearFactor=ctx.state.year===2026?1:0.92;
    ctx.$('kpiGrid').innerHTML=Object.entries(ctx.METRICS).map(([key,m])=>{
      const val=ctx.model.totals[key],target=ctx.model.targets[key];
      const isCompleted=key==='completed';
      const addRaw=(isCompleted?ctx.DEMO_DATA.prevMonthAdd[key]:ctx.DEMO_DATA.monthAdd[key])*unitFactor*bizFactor*yearFactor;
      const addLabel=isCompleted?'上月新增':'当月新增';
      const valText=ctx.money(val),targetText=ctx.money(target);
      const mainDone=ctx.KS.unitsFromDisplay(valText),mainTarget=ctx.KS.unitsFromDisplay(targetText);
      const addShareText=mainTarget===0n?'—':ctx.pct(addRaw/target*100);
      const noTarget=mainTarget===0n;
      const subs=ctx.state.showSubgoals?ctx.KS.subRowsHtml(m.name,ctx.KS.splitKpi(valText,targetText,ctx.DEMO_SUBGOAL_WEIGHTS[key]).map(r=>ctx.KS.rowView(r.category,r))):'';
      return `<article class="kpi-card" data-kpi="${key}" tabindex="0" role="button" aria-label="${m.name} ${valText}万元，查看明细" data-tip="${m.definition} 点击查看明细。"><div class="kpi-icon">${ctx.icon(m.icon)}</div><div class="kpi-content"><div class="kpi-title">${m.name}<span class="unit">（万元）</span></div><strong class="kpi-value">${valText}</strong><div class="kpi-meta"><span>目标 <b>${targetText}</b></span><span>占总目标 <em>${ctx.KS.percentText(mainDone,mainTarget)}</em></span>${noTarget?'<span class="kpi-sub-flag">无目标</span>':''}</div>${ctx.KS.trackHtml(ctx.KS.fillPercent(mainDone,mainTarget),m.name+' 占总目标')}${subs}</div><div class="kpi-delta" data-kpi-delta="${key}"><span class="kpi-delta-row"><span class="kpi-delta-label">${addLabel}</span> <b class="kpi-delta-num">${ctx.money(addRaw)}</b></span><span class="kpi-delta-row"><span class="kpi-delta-label">占目标</span> <b class="kpi-delta-num">${addShareText}</b></span></div></article>`;
    }).join('');
  }
Object.assign(ctx,{info,renderKpis});
}
