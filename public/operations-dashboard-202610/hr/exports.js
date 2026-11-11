/** hr: exports. Private page context; no cross-dashboard state. */
export function register(ctx) {
function csvCell(value){let text=String(value??'');if(/^[=+@\-]/.test(text))text="'"+text;return'"'+text.replace(/"/g,'""')+'"';}

function downloadCsv(name,headers,rows){const blob=new Blob(['\uFEFF'+[headers,...rows].map(row=>row.map(ctx.csvCell).join(',')).join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name+'_2026-11-05.csv';document.body.appendChild(link);link.click();link.remove();ctx.lifecycle.timeout(()=>URL.revokeObjectURL(url),1000);}
Object.assign(ctx,{csvCell,downloadCsv});
}
