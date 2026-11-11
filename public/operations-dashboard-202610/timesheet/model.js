/** timesheet: model. Private page context; no cross-dashboard state. */
export function register(ctx) {
function createModel(config) {
    const available = config.available !== false;
    const capacities = [24,24,16,24,24,8], actual = [23,21,12,0,18,4], overhead = [1,2,0,0,3,2], futureRates = [1.18,.94,.68,0,.82,.53];
    const people = config.names.map((name,i) => {
      const projectHours = ctx.round(actual[i] * config.factor), overheadHours = ctx.round(overhead[i] * config.factor);
      const person = {id:config.unit.split(' ')[0] + '-' + String(i+1).padStart(3,'0'),name,role:i===0?'项目负责人':'工程师',reported:i!==3,standardHours:config.zeroCapacity?0:capacities[i],projectHours,overheadHours};
      person.forecast = ctx.MONTHS.map((month,m) => {
        const availableHours = config.zeroCapacity?0:ctx.round([176,168,144][m]*capacities[i]/24);
        const assignedHours = ctx.round(availableHours * Math.max(0,futureRates[i] + (i===3?0:[0,.035,-.075][m])) * config.factor);
        return {month,availableHours,assignedHours,rate:ctx.rate(assignedHours,availableHours)};
      });
      return person;
    });
    const projectHours = available?ctx.sum(people.map(p=>p.projectHours)):null;
    const overheadHours = available?ctx.sum(people.map(p=>p.overheadHours)):null;
    const standardHours = available?ctx.sum(people.map(p=>p.standardHours)):null;
    const report = {projectHours,overheadHours,approvedHours:available?ctx.sum([projectHours,overheadHours]):null,standardHours,rate:ctx.rate(projectHours,standardHours),baselineCount:people.length,reportedCount:people.filter(p=>p.reported).length};
    const forecasts = ctx.MONTHS.map((month,m) => {
      const assignedHours = available?ctx.sum(people.map(p=>p.forecast[m].assignedHours)):null;
      const availableHours = available?ctx.sum(people.map(p=>p.forecast[m].availableHours)):null;
      return {month,assignedHours,availableHours,rate:ctx.rate(assignedHours,availableHours),tbdHours:0};
    });
    const days = available?['2026-11-01','2026-11-02','2026-11-03'].map((date,d)=>{
      const project = d<2?ctx.round(projectHours*[.28,.36][d]):ctx.round(projectHours-ctx.round(projectHours*.28)-ctx.round(projectHours*.36));
      const standard = d<2?ctx.round(standardHours/3):ctx.round(standardHours-2*ctx.round(standardHours/3));
      return {date,projectHours:project,standardHours:standard,rate:ctx.rate(project,standard)};
    }):[];
    const history = available?ctx.HISTORY_MONTHS.map((month,m)=>{
      if(m===5) return {month,projectHours,standardHours,rate:report.rate};
      const standard = config.zeroCapacity?0:ctx.sum(people.map(p=>p.standardHours))*[21,23,21,22,21][m]/3;
      const hours = ctx.round(standard*[.72,.81,.77,.91,.84][m]*config.factor);
      return {month,projectHours:hours,standardHours:ctx.round(standard),rate:ctx.rate(hours,standard)};
    }):[];
    const firstProject = projectHours == null?null:ctx.round(projectHours*.65);
    const projects = available?[{code:'D26-'+config.unit.slice(3,6)+'01',name:'方案咨询项目',projectHours:firstProject},{code:'D26-'+config.unit.slice(3,6)+'02',name:'工程设计项目',projectHours:ctx.round(projectHours-firstProject)}]:[];
    return {unit:config.unit,available,report,people,forecasts,days,history,projects};
  }

function selectedForecast(){return ctx.model.forecasts.find(f=>f.month===ctx.state.month);}

function getPersonnelRows(){
    return ctx.model.people.filter(p=>p.name.includes(ctx.state.query)).map(p=>({...p,...p.forecast.find(f=>f.month===ctx.state.month)})).sort((a,b)=>{
      if(a.rate==null && b.rate!=null) return 1;
      if(a.rate!=null && b.rate==null) return -1;
      const diff = (a.rate||0)-(b.rate||0);
      return (ctx.state.sort==='asc'?diff:-diff) || a.id.localeCompare(b.id);
    });
  }
Object.assign(ctx,{createModel,selectedForecast,getPersonnelRows});
}
