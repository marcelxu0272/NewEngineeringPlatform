import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { NextRequest } from 'next/server';
import { IMPORT_HEADERS, ImportValidationError, parseHsseWorkbook } from '../../../lib/hsse/import';
import { HSSE_FIELDS } from '../../../lib/hsse/types';

async function main() {
  const root = process.cwd(), evidence = path.join(root, 'docs/evidence/2026-11-09-ops-hsse-import');
  const template = readFileSync(path.join(root, 'public/operations-dashboard-202610/HSSE月报批量导入模板.xlsx'));
  const temp = mkdtempSync(path.join(tmpdir(), 'hsse-import-test-'));
  let checks = 0;
  const check = (value: unknown) => { assert.ok(value); checks++; };
  async function fixture(edit?: (sheet: ExcelJS.Worksheet) => void) {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(template as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const sheet = wb.getWorksheet('HSSE月报')!;
    for (const r of [5, 6]) for (let c = 3; c <= 13; c++) sheet.getRow(r).getCell(c).value = c === 13 ? (r === 5 ? 0.28 : 0.000001) : (c === 12 ? 209 : 0);
    edit?.(sheet);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }
  const valid = await fixture();
  const parsed = await parseHsseWorkbook(valid);
  check(parsed.rows.length === 2 && parsed.skipped === 10);
  check(parsed.rows[0].values.hours === 280000 && parsed.rows[1].values.hours === 1);
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(template as unknown as Parameters<typeof wb.xlsx.load>[0]);
  check(wb.getWorksheet('HSSE月报')!.getRow(4).values.toString().includes(IMPORT_HEADERS[12]));
  check(wb.getWorksheet('HSSE月报')!.getCell('C5').value === null);
  for (const edit of [
    (s: ExcelJS.Worksheet) => { s.getCell('B6').value = 1; },
    (s: ExcelJS.Worksheet) => { s.getCell('A5').value = 2027; },
    (s: ExcelJS.Worksheet) => { s.getCell('C5').value = -1; },
    (s: ExcelJS.Worksheet) => { s.getCell('D5').value = 0.5; },
    (s: ExcelJS.Worksheet) => { s.getCell('C5').value = null; },
    (s: ExcelJS.Worksheet) => { s.getCell('M5').value = 0.0000001; },
    (s: ExcelJS.Worksheet) => { s.getCell('C5').value = { formula: '1+1', result: 2 }; },
    (s: ExcelJS.Worksheet) => { s.getCell('C4').value = '错误列名'; },
  ]) {
    await assert.rejects(parseHsseWorkbook(await fixture(edit)), ImportValidationError); checks++;
  }
  await assert.rejects(parseHsseWorkbook(template), /没有可导入/); checks++;
  await assert.rejects(parseHsseWorkbook(Buffer.from('invalid')), /无法读取/); checks++;
  // Stable synthetic fixtures for the browser test, never production monthly data.
  writeFileSync(path.join(evidence, 'fixture-valid.xlsx'), valid);
  writeFileSync(path.join(evidence, 'fixture-invalid.xlsx'), await fixture(s => { s.getCell('C5').value = -1; }));

  process.chdir(temp);
  const { POST, PUT } = await import('../../../app/api/hsse-performance/import/route');
  const { getDb, closeDb, DB_PATH } = await import('../../../lib/db/client');
  const { readHsse, saveHsse } = await import('../../../lib/hsse/store');
  assert.equal(DB_PATH, path.join(temp, 'data/platform.db'));
  const post = (bytes: Buffer, filename = 'monthly.xlsx') => {
    const form = new FormData(); form.append('file', new Blob([new Uint8Array(bytes)]), filename);
    return POST(new NextRequest('http://localhost/api/hsse-performance/import', { method: 'POST', body: form }));
  };
  const put = (rows: unknown) => PUT(new NextRequest('http://localhost/api/hsse-performance/import', {
    method: 'PUT', body: JSON.stringify({ year: 2026, month: 2, rows }), headers: { 'Content-Type': 'application/json' },
  }));
  try {
    check((await post(valid, 'data.xls')).status === 400);
    check((await post(Buffer.from('invalid'))).status === 400);
    const preview = await (await post(valid)).json();
    check(preview.rows.length === 2 && preview.rows.every((r: { action: string }) => r.action === '新增'));
    check(readHsse(2026, 2).current === null); // preview does not save
    const saved = await (await put(preview.rows)).json();
    check(saved.count === 2 && saved.data.cumulative.hours === 280001 && saved.data.cumulative.bbso === 418);
    check((await (await post(valid)).json()).rows.every((r: { action: string }) => r.action === '覆盖'));
    check((await put([preview.rows[0], preview.rows[0]])).status === 400);
    check((await put([{ ...preview.rows[0], values: {} }])).status === 400);
    const zero = Object.fromEntries(HSSE_FIELDS.map(f => [f.key, 0])) as typeof parsed.rows[0]['values'];
    saveHsse(2026, 1, { ...zero, bbso: 999 });
    getDb().exec("CREATE TRIGGER test_batch_failure BEFORE UPDATE ON hsse_monthly WHEN NEW.month=2 BEGIN SELECT RAISE(ABORT,'forced test rollback'); END;");
    const expectedError = console.error; console.error = () => {};
    try { check((await put(preview.rows)).status === 500); } finally { console.error = expectedError; }
    check(readHsse(2026, 1).current?.bbso === 999); // month 1 update rolled back when month 2 fails
    getDb().exec('DROP TRIGGER test_batch_failure');
    check((await put(preview.rows)).status === 200);
    closeDb();
    check(readHsse(2026, 2).cumulative?.hours === 280001);
    const result = { verdict: 'PASS', checks, template: '13 columns, 12 blank months', storage: 'isolated temporary SQLite', rollback: 'verified with forced failure on second month' };
    writeFileSync(path.join(evidence, 'api-results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result));
  } finally { closeDb(); process.chdir(root); rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
