/** overview: theme. Private page context; no cross-dashboard state. */
export function register(ctx) {
function setTheme(name){
    ctx.state.theme=name;ctx.colors=ctx.THEMES[name]||ctx.THEMES.teal;
    for(const [key,value] of Object.entries(ctx.colors)) {
      const token=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
      document.documentElement.style.setProperty('--'+token,value);
      const rgb=value.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)).join(',');
      document.documentElement.style.setProperty('--'+token+'-rgb',rgb);
    }
    document.documentElement.dataset.theme=name;
    Highcharts.setOptions({chart:{backgroundColor:'transparent',style:{fontFamily:'"Microsoft YaHei", "PingFang SC", sans-serif',fontSize:'11px'},animation:false},title:{text:null},credits:{enabled:false},accessibility:{enabled:false},lang:{decimalPoint:'.',thousandsSep:','},legend:{itemStyle:{color:ctx.colors.muted,fontWeight:'normal',fontSize:'11px'},itemHoverStyle:{color:ctx.colors.primary}},tooltip:{backgroundColor:ctx.colors.surface,borderColor:ctx.colors.border,borderRadius:8,shadow:true,style:{color:ctx.colors.ink,fontSize:'12px'},padding:10,outside:true,useHTML:true},xAxis:{lineColor:ctx.colors.border,tickColor:ctx.colors.border,labels:{style:{color:ctx.colors.muted,fontSize:'11px'}}},yAxis:{gridLineColor:ctx.colors.grid,labels:{style:{color:ctx.colors.muted,fontSize:'10px'}},title:{text:null}},plotOptions:{series:{animation:false,states:{inactive:{opacity:.35}},dataLabels:{style:{textOutline:'none'}}}}});
    if(ctx.model) ctx.render();
  }

function applyHostTheme(name){
    if(!name||!ctx.THEMES[name])return;
    ctx.setTheme(name);
    if(ctx.themeSel)ctx.themeSel.value=name;
  }

function applyHostFilter(payload){
    if(!payload||typeof payload!=='object')return;
    ctx.state.year=2026; /* 锁 2026 */
    ctx.state.business='全部业务类型'; /* 业务类型废除 */
    if(typeof payload.unit==='string'&&payload.unit) ctx.state.unit=payload.unit;
    if(ctx.model) ctx.render();
  }
Object.assign(ctx,{setTheme,applyHostTheme,applyHostFilter});
}
