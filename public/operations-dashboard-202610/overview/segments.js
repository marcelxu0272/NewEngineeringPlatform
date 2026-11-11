/** overview: segments. Private page context; no cross-dashboard state. */
export function register(ctx) {
function renderContribution(){
    const rows=[...ctx.model.depRows].sort((a,b)=>b.net-a.net);
    const cats=rows.map(r=>r.name);
    const data=rows.map(r=>({y:r.net,color:r.net>=0?ctx.colors.success:ctx.colors.danger,name:r.name}));
    const labelContext=document.createElement('canvas').getContext('2d');
    if(labelContext)labelContext.font='11px "Microsoft YaHei", "PingFang SC", sans-serif';
    const labelWidth=Math.ceil(Math.max(0,...cats.map(name=>labelContext?labelContext.measureText(name).width:name.length*11)))+4;
    ctx.chart('contributionChart',{
      chart:{type:'bar',spacing:[4,8,4,4],marginLeft:labelWidth+16,marginRight:52},
      xAxis:{categories:cats,reversed:true,tickLength:0,lineWidth:0,labels:{step:1,x:-8,style:{fontSize:'11px',color:ctx.colors.muted,width:labelWidth+'px',textOverflow:'none',whiteSpace:'nowrap'}}},
      yAxis:{title:{text:null},gridLineColor:ctx.colors.grid,labels:{style:{fontSize:'10px',color:ctx.colors.muted}},plotLines:[{value:0,color:ctx.colors.faint,width:1}]},
      legend:{enabled:false},
      tooltip:{formatter(){const v=this.y;return `<b>${this.point.name||this.x}</b><br/>净现金流贡献 <b style="color:${v>=0?ctx.colors.success:ctx.colors.danger}">${ctx.money(v)}</b> 万元<br/>点击查看板块明细`;}},
      plotOptions:{bar:{borderRadius:3,borderWidth:0,pointPadding:0.12,groupPadding:0.08,dataLabels:{enabled:true,formatter(){return ctx.money(this.y,1);},style:{fontSize:'10px',color:ctx.colors.ink,textOutline:'none'},crop:false,overflow:'allow'}},series:{cursor:'pointer',point:{events:{click(){ctx.openDepartment(rows[this.index].name);}}}}},
      series:[{name:'净现金流贡献',data}]
    });
  }

function renderTargets(){
    const key=ctx.state.target,label=(ctx.METRICS[key]&&ctx.METRICS[key].name)||{contract:'新签合同额',completed:'完成合同额',invoice:'完成开票额',receipt:'完成回款额'}[key]||key;
    const totalTarget=ctx.model.targets[key],contractBudget=ctx.model.targets.contract||1;
    /* 各 tab 按该指标完成率（实际/年度目标）降序，互不影响 */
    const rows=[...ctx.model.depRows].map(r=>{
      const tgt=totalTarget*(r.target/contractBudget),act=r[key]||0,rate=tgt?act/tgt*100:0;
      return Object.assign({},r,{_tgt:tgt,_act:act,_rate:rate});
    }).sort((a,b)=>b._rate-a._rate);
    const targets=rows.map(r=>r._tgt),actual=rows.map(r=>r._act),rates=rows.map(r=>r._rate);
    ctx.$('targetNote').textContent=`${label}年度目标达成率 · 全部板块（${rows.length}）· 按完成率降序`;
    // Reserve the measured width of the full SAS code and organization name in every tab.
    const labelContext=document.createElement('canvas').getContext('2d');
    if(labelContext)labelContext.font='11px "Microsoft YaHei", "PingFang SC", sans-serif';
    const labelWidth=Math.ceil(Math.max(0,...rows.map(r=>labelContext?labelContext.measureText(r.name).width:r.name.length*11)))+4;
    ctx.chart('targetChart',{chart:{type:'bar',spacing:[4,8,4,4],marginLeft:labelWidth+16,marginRight:52},xAxis:{categories:rows.map(r=>r.name),tickLength:0,lineWidth:0,labels:{step:1,x:-8,style:{fontSize:'11px',color:ctx.colors.muted,width:labelWidth+'px',textOverflow:'none',whiteSpace:'nowrap'}}},yAxis:{min:Math.min(0,...rates),max:Math.max(112,...rates.map(v=>v+8)),tickPositions:[0,50,100],labels:{format:'{value}%'},plotLines:[{value:100,color:ctx.colors.warning,width:1,dashStyle:'Dash',label:{text:'目标',style:{color:ctx.colors.warning,fontSize:'9px'},rotation:0,align:'right',y:10}}]},legend:{enabled:false},tooltip:{formatter(){const i=this.index;return `<b>${rows[i].name} · ${label}</b><br/>实际 ${ctx.money(actual[i])} 万元<br/>年度目标 ${ctx.money(targets[i])} 万元<br/>达成率 <b>${ctx.pct(this.y)}</b><br/>点击查看板块明细`;}},plotOptions:{bar:{borderRadius:3,borderWidth:0,pointPadding:.15,groupPadding:.04,dataLabels:{enabled:true,format:'{y:.1f}%',style:{fontSize:'9px',color:ctx.colors.primaryDark},crop:false,overflow:'allow'}},series:{cursor:'pointer',point:{events:{click(){ctx.openDepartment(rows[this.index].name);}}}}},series:[{name:'年度目标达成率',color:ctx.colors.primary,data:rates}]});
  }
Object.assign(ctx,{renderContribution,renderTargets});
}
