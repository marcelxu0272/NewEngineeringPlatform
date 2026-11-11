/** overview: controller. Private page context; no cross-dashboard state. */
export function register(ctx) {
function render(){
    ctx.hideTooltip();ctx.model=ctx.buildModel();const asofEl=ctx.$('asofDate');if(asofEl)asofEl.textContent=`${ctx.state.year}-08-31`;
    ctx.syncPairRowVisibility();ctx.renderKpis();ctx.renderCash();ctx.renderRisk();if(ctx.state.unit==='全部板块'){ctx.renderContribution();ctx.renderTargets();}ctx.renderDelivery();ctx.renderAlerts();

    document.querySelectorAll('[data-contribution-dim]').forEach(b=>b.classList.toggle('active',b.dataset.contributionDim===ctx.state.dimension));
    document.querySelectorAll('[data-target-metric]').forEach(b=>b.classList.toggle('active',b.dataset.targetMetric===ctx.state.target));
    ctx.applyPeerLayout();if(ctx.projectDetail)ctx.refreshProjectDetails();document.body.dataset.ready='true';window.dashboard={state:ctx.state,model:ctx.model,charts:ctx.charts,THEMES:ctx.THEMES,DEMO_DATA:ctx.DEMO_DATA,METRICS:ctx.METRICS};
  }

function setUnit(name){ctx.state.unit=name;ctx.render();ctx.toast('已筛选：'+name);}
Object.assign(ctx,{render,setUnit});
}
