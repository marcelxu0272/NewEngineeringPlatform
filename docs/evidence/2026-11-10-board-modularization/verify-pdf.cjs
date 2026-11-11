const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
 const rows=new Map(),bytes=new Map(),errors=[];let checks=0,category='wip-aging';const check=v=>{assert.ok(v);checks++;};
 page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const key of ['wip-aging','completed-contract-deduction']){
   const response=await context.request.get('http://localhost:3001/api/pdf-reports?category='+key);check(response.ok());const list=(await response.json()).reports;rows.set(key,list);
   for(const report of list){const file=await context.request.get(`http://localhost:3001/api/pdf-reports/${report.id}/file`);bytes.set(report.id,await file.body());}
  }
  await context.route('**/api/pdf-reports**',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.method()==='POST'){
    const template=rows.get(category)[0];const report={...template,id:'isolated-ui-'+category,title:'模拟重构上传测试',sample:false,unit:'全部板块'};
    rows.set(category,[report,...rows.get(category)]);bytes.set(report.id,bytes.get(template.id));return route.fulfill({status:201,json:{report}});
   }
   const match=url.pathname.match(/\/api\/pdf-reports\/([^/]+)\/file/);
   if(match)return route.fulfill({contentType:'application/pdf',headers:{'Content-Disposition':(url.searchParams.has('download')?'attachment':'inline')+'; filename="report.pdf"'},body:bytes.get(decodeURIComponent(match[1]))});
   return route.fulfill({json:{reports:rows.get(url.searchParams.get('category'))||[]}});
  });
  await page.goto('http://localhost:3001/operations-dashboard-202610/board',{waitUntil:'networkidle'});
  for(const [key,title] of [['wip-aging','WIP 账龄分析'],['completed-contract-deduction','完成合同额核减']]){
   category=key;await page.getByRole('treeitem',{name:title,exact:true}).click();const list=page.getByTestId('pdf-reports-page');
   await list.getByRole('button',{name:'查看',exact:true}).first().waitFor();check(await list.locator('tbody tr').count()===rows.get(key).length);
   await list.getByLabel('搜索报告').fill('不存在的报告');await list.getByText('没有找到匹配的报告',{exact:true}).waitFor();check(true);await list.getByRole('button',{name:'清除筛选'}).click();
   await list.getByRole('button',{name:'查看',exact:true}).first().click();const dialog=page.getByRole('dialog');await dialog.locator('canvas').first().waitFor({timeout:30000});check(await dialog.locator('canvas').count()>0);
   await dialog.getByRole('button',{name:'Close',exact:true}).click();await dialog.waitFor({state:'hidden'});
   await list.getByRole('button',{name:'上传 PDF',exact:true}).click();await dialog.locator('input[name=title]').fill('模拟重构上传测试');
   await dialog.locator('input[name=file]').setInputFiles({name:'sample.pdf',mimeType:'application/pdf',buffer:bytes.values().next().value});
   await dialog.getByRole('button',{name:'上传并保存',exact:true}).click();await dialog.waitFor({state:'hidden'});await list.getByText('模拟重构上传测试',{exact:true}).waitFor();check(true);
   await page.screenshot({path:path.join(__dirname,`pdf-${key}.png`)});
  }
  check(errors.length===0);const result={verdict:'PASS',checks,errors,storage:'UI writes use an in-memory HTTP fixture; existing PDFs read only'};fs.writeFileSync(path.join(__dirname,'pdf-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
