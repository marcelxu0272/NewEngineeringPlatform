/** hr: components. Private page context; no cross-dashboard state. */
export function register(ctx) {
function table(headers, rows, className = '') {
    return '<div class="table-scroll"><table class="' + className + '"><thead><tr>' + headers.map(h=>'<th>'+ctx.escape(h)+'</th>').join('') + '</tr></thead><tbody>' + (rows.length ? rows.map(row=>'<tr>'+row.map(cell=>'<td>'+(cell && typeof cell==='object' && 'html' in cell ? cell.html : ctx.escape(cell))+'</td>').join('')+'</tr>').join('') : '<tr><td colspan="'+headers.length+'">当前快照没有匹配记录。</td></tr>') + '</tbody></table></div>';
  }

function avatar(name) { return '<span class="avatar" aria-hidden="true">'+ctx.escape((name || '?').slice(-2))+'</span>'; }

function personCard(person, low, index, context) {
    return '<button type="button" class="person-card" data-person-index="'+index+'" data-person-context="'+context+'">'+ctx.avatar(person.name)+'<span class="person-content"><strong>'+ctx.escape(person.name)+'</strong><span class="person-role">'+ctx.escape(person.department)+' | '+ctx.escape(person.role)+'</span>'+(low?'<span class="week-grid">'+['前一周','前二周','前三周','本年度'].map((label,i)=>'<span>'+label+'负荷率<b>'+ctx.pct(i===3?person.annual:person.weeks?.[i])+'</b></span>').join('')+'</span>':'')+'</span></button>';
  }

function bindPeople(container, people) { container.querySelectorAll('[data-person-index]').forEach(button=>button.addEventListener('click',()=>ctx.openPerson(people[Number(button.dataset.personIndex)], button))); }
Object.assign(ctx,{table,avatar,personCard,bindPeople});
}
