import {MONTHLY_METRICS} from './monthly-model.js';
/** overview: dialogs. Private page context; no cross-dashboard state. */
export function register(ctx) {
function showDialog(title,content,footer='数据为交互演示样例，金额单位：万元。'){
    ctx.destroyMonthly();ctx.projectDetail=null;ctx.$('detailDialog').classList.remove('project-details');
    ctx.hideTooltip();Object.values(ctx.charts).forEach(c=>c.tooltip.hide(0));ctx.$('dialogTitle').textContent=title;ctx.$('dialogContent').innerHTML=content;ctx.$('dialogFooter').textContent=footer;ctx.$('detailDialog').showModal();ctx.$('closeDialog').focus();
  }

function table(headers,rows){return `<table class="detail-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="empty-state">当前筛选范围内暂无记录</td></tr>`}</tbody></table>`;}

function projectDetailName(key){return MONTHLY_METRICS[key]?.[0];}

function projectDetailRows(key){
    const amount=ctx.METRICS[key]?ctx.model.totals[key]:ctx.model[key];
    return ctx.PD.makeRows({key,year:ctx.state.year,displayAmount:ctx.money(amount),allUnits:ctx.DEMO_DATA.departments.map(d=>d[0]),units:ctx.DEMO_DATA.departments.filter(d=>ctx.state.unit==='全部板块'||d[1]===ctx.state.unit).map(d=>({name:d[0],weight:Math.round(d[2]*10000)}))});
  }

function currentProjectRows(){return ctx.PD.filterRows(ctx.projectDetail.rows,ctx.projectDetail.unit,ctx.projectDetail.query);}

function refreshProjectDetails(){
    ctx.destroyMonthly();ctx.projectDetail.rows=MONTHLY_METRICS[ctx.projectDetail.key][2]?ctx.projectDetailRows(ctx.projectDetail.key):[];ctx.prepareMonthly();
    if(ctx.projectDetail.unit&&!ctx.projectDetail.units.includes(ctx.projectDetail.unit))ctx.projectDetail.unit='';
    const options=ctx.projectDetail.units;
    const headers=[...ctx.PD.HEADERS,...(ctx.projectDetail.key==='contract'?['类型']:[])];
    const widths=[100,170,130,100,100,150,105,105,145,...(ctx.projectDetail.key==='contract'?[70]:[])];
    const widthTotal=widths.reduce((sum,width)=>sum+width,0);
    ctx.$('dialogContent').innerHTML=`<div class="detail-tabs" role="tablist" aria-label="明细类型">${MONTHLY_METRICS[ctx.projectDetail.key][2]?'<button role="tab" data-detail-tab="project">项目明细</button>':''}<button role="tab" data-detail-tab="monthly">月度明细</button></div><div class="project-detail-filters"><label for="projectDetailUnit">管理归属：<select id="projectDetailUnit" aria-label="管理归属"><option value="">全部</option>${options.map(unit=>`<option value="${ctx.safe(unit)}"${unit===ctx.projectDetail.unit?' selected':''}>${ctx.safe(unit)}</option>`).join('')}</select></label><input id="projectDetailSearch" class="project-detail-search" aria-label="搜索项目明细" placeholder="项目编号/项目名称/项目经理/甲方名称" value="${ctx.safe(ctx.projectDetail.query)}"></div><div id="projectPanel" role="tabpanel"><div id="projectDetailMeta" class="project-detail-meta" aria-live="polite"></div><div class="project-detail-scroll"><table class="project-detail-table"><colgroup>${widths.map(width=>`<col style="width:${width/widthTotal*100}%">`).join('')}</colgroup><thead><tr>${headers.map((header,i)=>`<th${i===8?' class="project-detail-amount"':i===9?' class="project-detail-type"':''}>${ctx.safe(header)}</th>`).join('')}</tr></thead><tbody id="projectDetailBody"></tbody></table></div><div class="project-detail-actions"><button id="projectDetailExport" class="dialog-action">导出</button><nav id="projectDetailPagination" class="project-detail-pagination" aria-label="项目明细分页"></nav></div></div><div id="monthlyPanel" role="tabpanel"></div>`;
    ctx.paintProjectDetails();if(!MONTHLY_METRICS[ctx.projectDetail.key][2])ctx.$('projectPanel').remove();ctx.switchDetailTab(ctx.projectDetail.tab);
  }

function paintProjectDetails(){
    if(!ctx.$('projectDetailBody'))return;
    const rows=ctx.currentProjectRows(),pageSize=10,pages=Math.max(1,Math.ceil(rows.length/pageSize));
    ctx.projectDetail.page=Math.max(1,Math.min(pages,ctx.projectDetail.page));
    const withType=ctx.projectDetail.key==='contract',start=(ctx.projectDetail.page-1)*pageSize;
    ctx.$('projectDetailBody').innerHTML=rows.length?rows.slice(start,start+pageSize).map(row=>`<tr data-project-id="${ctx.safe(row.id)}">${ctx.PD.rowCells(row,withType).map((value,i)=>`<td title="${ctx.safe(i===8?ctx.money(row.amountCents/100):value)}"${i===0?' class="project-detail-code"':i===8?' class="project-detail-amount"':i===9?' class="project-detail-type"':''}>${ctx.safe(i===8?ctx.money(row.amountCents/100):value)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${withType?10:9}" class="empty-state">当前筛选范围内暂无项目明细</td></tr>`;
    ctx.$('projectDetailMeta').innerHTML=`演示项目明细 · 当前范围：${ctx.safe(ctx.state.unit)} · 筛选合计 <strong>${ctx.money(rows.reduce((sum,row)=>sum+row.amountCents,0)/100)}</strong> 元`;
    const pageNumbers=Array.from(new Set([1,ctx.projectDetail.page-1,ctx.projectDetail.page,ctx.projectDetail.page+1,pages])).filter(page=>page>=1&&page<=pages).sort((a,b)=>a-b);
    ctx.$('projectDetailPagination').innerHTML=`<span class="project-detail-count">共 ${rows.length} 条</span><button data-detail-page="${ctx.projectDetail.page-1}" aria-label="上一页"${ctx.projectDetail.page===1?' disabled':''}>‹</button>`+pageNumbers.map((page,i)=>`${i&&page-pageNumbers[i-1]>1?'<span>…</span>':''}<button data-detail-page="${page}"${page===ctx.projectDetail.page?' aria-current="page"':''} aria-label="第${page}页">${page}</button>`).join('')+`<button data-detail-page="${ctx.projectDetail.page+1}" aria-label="下一页"${ctx.projectDetail.page===pages?' disabled':''}>›</button><span>第${ctx.projectDetail.page}/${pages}页</span>`;
    const scroller=ctx.$('projectDetailBody').closest('.project-detail-scroll');if(scroller)scroller.scrollTop=0;
  }

function openProjectDetails(key){
    ctx.showDialog((MONTHLY_METRICS[key]?.[0]||ctx.projectDetailName(key))+'明细','','演示数据，未接真实系统。项目明细单位：元；月度明细单位：万元。累计金额或末期余额对应主卡。');
    ctx.projectDetail={key,rows:[],unit:'',query:'',page:1,tab:MONTHLY_METRICS[key][2]?'project':'monthly'};ctx.$('detailDialog').classList.add('project-details');ctx.refreshProjectDetails();
  }

function exportProjectDetails(){
    const blob=new Blob([ctx.PD.csv(ctx.currentProjectRows(),ctx.projectDetail.key==='contract')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=ctx.projectDetailName(ctx.projectDetail.key)+'明细_'+ctx.state.year+'_演示.csv';link.click();ctx.lifecycle.timeout(()=>URL.revokeObjectURL(url),0);
  }

function openKpi(key){ctx.openProjectDetails(key);}

function openCash(index=ctx.model.n-1,key='net'){ctx.openProjectDetails(key);ctx.projectDetail.month=index+1;ctx.renderMonthly();}

function openDepartment(name){let row=ctx.dimensionRows().find(r=>r.name===name)||ctx.model.depRows.find(r=>r.name===name);if(!row)return;ctx.showDialog(name+' · 板块明细',`<p class="dialog-description">净现金流贡献为该板块同期现金流贡献（演示拆分）。合同/开票/回款为所选年累计口径。</p>`+ctx.table(['指标','金额 / 比率'],[['净现金流贡献',ctx.money(row.net)+' 万元'],['新签合同额',ctx.money(row.contract)+' 万元'],['完成合同额',ctx.money(row.completed||0)+' 万元'],['完成开票额',ctx.money(row.invoice)+' 万元'],['完成回款额',ctx.money(row.receipt)+' 万元'],['合同额占比',ctx.pct(row.contract/ctx.model.totals.contract*100)],['合同目标达成',ctx.pct(row.rate)]]));}

function openProjects(status=null){let rows=ctx.model.projects.filter(p=>!status||p.status===status);ctx.showDialog((status?status+'项目':'项目交付')+' · 清单',ctx.table(['项目名称','负责板块','状态','交付节点','计划日期'],rows.map(p=>[ctx.safe(p.name),p.department,p.status,p.milestone,p.due.replace('2026',String(ctx.state.year))])),'演示项目状态与环图、图例数量一致；风险项目与逾期项目分别统计，风险不等于逾期。');}

function openLoad(i,annual,monthly){ctx.showDialog(`${ctx.state.year}年${ctx.model.n-5+i}月 · 生产负荷率`,`<p class="dialog-description">年度负荷率 = 已排定年度工时 ÷ 年度可用工时；当月负荷率 = 当月已排定工时 ÷ 当月可用工时。两条曲线采用不同时间口径。</p>`+ctx.table(['月份','年度负荷率','当月负荷率'],annual.map((v,j)=>[`${ctx.model.n-5+j}月`,ctx.pct(v,2),ctx.pct(monthly[j],2)])));}

function help(){ctx.showDialog('看板使用说明',`<div class="help-grid"><div><h3>筛选与联动</h3><p>切换年度、板块，经营金额、现金流、板块现金流贡献及项目清单同步更新；板块目标达成页签仅切换本区。</p></div><div><h3>图表探索</h3><p>悬停查看精确数值；点击现金流、目标达成和交付环图查看明细。现金流与负荷图的图例支持显隐。</p></div><div><h3>模块区分</h3><p>板块现金流贡献仅展示各板块净现金流（正绿负红、按值排序）；板块目标达成四个页签对齐顶部 KPI，切换只影响本区进度图。</p></div><div><h3>统一主题</h3><p>页面顶部（宿主标题栏）可切换青绿、深蓝、暖棕主题；整树看板同步换色。</p></div></div><p class="dialog-description">原图为AI生成，原型已重建中文文字，并统一金额、百分比、项目状态和累计口径。所有业务数据均为演示样例，未连接真实系统。</p>`,'数据时间：2026年样例截至8月31日；2025年对比样例截至8月31日。');}
Object.assign(ctx,{showDialog,table,projectDetailName,projectDetailRows,currentProjectRows,refreshProjectDetails,paintProjectDetails,openProjectDetails,exportProjectDetails,openKpi,openCash,openDepartment,openProjects,openLoad,help});
}
