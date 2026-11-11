/** hr: theme. Private page context; no cross-dashboard state. */
export function register(ctx) {
function applyTheme(name){if(!ctx.THEMES[name])return;ctx.state.theme=name;Object.entries(ctx.theme()).forEach(([key,value])=>document.documentElement.style.setProperty('--'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value));document.documentElement.dataset.theme=name;ctx.renderLoad();ctx.renderMap();if(ctx.$('dialogDispatchMap'))ctx.renderMap('dialogDispatchMap');if(ctx.$('dialogLoadChart'))ctx.renderLoad('dialogLoadChart');ctx.resizeCharts();}

function applyFilter(data){if(data.year!==2026)return;const valid=data.unit==='全部板块'||(ctx.S.units||[]).some(u=>data.unit===u.code+' '+u.name);if(!valid)return;if(ctx.state.unit!==data.unit){ctx.state.unit=data.unit;ctx.closeModal();ctx.render();}}
Object.assign(ctx,{applyTheme,applyFilter});
}
