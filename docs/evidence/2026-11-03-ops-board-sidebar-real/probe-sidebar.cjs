const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const page = fs.readFileSync(path.join(root, 'app/operations-dashboard-202610/board/page.tsx'), 'utf8');
const checks = [
  ['wood-shell-sidebar', page.includes('data-testid="wood-shell-sidebar"')],
  ['Projects Zone', page.includes('Projects Zone')],
  ['项目数据中台', page.includes('项目数据中台')],
  ['全局看板默认展开', /shellExpanded[\s\S]*global:\s*true/.test(page)],
  ['折叠«', page.includes("'«'") || page.includes('«')],
  ['无旧w-16灰栏', !/w-16[\s\S]{0,80}bg-gray-800/.test(page)],
  ['白底看板目录保留', page.includes('aria-label="看板目录"')],
  ['运营看板选中', page.includes("label: '运营看板'") && page.includes('current: true')],
  ['待办铃', page.includes('ri-notification-3-line')],
];
let fail = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);