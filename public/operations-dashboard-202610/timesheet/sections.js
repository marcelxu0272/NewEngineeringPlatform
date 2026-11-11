/** timesheet: sections. Private page context; no cross-dashboard state. */
export function register(ctx) {
function renderKpis(){
    ctx.$('effectiveDepartment').textContent=ctx.model.unit;
    ctx.$('scopeNote').textContent=ctx.state.unit==='全部板块'?'顶部为全部板块，当前展示咨询板块。':'仅展示当前部门的指标、负荷与人员。';
    ctx.$('approvedHours').textContent=ctx.number(ctx.model.report.approvedHours);ctx.$('overheadHours').textContent=ctx.number(ctx.model.report.overheadHours);ctx.$('standardHours').textContent=ctx.number(ctx.model.report.standardHours);ctx.$('baselineCount').textContent=ctx.model.report.baselineCount;ctx.$('reportedCount').textContent=ctx.model.report.reportedCount;ctx.$('reportLoad').textContent=ctx.percentage(ctx.model.report.rate);
    ctx.chartVisibility('miniForecastChart','miniEmpty',ctx.model.available);
    if(!ctx.model.available)return;
    const t=ctx.theme(),axes=ctx.commonAxes();
    ctx.initChart('miniForecastChart').setOption({...ctx.baseOption(),grid:{left:36,right:36,top:28,bottom:27,containLabel:false},tooltip:{...ctx.baseOption().tooltip,trigger:'axis',formatter:params=>{const f=ctx.model.forecasts[params[0].dataIndex];return ctx.monthLabel(f.month)+'<br/>负荷率：'+ctx.percentage(f.rate)+'<br/>已排总工时：'+ctx.number(f.assignedHours)+' EWH';}},xAxis:{...axes.x,type:'category',boundaryGap:false,data:ctx.MONTHS.map(m=>m.replace('-','.')),axisLabel:{color:t.muted,fontSize:11},axisLine:{show:false}},yAxis:{type:'value',min:0,max:ctx.axisMax(ctx.model.forecasts.map(f=>f.rate)),show:false},series:[{name:'负荷率',type:'line',data:ctx.model.forecasts.map(f=>f.rate),symbol:'circle',symbolSize:6,connectNulls:false,lineStyle:{color:t.primary,width:2},itemStyle:{color:t.primary},areaStyle:{color:t.primarySoft,opacity:1},label:{show:true,position:'top',formatter:p=>ctx.percentage(p.value),fontSize:12,color:t.primaryDark}}]},true);
  }

function renderTrend(){
    const historyMode=ctx.state.trendMode==='history';
    document.querySelectorAll('[data-trend-mode]').forEach(button=>{const on=button.dataset.trendMode===ctx.state.trendMode;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
    ctx.$('trendNote').textContent=historyMode?ctx.model.unit+' · 2026年6月至2027年2月；2026年11月实际数据截至11月3日':ctx.model.unit+' · 报告期逐日负荷：2026-11-01 至 2026-11-03';
    ctx.$('forecastLegend').hidden=!historyMode;
    ctx.chartVisibility('departmentTrendChart','trendEmpty',ctx.model.available);
    if(!ctx.model.available)return;
    const t=ctx.theme(),axes=ctx.commonAxes();
    const dates=historyMode?[...ctx.HISTORY_MONTHS,...ctx.MONTHS]:ctx.model.days.map(d=>d.date);
    const actual=historyMode?[...ctx.model.history.map(h=>h.rate),null,null,null]:ctx.model.days.map(d=>d.rate);
    const predicted=historyMode?[null,null,null,null,null,ctx.model.report.rate,...ctx.model.forecasts.map(f=>f.rate)]:[];
    const series=[{name:'实际负荷',type:'line',data:actual,symbol:'circle',symbolSize:7,lineStyle:{width:2.5,color:t.primary},itemStyle:{color:t.primary},connectNulls:false,markLine:ctx.referenceLine()}];
    if(historyMode)series.push({name:'预测负荷',type:'line',data:predicted,symbol:'emptyCircle',symbolSize:7,lineStyle:{width:2.5,type:'dashed',color:t.accent},itemStyle:{color:t.accent},connectNulls:false});
    ctx.initChart('departmentTrendChart').setOption({...ctx.baseOption(),grid:{left:48,right:24,top:25,bottom:38,containLabel:false},tooltip:{...ctx.baseOption().tooltip,trigger:'axis',formatter:params=>{const index=params[0].dataIndex;const item=historyMode?(index<6?ctx.model.history[index]:ctx.model.forecasts[index-6]):ctx.model.days[index];return ctx.escapeHtml(ctx.model.unit)+'<br/>'+ctx.escapeHtml(historyMode?ctx.monthLabel(dates[index])+(index===5?'（截至11月3日）':''):dates[index])+'<br/>'+(historyMode&&index>5?'预测负荷率':'实际负荷率')+'：'+ctx.percentage(item.rate)+'<br/>'+(historyMode&&index>5?'已排工时':'项目工时')+'：'+ctx.number(item.projectHours??item.assignedHours)+' '+(historyMode&&index>5?'EWH':'小时')+'<br/>可用工时：'+ctx.number(item.standardHours??item.availableHours)+' '+(historyMode&&index>5?'EWH':'小时');}},xAxis:{...axes.x,type:'category',boundaryGap:false,data:dates.map(d=>historyMode?d.replace('-','.') : d.slice(5)),axisLabel:{color:t.muted,fontSize:11,interval:0,rotate:0}},yAxis:{...axes.y,type:'value',max:ctx.axisMax([...actual,...predicted])},series},true);
  }

function renderForecast(){
    ctx.chartVisibility('departmentForecastChart','departmentEmpty',ctx.model.available);
    if(ctx.model.available)ctx.initChart('departmentForecastChart').setOption(ctx.barOption(ctx.model.forecasts,'department'),true);
    document.querySelectorAll('[data-forecast-month]').forEach(button=>{const on=button.dataset.forecastMonth===ctx.state.month;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
    const rows=ctx.getPersonnelRows(),show=rows.length>0;
    ctx.$('personnelCount').textContent=ctx.monthLabel(ctx.state.month)+' · '+(ctx.state.query?'匹配 ':'共 ')+rows.length+' 人';
    ctx.$('personnelEmpty').textContent=!ctx.model.available?'当前部门暂无人员预测数据':ctx.state.query?'未找到匹配人员，请调整姓名后查询。':'当前部门暂无人员预测数据';
    ctx.chartVisibility('personnelForecastChart','personnelEmpty',show);
    ctx.$('personnelForecastChart').style.height=Math.max(150,rows.length*37+48)+'px';
    if(show){ctx.initChart('personnelForecastChart').resize();ctx.charts.personnelForecastChart.setOption(ctx.barOption(rows,'personnel'),true);}
    ctx.$('tbdHours').textContent=ctx.model.available?ctx.number(ctx.selectedForecast().tbdHours)+' EWH':'—';
    ctx.$('exportSummary').disabled=!ctx.model.available;ctx.$('exportDetails').disabled=!show;
  }

function render(){ctx.renderKpis();ctx.renderTrend();ctx.renderForecast();ctx.resizeCharts();}
Object.assign(ctx,{renderKpis,renderTrend,renderForecast,render});
}
