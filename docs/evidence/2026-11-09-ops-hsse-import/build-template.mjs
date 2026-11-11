import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
import JSZip from 'jszip';

const root = process.argv[2];
const outputDir = path.join(root, 'outputs', 'hsse-import-20261109');
await fs.mkdir(outputDir, { recursive: true });
const wb = Workbook.create();
const sheet = wb.worksheets.add('HSSE月报');
sheet.showGridLines = false;
sheet.tabColor = '#008b8b';
const headers = ['年度', '月份', 'F', 'LTI 损失工时', 'RWC 工作受限事件', 'MTC 医院医疗处理', 'FAC 现场医疗处理',
  'HiPo INCIDENT 高风险事件', 'PROPERTY DAMAGE & SECURITY 财产损失和安保事件', 'ENVIRONMENT 环境事件', 'NEAR MISS 未遂事件', 'BBSO 安全观察', 'AT RISK HOURS 人工时（百万）'];
sheet.getRange('A1:M16').format.font = { name: 'Microsoft YaHei', size: 11 };
sheet.getRange('A1:M1').merge();
sheet.getRange('A1').values = [['HSSE绩效 · 2026全公司月报批量录入']];
sheet.getRange('A1:M1').format = { fill: '#173b46', font: { size: 20, bold: true, color: '#ffffff' }, rowHeight: 46 };
sheet.getRange('A2:M2').merge();
sheet.getRange('A2').values = [['填写方法：每月一行，填齐11项指标；前10项填非负整数，零值填0；未填写的月份留空，系统跳过。']];
sheet.getRange('A3:M3').merge();
sheet.getRange('A3').values = [['人工时单位为百万：0.28 = 280,000小时，最多6位小数。不要填公式或改列名；Recordables/年度累计自动计算。导入预览后确认覆盖已有月份。']];
sheet.getRange('A2:M3').format = { fill: '#edf6f6', font: { size: 11, color: '#365c65' }, rowHeight: 30 };
sheet.getRange('A4:M4').values = [headers];
sheet.getRange('A4:M4').format = { fill: '#008b8b', font: { bold: true, color: '#ffffff', size: 11 }, rowHeight: 64, wrapText: true, verticalAlignment: 'center', horizontalAlignment: 'center' };
sheet.getRange('A5:M16').values = Array.from({ length: 12 }, (_, i) => [2026, i + 1, ...Array(11).fill(null)]);
sheet.getRange('A5:M16').format.rowHeight = 32;
sheet.getRange('A5:B16').format = { fill: '#edf2f5', font: { color: '#3d5360', bold: true }, horizontalAlignment: 'center' };
sheet.getRange('C5:M16').format = { fill: '#fffbea', font: { color: '#1456a0' }, horizontalAlignment: 'right' };
sheet.getRange('A4:M16').format.borders = { preset: 'all', style: 'thin', color: '#dbe6e8' };
sheet.getRange('A:B').format.columnWidth = 10;
sheet.getRange('C:C').format.columnWidth = 10;
sheet.getRange('D:H').format.columnWidth = 24;
sheet.getRange('I:I').format.columnWidth = 38;
sheet.getRange('J:L').format.columnWidth = 27;
sheet.getRange('M:M').format.columnWidth = 32;
sheet.getRange('A5:L16').setNumberFormat('0');
sheet.getRange('M5:M16').setNumberFormat('0.######');
sheet.getRange('C5:L16').dataValidation = { rule: { type: 'whole', operator: 'between', formula1: 0, formula2: 187649984473770 } };
sheet.freezePanes.freezeRows(4);
sheet.freezePanes.freezeColumns(2);
const file = path.join(outputDir, 'HSSE月报批量导入模板.xlsx');
await (await SpreadsheetFile.exportXlsx(wb)).save(file);
// ExcelJS expects unprefixed SpreadsheetML tags. Preserve the same namespace
// while normalizing the artifact export's x: prefix for importer compatibility.
const zip = await JSZip.loadAsync(await fs.readFile(file));
for (const entry of Object.values(zip.files)) {
  if (!entry.dir && /^xl\/.*\.xml$/.test(entry.name)) {
    const xml = await entry.async('string');
    zip.file(entry.name, xml.replace(/<(\/?)x:/g, '<$1').replace(/xmlns:x=/g, 'xmlns='));
  }
}
await fs.writeFile(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
await fs.copyFile(file, path.join(root, 'public', 'operations-dashboard-202610', 'HSSE月报批量导入模板.xlsx'));
const preview = await wb.render({ sheetName: 'HSSE月报', range: 'A1:M16', scale: 1, format: 'png' });
await fs.writeFile(path.join(root, 'docs/evidence/2026-11-09-ops-hsse-import/template-preview.png'), new Uint8Array(await preview.arrayBuffer()));
console.log(JSON.stringify({ output: file, sheet: 'HSSE月报', rows: 12, columns: 13 }));
