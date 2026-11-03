const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const page = fs.readFileSync(path.join(root, 'app/operations-dashboard-202610/board/page.tsx'), 'utf8');
const index = fs.readFileSync(path.join(root, 'public/operations-dashboard-202610/index.html'), 'utf8');
const units = [
  '全部板块','SAS170 PMC板块','SAS610 咨询板块','SAS680 数字技术板块','SAS650 新材料板块',
  'SAS710 生命科学板块','SAS690 COII板块','SAS720 模块化板块','SAS670 供应链板块',
  'SAS520 金山中心','SAS560 沈阳中心','SAS550 惠湛中心','SAS530 银川中心'
];
const checks = [];
for (const u of units) checks.push(['UNIT '+u, page.includes("value: '"+u+"'")]);
checks.push(['无设计院选项', !page.includes("value: '设计院'")]);
checks.push(['无数字化业务单元选项', !page.includes("value: '数字化业务单元'")]);
checks.push(['无专业室选项', !page.includes("value: '专业室'")]);
checks.push(['无公司级EPC选项', page.indexOf("value: '公司级EPC'") < 0]);
checks.push(['UNIT条数13', (page.match(/value: 'SAS/g)||[]).length === 12 && page.includes("value: '全部板块'")]);
checks.push(['pairRow id', index.includes('id="pairRow"')]);
checks.push(['syncPairRowVisibility', index.includes('function syncPairRowVisibility')]);
checks.push(['CSS pairRow hidden override', index.includes('#pairRow[hidden]') && index.includes('display:none!important')]);
checks.push(['JS setProperty important', index.includes("setProperty('display','none','important')")]);
checks.push(['render调用显隐', index.includes('syncPairRowVisibility();')]);
checks.push(['仅全部板块渲染贡献目标', index.includes("if(state.unit==='全部板块'){renderContribution();renderTargets();}")]);
checks.push(['demo含SAS170', index.includes("'SAS170 PMC板块'")]);
checks.push(['index无设计院group', !index.includes("'设计院'")]);
checks.push(['index无数字化业务单元', !index.includes('数字化业务单元')]);
checks.push(['index无专业室', !index.includes('专业室')]);
let fail = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);