/** overview: feedback. Private page context; no cross-dashboard state. */
export function register(ctx) {
function toast(message){ctx.$('toast').textContent=message;ctx.$('toast').classList.add('show');ctx.lifecycle.clearTimeout(toast.timer);toast.timer=ctx.lifecycle.timeout(()=>ctx.$('toast').classList.remove('show'),2600);}

function showTooltip(el){if(ctx.$('detailDialog').open)return;ctx.tooltipOwner=el;const tip=ctx.$('globalTooltip');tip.textContent=el.dataset.tip;tip.classList.add('show');tip.setAttribute('aria-hidden','false');el.setAttribute('aria-describedby','globalTooltip');ctx.positionTooltip(el);}

function positionTooltip(el){const tip=ctx.$('globalTooltip'),r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;let x=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)),y=r.bottom+8;if(y+h>innerHeight-8)y=Math.max(8,r.top-h-8);tip.style.left=x+'px';tip.style.top=y+'px';}

function hideTooltip(){if(ctx.tooltipOwner)ctx.tooltipOwner.removeAttribute('aria-describedby');ctx.tooltipOwner=null;ctx.$('globalTooltip').classList.remove('show');ctx.$('globalTooltip').setAttribute('aria-hidden','true');}
Object.assign(ctx,{toast,showTooltip,positionTooltip,hideTooltip});
}
