/** hr: charts. Private page context; no cross-dashboard state. */
export function register(ctx) {
function ensureChart(id) { const host=ctx.$(id); if(!host || host.clientWidth===0 || !window.echarts)return null; if(!ctx.charts[id])ctx.charts[id]=echarts.init(host,null,{renderer:'svg'}); return ctx.charts[id]; }

function renderMap(id='dispatchMap') {
    if(!ctx.chinaReady)return; const chart=ctx.ensureChart(id); if(!chart)return; const t=ctx.theme(),points=ctx.mapPoints();
    chart.setOption({animation:false,backgroundColor:'transparent',tooltip:{confine:true,borderColor:t.border,backgroundColor:t.surface,textStyle:{color:t.ink,fontSize:12},formatter:params=>{const p=params.data;return p?ctx.escape(p.city||p.name)+'<br/>来源项目数：'+ctx.fmt(p.count??p.projects??p.total??p.value?.[2])+(p.people!=null?'<br/>派遣人数：'+ctx.fmt(p.people)+' 人':'')+'<br/>示意点位：城市中心':ctx.escape(params.name);}},geo:{map:'hrChina',roam:true,zoom:ctx.state.mapZoom,layoutCenter:['50%','50%'],layoutSize:'105%',label:{show:false},itemStyle:{areaColor:t.primarySoft,borderColor:t.border,borderWidth:.7},emphasis:{label:{show:true,color:t.ink,fontSize:11},itemStyle:{areaColor:t.accent,opacity:.6}}},series:[{name:'项目派遣',type:'scatter',coordinateSystem:'geo',symbol:'pin',symbolSize:23,itemStyle:{color:t.primary,opacity:.9},data:points}]},true);
    chart.off('click');chart.on('click',p=>{if(p.componentType==='series')ctx.openMapRegion(p.data,null);});
    chart.off('georoam');chart.on('georoam',()=>{ctx.state.mapZoom=chart.getOption().geo[0].zoom;ctx.$('mapZoom').textContent=ctx.fmt(ctx.state.mapZoom*100)+'%';});
  }

function renderLoad(id='loadRateChart') {
    const series=ctx.S.loadSeries || [];
    const hasData=Array.isArray(series)&&series.length>0;
    if(id==='loadRateChart'){ctx.$('loadRateChart').hidden=!hasData;ctx.$('loadEmpty').hidden=hasData;ctx.$('loadScope').textContent='全公司负荷分析 · 来源快照，不按组织比例分摊';}
    if(!hasData){
      if(id==='loadRateChart') ctx.$('loadEmpty').innerHTML='来源负荷图的原始数值尚未取得。<br/><a href="https://projectszone.woodchina.com/Project/HumanResources/HumanResourcesDashboardIndex#loadRateChart" target="_blank" rel="noopener noreferrer">查看来源负荷分析 ↗</a>';
      if(id==='loadRateChart' && ctx.S.loadImage){
        ctx.$('loadRateChart').hidden=false;ctx.$('loadEmpty').hidden=true;
        ctx.$('loadRateChart').innerHTML='<img src="'+ctx.escape(ctx.S.loadImage)+'" alt="来源负荷率分析：新材料板块、沈阳中心、项目管理服务部、银川中心、工艺设备室、土建室，6月至11月" style="width:100%;height:100%;object-fit:contain;background:white" />';
        ctx.$('loadScope').textContent='来源原图 · 2026-11-06采集，保留原图曲线与图例；未推算点值';
      }
      return;
    }
    const chart=ctx.ensureChart(id);if(!chart)return;const t=ctx.theme();
    let labels,dataSeries;
    if(series[0]?.data){labels=ctx.S.loadLabels || series[0].labels || [];dataSeries=series.map((s,i)=>({name:s.name||'负荷率',type:s.type||'bar',data:s.data,itemStyle:{color:[t.primary,t.accent,t.success][i%3]},barMaxWidth:24}));}
    else {labels=series.map(s=>s.name||s.department||s.label||s.month);dataSeries=[{name:'负荷率',type:'bar',data:series.map(s=>s.value??s.rate??s.load),itemStyle:{color:t.primary},barMaxWidth:24}];}
    const max=Math.max(120,...dataSeries.flatMap(s=>s.data.map(d=>Number(typeof d==='object'?d.value:d)||0)));
    chart.setOption({animation:false,textStyle:{fontFamily:'Microsoft YaHei, sans-serif'},tooltip:{trigger:'axis',confine:true,valueFormatter:v=>ctx.pct(v),textStyle:{fontSize:12,color:t.ink},backgroundColor:t.surface,borderColor:t.border},legend:{bottom:0,textStyle:{fontSize:11,color:t.muted}},grid:{left:46,right:20,top:24,bottom:72},xAxis:{type:'category',data:labels,axisLabel:{color:t.muted,fontSize:10,interval:0,rotate:labels.some(x=>String(x).length>5)?25:0},axisLine:{lineStyle:{color:t.border}},axisTick:{show:false}},yAxis:{type:'value',min:0,max:Math.ceil(max/25)*25,axisLabel:{formatter:'{value}%',color:t.muted,fontSize:10},splitLine:{lineStyle:{color:t.grid}}},series:dataSeries},true);
  }

function resizeCharts(){if(ctx.pendingResize)return;ctx.pendingResize=true;ctx.lifecycle.frame(()=>{ctx.pendingResize=false;Object.entries(ctx.charts).forEach(([id,chart])=>{const host=ctx.$(id);if(host&&host.clientWidth>0)chart.resize();});if(ctx.chinaReady&&!ctx.charts.dispatchMap)ctx.renderMap();if(ctx.chinaReady&&ctx.$('dialogDispatchMap')&&!ctx.charts.dialogDispatchMap)ctx.renderMap('dialogDispatchMap');if((ctx.S.loadSeries||[]).length&&!ctx.charts.loadRateChart)ctx.renderLoad();if((ctx.S.loadSeries||[]).length&&ctx.$('dialogLoadChart')&&!ctx.charts.dialogLoadChart)ctx.renderLoad('dialogLoadChart');});}

function disposeDialogCharts(){for(const id of Object.keys(ctx.charts).filter(id=>id.startsWith('dialog'))){ctx.charts[id].dispose();delete ctx.charts[id];}}
Object.assign(ctx,{ensureChart,renderMap,renderLoad,resizeCharts,disposeDialogCharts});
}
