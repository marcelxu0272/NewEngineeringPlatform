import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import type { CatalogItem } from '../lib/catalog-filter';

const base = process.env.CATALOG_BASE_URL ?? 'http://localhost:3000';
const force = process.argv.includes('--force');
const catalogFile = path.join(process.cwd(), 'config', 'catalog.json');
const outDir = path.join(process.cwd(), 'public', 'catalog', 'thumbs');

function writeItems(items: CatalogItem[]) {
  fs.writeFileSync(catalogFile, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}

async function main() {
  const probe = await fetch(`${base}/api/catalog`).catch(() => null);
  if (!probe?.ok) {
    console.error(`开发服务器未响应：${base}。请先运行 npm run dev`);
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(catalogFile, 'utf8')) as CatalogItem[];
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const notes: string[] = [];

  try {
    for (const item of items) {
      const file = path.join(outDir, `${item.id}.jpg`);
      const publicPath = `/catalog/thumbs/${item.id}.jpg`;
      if (!force && item.thumbnail === publicPath && fs.existsSync(file)) {
        console.log(`skip ${item.href}`);
        continue;
      }

      const mobile = item.href === '/cash-flow-dashboard-mobile';
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
      });
      try {
        const response = await page.goto(`${base}${item.href}`, {
          waitUntil: 'domcontentloaded',
          timeout: 45000,
        });
        await page.waitForTimeout(800);
        await page
          .waitForFunction(() => !document.body.innerText.includes('加载中'), { timeout: 20000 })
          .catch(() => undefined);
        if ((await page.locator('iframe').count()) > 0) await page.waitForTimeout(1500);
        await page.screenshot({ path: file, type: 'jpeg', quality: 60 });
        item.thumbnail = publicPath;
        writeItems(items);
        const status = response?.status() ?? 0;
        const text = await page.locator('body').innerText().catch(() => '');
        if (status >= 400 || /Application error|Internal Server Error/i.test(text)) {
          notes.push(`${item.href}: 页面状态 ${status}，已保留截图`);
        } else {
          console.log(`saved ${item.href}`);
        }
      } catch (error) {
        notes.push(`${item.href}: ${error instanceof Error ? error.message : '截图失败'}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (notes.length) console.warn(notes.join('\n'));
}

void main();
