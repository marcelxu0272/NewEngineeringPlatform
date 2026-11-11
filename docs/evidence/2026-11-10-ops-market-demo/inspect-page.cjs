const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3001/operations-dashboard-202610/board',{waitUntil:'domcontentloaded',timeout:120000});
  for(const [label,id] of [['机会清单','opportunity'],['市场数据','market-data'],['合同看板','contract-board']]){
   await page.getByRole('treeitem',{name:label,exact:true}).click();
   await page.getByRole('heading',{name:label,exact:true}).waitFor();
   await page.locator('[aria-label="市场看板演示"]').screenshot({path:`docs/evidence/2026-11-10-ops-market-demo/${id}-initial.png`});
   console.log(label, await page.locator('[aria-label="市场看板演示"]').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth,height:el.scrollHeight,charts:el.querySelectorAll('[data-market-chart] svg').length,modules:el.querySelectorAll('[data-market-module]').length})));
  }
  fs.writeFileSync('docs/evidence/2026-11-10-ops-market-demo/page-errors.json',JSON.stringify(errors));
  console.log('errors',errors);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
