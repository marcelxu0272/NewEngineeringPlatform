const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../../..');
const OUT = __dirname;
const BASE = process.env.OPS_BASE || 'http://localhost:3001';
const lines = [];
let fail = 0;

function log(ok, name, detail) {
  const s = (ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  ' + detail : '');
  lines.push(s);
  console.log(s);
  if (!ok) fail++;
}

const LEAVES = [
  'SAS170 PMC板块',
  'SAS610 咨询板块',
  'SAS680 数字技术板块',
  'SAS650 新材料板块',
  'SAS710 生命科学板块',
  'SAS690 COII板块',
  'SAS720 模块化板块',
  'SAS670 供应链板块',
  'SAS520 金山中心',
  'SAS560 沈阳中心',
  'SAS550 惠湛中心',
  'SAS530 银川中心',
];

const MANAGERS = {
  'SAS170 PMC板块': '姚佳辉',
  'SAS610 咨询板块': '王建平',
  'SAS680 数字技术板块': '潘颖',
  'SAS650 新材料板块': '陈贺明',
  'SAS710 生命科学板块': '王培波',
  'SAS690 COII板块': '周翔',
  'SAS720 模块化板块': '朱勇',
  'SAS670 供应链板块': '张雯',
  'SAS520 金山中心': '赵宏海',
  'SAS560 沈阳中心': '朱新辉',
  'SAS550 惠湛中心': '赵卫强',
  'SAS530 银川中心': '杨科',
};

(async () => {
  const org = fs.readFileSync(path.join(root, 'public/operations-dashboard-202610/org-entry.html'), 'utf8');
  const pageSrc = fs.readFileSync(path.join(root, 'app/operations-dashboard-202610/board/page.tsx'), 'utf8');

  // --- static org-entry ---
  for (const u of LEAVES) {
    const enc = encodeURIComponent(u);
    const hrefOk = org.includes(`href="/operations-dashboard-202610/board?unit=${enc}"`);
    const mgrOk = org.includes(`project-item-title">${u}</div>`) && org.includes(MANAGERS[u]);
    log(hrefOk, 'leaf-href ' + u, enc);
    log(mgrOk, 'leaf-manager ' + u, MANAGERS[u]);
  }
  log(!org.includes('惠滋'), 'no-huizi-typo');
  const boardDefault = /class="box board-entry-link"\s+href="\/operations-dashboard-202610\/board"\s+target="_top"/.test(org);
  log(boardDefault, 'board-entry-default-no-unit');
  log(!/公司级EPC[\s\S]{0,500}board\?unit=/.test(org), 'epc-no-board-unit');
  const leafAnchors = (org.match(/<a class="project-item" href="\/operations-dashboard-202610\/board\?unit=/g) || []).length;
  log(leafAnchors === 12, 'leaf-anchor-count', String(leafAnchors));
  // project groups should not point at board?unit
  const pgBad = [...org.matchAll(/class="project-group-header"[^>]*href="([^"]+)"/g)].some((m) => /board\?unit=/.test(m[1]));
  log(!pgBad, 'project-group-no-leaf-unit');

  // --- static board page ---
  log(pageSrc.includes('URLSearchParams(window.location.search)'), 'board-reads-search-unit');
  log(pageSrc.includes("unit === '全部板块' ? 'Board' : unit"), 'board-header-leaf-or-Board');
  log(pageSrc.includes('data-testid="board-main-header"'), 'board-header-testid');
  for (const u of LEAVES) {
    log(pageSrc.includes(`value: '${u}'`), 'UNIT_OPTIONS ' + u);
  }

  // --- live playwright ---
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

    // org-entry via ops route iframe
    await page.goto(BASE + '/operations-dashboard-202610', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(1200);
    const orgProbe = await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      const doc = iframe && iframe.contentDocument;
      if (!doc) return { ok: false, reason: 'no iframe doc' };
      const leaves = [...doc.querySelectorAll('a.project-item')].map((a) => ({
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        title: (a.querySelector('.project-item-title') || {}).textContent || '',
        manager: (a.querySelector('.project-item-manager') || {}).textContent || '',
      }));
      const board = doc.querySelector('a.board-entry-link');
      const epc = doc.querySelector('#epc-detail-trigger');
      return {
        ok: true,
        leaves,
        boardHref: board ? board.getAttribute('href') : null,
        boardTarget: board ? board.getAttribute('target') : null,
        epcHref: epc ? epc.getAttribute('href') : null,
        epcTag: epc ? epc.tagName : null,
      };
    });
    log(!!orgProbe.ok && orgProbe.leaves.length === 12, 'live-leaf-count', JSON.stringify({ n: orgProbe.leaves && orgProbe.leaves.length, reason: orgProbe.reason }));
    if (orgProbe.ok) {
      for (const u of LEAVES) {
        const hit = orgProbe.leaves.find((l) => l.title === u);
        const expectHref = '/operations-dashboard-202610/board?unit=' + encodeURIComponent(u);
        log(!!hit && hit.href === expectHref && hit.target === '_top', 'live-href ' + u, hit ? hit.href : 'missing');
        log(!!hit && hit.manager === MANAGERS[u], 'live-mgr ' + u, hit ? hit.manager : 'missing');
      }
      log(orgProbe.boardHref === '/operations-dashboard-202610/board' && orgProbe.boardTarget === '_top', 'live-board-default', orgProbe.boardHref);
      log(!orgProbe.epcHref || !/board\?unit=/.test(orgProbe.epcHref), 'live-epc-no-unit', String(orgProbe.epcHref));
    }

    // Board deep link leaf
    const unit = 'SAS170 PMC板块';
    await page.goto(BASE + '/operations-dashboard-202610/board?unit=' + encodeURIComponent(unit), {
      waitUntil: 'networkidle',
      timeout: 90000,
    });
    await page.waitForTimeout(2000);
    await page.waitForFunction(
      (u) => {
        const h2 = document.querySelector('[data-testid="board-main-header"]');
        return h2 && h2.textContent.includes(u);
      },
      unit,
      { timeout: 15000 },
    ).catch(() => {});

    const leafBoard = await page.evaluate((u) => {
      const h2 = document.querySelector('[data-testid="board-main-header"]');
      const sel = document.querySelector('[data-testid="shell-unit-select"]');
      // antd Select shows selected in .ant-select-selection-item
      const shown = sel
        ? (sel.querySelector('.ant-select-selection-item') || sel).textContent.trim()
        : null;
      const iframe = document.querySelector('iframe');
      let pairDisplay = null;
      let pairHiddenAttr = null;
      let iframeUnit = null;
      try {
        const doc = iframe && iframe.contentDocument;
        if (doc) {
          const pair = doc.querySelector('#pairRow');
          if (pair) {
            pairDisplay = getComputedStyle(pair).display;
            pairHiddenAttr = pair.hasAttribute('hidden');
          }
          iframeUnit = doc.defaultView && doc.defaultView.state ? doc.defaultView.state.unit : null;
          // fallback: listen wasn't stored; try data attribute or last filter text
        }
      } catch (e) {
        pairDisplay = 'cross-origin-or-err:' + e.message;
      }
      return {
        header: h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : null,
        selectShown: shown,
        url: location.href,
        pairDisplay,
        pairHiddenAttr,
        iframeUnit,
      };
    }, unit);

    log(
      leafBoard.header && leafBoard.header.endsWith(unit) && leafBoard.header.includes('全局看板'),
      'live-header-leaf',
      leafBoard.header,
    );
    log(leafBoard.selectShown === unit, 'live-shell-unit-selected', leafBoard.selectShown);
    log(
      leafBoard.pairDisplay === 'none' || leafBoard.pairHiddenAttr === true,
      'live-pairRow-hidden-on-leaf',
      JSON.stringify({ display: leafBoard.pairDisplay, hidden: leafBoard.pairHiddenAttr, iframeUnit: leafBoard.iframeUnit }),
    );

    // default board → header Board
    await page.goto(BASE + '/operations-dashboard-202610/board', { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.waitForFunction(() => {
      const h2 = document.querySelector('[data-testid="board-main-header"]');
      return h2 && /Board\s*$/.test(h2.textContent.replace(/\s+/g, ' ').trim());
    }, { timeout: 15000 }).catch(() => {});
    const defBoard = await page.evaluate(() => {
      const h2 = document.querySelector('[data-testid="board-main-header"]');
      const sel = document.querySelector('[data-testid="shell-unit-select"]');
      const shown = sel
        ? (sel.querySelector('.ant-select-selection-item') || sel).textContent.trim()
        : null;
      return {
        header: h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : null,
        selectShown: shown,
      };
    });
    log(
      defBoard.header && defBoard.header.endsWith('Board') && !defBoard.header.includes('全部板块'),
      'live-header-default-Board',
      defBoard.header,
    );
    log(defBoard.selectShown === '全部板块', 'live-shell-default-all', defBoard.selectShown);

    await browser.close();
  } catch (e) {
    log(false, 'playwright-error', e && e.stack ? e.stack : String(e));
    if (browser) try { await browser.close(); } catch (_) {}
  }

  const out = lines.join('\n') + '\n\nfail=' + fail + '\n';
  fs.writeFileSync(path.join(OUT, 'probe-result.txt'), out, 'utf8');
  console.log('\nWrote probe-result.txt fail=' + fail);
  process.exit(fail ? 1 : 0);
})();
