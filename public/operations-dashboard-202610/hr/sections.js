/** hr: sections. Private page context; no cross-dashboard state. */
export function register(ctx) {
function renderKpis() {
    const k=ctx.S.kpis || {};
    ctx.$('kpiCoordination').textContent=ctx.fmt(k.coordinationRequests); ctx.$('kpiCoordinationPeople').textContent='（'+ctx.fmt(k.coordinationPeople)+'人）';
    ctx.$('kpiPotential').textContent=ctx.fmt(k.potentialCount); ctx.$('kpiCompanyLoad').textContent=ctx.pct(k.companyLoad); ctx.$('kpiLowLoad').textContent=ctx.fmt(k.lowLoadCount);
    ctx.$('kpiLoadDelta').textContent='▲ 较上期 '+ctx.fmt(k.loadDelta)+'%'; ctx.$('kpiLowLoadDelta').textContent='▲ 较上期 '+ctx.fmt(k.lowLoadDelta)+' 人';
    ctx.$('hrScope').textContent=ctx.state.unit==='全部板块'?'全公司':ctx.unitLabel();
    ctx.$('hrSourceNote').textContent=ctx.state.unit==='全部板块'?'2026-11-05 来源快照 · 全部指标、派遣、需求、办公地与人员梯队。':'人员名单及明确归属记录随组织筛选；四项公司级指标和无组织分解的来源汇总保持全公司口径。';
  }

function renderProjects() {
    const scope=ctx.scoped(ctx.S.projects), all=scope.rows, rows=all.filter(p=>p.type===ctx.state.type);
    ctx.$('dispatchScope').textContent=ctx.scopeNote(scope.global)+(ctx.state.unit!=='全部板块'&&!scope.global?'；未标明归属的项目不分摊。':'');
    document.querySelectorAll('[data-type]').forEach(button=>{
      const list=all.filter(p=>p.type===button.dataset.type), totals=list.reduce((a,p)=>({total:a.total+Number(p.total||0),internal:a.internal+Number(p.internal||0),external:a.external+Number(p.external||0)}),{total:0,internal:0,external:0});
      button.innerHTML=ctx.escape(button.dataset.type)+' <span class="tab-sub">（总：'+totals.total+'，内：'+totals.internal+'，外：'+totals.external+'）</span>';
      button.classList.toggle('active',button.dataset.type===ctx.state.type); button.setAttribute('aria-selected',String(button.dataset.type===ctx.state.type));
    });
    ctx.$('dispatchTable').querySelector('tbody').innerHTML=rows.length?rows.map(p=>{
      const ratio=p.total?Number(p.internal)/Number(p.total)*100:0;
      return '<tr><td class="project-name">'+ctx.escape(p.name)+(p.start||p.end?'<div class="project-date">'+ctx.escape(p.start||'—')+' 至 '+ctx.escape(p.end||'—')+'</div>':'')+'</td><td class="project-code">'+ctx.escape(p.code)+'</td><td>'+ctx.escape(p.type)+'</td><td class="person-name">'+ctx.escape(p.manager)+'</td><td class="person-name">'+ctx.fmt(p.total)+'人</td><td class="ratio-cell"><div class="ratio-copy"><span>内部：'+ctx.fmt(p.internal)+'人 ('+ctx.fmt(ratio)+'%)</span><span>外部：'+ctx.fmt(p.external)+'人 ('+ctx.fmt(p.total?Number(p.external)/Number(p.total)*100:0)+'%)</span></div><div class="ratio-bar"><i style="width:'+Math.max(0,Math.min(100,ratio))+'%"></i></div></td><td><button class="text-button" type="button" data-project-code="'+ctx.escape(p.code)+'">详情</button></td></tr>';
    }).join(''):'<tr><td colspan="7">当前组织在来源快照中没有此类已明确归属项目。</td></tr>';
    ctx.$('dispatchCount').textContent='共 '+rows.length+' 个项目 · 团队人数为来源项目派遣记录口径。';
    ctx.$('dispatchTable').querySelectorAll('[data-project-code]').forEach(button=>button.addEventListener('click',()=>ctx.openProject(button.dataset.projectCode,button)));
  }

function renderDemands() {
    let specialties=ctx.S.specialties || [],specialtyGlobal=true;
    if(ctx.state.unit!=='全部板块'&&(ctx.S.demandRows||[]).some(ctx.orgValue)){
      const groups=new Map();ctx.scoped(ctx.S.demandRows).rows.forEach(row=>{const name=ctx.valueOf(row,'specialty');groups.set(name,(groups.get(name)||0)+Number(row.need||0));});specialties=Array.from(groups,([name,count])=>({name,count}));specialtyGlobal=false;
    }
    ctx.$('specialtyScope').textContent=ctx.scopeNote(specialtyGlobal);
    ctx.$('specialtyList').innerHTML=specialties.length?specialties.map((item,i)=>'<button class="specialty-button" type="button" data-specialty="'+i+'"><strong>'+ctx.fmt(item.count)+'</strong><span>'+ctx.escape(item.name)+'</span></button>').join(''):ctx.textEmpty('当前组织暂无已明确归属的专业需求来源记录。');
    const scope=ctx.scoped(ctx.S.sectorDemands);
    ctx.$('sectorDemandList').innerHTML=scope.rows.length?scope.rows.map((item,i)=>'<button class="sector-row" type="button" data-sector="'+i+'"><span>'+ctx.escape(item.department)+'</span><span><strong>'+ctx.fmt(item.need)+' 人</strong><small>'+ctx.fmt(item.records)+' 条 ›</small></span></button>').join(''):ctx.textEmpty('当前组织在来源快照中没有已明确归属的需求记录。');
    ctx.$('specialtyList').querySelectorAll('[data-specialty]').forEach(button=>button.addEventListener('click',()=>ctx.openPivot('demand',button,{specialty:specialties[Number(button.dataset.specialty)].name})));
    ctx.$('sectorDemandList').querySelectorAll('[data-sector]').forEach(button=>button.addEventListener('click',()=>ctx.openPivot('demand',button,{department:scope.rows[Number(button.dataset.sector)].department})));
  }

function renderPeople() {
    const low=ctx.scoped(ctx.S.lowLoadPeople), potential=ctx.scoped(ctx.S.potentialPeople);
    ctx.$('lowLoadCount').textContent=low.rows.length+' 人'; ctx.$('lowLoadScope').textContent=ctx.scopeNote(low.global)+' · 来源前一周、前二周、前三周及本年度负荷';
    ctx.$('lowLoadList').innerHTML=low.rows.length?low.rows.map((p,i)=>ctx.personCard(p,true,i,'low')).join(''):ctx.textEmpty('当前组织暂无匹配的低负荷来源记录。'); ctx.bindPeople(ctx.$('lowLoadList'),low.rows);
    ctx.$('potentialCount').textContent=potential.rows.length+' 人'; ctx.$('potentialScope').textContent=ctx.scopeNote(potential.global)+' · 完整保留来源人员名单';
    ctx.$('potentialList').innerHTML=potential.rows.length?potential.rows.map((p,i)=>ctx.personCard(p,false,i,'potential')).join(''):ctx.textEmpty('当前组织暂无匹配的高潜力来源记录。'); ctx.bindPeople(ctx.$('potentialList'),potential.rows);
  }

function renderOffices() {
    ctx.$('officeList').innerHTML=(ctx.S.offices || []).map((o,i)=>'<button class="office-card" type="button" data-office-index="'+i+'"><strong>'+ctx.escape(o.name)+'</strong><span class="office-numbers"><span>总人数<b>'+ctx.fmt(o.total)+'</b></span><span>在岗人数<b class="on-site">'+ctx.fmt(o.onSite)+'</b></span></span></button>').join('');
    ctx.$('officeList').querySelectorAll('[data-office-index]').forEach(button=>button.addEventListener('click',()=>ctx.openOfficeSummary(ctx.S.offices[Number(button.dataset.officeIndex)],button)));
    const link=ctx.S.links?.seatSystem; ctx.$('seatSystemLink').hidden=!link; if(link)ctx.$('seatSystemLink').href=link;
  }

function renderRegions() {
    ctx.$('popularRegions').innerHTML=(ctx.S.popularRegions || []).map((r,i)=>'<li><button type="button" data-region-index="'+i+'"><span><i class="region-dot"></i>'+ctx.escape(r.name)+'</span><strong>'+ctx.fmt(r.count)+'个项目 ›</strong></button></li>').join('');
    ctx.$('popularRegions').querySelectorAll('[data-region-index]').forEach(button=>button.addEventListener('click',()=>ctx.openMapRegion(ctx.S.popularRegions[Number(button.dataset.regionIndex)],button)));
  }

function render(){ctx.renderKpis();ctx.renderProjects();ctx.renderDemands();ctx.renderPeople();ctx.renderOffices();ctx.renderRegions();ctx.renderLoad();ctx.renderMap();ctx.resizeCharts();}
Object.assign(ctx,{renderKpis,renderProjects,renderDemands,renderPeople,renderOffices,renderRegions,render});
}
