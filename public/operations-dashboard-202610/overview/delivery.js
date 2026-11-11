/** overview: delivery. Private page context; no cross-dashboard state. */
export function register(ctx) {
function renderDelivery(){
    const projects=ctx.model.projects,risks=projects.filter(p=>p.status==='风险').length,overdue=projects.filter(p=>p.status==='逾期').length;
    const shift=(ctx.state.unit==='全部板块'?0:((ctx.DEMO_DATA.departments.findIndex(d=>d[1]===ctx.state.unit)%5)-2)*0.4)+(ctx.state.year===2026?0:-2.35);
    const annual=ctx.DEMO_DATA.annualLoad.map(v=>Math.min(100,v+shift)),monthly=ctx.DEMO_DATA.monthlyLoad.map(v=>Math.min(100,v+shift));
    ctx.model.loadAnnual=annual;ctx.model.loadMonthly=monthly;
    ctx.$('annualLoadVal').textContent=ctx.pct(annual.at(-1),2);
    ctx.$('annualLoadSub').textContent=ctx.state.year===2026?'较上期 +2.5% ↑':'较上期 —';
    ctx.$('monthlyLoadVal').textContent=ctx.pct(monthly.at(-1),2);
    ctx.$('monthlyLoadSub').textContent='较上期 '+ctx.pct((monthly.at(-1)-monthly.at(-2))/monthly.at(-2)*100)+' ↑';
    ctx.chart('loadChart',{chart:{type:'line',spacing:[0,3,0,0],margin:[18,6,21,43]},legend:{enabled:true,floating:true,align:'right',verticalAlign:'top',y:-7,margin:0,itemStyle:{fontSize:'9px'},symbolWidth:14,itemDistance:10},xAxis:{categories:Array.from({length:6},(_,i)=>(ctx.model.n-5+i)+'月'),tickLength:0,labels:{y:15,style:{fontSize:'10px'}}},yAxis:{min:60,max:100,tickPositions:[60,80,100],labels:{format:'{value}%',x:-5,style:{textOverflow:'none'}}},responsive:{rules:[{condition:{maxHeight:85},chartOptions:{yAxis:{min:70,startOnTick:false,endOnTick:false,tickPositions:[80,100]}}}]},tooltip:{shared:true,formatter(){return `<b>${this.x+ctx.model.n-5}月负荷率</b><br/>`+(this.points||[this]).map(p=>`<span style="color:${p.color}">●</span> ${p.series.name} <b>${ctx.pct(p.y,2)}</b>`).join('<br/>');}},plotOptions:{series:{marker:{radius:2.5},lineWidth:2,cursor:'pointer',point:{events:{click(){ctx.openLoad(this.index,annual,monthly);}}}}},series:[{name:'年度负荷率',color:ctx.colors.primary,data:annual},{name:'当月负荷率',color:ctx.colors.accent,data:monthly}]});
    const counts=[projects.length-risks-overdue,risks,overdue],labels=['正常','风险','逾期'],palette=[ctx.colors.primary,ctx.colors.warning,ctx.colors.danger];
    ctx.$('deliveryCenter').innerHTML=`<strong>${projects.length}</strong><span>在管项目</span>`;
    ctx.$('deliveryLegend').innerHTML=labels.map((l,i)=>`<button class="legend-row" data-project-status="${l}" data-tip="${l}项目${counts[i]}项，点击查看项目清单。"><i style="background:${palette[i]}"></i><span>${l}</span><b>${counts[i]}</b></button>`).join('');
    ctx.chart('deliveryChart',{chart:{type:'pie',spacing:[0,0,0,0]},legend:{enabled:false},tooltip:{formatter(){return `<b>${this.name}</b> ${this.y}项<br/>占全部项目 ${ctx.pct(this.percentage)}<br/>点击查看项目清单`;}},plotOptions:{pie:{innerSize:'78%',size:'100%',slicedOffset:0,borderWidth:0,dataLabels:{enabled:false},cursor:'pointer',point:{events:{click(){ctx.openProjects(this.name);}}}}},series:[{name:'交付状态',data:labels.map((name,i)=>({name,y:counts[i],color:palette[i]}))}]});
  }
Object.assign(ctx,{renderDelivery});
}
