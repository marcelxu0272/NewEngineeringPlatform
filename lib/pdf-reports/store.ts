import { randomUUID } from 'node:crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getDb } from '@/lib/db/client';
import { PdfReport, REPORT_CATEGORIES, ReportCategory } from './types';

const columns = `id, category, title, period, unit, summary, file_name AS fileName,
  file_size AS fileSize, page_count AS pageCount, created_at AS createdAt, sample`;

function database() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS pdf_reports (
    id TEXT PRIMARY KEY, category TEXT NOT NULL, title TEXT NOT NULL,
    period TEXT NOT NULL, unit TEXT NOT NULL, summary TEXT NOT NULL,
    file_name TEXT NOT NULL, file_size INTEGER NOT NULL, page_count INTEGER NOT NULL,
    created_at TEXT NOT NULL, sample INTEGER NOT NULL DEFAULT 0, content BLOB NOT NULL
  ); CREATE INDEX IF NOT EXISTS pdf_reports_category_period ON pdf_reports(category, period);`);
  return db;
}

function insert(report: PdfReport, bytes: Buffer, ignore = false) {
  database().prepare(`INSERT ${ignore ? 'OR IGNORE' : ''} INTO pdf_reports
    (id,category,title,period,unit,summary,file_name,file_size,page_count,created_at,sample,content)
    VALUES (@id,@category,@title,@period,@unit,@summary,@fileName,@fileSize,@pageCount,@createdAt,@sample,@content)`)
    .run({ ...report, sample: Number(report.sample), content: bytes });
}

// Samples are synthetic and generated once per database, never copies of company reports.
async function samplePdf(category: ReportCategory, period: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const title = category === 'wip-aging' ? 'WIP AGING ANALYSIS' : 'CONTRACT VALUE ADJUSTMENTS';
  for (let number = 1; number <= 2; number++) {
    const page = pdf.addPage([595, 842]);
    page.drawRectangle({ x: 0, y: 735, width: 595, height: 107, color: rgb(.08, .20, .30) });
    page.drawText('WOOD / PDF REPORT SAMPLE', { x: 42, y: 800, font, size: 11, color: rgb(.8, .87, .92) });
    page.drawText(title, { x: 42, y: 762, font: bold, size: 21, color: rgb(1, 1, 1) });
    const lines = number === 1
      ? [`Reporting period: ${period}`, 'Organization: Company overview', 'Synthetic sample / not an official business report', '', '01  Executive overview', 'This sample demonstrates the report list and continuous PDF reader.', 'Upload your PDF to review actual report content.', '', '02  Reading guide', 'Scroll down to read page 2 in the same document.']
      : ['03  Detail and follow-up', 'This page demonstrates multi-page continuous reading.', '', 'Project A - sample only', 'Project B - sample only', '', 'All sample items are fictional.', 'No financial conclusions or approved metric definitions are included.'];
    lines.forEach((line, index) => page.drawText(line, { x: 42, y: 690 - index * 31, font, size: 12, color: rgb(.15, .24, .31) }));
    page.drawText(`DEMO ONLY  |  ${period}  |  PAGE ${number} / 2`, { x: 42, y: 40, font, size: 10, color: rgb(.43, .49, .55) });
  }
  return Buffer.from(await pdf.save());
}

let initialization: Promise<void> | undefined;
export function ensureReports() {
  if (!initialization) initialization = (async () => {
    const db = database();
    for (const category of Object.keys(REPORT_CATEGORIES) as ReportCategory[]) {
      for (const period of ['2026-10', '2026-09']) {
        const id = `sample-${category}-${period}`;
        if (db.prepare('SELECT id FROM pdf_reports WHERE id = ?').get(id)) continue;
        const content = await samplePdf(category, period);
        insert({ id, category, period, title: `${period} ${REPORT_CATEGORIES[category]}（示例）`,
          unit: '全部板块', summary: '两页合成示例，用于体验报告列表和连续阅读，不含真实经营数据。',
          fileName: `${category}-${period}-sample.pdf`, fileSize: content.length,
          pageCount: 2, createdAt: `${period}-28T01:00:00.000Z`, sample: true }, content, true);
      }
    }
  })().catch(error => { initialization = undefined; throw error; });
  return initialization;
}

export function listReports(category: ReportCategory): PdfReport[] {
  const rows = database().prepare(`SELECT ${columns} FROM pdf_reports WHERE category = ? ORDER BY period DESC, created_at DESC, id`).all(category) as (Omit<PdfReport, 'sample'> & { sample: number })[];
  return rows.map(row => ({ ...row, sample: !!row.sample }));
}

export function addReport(input: Omit<PdfReport, 'id' | 'createdAt' | 'sample'>, bytes: Buffer): PdfReport {
  const report = { ...input, id: randomUUID(), createdAt: new Date().toISOString(), sample: false };
  insert(report, bytes);
  return report;
}

export function getReportFile(id: string) {
  return database().prepare('SELECT content, file_name AS fileName FROM pdf_reports WHERE id = ?').get(id) as { content: Buffer; fileName: string } | undefined;
}
