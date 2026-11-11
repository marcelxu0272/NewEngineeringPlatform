/** overview: layout. Private page context; no cross-dashboard state. */
export function register(ctx) {
function syncPairRowVisibility(){
    const row=ctx.$('pairRow')||document.querySelector('.pair-row');
    if(!row)return;
    const show=ctx.state.unit==='全部板块';
    row.hidden=!show;
    if(show){
      row.style.removeProperty('display');
    }else{
      row.style.setProperty('display','none','important');
    }
    row.setAttribute('data-visible', show?'true':'false');
  }

function syncPeerRows(){
    const specs=[
      {root:ctx.$('kpiGrid'),prefer:2,sel:':scope > .kpi-card'},
      {root:ctx.$('cashMetrics'),prefer:3,sel:':scope > .cash-metric'},
      {root:ctx.$('riskMetrics'),prefer:2,sel:':scope > .risk-metric'},
      {root:ctx.$('pairRow'),prefer:2,sel:':scope > .panel'}
    ];
    const textWidth=node=>{
      const range=document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect().width;
    };
    const titleIntrinsic=title=>{
      const probe=title.cloneNode(true);
      probe.setAttribute('aria-hidden','true');
      probe.style.position='absolute';
      probe.style.visibility='hidden';
      probe.style.pointerEvents='none';
      probe.style.width='max-content';
      probe.style.minWidth='max-content';
      probe.style.maxWidth='none';
      probe.style.whiteSpace='nowrap';
      (title.parentElement||document.body).appendChild(probe);
      const w=Math.ceil(probe.getBoundingClientRect().width);
      probe.remove();
      return w;
    };
    const minContentWidth=el=>{
      const cs=getComputedStyle(el);
      const pad=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
      const border=(parseFloat(cs.borderLeftWidth)||0)+(parseFloat(cs.borderRightWidth)||0);
      let text=0;
      el.querySelectorAll('.segment button').forEach(n=>{text=Math.max(text,n.getBoundingClientRect().width);});
      el.querySelectorAll('.kpi-value, strong').forEach(n=>{
        if(n.closest('.segment')||n.closest('svg'))return;
        text=Math.max(text,textWidth(n));
      });
      el.querySelectorAll('.panel-title').forEach(n=>{text=Math.max(text,titleIntrinsic(n));});
      let sub=0;
      el.querySelectorAll('.kpi-sub-name, .kpi-sub-amount, .kpi-sub-pct').forEach(n=>{sub=Math.max(sub,textWidth(n));});
      const icon=el.querySelector(':scope > .mini-icon, :scope > .kpi-icon');
      const iconW=icon?icon.getBoundingClientRect().width:0;
      const gap=icon?(parseFloat(cs.columnGap||cs.gap)||8):0;
      const delta=el.querySelector(':scope > .kpi-delta');
      const deltaW=delta?delta.getBoundingClientRect().width+8:0;
      return Math.ceil(Math.max(text+deltaW,sub)+iconW+gap+pad+border+2);
    };
    specs.forEach(spec=>{
      const root=spec.root;
      if(!root)return;
      const hidden=root.hidden||getComputedStyle(root).display==='none';
      if(hidden){
        root.style.removeProperty('grid-template-columns');
        delete root.dataset.peerCols;
        return;
      }
      const items=[...root.querySelectorAll(spec.sel)];
      if(!items.length)return;
      const avail=root.clientWidth;
      if(avail<8)return;
      const gap=parseFloat(getComputedStyle(root).columnGap)||0;
      const minW=Math.max(1,...items.map(minContentWidth));
      let cols=Math.min(spec.prefer,items.length);
      while(cols>1&&(cols*minW+(cols-1)*gap)>avail+1)cols-=1;
      root.style.setProperty('grid-template-columns','repeat('+cols+',minmax(0,1fr))','important');
      root.dataset.peerCols=String(cols);
    });
  }

function hOutside(node,host,tol){
    if(!node||!host)return false;
    const b=node.getBoundingClientRect();
    const h=host.getBoundingClientRect();
    if(b.width<0.5)return false;
    return b.left<h.left-tol||b.right>h.right+tol;
  }

function relaxPairRow(){
    const root=ctx.$('pairRow');
    if(!root||root.hidden||getComputedStyle(root).display==='none')return false;
    const cols=Number(root.dataset.peerCols||0);
    if(cols<=1)return false;
    const tol=1;
    const clips=[...root.querySelectorAll(':scope > .panel')].some(panel=>{
      if(panel.scrollWidth>panel.clientWidth+tol)return true;
      const title=panel.querySelector('.panel-title');
      if(title&&title.scrollWidth>title.clientWidth+tol)return true;
      if(title&&[...title.querySelectorAll('.unit, .info-button, svg')].some(n=>ctx.hOutside(n,panel,tol)))return true;
      return [...panel.querySelectorAll('.highcharts-data-label')].some(lab=>ctx.hOutside(lab,lab.closest('.chart')||panel,tol));
    });
    if(!clips)return false;
    root.style.setProperty('grid-template-columns','minmax(0,1fr)','important');
    root.dataset.peerCols='1';
    return true;
  }

function reflowCharts(){
    Object.values(ctx.charts).forEach(c=>{
      if(!c||!c.container||!c.container.offsetWidth)return;
      c.setSize(undefined,undefined,false);
    });
  }

function applyPeerLayout(){
    ctx.syncPeerRows();
    ctx.reflowCharts();
    if(ctx.relaxPairRow())ctx.reflowCharts();
  }
Object.assign(ctx,{syncPairRowVisibility,syncPeerRows,hOutside,relaxPairRow,reflowCharts,applyPeerLayout});
}
