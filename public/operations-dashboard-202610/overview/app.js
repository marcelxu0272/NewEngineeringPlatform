import {register as registerMonthly} from './monthly.js';
import {createLifecycle} from '../shared/lifecycle.js';
import {attachHostBridge} from '../shared/host-bridge.js';
import {register as register0} from './model.js';
import {register as register1} from './theme.js';
import {register as register2} from './kpi.js';
import {register as register3} from './cash.js';
import {register as register4} from './risk.js';
import {register as register5} from './segments.js';
import {register as register6} from './delivery.js';
import {register as register7} from './alerts.js';
import {register as register8} from './charts.js';
import {register as register9} from './layout.js';
import {register as register10} from './dialogs.js';
import {register as register11} from './feedback.js';
import {register as register12} from './controller.js';
import * as data from './data.js';
import {THEMES} from './themes.js';
export function mount() {
 const ctx={lifecycle:createLifecycle()};
 registerMonthly(ctx);
 register0(ctx);
 register1(ctx);
 register2(ctx);
 register3(ctx);
 register4(ctx);
 register5(ctx);
 register6(ctx);
 register7(ctx);
 register8(ctx);
 register9(ctx);
 register10(ctx);
 register11(ctx);
 register12(ctx);
 ctx.lifecycle.onDispose(()=>Object.values(ctx.charts||{}).forEach(chart=>{if(chart?.destroy)chart.destroy();else chart?.dispose?.();}));
ctx.THEMES=THEMES;window.DASHBOARD_THEMES=THEMES;
ctx.KS=window.KpiSubgoals;
ctx.PD=window.OpsProjectDetails;
ctx.METRICS=data.METRICS;
ctx.DEMO_DATA=data.DEMO_DATA;
ctx.DEMO_SUBGOAL_WEIGHTS=data.DEMO_SUBGOAL_WEIGHTS;
ctx.state={year:2026,unit:'全部板块',business:'全部业务类型',theme:'teal',dimension:'department',target:'contract',showSubgoals:false};
ctx.colors=ctx.THEMES.teal;
ctx.charts={};
ctx.model=undefined;
ctx.tooltipOwner=null;
ctx.projectDetail=null;
ctx.$=id=>document.getElementById(id);
ctx.sum=a=>a.reduce((v,n)=>v+n,0);
ctx.money=(n,d=2)=>Highcharts.numberFormat(n,d,'.',',');
ctx.pct=(n,d=1)=>ctx.money(n,d)+'%';
ctx.icon=id=>`<svg class="icon" aria-hidden="true"><use href="#icon-${id}"/></svg>`;
ctx.safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
ctx.cum=a=>a.map((_,i)=>ctx.sum(a.slice(0,i+1)));
ctx.splitExact=(amount,weights)=>{const values=weights.map(w=>Math.round(amount*w*100)/100);values[values.length-1]=Math.round((amount-ctx.sum(values.slice(0,-1)))*100)/100;return values;};
ctx.lifecycle.listen(document,'pointerover',e=>{const el=e.target.closest('[data-tip]');if(el&&el!==ctx.tooltipOwner)ctx.showTooltip(el);});
ctx.lifecycle.listen(document,'pointerout',e=>{if(ctx.tooltipOwner&&!ctx.tooltipOwner.contains(e.relatedTarget))ctx.hideTooltip();});
ctx.lifecycle.listen(document,'focusin',e=>{const el=e.target.closest('[data-tip]');if(el)ctx.showTooltip(el);});
ctx.lifecycle.listen(document,'focusout',ctx.hideTooltip);
ctx.lifecycle.listen(document,'click',e=>{
    const b=e.target.closest('button,[data-kpi],[data-row]');if(!b)return;
    if(b.dataset.detailTab&&ctx.projectDetail){ctx.switchDetailTab(b.dataset.detailTab);}
    else if(b.id==='monthlyExport')ctx.exportMonthly();
    else if(b.dataset.detailPage&&ctx.projectDetail){ctx.projectDetail.page=Number(b.dataset.detailPage);ctx.paintProjectDetails();ctx.$('projectDetailPagination').querySelector('[aria-current="page"]')?.focus();}
    else if(b.id==='projectDetailExport'&&ctx.projectDetail)ctx.exportProjectDetails();
    else if(b.dataset.kpi)ctx.openKpi(b.dataset.kpi);
    else if(b.id==='kpiSubgoalSwitch'){ctx.state.showSubgoals=!ctx.state.showSubgoals;ctx.renderKpis();ctx.applyPeerLayout();}

    else if(b.dataset.contributionDim){ctx.state.dimension=b.dataset.contributionDim;ctx.render();}
    else if(b.dataset.targetMetric){ctx.state.target=b.dataset.targetMetric;document.querySelectorAll('[data-target-metric]').forEach(x=>x.classList.toggle('active',x.dataset.targetMetric===ctx.state.target));ctx.renderTargets();ctx.applyPeerLayout();return;}
    else if(b.dataset.cashDetail!==undefined)ctx.openCash(ctx.model.n-1,['inflow','outflow','net'][Number(b.dataset.cashDetail)]);
    else if(b.dataset.risk!==undefined){const i=+b.dataset.risk;if(i<2){ctx.openProjectDetails(i===0?'receivables':'wip');return;}ctx.openProjectDetails(i===2?'inventory':'revenue');}
    else if(b.dataset.row)ctx.openDepartment(b.dataset.row);
    else if(b.dataset.unit)ctx.setUnit(b.dataset.unit);
    else if(b.dataset.projectStatus)ctx.openProjects(b.dataset.projectStatus);
    else if(b.dataset.delivery!==undefined){const i=+b.dataset.delivery;if(i<2)ctx.openLoad(5,ctx.model.loadAnnual,ctx.model.loadMonthly);else ctx.openProjects(i===2?'逾期':'风险');}
    else if(b.dataset.alert!==undefined){const a=ctx.alerts()[+b.dataset.alert];ctx.showDialog(a.title,`<p class="dialog-description">${a.explain}</p><p>当前范围：${ctx.state.unit} / ${ctx.state.business}</p><button class="dialog-action" data-alert-action="${a.action}">查看相关明细 ${ctx.icon('chevron')}</button>`);}
    else if(b.dataset.alertAction){ctx.$('detailDialog').close();const a=b.dataset.alertAction;if(a==='receipt')ctx.openKpi('receipt');else if(a==='cash')ctx.openCash();else ctx.openProjects('风险');}
    else if(b.id==='moreAlerts')ctx.showDialog('经营异常预警 · 当前范围',ctx.table(['预警','说明','日期'],ctx.alerts().map(a=>[a.title,a.detail,a.date])));
    else if(b.id==='helpButton')ctx.help();
    else if(b.id==='closeDialog')ctx.$('detailDialog').close();
    else if(b.id==='resetButton'){Object.assign(ctx.state,{year:2026,unit:'全部板块',business:'全部业务类型',dimension:'department',target:'contract'});/* 壳级筛选：不再写 year/unit/business 下拉 */ ctx.state.year=2026;ctx.state.business='全部业务类型';ctx.render();document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.focus==='overview'));ctx.toast('已恢复默认筛选与视图');}
    else if(b.dataset.focus){document.querySelectorAll('.nav-button,.header-tabs [data-focus]').forEach(x=>x.classList.toggle('active',x.dataset.focus===b.dataset.focus));const id={overview:'kpiGrid',cash:'cashPanel',risk:'riskPanel',contribution:'contributionPanel',delivery:'deliveryPanel'}[b.dataset.focus],panel=ctx.$(id);if(panel){panel.classList.remove('focus-highlight');void panel.offsetWidth;panel.classList.add('focus-highlight');ctx.lifecycle.timeout(()=>panel.classList.remove('focus-highlight'),1800);}ctx.toast(b.dataset.focus==='overview'?'当前为公司运营总览':'已定位：'+b.textContent.trim());}
  });
ctx.lifecycle.listen(document,'keydown',e=>{if(e.key==='Escape')ctx.hideTooltip();if(['Enter',' '].includes(e.key)&&e.target.matches('[data-kpi],[data-row]')){e.preventDefault();e.target.click();}});
ctx.lifecycle.listen(document,'input',e=>{if(ctx.projectDetail&&e.target.id==='projectDetailSearch'){ctx.projectDetail.query=e.target.value;ctx.projectDetail.page=1;ctx.paintProjectDetails();}});
ctx.lifecycle.listen(document,'change',e=>{if(ctx.projectDetail&&e.target.id==='projectDetailUnit'){ctx.projectDetail.unit=e.target.value;ctx.projectDetail.page=1;ctx.paintProjectDetails();if(ctx.projectDetail.tab==='monthly')ctx.renderMonthly();}});
ctx.lifecycle.listen(ctx.$('detailDialog'),'close',()=>{if(!ctx.$('detailDialog').open){ctx.destroyMonthly();ctx.projectDetail=null;ctx.$('detailDialog').classList.remove('project-details');}});
ctx.themeSel=ctx.$('themeSelect');
if(ctx.themeSel){
    ctx.themeSel.innerHTML=Object.keys(ctx.THEMES).map(k=>`<option value="${ctx.safe(k)}">${({teal:'青绿',blue:'深蓝',wood:'暖棕'})[k]||ctx.safe(k)}主题</option>`).join('');
    ctx.lifecycle.listen(ctx.themeSel,'change',e=>{ctx.setTheme(e.target.value);ctx.toast('主题已切换');});
  }
attachHostBridge({onTheme:ctx.applyHostTheme,onFilter:ctx.applyHostFilter},ctx.lifecycle);
ctx.lifecycle.listen(ctx.$('detailDialog'),'click',e=>{if(e.target===ctx.$('detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
ctx.lifecycle.listen(window,'resize',()=>{ctx.hideTooltip();ctx.lifecycle.clearTimeout(window.resizeTimer);window.resizeTimer=ctx.lifecycle.timeout(()=>{ctx.applyPeerLayout();},80);});
ctx.themeFromQuery=new URLSearchParams(location.search).get('theme');
ctx.setTheme(ctx.themeFromQuery&&ctx.THEMES[ctx.themeFromQuery]?ctx.themeFromQuery:'blue');
ctx.render();
 return {update(context){if(ctx.lifecycle.disposed)return;if(ctx.applyHostTheme)ctx.applyHostTheme(context.theme);else ctx.applyTheme(context.theme);if(ctx.applyHostFilter)ctx.applyHostFilter(context);else ctx.applyFilter(context);},destroy:()=>ctx.lifecycle.dispose(),get disposed(){return ctx.lifecycle.disposed;}};
}
window.__boardRuntime?.destroy();
window.__boardRuntime=mount();
