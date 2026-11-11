import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
async function main(){
 const root=process.cwd(),temporary=mkdtempSync(path.join(tmpdir(),'board-storage-check-'));
 process.chdir(temporary);
 const client=await import('../../../lib/db/client');
 assert.equal(client.DB_PATH,path.join(temporary,'data/platform.db'));
 let checks=1;const check=(value:unknown)=>{assert.ok(value);checks++;};
 try{
  const pdf=await import('../../../lib/pdf-reports/store');
  const hsse=await import('../../../lib/hsse/store');
  await pdf.ensureReports();const before=pdf.listReports('wip-aging');check(before.length===2);
  const document=await PDFDocument.create();document.addPage();document.addPage();const bytes=Buffer.from(await document.save());
  const report=pdf.addReport({category:'wip-aging',title:'隔离模拟报告',period:'2026-10',unit:'全部板块',summary:'仅临时库',fileName:'isolated.pdf',fileSize:bytes.length,pageCount:2},bytes);
  check(pdf.getReportFile(report.id)?.content.equals(bytes));
  hsse.saveHsse(2026,1,{f:0,lti:0,rwc:0,mtc:0,fac:0,hipo:0,property:0,environment:0,nearMiss:0,bbso:2,hours:1});
  client.closeDb();
  check(pdf.listReports('wip-aging').some(row=>row.id===report.id));
  check(hsse.readHsse(2026,1).current?.hours===1);
  check(pdf.getReportFile(report.id)?.content.equals(bytes));
  const result={verdict:'PASS',checks,database:client.DB_PATH,productionDatabaseTouched:false};
  writeFileSync(path.join(root,'docs/evidence/2026-11-10-board-modularization/storage-results.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 }finally{client.closeDb();process.chdir(root);rmSync(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
