/** timesheet: dialogs. Private page context; no cross-dashboard state. */
export function register(ctx) {
function tableHtml(headers,rows,footer){return '<thead><tr>'+headers.map((h,i)=>'<th'+(i>1?' class="num"':'')+'>'+ctx.escapeHtml(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(row=>'<tr>'+row.map((v,i)=>'<td'+(i>1?' class="num"':'')+'>'+ctx.escapeHtml(v)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'" style="text-align:center;color:var(--muted)">当前部门暂无数据</td></tr>')+'</tbody><tfoot><tr>'+footer.map((v,i)=>'<td'+(i>1?' class="num"':'')+'>'+ctx.escapeHtml(v)+'</td>').join('')+'</tr></tfoot>';}

function openDetail(kind,trigger){
    const titles={baseline:'基准人员明细',reported:'上报人员明细',projects:'项目工时统计',people:'人员工时统计'};
    if(!titles[kind])return;
    let headers,rows,footer;
    if(kind==='projects'){
      headers=['项目编码','项目名称','项目工时（小时）'];rows=ctx.model.projects.map(p=>[p.code,p.name,ctx.number(p.projectHours)]);footer=['合计',rows.length+' 个项目',ctx.number(ctx.model.report.projectHours)];
    }else{
      const people=kind==='reported'?ctx.model.people.filter(p=>p.reported):ctx.model.people;
      if(kind==='baseline'){
        headers=['人员姓名','工号','岗位','标准可用工时（小时）'];rows=people.map(p=>[p.name,p.id,p.role,ctx.number(p.standardHours)]);footer=['合计',people.length+' 人','',ctx.model.available?ctx.number(ctx.sum(people.map(p=>p.standardHours))):'—'];
      }else{
        headers=['人员姓名','工号','项目工时（小时）','OverHead（小时）','批准工时（小时）',...(kind==='people'?['标准工时（小时）','负荷率']:[])];
        rows=people.map(p=>[p.name,p.id,ctx.number(p.projectHours),ctx.number(p.overheadHours),ctx.number(ctx.sum([p.projectHours,p.overheadHours])),...(kind==='people'?[ctx.number(p.standardHours),ctx.percentage(ctx.rate(p.projectHours,p.standardHours))]:[])]);
        const project=ctx.model.available?ctx.sum(people.map(p=>p.projectHours)):null,oh=ctx.model.available?ctx.sum(people.map(p=>p.overheadHours)):null,standard=ctx.model.available?ctx.sum(people.map(p=>p.standardHours)):null;
        footer=['合计',people.length+' 人',ctx.number(project),ctx.number(oh),ctx.number(project==null?null:ctx.sum([project,oh])),...(kind==='people'?[ctx.number(standard),ctx.percentage(ctx.rate(project,standard))]:[])];
      }
    }
    ctx.$('detailTitle').textContent=titles[kind];ctx.$('detailContext').textContent=ctx.model.unit+' · 2026-11-01 至 2026-11-03 · '+(ctx.model.available?'只读统计明细':'当前部门暂无数据');ctx.$('detailTable').innerHTML=ctx.tableHtml(headers,rows,footer);ctx.$('detailDialog').dataset.kind=kind;
    ctx.lastDetailTrigger=trigger;
    ctx.scrollLock={rootOverflow:document.documentElement.style.overflow,rootOverscroll:document.documentElement.style.overscrollBehavior,bodyOverflow:document.body.style.overflow,x:window.scrollX,y:window.scrollY};
    document.documentElement.style.overflow='hidden';document.documentElement.style.overscrollBehavior='none';document.body.style.overflow='hidden';
    ctx.$('detailDialog').showModal();ctx.$('closeDetail').focus({preventScroll:true});
  }

function closeDetail(){if(ctx.$('detailDialog').open)ctx.$('detailDialog').close();}
Object.assign(ctx,{tableHtml,openDetail,closeDetail});
}
