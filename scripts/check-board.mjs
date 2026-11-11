/** Unified Board regression entry; development server must already be running on localhost:3001. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'docs/evidence/2026-11-10-board-modularization');
const tsx=require.resolve('tsx/cli');
const tests=[
 ['kpi-math',['--test','scripts/test-ops-kpi-subgoals.cjs']],
 ['sector-comparison',['docs/evidence/2026-11-10-ops-sector-comparison/verify.cjs']],
 ['monthly-details',['docs/evidence/2026-11-10-ops-monthly-details/verify.cjs']],
 ['project-math',['docs/evidence/2026-11-10-ops-project-details/verify-model.cjs']],
 ['market-math',[tsx,'docs/evidence/2026-11-10-ops-market-demo/verify-model.ts']],
 ['storage-isolated',[tsx,'docs/evidence/2026-11-10-board-modularization/verify-storage.ts']],
 ['hsse-api-isolated',[tsx,'docs/evidence/2026-11-09-ops-hsse/verify-api.ts']],
 ['hsse-import-isolated',[tsx,'docs/evidence/2026-11-09-ops-hsse-import/verify-import.ts']],
 ['static-lifecycle',['docs/evidence/2026-11-10-board-modularization/verify-static.cjs']],
 ['project-browser',['docs/evidence/2026-11-10-ops-project-details/verify-browser.cjs']],
 ['timesheet-browser',['docs/evidence/2026-11-03-ops-timesheet/verify.cjs']],
 ['timesheet-lifecycle',['docs/evidence/2026-11-03-ops-timesheet/verify-lifecycle.cjs']],
 ['market-browser',[tsx,'docs/evidence/2026-11-10-ops-market-demo/verify-browser.ts']],
 ['hsse-browser',['docs/evidence/2026-11-09-ops-hsse/verify-browser.cjs']],
 ['hsse-import-browser',['docs/evidence/2026-11-09-ops-hsse-import/verify-browser.cjs']],
 ['pdf-browser',['docs/evidence/2026-11-10-board-modularization/verify-pdf.cjs']],
 ['baseline',['docs/evidence/2026-11-10-board-modularization/capture.cjs','final']],
];
const results=[];
for(const [name,args]of tests){
 const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024,timeout:180000});
 const output=(result.stdout||'')+(result.stderr||'');
 fs.writeFileSync(path.join(evidence,`check-${name}.log`),output);
 results.push({name,status:result.status,error:result.error?.message});
 console.log(`${result.status===0?'PASS':'FAIL'} ${name}`);
 if(result.status!==0){console.error(output.slice(-3000));break;}
}
try{
 const baseline=JSON.parse(fs.readFileSync(path.join(evidence,'baseline.json'))),final=JSON.parse(fs.readFileSync(path.join(evidence,'final.json')));
 assert.deepEqual(final.snapshots,baseline.snapshots);assert.deepEqual(final.errors,[]);assert.deepEqual(final.failed,[]);
 const vendor=fs.readFileSync(path.join(root,'public/operations-dashboard-202610/vendor/highcharts-12.4.0.min.js'));
 const expected=JSON.parse(fs.readFileSync(path.join(evidence,'highcharts-sha256.json')));
 assert.equal(crypto.createHash('sha256').update(vendor).digest('hex'),expected.sha256);
 results.push({name:'baseline-and-vendor-integrity',status:0});
}catch(error){results.push({name:'baseline-and-vendor-integrity',status:1,error:error.message});}
const pass=results.length===tests.length+1&&results.every(result=>result.status===0);
fs.writeFileSync(path.join(evidence,'suite-results.json'),JSON.stringify({verdict:pass?'PASS':'FAIL',results},null,2));
process.exitCode=pass?0:1;
