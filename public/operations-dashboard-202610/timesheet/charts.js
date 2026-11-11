/** timesheet: charts. Private page context; no cross-dashboard state. */
export function register(ctx) {
function initChart(id){if(!ctx.charts[id])ctx.charts[id]=echarts.init(ctx.$(id),null,{renderer:'svg'});return ctx.charts[id];}

function baseOption(){const t=ctx.theme();return {animation:false,color:[t.primary,t.accent],textStyle:{fontFamily:'Microsoft YaHei, PingFang SC, sans-serif',fontSize:12,color:t.ink},tooltip:{confine:true,backgroundColor:t.surface,borderColor:t.border,textStyle:{color:t.ink,fontSize:12}},aria:{enabled:true}};}

function chartVisibility(id,emptyId,show){ctx.$(id).hidden=!show;ctx.$(emptyId).hidden=show;if(show)ctx.initChart(id);}

function commonAxes(){const t=ctx.theme();return {x:{axisLine:{lineStyle:{color:t.border}},axisTick:{show:false},axisLabel:{color:t.muted,fontSize:12}},y:{min:0,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:t.muted,formatter:'{value}%',fontSize:11},splitLine:{lineStyle:{color:t.grid}}}};}

function referenceLine(){return {silent:true,symbol:'none',lineStyle:{color:ctx.theme().muted,type:'dashed',opacity:.5},label:{show:false},data:[{yAxis:100}]};}

function barOption(rows,kind){
    const t=ctx.theme(),axes=ctx.commonAxes();
    return {...ctx.baseOption(),grid:{left:kind==='department'?88:62,right:107,top:14,bottom:32,containLabel:false},tooltip:{...ctx.baseOption().tooltip,trigger:'axis',axisPointer:{type:'shadow'},formatter:params=>{const row=rows[params[0].dataIndex];return ctx.escapeHtml(ctx.model.unit)+'<br/>'+ctx.escapeHtml(kind==='department'?ctx.monthLabel(row.month):row.name)+'<br/>'+ctx.monthLabel(row.month)+'<br/>负荷率：'+ctx.percentage(row.rate)+'<br/>已排工时：'+ctx.number(row.assignedHours)+' EWH<br/>可用工时：'+ctx.number(row.availableHours)+' EWH';}},xAxis:{...axes.x,type:'value',min:0,max:ctx.axisMax(rows.map(r=>r.rate)),axisLabel:{color:t.muted,fontSize:10,formatter:'{value}%'},splitLine:{lineStyle:{color:t.grid}}},yAxis:{type:'category',inverse:true,data:rows.map(r=>kind==='department'?ctx.monthLabel(r.month):r.name),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:t.ink,fontSize:12,margin:10}},series:[{name:'负荷率',type:'bar',barMaxWidth:23,data:rows.map(r=>({value:r.rate??0,itemStyle:{color:r.rate>100?t.danger:t.primary}})),label:{show:true,position:'right',distance:9,formatter:params=>{const row=rows[params.dataIndex];return '{rate|'+ctx.percentage(row.rate)+'}\n{hours|'+ctx.number(row.assignedHours)+' EWH}';},rich:{rate:{color:t.ink,fontSize:12,fontWeight:600,lineHeight:17},hours:{color:t.muted,fontSize:10,lineHeight:16}}},itemStyle:{borderRadius:[0,3,3,0]},markLine:{silent:true,symbol:'none',lineStyle:{color:t.muted,type:'dashed',opacity:.45},label:{show:false},data:[{xAxis:100}]}}]};
  }
Object.assign(ctx,{initChart,baseOption,chartVisibility,commonAxes,referenceLine,barOption});
}
