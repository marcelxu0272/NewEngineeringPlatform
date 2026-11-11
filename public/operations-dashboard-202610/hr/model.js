/** hr: model. Private page context; no cross-dashboard state. */
export function register(ctx) {
function orgValue(row) { return row.departmentCode || row.unitCode || row.department || row.unit || row.sourceDepartment || null; }

function matchesUnit(row) {
    if (ctx.state.unit === '全部板块') return true;
    const u = ctx.unitInfo(), v = ctx.orgValue(row);
    return !!u && (v === u.code || v === u.name || v === u.code + ' ' + u.name);
  }

function scoped(list) {
    list = Array.isArray(list) ? list : [];
    const global = !list.some(ctx.orgValue);
    return {global,rows:ctx.state.unit === '全部板块' || global ? list : list.filter(ctx.matchesUnit)};
  }

function mapPoints() {
    const list=(ctx.S.mapProjects || []).filter(row=>!ctx.orgValue(row)||ctx.matchesUnit(row));
    if(list.length)return list.map(row=>{const city=row.city||row.location||row.name,coords=Array.isArray(row.coordinates)?row.coordinates:Array.isArray(row.value)?row.value:row.lng!=null?[row.lng,row.lat]:row.longitude!=null?[row.longitude,row.latitude]:ctx.COORDS[city];return {...row,name:row.name||city,city,value:coords?[Number(coords[0]),Number(coords[1]),Number(row.count??row.projects??row.total??1)]:null};}).filter(row=>row.value&&row.value.every(Number.isFinite));
    return (ctx.S.popularRegions || []).filter(r=>ctx.COORDS[r.name]).map(r=>({...r,name:r.name,city:r.name,value:[...ctx.COORDS[r.name],r.count],summaryOnly:true}));
  }

function allPeople(){
    const people=new Map();
    const add=p=>{if(!p?.name)return;const key=p.employeeId||p.employeeNo||p.id||p.name+'|'+(p.department||'');people.set(key,{...people.get(key),...p});};
    (ctx.S.lowLoadPeople||[]).forEach(add);(ctx.S.potentialPeople||[]).forEach(add);(ctx.S.searchPeople||[]).forEach(add);(ctx.S.officePeople||[]).forEach(add);
    Object.values(ctx.S.teams||{}).forEach(team=>{(team.internal||[]).forEach(add);(team.external||[]).forEach(add);});
    return ctx.scoped([...people.values()]).rows;
  }

function personProjects(person){return(ctx.S.projects||[]).filter(project=>{const team=ctx.S.teams?.[project.code];return[...(team?.internal||[]),...(team?.external||[])].some(p=>p.name===person.name&&(!person.department||!p.department||person.department===p.department));});}

function valueOf(row,key){const aliases={office:['office','officeLocation','办公地'],personType:['personType','type','人员类型'],specialty:['specialty','discipline','主专业','专业'],department:['department','sector','所属部门','板块'],qualification:['qualification','资格'],role:['role','position','岗位'],location:['location','city','工作地点'],status:['status','状态']};for(const field of aliases[key]||[key])if(row[field]!=null&&row[field]!=='')return String(row[field]);return'—';}
Object.assign(ctx,{orgValue,matchesUnit,scoped,mapPoints,allPeople,personProjects,valueOf});
}
