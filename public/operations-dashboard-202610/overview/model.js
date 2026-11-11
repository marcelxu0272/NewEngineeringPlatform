/** overview: model. Private page context; no cross-dashboard state. */
export function register(ctx) {
function buildModel(){
    const yearFactor=ctx.state.year===2026?1:.88, budgetFactor=ctx.state.year===2026?1:.94;
    const bizFactor=ctx.DEMO_DATA.businesses.find(x=>x[0]===ctx.state.business)?.[1]||1;
    const departments=ctx.DEMO_DATA.departments.filter(d=>ctx.state.unit==='全部板块'||d[1]===ctx.state.unit),unitFactor=ctx.sum(departments.map(d=>d[2])),factor=yearFactor*unitFactor*bizFactor;
    const totals=Object.fromEntries(Object.entries(ctx.DEMO_DATA.current).map(([k,v])=>[k,Math.round(v*(ctx.state.year===2026?1:0.92)*unitFactor*bizFactor*100)/100]));
    const targets=Object.fromEntries(Object.entries(ctx.METRICS).map(([k,v])=>[k,v.target*budgetFactor*unitFactor*bizFactor]));
    const n=8,inflow=ctx.DEMO_DATA.inflow.slice(0,n).map(v=>Math.round(v*factor*100)/100),outflow=ctx.DEMO_DATA.outflow.slice(0,n).map(v=>Math.round(v*factor*100)/100),net=inflow.map((v,i)=>Math.round((v-outflow[i])*100)/100);
    const totalNet=Math.round(ctx.sum(net)*100)/100;
    const weights=departments.map(d=>d[2]/unitFactor),allocated={};
    for(const key of ['contract','completed','receipt','invoice']) allocated[key]=ctx.splitExact(totals[key],weights);
    /* 板块现金流贡献演示：多数为正、少数为负，便于正绿负红 */
    const cashW=departments.map(d=>{
      if(d[0]==='SAS560 沈阳中心') return -0.035;
      if(d[0]==='SAS690 COII板块') return -0.055;
      if(d[0]==='SAS550 惠湛中心') return -0.025;
      return Math.max(0.02, d[2]);
    });
    const cashAbs=ctx.sum(cashW.map(Math.abs))||1;
    allocated.net=cashW.map(w=>Math.round(totalNet*(w/cashAbs)*100)/100);
    const depRows=departments.map((d,i)=>({name:d[0],group:d[1],contract:allocated.contract[i],completed:allocated.completed[i],receipt:allocated.receipt[i],invoice:allocated.invoice[i],net:allocated.net[i],target:allocated.contract[i]/d[3],rate:d[3]*100}));
    const rawBudget=ctx.sum(depRows.map(r=>r.target));
    depRows.forEach(r=>{r.target=targets.contract*r.target/rawBudget;r.rate=r.contract/r.target*100;});
    const projects=ctx.DEMO_DATA.projects.filter(p=>(ctx.state.unit==='全部板块'||ctx.DEMO_DATA.departments.find(d=>d[0]===p.department)[1]===ctx.state.unit)&&(ctx.state.business==='全部业务类型'||p.business===ctx.state.business));
    return {factor,yearFactor,unitFactor,bizFactor,totals,targets,inflow,outflow,net,totalNet,depRows,projects,n,receivables:Math.round(ctx.DEMO_DATA.receivables*factor*100)/100,wip:ctx.DEMO_DATA.wip*factor,inventory:ctx.DEMO_DATA.inventory*factor};
  }

function dimensionRows(){
    if(ctx.state.dimension==='department') return ctx.model.depRows;
    const list=ctx.state.dimension==='business'?(ctx.state.business==='全部业务类型'?ctx.DEMO_DATA.businesses:[[ctx.state.business,1]]):ctx.DEMO_DATA.customers;
    const allocated=Object.fromEntries(['contract','completed','receipt','invoice','net'].map(k=>[k,ctx.splitExact(k==='net'?ctx.model.totalNet:ctx.model.totals[k],list.map(d=>d[1]))]));
    const rows=list.map((d,i)=>({name:d[0],contract:allocated.contract[i],completed:allocated.completed[i],receipt:allocated.receipt[i],invoice:allocated.invoice[i],net:allocated.net[i],target:allocated.contract[i]/(.94-i*.027),rate:(.94-i*.027)*100}));
    const raw=ctx.sum(rows.map(r=>r.target));rows.forEach(r=>{r.target=ctx.model.targets.contract*r.target/raw;r.rate=r.contract/r.target*100;});return rows;
  }
Object.assign(ctx,{buildModel,dimensionRows});
}
