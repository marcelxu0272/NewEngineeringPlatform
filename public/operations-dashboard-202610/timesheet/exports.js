/** timesheet: exports. Private page context; no cross-dashboard state. */
export function register(ctx) {
function csvCell(value){let text=String(value??'');if(/^[=+@\-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}

function downloadCsv(kind){
    const f=ctx.selectedForecast(),rows=ctx.getPersonnelRows();
    if(!ctx.model.available || (kind==='details'&&!rows.length))return;
    const data=kind==='summary'?[['部门','预测年月','负荷率（%）','已排总工时（EWH）','可用总工时（EWH）','TBD工时（EWH）'],[ctx.model.unit,ctx.state.month,ctx.number(f.rate),ctx.number(f.assignedHours),ctx.number(f.availableHours),ctx.number(f.tbdHours)]]:[['部门','预测年月','姓名','工号','负荷率（%）','已排工时（EWH）','可用工时（EWH）'],...rows.map(row=>[ctx.model.unit,ctx.state.month,row.name,row.id,ctx.number(row.rate),ctx.number(row.assignedHours),ctx.number(row.availableHours)])];
    const csv='\uFEFF'+data.map(row=>row.map(ctx.csvCell).join(',')).join('\r\n')+'\r\n';
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=ctx.model.unit+'_'+ctx.state.month+'_'+(kind==='summary'?'部门工时汇总':'人员工时明细')+'.csv';document.body.appendChild(link);link.click();link.remove();ctx.lifecycle.timeout(()=>URL.revokeObjectURL(url),1000);ctx.$('exportStatus').textContent=ctx.monthLabel(ctx.state.month)+(kind==='summary'?'部门汇总已导出。':'人员明细已导出，共 '+rows.length+' 人。');
  }
Object.assign(ctx,{csvCell,downloadCsv});
}
