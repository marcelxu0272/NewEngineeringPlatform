/** overview: cash. Private page context; no cross-dashboard state. */
export function register(ctx) {
function cashValues(){return [ctx.sum(ctx.model.inflow),ctx.sum(ctx.model.outflow),ctx.model.totalNet];}

function renderCash(){
    const vals=ctx.cashValues();
    const names=['现金流入','现金流出','净现金流'];
    // demo 较上期%：流入/净额升好降坏；流出升坏降好
    const periodDeltas=[3.2,-2.1,4.6];
    const tones=['primary','primary',vals[2]<0?'danger':'primary']; // AC5: 流出卡亦用 primary tone，主金额见 amountColor
    const tips=[
      '银行现金流入总额，含经营、投资、筹资流入；与客户业务回款额口径不同。',
      '银行现金流出总额；副文案为较上期对比。',
      '净现金流 = 现金流入 − 现金流出。累计口径，年初至截止日。'
    ];
    ctx.$('cashMetrics').innerHTML=names.map((name,i)=>{
      const delta=periodDeltas[i];
      const up=delta>=0;
      const good = i===1 ? !up : up;
      const col = good ? ctx.colors.success : ctx.colors.danger;
      const arrow = up ? '↑' : '↓';
      const signed = (up?'+':'-') + ctx.pct(Math.abs(delta));
      let amountColor = ctx.colors.primary;
      if(i===2){
        if(vals[2]>0) amountColor = ctx.colors.success;
        else if(vals[2]<0) amountColor = ctx.colors.danger;
        else amountColor = ctx.colors.primary; /* AC5 零值=主题色 */
      }
      return `<button class="cash-metric tone-${tones[i]}" data-cash-detail="${i}" data-tip="${tips[i]} 点击查看明细。"><span class="mini-icon">${ctx.icon(i===2?'money':i===1?'briefcase':'shield')}</span><div><span class="metric-label">${name}</span><strong style="color:${amountColor}">${ctx.money(vals[i])}</strong><span class="metric-delta">较上期 <em style="color:${col}">${signed} ${arrow}</em></span></div></button>`;
    }).join('');
    const monthlyIn = ctx.model.inflow.slice();
    const monthlyOut = ctx.model.outflow.slice();
    const ytdNet = ctx.cum(ctx.model.net);
    // theme-tied column colors (follow active DASHBOARD theme)
    const inColor = ctx.colors.primary;
    const outColor = ctx.colors.accent || ctx.colors.primaryDark;
    ctx.chart('cashChart',{
      chart:{type:'column',spacing:[6,8,18,0]}, /* bottom spacing 留白 */
      legend:{enabled:true,align:'center',verticalAlign:'top',margin:7,symbolRadius:4,symbolHeight:8,symbolWidth:13,itemDistance:16},
      xAxis:{categories:Array.from({length:ctx.model.n},(_,i)=>(i+1)+'月'),crosshair:{color:ctx.colors.primarySoft,width:25},tickLength:0},
      yAxis:{labels:{formatter(){return Math.abs(this.value)>=10000?ctx.money(this.value/10000,1)+'万':ctx.money(this.value,0);}},plotLines:[{value:0,color:ctx.colors.faint,width:1}],tickAmount:6},
      tooltip:{shared:true,formatter(){
        const ps=this.points||[this],index=this.points?this.points[0].point.index:this.x;
        const ytd=ytdNet[index];
        let s=`<b>${ctx.state.year}年 ${index+1}月</b><br/>`;
        ps.forEach(p=>{
          const isLine=p.series.type==='line';
          s+=`<span style="color:${p.color}">●</span> ${isLine?('当年累计净现金流'):p.series.name} <b>${ctx.money(Math.abs(p.y))}</b> 万元<br/>`;
        });
        s+=`<div style="margin:5px 0;color:${ytd<0?ctx.colors.danger:ctx.colors.success}"><b>当年累计 ${ytd<0?'净流出':'净流入'} ${ctx.money(Math.abs(ytd))} 万元</b></div>`;
        return s+`<span style="color:${ctx.colors.muted}">点击数据点查看收支明细</span>`;
      }},
      plotOptions:{
        column:{grouping:false,borderWidth:0,borderRadius:2,groupPadding:.32,pointPadding:.08},
        series:{cursor:'pointer',point:{events:{click(){ctx.openCash(this.index,this.series.name==='当月流入'?'inflow':this.series.name==='当月流出'?'outflow':'net');}}}}
      },
      series:[
        {name:'当月流入',color:inColor,data:monthlyIn},
        {name:'当月流出',color:outColor,data:monthlyOut.map(v=>-v)},
        {
          name:'当年累计净现金流',
          type:'line',
          kdNow:true,
          color:ctx.colors.success,
          lineWidth:2.5,
          marker:{radius:3.5,lineWidth:0},
          zoneAxis:'y',
          zones:[{value:0,color:ctx.colors.danger},{color:ctx.colors.success}],
          data:ytdNet.map(v=>({y:v,color:v<0?ctx.colors.danger:ctx.colors.success,marker:{fillColor:v<0?ctx.colors.danger:ctx.colors.success}}))
        }
      ]
    });
  }
Object.assign(ctx,{cashValues,renderCash});
}
