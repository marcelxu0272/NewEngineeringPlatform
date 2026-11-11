import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { HSSE_FIELDS, formatHsse, recordables } from '../../../lib/hsse/types';

async function main() {
  const original = process.cwd();
  const temp = mkdtempSync(path.join(tmpdir(), 'hsse-verification-'));
  process.chdir(temp);
  // Import only AFTER chdir: client.ts fixes DB_PATH at module evaluation time.
  const { GET, PUT } = await import('../../../app/api/hsse-performance/route');
  const { closeDb, DB_PATH } = await import('../../../lib/db/client');
  assert.equal(DB_PATH, path.join(temp, 'data', 'platform.db'));
  let checks = 0;
  const check = (value: unknown) => { assert.ok(value); checks++; };
  const get = (month: number) => GET(new NextRequest(`http://localhost/api/hsse-performance?year=2026&month=${month}`));
  const put = (month: number, values: unknown, year = 2026) => PUT(new NextRequest('http://localhost/api/hsse-performance', {
    method: 'PUT', body: JSON.stringify({ year, month, values }), headers: { 'Content-Type': 'application/json' },
  }));
  const zero = Object.fromEntries(HSSE_FIELDS.map(({ key }) => [key, 0]));
  try {
    const empty = await (await get(9)).json();
    check(empty.current === null && empty.cumulative === null && empty.missingMonths.length === 9);
    check((await get(0)).status === 400);
    check((await put(9, zero, 2027)).status === 400);
    for (const bad of [{}, { ...zero, f: -1 }, { ...zero, f: 0.1 }, { ...zero, lti: null }, { ...zero, hours: '280000' }, { ...zero, f: Number.MAX_SAFE_INTEGER }]) {
      check((await put(9, bad)).status === 400);
    }
    const september = { ...zero, bbso: 209, hours: 280000 };
    check((await put(9, september)).status === 200);
    const result = await (await get(9)).json();
    check(result.current.bbso === 209 && result.current.hours === 280000);
    check(result.cumulative.bbso === 209 && result.missingMonths.join(',') === '1,2,3,4,5,6,7,8');
    check(formatHsse('hours', 280000) === '0.28M');
    check(formatHsse('hours', 1) === '0.000001M');
    check(formatHsse('hours', 0) === '0M');
    await put(1, { ...zero, f: 1, lti: 2, rwc: 3, mtc: 4, bbso: 2584, hours: 2360000 });
    const cumulative = await (await get(9)).json();
    check(cumulative.cumulative.bbso === 2793 && cumulative.cumulative.hours === 2640000);
    check(recordables(cumulative.cumulative) === 10);
    const january = await (await get(1)).json();
    check(january.missingMonths.length === 0 && january.cumulative.bbso === 2584);
    await put(1, { ...zero, hours: 1 });
    const edited = await (await get(9)).json();
    check(edited.cumulative.hours === 280001 && edited.cumulative.bbso === 209 && recordables(edited.cumulative) === 0);
    check((await (await get(2)).json()).current === null);
    await put(2, zero);
    const reportedZero = await (await get(2)).json();
    check(reportedZero.current.f === 0 && reportedZero.missingMonths.length === 0);
    check((await get(9)).headers.get('cache-control') === 'no-store');
    check((await PUT(new NextRequest('http://localhost/api/hsse-performance', { method: 'PUT', body: '{' }))).status === 400);
    closeDb(); // reopen confirms persistence, not module-local state
    check((await (await get(9)).json()).current.bbso === 209);
    console.log(JSON.stringify({ verdict: 'PASS', checks, storage: 'temporary isolated SQLite; deleted after test' }));
  } finally {
    closeDb(); process.chdir(original); rmSync(temp, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
