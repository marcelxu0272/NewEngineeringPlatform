/** hr: dialogs. Private page context; no cross-dashboard state. */
export function register(ctx) {
function drawModal(){
    ctx.disposeDialogCharts(); const view=ctx.dialogHistory[ctx.dialogHistory.length-1];if(!view)return;
    ctx.$('hrDialogTitle').textContent=view.title;ctx.$('hrDialog').classList.toggle('wide',!!view.wide);ctx.$('hrDialogBack').hidden=ctx.dialogHistory.length<2;ctx.$('hrDialogBody').innerHTML=view.html();ctx.$('hrDialogBody').scrollTop=0;view.setup?.();ctx.lifecycle.frame(ctx.resizeCharts);
  }

function openModal(title,html,setup,trigger,wide=false){
    const view={title,html:typeof html==='function'?html:()=>html,setup,wide};
    if(!ctx.$('hrDialog').open){ctx.lastTrigger=trigger||document.activeElement;ctx.scrollLock={html:document.documentElement.style.overflow,overscroll:document.documentElement.style.overscrollBehavior,body:document.body.style.overflow,x:scrollX,y:scrollY};document.documentElement.style.overflow='hidden';document.documentElement.style.overscrollBehavior='none';document.body.style.overflow='hidden';ctx.dialogHistory=[view];ctx.drawModal();ctx.$('hrDialog').showModal();ctx.$('closeHrDialog').focus();}
    else{ctx.dialogHistory.push(view);ctx.drawModal();ctx.$('hrDialogBack').focus();}
  }

function closeModal(){if(ctx.$('hrDialog').open)ctx.$('hrDialog').close();}

function openProject(code,trigger){
    const project=(ctx.S.projects||[]).find(p=>p.code===code);if(!project)return;let teamType='internal';
    ctx.openModal(project.code+' '+project.name,()=>'<p class="dialog-note">'+ctx.escape(project.type)+' · 负责人 '+ctx.escape(project.manager)+' · '+ctx.escape(project.start||'—')+' 至 '+ctx.escape(project.end||'—')+'</p><div class="tabs" role="tablist" aria-label="团队人员类型"><button class="active" type="button" role="tab" data-team-type="internal">Wood人员（'+ctx.fmt(project.internal)+'人）</button><button type="button" role="tab" data-team-type="external">外部人员（'+ctx.fmt(project.external)+'人）</button></div><div id="teamDetailBody"></div>',()=>{
      const render=()=>{
        const team=ctx.S.teams?.[code],members=team?.[teamType]||[];
        ctx.$('teamDetailBody').innerHTML='<p class="dialog-note">来源团队规模：'+ctx.fmt(teamType==='internal'?project.internal:project.external)+' 人。'+(!team?'当前快照未提供该项目成员名单；不补造个人记录。':'')+'</p>'+ctx.table(['序号','姓名','岗位角色','预计撤场时间','开始日期','操作'],members.map((p,i)=>[i+1,p.name,p.role||p.position,p.expectedEnd||p.expectedLeave||p.leaveDate||p.endDate,p.start||p.startDate,ctx.safeHtml('<button type="button" class="text-button" data-team-person="'+i+'">查看人员信息</button>')]));
        ctx.$('teamDetailBody').querySelectorAll('[data-team-person]').forEach(button=>button.addEventListener('click',()=>ctx.openPerson(members[Number(button.dataset.teamPerson)],button)));
        ctx.$('hrDialogBody').querySelectorAll('[data-team-type]').forEach(button=>{const on=button.dataset.teamType===teamType;button.classList.toggle('active',on);button.setAttribute('aria-selected',String(on));});
      };
      ctx.$('hrDialogBody').querySelectorAll('[data-team-type]').forEach(button=>button.addEventListener('click',()=>{teamType=button.dataset.teamType;render();}));render();
    },trigger,true);
  }

function openPerson(person,trigger){
    if(!person)return;const projects=ctx.personProjects(person);
    ctx.openModal(person.name+' · 人员信息',()=>'<div class="person-card">'+ctx.avatar(person.name)+'<div><strong>'+ctx.escape(person.name)+'</strong><span class="person-role">'+ctx.escape(person.department)+' | '+ctx.escape(person.role||person.position)+'</span></div></div><dl class="detail-grid">'+[['工号',person.employeeId||person.id],['所属部门',person.department],['岗位角色',person.role||person.position],['主专业',person.specialty||person.discipline],['资格',person.qualification],['人员类型',person.personType||person.type]].map(([label,v])=>'<div class="detail-field"><dt>'+label+'</dt><dd>'+ctx.escape(v)+'</dd></div>').join('')+'</dl>'+(person.weeks?'<h3 class="subheading">来源负荷记录</h3>'+ctx.table(['前一周负荷率','前二周负荷率','前三周负荷率','本年度负荷率'],[[...person.weeks.map(ctx.pct),ctx.pct(person.annual)]]):'')+'<h3 class="subheading">来源已采集派遣记录</h3>'+(projects.length?ctx.table(['项目编码','项目名称','操作'],projects.map(p=>[p.code,p.name,ctx.safeHtml('<button class="text-button" type="button" data-person-project="'+ctx.escape(p.code)+'">项目详情</button>')])):ctx.textEmpty('当前已采集来源记录中未提供该人员的项目派遣明细。'))+'<p class="dialog-note">“—”表示来源未提供；不补造履历、能力评价或个人信息。</p>',()=>{ctx.$('hrDialogBody').querySelectorAll('[data-person-project]').forEach(button=>button.addEventListener('click',()=>ctx.openProject(button.dataset.personProject,button)));},trigger);
  }

function openSearch(trigger){
    ctx.openModal('搜索人员派遣','<form id="hrPersonnelSearchForm" class="search-form"><input type="search" id="hrPersonnelSearch" placeholder="请输入姓名或员工编号/工号" aria-label="人员姓名或工号" autocomplete="off"/><button class="button primary" type="submit" id="hrSearchButton">搜索</button></form><p class="dialog-note">查询本快照已采集的来源人员记录；姓名或工号可部分匹配。</p><div id="hrSearchResults" class="search-results"></div>',()=>{
      const render=query=>{const needle=query.trim().toLocaleLowerCase(),rows=needle?ctx.allPeople().filter(p=>[p.name,p.employeeId,p.id].some(v=>v!=null&&String(v).toLocaleLowerCase().includes(needle))):[];
        ctx.$('hrSearchResults').innerHTML=!needle?ctx.textEmpty('请输入姓名或工号后搜索。'):rows.length?'<p class="panel-note">共 '+rows.length+' 条匹配记录</p>'+rows.map((p,i)=>'<article class="search-result"><div class="result-top"><div><strong>'+ctx.escape(p.name)+'</strong><span class="person-role">工号：'+ctx.escape(p.employeeId||p.id)+' · '+ctx.escape(p.department)+' | '+ctx.escape(p.role||p.position)+'</span></div><button class="text-button" type="button" data-search-person="'+i+'">查看完整人员卡片</button></div><div class="result-projects">'+(ctx.personProjects(p).length?ctx.personProjects(p).map(project=>'<button class="text-button" type="button" data-search-project="'+ctx.escape(project.code)+'">'+ctx.escape(project.code)+' '+ctx.escape(project.name)+'</button>').join(''):'来源已采集记录中暂无该人员的在册派遣明细。')+'</div></article>').join(''):ctx.textEmpty('未找到匹配人员，请调整姓名或工号。');
        ctx.$('hrSearchResults').querySelectorAll('[data-search-person]').forEach(button=>button.addEventListener('click',()=>ctx.openPerson(rows[Number(button.dataset.searchPerson)],button)));
        ctx.$('hrSearchResults').querySelectorAll('[data-search-project]').forEach(button=>button.addEventListener('click',()=>ctx.openProject(button.dataset.searchProject,button)));
      };ctx.$('hrPersonnelSearchForm').addEventListener('submit',event=>{event.preventDefault();render(ctx.$('hrPersonnelSearch').value);});render('');ctx.$('hrPersonnelSearch').focus();
    },trigger);
  }

function openMapRegion(region,trigger){
    const city=region.city||region.name,records=(ctx.S.mapProjects||[]).filter(p=>(p.city||p.location||p.name)===city),projects=(ctx.S.projects||[]).filter(p=>p.city===city||records.some(r=>r.code===p.code||(Array.isArray(r.projects)&&r.projects.includes(p.code))));
    const source=records[0]||region;
    ctx.openModal(city+' · 派遣项目',()=>'<p class="dialog-note">来源区域项目数：'+ctx.fmt(source.count??source.projects??source.total??source.value?.[2]??projects.length)+(source.people!=null?' · 派遣人数：'+ctx.fmt(source.people)+' 人':'')+'</p>'+(projects.length?ctx.table(['项目编码','项目名称','类型','团队规模','操作'],projects.map(p=>[p.code,p.name,p.type,ctx.fmt(p.total)+'人',ctx.safeHtml('<button class="text-button" data-region-project="'+ctx.escape(p.code)+'" type="button">详情</button>')])):ctx.textEmpty('来源区域汇总未提供与具体项目的对应明细，保留原汇总，不补造项目记录。')),()=>{ctx.$('hrDialogBody').querySelectorAll('[data-region-project]').forEach(button=>button.addEventListener('click',()=>ctx.openProject(button.dataset.regionProject,button)));},trigger);
  }

function openMapFullscreen(trigger){
    const regions=(ctx.S.mapProjects||[]).length?ctx.S.mapProjects:ctx.mapPoints();
    ctx.openModal('项目派遣分布 · 全屏查看',()=>'<p class="dialog-note">可拖动地图、滚轮缩放。标记为城市中心示意，不代表项目精确地址；未知区域保留清单，不推测坐标。</p><div class="map-full-layout"><div><div id="dialogDispatchMap" class="fullscreen-map" role="img" aria-label="全屏项目派遣地图"></div></div><div><h3 class="subheading">派遣区域与项目 · '+regions.length+' 地区</h3><div class="map-data-list">'+regions.map((p,i)=>'<div class="map-data-item"><strong>'+ctx.escape(p.city||p.name)+'</strong><small>中国 · '+ctx.fmt(p.count??p.projects??p.total??p.value?.[2])+' 个项目'+(p.people!=null?' · '+ctx.fmt(p.people)+' 人':'')+'</small><br/><button class="text-button" type="button" data-full-region="'+i+'">查看详情 ›</button></div>').join('')+'</div></div></div>',()=>{ctx.renderMap('dialogDispatchMap');ctx.$('hrDialogBody').querySelectorAll('[data-full-region]').forEach(button=>button.addEventListener('click',()=>ctx.openMapRegion(regions[Number(button.dataset.fullRegion)],button)));},trigger,true);
  }

function openOfficeSummary(office,trigger){ctx.openModal(office.name+' · 办公地情况','<p class="dialog-note">全公司来源办公地汇总，不与802条人员统计口径强行合并。</p><dl class="detail-grid"><div class="detail-field"><dt>总人数</dt><dd>'+ctx.fmt(office.total)+' 人</dd></div><div class="detail-field"><dt>在岗人数</dt><dd>'+ctx.fmt(office.onSite)+' 人</dd></div></dl><button class="button" id="officeSummaryPivot" type="button">查看人员统计透视表</button>',()=>{ctx.$('officeSummaryPivot').addEventListener('click',()=>ctx.openPivot('office',ctx.$('officeSummaryPivot')));},trigger);}

function openPivot(kind,trigger,initial={}){
    const office=kind==='office',dims=office?ctx.OFFICE_DIMS:ctx.DEMAND_DIMS,pivot={rows:[office?'office':'department'],cols:[],metrics:office?['count']:['need'],filter:initial};
    let exportData={headers:[],rows:[]};
    const raw=office?(ctx.S.officePeople||[]):(ctx.S.demandRows||[]);
    const getRecords=()=>{
      if(raw.length)return ctx.scoped(raw).rows.filter(row=>Object.entries(pivot.filter).every(([key,v])=>ctx.valueOf(row,key)===v));
      const requested=[...pivot.rows,...pivot.cols];
      if(office)return requested.every(k=>k==='office')?(ctx.S.officePivot||[]).map(r=>({...r,_count:r.count})):[];
      if(requested.every(k=>k==='department')&&!pivot.filter.specialty)return ctx.scoped(ctx.S.sectorDemands).rows.filter(r=>!pivot.filter.department||r.department===pivot.filter.department).map(r=>({...r,_count:r.records,need:r.need,hired:null,gap:null}));
      if(requested.every(k=>k==='specialty')&&!pivot.filter.department)return(ctx.S.specialties||[]).filter(r=>!pivot.filter.specialty||r.name===pivot.filter.specialty).map(r=>({specialty:r.name,need:r.count,hired:null,gap:null,_count:null}));
      return[];
    };
    if(initial.specialty)pivot.rows=['specialty'];
    const defaultRows=[...pivot.rows];
    ctx.openModal(office?'办公地情况 - 人员统计':'岗位需求透视',()=>'<p class="dialog-note">'+(office?'来源人员统计为独立口径，完整快照共802条；与首页6个办公地汇总不同。':'按来源需求记录汇总；未提供的招聘或缺口值显示“—”，不推算。')+'</p>'+(Object.keys(initial).length?'<p class="dialog-note">当前条件：'+ctx.escape(Object.values(initial).join(' · '))+'</p>':'')+(!office?'<div class="pivot-toolbar" id="pivotMetrics"><span>显示指标</span><label><input type="checkbox" value="need" checked/>需求人数</label><label><input type="checkbox" value="hired"/>已聘人数</label><label><input type="checkbox" value="gap"/>缺口人数</label></div>':'')+'<details class="pivot-config" open><summary>⚙ 透视表配置</summary><div class="pivot-dimensions"><div class="dimension-zone" id="hrAvailableDimensions" data-dimension-zone="available"><h4>可用维度</h4><div class="dimension-items"></div></div><div class="dimension-zone" id="hrRowDimensions" data-dimension-zone="rows"><h4>行维度</h4><div class="dimension-items"></div></div><div class="dimension-zone" id="hrColumnDimensions" data-dimension-zone="cols"><h4>列维度</h4><div class="dimension-items"></div></div></div><div class="pivot-actions"><button class="button" type="button" id="resetHrPivot">重置布局</button><button class="button" type="button" id="exportHrPivot">导出数据</button></div></details><div id="hrPivotCount" class="pivot-count"></div><div id="hrPivotTableContainer"></div><div id="hrPivotStatus" class="pivot-status" role="status"></div>',()=>{
      const metricLabels={count:'人数',need:'需求人数',hired:'已聘人数',gap:'缺口人数'};
      const move=(key,to)=>{pivot.rows=pivot.rows.filter(k=>k!==key);pivot.cols=pivot.cols.filter(k=>k!==key);if(to!=='available')pivot[to].push(key);renderPivot();};
      const renderDimensions=()=>{
        for(const zone of['available','rows','cols']){
          const host=ctx.$('hrDialogBody').querySelector('[data-dimension-zone="'+zone+'"] .dimension-items'),keys=zone==='available'?dims.filter(d=>!pivot.rows.includes(d.key)&&!pivot.cols.includes(d.key)).map(d=>d.key):pivot[zone];
          host.innerHTML=keys.length?keys.map(key=>'<div class="dimension-chip" draggable="true" data-dimension="'+key+'"><span>⠿ '+ctx.escape(dims.find(d=>d.key===key).label)+'</span><span class="chip-actions">'+(zone==='available'?'<button type="button" data-move-dimension="'+key+'" data-to="rows" aria-label="将'+ctx.escape(dims.find(d=>d.key===key).label)+'加入行">行</button><button type="button" data-move-dimension="'+key+'" data-to="cols" aria-label="将'+ctx.escape(dims.find(d=>d.key===key).label)+'加入列">列</button>':'<button type="button" data-move-dimension="'+key+'" data-to="available" aria-label="移除'+ctx.escape(dims.find(d=>d.key===key).label)+'">×</button>')+'</span></div>').join(''):'<span class="dimension-placeholder">拖拽维度到此处</span>';
        }
        ctx.$('hrDialogBody').querySelectorAll('[data-move-dimension]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.moveDimension,button.dataset.to)));
        ctx.$('hrDialogBody').querySelectorAll('[data-dimension]').forEach(chip=>chip.addEventListener('dragstart',event=>event.dataTransfer.setData('text/plain',chip.dataset.dimension)));
      };
      const renderPivot=()=>{
        renderDimensions();const records=getRecords(),rowKeys=pivot.rows.length?[...new Set(records.map(r=>pivot.rows.map(key=>ctx.valueOf(r,key)).join(' / ')))].sort((a,b)=>a.localeCompare(b,'zh-CN')):['总计'],colKeys=pivot.cols.length?[...new Set(records.map(r=>pivot.cols.map(key=>ctx.valueOf(r,key)).join(' / ')))].sort((a,b)=>a.localeCompare(b,'zh-CN')):[''];
        const metrics=pivot.metrics.length?pivot.metrics:[office?'count':'need'];
        const headers=[pivot.rows.map(key=>dims.find(d=>d.key===key).label).join(' / ')||'汇总',...colKeys.flatMap(col=>metrics.map(metric=>(col?col+' · ':'')+metricLabels[metric]))];
        const groups=[];const outputRows=rowKeys.map(rowKey=>[rowKey,...colKeys.flatMap(colKey=>metrics.map(metric=>{const matching=records.filter(r=>(!pivot.rows.length||pivot.rows.map(key=>ctx.valueOf(r,key)).join(' / ')===rowKey)&&(!pivot.cols.length||pivot.cols.map(key=>ctx.valueOf(r,key)).join(' / ')===colKey));const values=matching.map(r=>metric==='count'?Number(r._count??1):r[metric]);const known=values.filter(v=>v!=null&&Number.isFinite(Number(v)));const sum=known.length?known.reduce((a,b)=>a+Number(b),0):null;const groupIndex=groups.push({label:[rowKey,colKey,metricLabels[metric]].filter(Boolean).join(' · '),records:matching})-1;return{value:sum,html:'<button class="pivot-cell" type="button" data-pivot-cell="'+groupIndex+'">'+ctx.fmt(sum)+'</button>'};}))]);
        const count=raw.length?records.length:!records.length||records.some(r=>r._count==null)?null:records.reduce((n,r)=>n+(r._count||0),0);
        ctx.$('hrPivotCount').textContent=(office?'人员记录':'需求记录')+'：'+ctx.fmt(count)+' 条 · '+records.length+' 个来源汇总/明细项';
        ctx.$('hrPivotTableContainer').innerHTML=records.length?ctx.table(headers,outputRows.map(row=>row.map(cell=>cell&&typeof cell==='object'?ctx.safeHtml(cell.html):cell)),'pivot-table'):ctx.textEmpty('当前快照未提供所选交叉维度的明细记录。可重置布局查看已采集的完整来源汇总。');
        exportData={headers,rows:outputRows.map(row=>row.map(cell=>cell&&typeof cell==='object'?ctx.fmt(cell.value):cell))};
        ctx.$('exportHrPivot').disabled=!records.length;
        ctx.$('hrPivotTableContainer').querySelectorAll('[data-pivot-cell]').forEach(button=>button.addEventListener('click',()=>ctx.openPivotDetails(groups[Number(button.dataset.pivotCell)],office,button)));
      };
      ctx.$('hrDialogBody').querySelectorAll('[data-dimension-zone]').forEach(zone=>{zone.addEventListener('dragover',event=>event.preventDefault());zone.addEventListener('drop',event=>{event.preventDefault();const key=event.dataTransfer.getData('text/plain');if(dims.some(d=>d.key===key))move(key,zone.dataset.dimensionZone);});});
      ctx.$('resetHrPivot').addEventListener('click',()=>{pivot.rows=[...defaultRows];pivot.cols=[];renderPivot();ctx.$('hrPivotStatus').textContent='已恢复默认布局。';});
      ctx.$('exportHrPivot').addEventListener('click',()=>{ctx.downloadCsv(office?'办公地人员统计':'岗位需求透视',exportData.headers,exportData.rows);ctx.$('hrPivotStatus').textContent='当前透视结果已导出。';});
      ctx.$('pivotMetrics')?.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{pivot.metrics=Array.from(ctx.$('pivotMetrics').querySelectorAll('input:checked'),e=>e.value);renderPivot();}));renderPivot();
    },trigger,true);
  }

function openPivotDetails(group,office,trigger){
    const records=group.records;
    ctx.openModal(group.label+' · 只读明细',()=>'<p class="dialog-note">所选透视单元格的来源记录。汇总数据未提供个人信息时不补造个人名单。</p>'+ctx.table(office?['办公地','所属部门','人员类型','主专业','姓名','来源人数']:['板块/部门','专业','岗位','工作地点','需求人数','已聘人数','缺口人数'],records.map(r=>office?[ctx.valueOf(r,'office'),ctx.valueOf(r,'department'),ctx.valueOf(r,'personType'),ctx.valueOf(r,'specialty'),r.name,ctx.fmt(r._count??1)]:[ctx.valueOf(r,'department'),ctx.valueOf(r,'specialty'),ctx.valueOf(r,'role'),ctx.valueOf(r,'location'),ctx.fmt(r.need),ctx.fmt(r.hired),ctx.fmt(r.gap)])),null,trigger,true);
  }

function openKpi(kind,trigger){
    if(kind==='coordination'){ctx.openPivot('demand',trigger);return;}
    if(kind==='company-load'){ctx.openModal('公司整体负荷率',()=>'<p class="dialog-note">全公司来源指标；“较上期”保留源展示，不推定期间或计算分母。</p><div class="summary-hero">'+ctx.pct(ctx.S.kpis.companyLoad)+'</div><p class="dialog-note">较上期 +'+ctx.fmt(ctx.S.kpis.loadDelta)+'%</p>'+((ctx.S.loadSeries||[]).length?'<div id="dialogLoadChart" class="load-chart" role="img" aria-label="公司负荷率分析"></div>':ctx.textEmpty('来源快照未提供该指标进一步分解的数据。')),()=>ctx.renderLoad('dialogLoadChart'),trigger);return;}
    const low=kind==='low-load',scope=ctx.scoped(low?ctx.S.lowLoadPeople:ctx.S.potentialPeople);
    ctx.openModal(low?'三周持续低负荷人员':'高潜力人员提名',()=>'<p class="dialog-note">'+ctx.scopeNote(scope.global)+' · '+scope.rows.length+' 人</p><div class="dialog-people">'+scope.rows.map((p,i)=>ctx.personCard(p,low,i,'dialog')).join('')+'</div>',()=>ctx.bindPeople(ctx.$('hrDialogBody'),scope.rows),trigger,true);
  }
Object.assign(ctx,{drawModal,openModal,closeModal,openProject,openPerson,openSearch,openMapRegion,openMapFullscreen,openOfficeSummary,openPivot,openPivotDetails,openKpi});
}
