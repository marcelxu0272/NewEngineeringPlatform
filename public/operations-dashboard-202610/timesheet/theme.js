/** timesheet: theme. Private page context; no cross-dashboard state. */
export function register(ctx) {
function applyTheme(name){if(!ctx.THEMES[name])return;ctx.state.theme=name;Object.entries(ctx.theme()).forEach(([key,value])=>document.documentElement.style.setProperty('--'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value));document.documentElement.dataset.theme=name;ctx.render();}

function applyFilter(data){
    if(data.year!==2026 || (data.unit!=='全部板块'&&!ctx.MODELS.has(data.unit)))return;
    const changed=ctx.state.unit!==data.unit;
    ctx.state.unit=data.unit;ctx.state.effectiveUnit=data.unit==='全部板块'?ctx.DEFAULT_UNIT:data.unit;ctx.model=ctx.MODELS.get(ctx.state.effectiveUnit);
    if(changed){ctx.closeDetail();ctx.state.query='';ctx.$('personnelSearch').value='';ctx.$('exportStatus').textContent='';}
    ctx.render();
  }
Object.assign(ctx,{applyTheme,applyFilter});
}
