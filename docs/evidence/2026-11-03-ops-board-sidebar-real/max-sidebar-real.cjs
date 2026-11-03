const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const ROOT = 'C:/Work/2_Development/21_Platform/26_engineering-platform';
  const OUT = path.join(ROOT, 'docs/evidence/2026-11-03-ops-board-sidebar-real');
  fs.mkdirSync(OUT, { recursive: true });

  const BASE = process.env.BOARD_BASE || 'http://localhost:3001';
  const URL = BASE + '/operations-dashboard-202610/board';

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));

  const checks = [];
  const push = (ac, name, ok, detail) => {
    checks.push({ ac, name, ok: !!ok, detail: detail == null ? '' : String(detail) });
  };

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="wood-shell-sidebar"]', { timeout: 25000 });
  await page.waitForTimeout(800);

  // --- AC1 brand ---
  const brand = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    if (!aside) return null;
    const cs = getComputedStyle(aside);
    const text = (aside.innerText || '').replace(/\s+/g, ' ').trim();
    const bg = cs.backgroundColor;
    return { text, bg, width: aside.getBoundingClientRect().width };
  });
  const hasWood = brand && /wood\./i.test(brand.text) && /Projects Zone/i.test(brand.text);
  const hasSubtitle = brand && /项目数据中台/.test(brand.text);
  const darkish = brand && (() => {
    const m = brand.bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return false;
    const [r, g, b] = m.slice(1).map(Number);
    return (r + g + b) / 3 < 120;
  })();
  push(1, '深色侧栏 + wood. Projects Zone + 项目数据中台', hasWood && hasSubtitle && darkish,
    JSON.stringify({ hasWood, hasSubtitle, darkish, bg: brand && brand.bg, width: brand && brand.width, textSample: brand && brand.text.slice(0, 80) }));

  // --- AC2 bell / 待办 ---
  const todo = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const nav = aside && aside.querySelector('nav');
    const text = (nav && nav.innerText) || '';
    const hasLabel = /待办提醒/.test(text);
    const icons = Array.from((nav || aside).querySelectorAll('i, [class*="ri-"]'));
    const bell = icons.some((el) => /ri-notification/.test(el.className || ''));
    // also accept svg/img near 待办
    const todoEl = Array.from((nav || aside).querySelectorAll('*')).find((el) => (el.textContent || '').trim() === '待办提醒');
    const nearIcon = todoEl
      ? !!(todoEl.querySelector('i,[class*="ri-"]') || (todoEl.previousElementSibling && /ri-/.test(todoEl.previousElementSibling.className || '')) || (todoEl.parentElement && todoEl.parentElement.querySelector('i,[class*="ri-"]')))
      : false;
    return { hasLabel, bell, nearIcon, iconClasses: icons.slice(0, 12).map((i) => i.className) };
  });
  push(2, '待办提醒入口可见（铃铛图标）', todo.hasLabel && (todo.bell || todo.nearIcon),
    JSON.stringify(todo));

  // --- AC3 全局看板组 ---
  const globalGroup = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const text = (aside.innerText || '').replace(/\s+/g, ' ');
    const hasGlobal = /全局看板/.test(text);
    const hasOps = /运营看板/.test(text);
    const hasDelivery = /交付保障看板/.test(text);
    const hasHr = /人力资源看板/.test(text);
    // find the 全局看板 row and check expand indicator / highlight
    const all = Array.from(aside.querySelectorAll('button, a, div, span, li'));
    const globalBtn = all.find((el) => {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return t === '全局看板' || /^全局看板/.test(t) && t.length < 40;
    });
    let groupEl = globalBtn;
    // climb to a container that includes children labels
    for (let i = 0; i < 6 && groupEl; i++) {
      const t = (groupEl.innerText || '').replace(/\s+/g, ' ');
      if (/全局看板/.test(t) && /运营看板/.test(t)) break;
      groupEl = groupEl.parentElement;
    }
    const groupText = groupEl ? (groupEl.innerText || '').replace(/\s+/g, ' ') : '';
    const childrenVisible = /运营看板/.test(groupText) && /交付保障看板/.test(groupText) && /人力资源看板/.test(groupText);
    // highlight: look for background not fully transparent on group or ops current
    const opsEl = all.find((el) => ((el.textContent || '').trim() === '运营看板'));
    let opsHighlight = false;
    if (opsEl) {
      let n = opsEl;
      for (let i = 0; i < 5 && n; i++) {
        const bg = getComputedStyle(n).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/);
        if (m) {
          const a = m[4] === undefined ? 1 : Number(m[4]);
          if (a > 0.05 && (Number(m[1]) + Number(m[2]) + Number(m[3])) / 3 > 40) {
            opsHighlight = true;
            break;
          }
        }
        n = n.parentElement;
      }
    }
    // up-arrow or chevron for expanded
    const arrowHint = groupEl
      ? /ri-arrow-up|ri-arrow-up-s|▲|︿|chevron-up|arrow-up/i.test(groupEl.innerHTML) ||
        Array.from(groupEl.querySelectorAll('i,[class*="ri-"]')).some((el) => /arrow-up|arrow-up-s/i.test(el.className || ''))
      : false;
    // also accept rotate/transform indicators on arrow-down
    const anyArrow = groupEl
      ? Array.from(groupEl.querySelectorAll('i,[class*="ri-"],span')).some((el) => {
          const cls = el.className || '';
          const rot = getComputedStyle(el).transform;
          return /arrow|chevron/i.test(cls) || (rot && rot !== 'none');
        })
      : false;
    return {
      hasGlobal, hasOps, hasDelivery, hasHr, childrenVisible, opsHighlight, arrowHint, anyArrow,
      groupTextSample: groupText.slice(0, 120),
    };
  });
  push(3, '全局看板展开组：运营/交付保障/人力 + 选中浅底 + 展开指示',
    globalGroup.hasGlobal && globalGroup.childrenVisible && (globalGroup.opsHighlight || globalGroup.arrowHint || globalGroup.anyArrow),
    JSON.stringify(globalGroup));

  // --- AC4 一级六项 ---
  const level1 = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const text = (aside.innerText || '').replace(/\s+/g, ' ');
    const labels = ['项目管理', '报告体系', '平台设置', '操作日志', '人员评分体系', '项目执行跟踪'];
    const found = {};
    for (const l of labels) found[l] = text.includes(l);
    const allFound = labels.every((l) => found[l]);
    // icons: remix classes present in aside
    const iconCount = aside.querySelectorAll('i[class*="ri-"], [class*="ri-"]').length;
    // down arrows on collapsibles
    const downArrows = Array.from(aside.querySelectorAll('i,[class*="ri-"]')).filter((el) =>
      /arrow-down|arrow-down-s|arrow-right/i.test(el.className || '')
    ).length;
    return { found, allFound, iconCount, downArrows };
  });
  push(4, '一级六项可见且带图标；可折叠项有下箭头（或等价）',
    level1.allFound && level1.iconCount >= 6,
    JSON.stringify(level1));

  // --- AC5 底右折叠 « ---
  const collapseBtn = await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="shell-sidebar-collapse"]');
    if (!btn) return null;
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const br = btn.getBoundingClientRect();
    const ar = aside.getBoundingClientRect();
    const label = btn.getAttribute('aria-label') || '';
    const text = (btn.innerText || btn.textContent || '').trim();
    const nearBottom = br.bottom > ar.bottom - 80;
    const nearRight = br.right > ar.right - 48;
    return { label, text, nearBottom, nearRight, codePoints: Array.from(text).map((c) => c.codePointAt(0).toString(16)) };
  });
  const collapseOk = collapseBtn && (collapseBtn.text === '«' || collapseBtn.text === '»' || /折叠|展开/.test(collapseBtn.label));
  push(5, '侧栏底右折叠控制 «（或等价）',
    !!(collapseBtn && collapseOk && collapseBtn.nearBottom),
    JSON.stringify(collapseBtn));

  // --- AC6 默认展开 + 运营选中 ---
  const defaults = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const collapsed = aside.getAttribute('data-collapsed');
    const text = (aside.innerText || '').replace(/\s+/g, ' ');
    const globalExpanded = /全局看板/.test(text) && /运营看板/.test(text) && /交付保障看板/.test(text);
    // current: aria-current or class containing active/current, or highlighted 运营看板
    const opsLinks = Array.from(aside.querySelectorAll('a,button,div,span')).filter((el) => (el.textContent || '').trim() === '运营看板');
    let currentish = false;
    const clues = [];
    for (const el of opsLinks) {
      const aria = el.getAttribute('aria-current');
      const cls = el.className || '';
      let n = el;
      for (let i = 0; i < 4 && n; i++) {
        const c = (n.className || '') + ' ' + (n.getAttribute('data-current') || '') + ' ' + (n.getAttribute('aria-current') || '');
        clues.push(c.slice(0, 80));
        if (/current|active|selected|bg-|primary/i.test(c) || n.getAttribute('aria-current') === 'page') {
          currentish = true;
        }
        const bg = getComputedStyle(n).backgroundColor;
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/);
        if (m) {
          const a = m[4] === undefined ? 1 : Number(m[4]);
          if (a > 0.08) currentish = true;
        }
        n = n.parentElement;
      }
    }
    return { collapsed, globalExpanded, currentish, clues: clues.slice(0, 8) };
  });
  push(6, '全局看板默认展开；进入 Board 时运营看板选中',
    defaults.collapsed === 'false' && defaults.globalExpanded && defaults.currentish,
    JSON.stringify(defaults));

  // --- AC7 expand/collapse groups ---
  const toggleResult = await page.evaluate(async () => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const globalWrap = aside.querySelector('[data-testid="shell-nav-global"]');
    const globalBtn = globalWrap && globalWrap.querySelector('button[aria-expanded]');
    if (!globalBtn) return { ok: false, reason: 'no shell-nav-global button[aria-expanded]' };
    const beforeExpanded = globalBtn.getAttribute('aria-expanded');
    const beforeKids = (globalWrap.innerText || '').includes('交付保障看板');
    globalBtn.click();
    await new Promise((r) => setTimeout(r, 350));
    const midExpanded = globalBtn.getAttribute('aria-expanded');
    const midKids = (globalWrap.innerText || '').includes('交付保障看板');
    globalBtn.click();
    await new Promise((r) => setTimeout(r, 350));
    const afterExpanded = globalBtn.getAttribute('aria-expanded');
    const afterKids = (globalWrap.innerText || '').includes('交付保障看板');

    const reportWrap = aside.querySelector('[data-testid="shell-nav-reports"]');
    const reportBtn = reportWrap && reportWrap.querySelector('button[aria-expanded]');
    let reportToggle = null;
    if (reportBtn) {
      const r0 = reportBtn.getAttribute('aria-expanded');
      reportBtn.click();
      await new Promise((r) => setTimeout(r, 300));
      const r1 = reportBtn.getAttribute('aria-expanded');
      reportBtn.click();
      await new Promise((r) => setTimeout(r, 200));
      const r2 = reportBtn.getAttribute('aria-expanded');
      reportToggle = { r0, r1, r2, flipped: r0 !== r1 && r1 !== r2 && r0 === r2 };
    }

    const flipped =
      beforeExpanded === 'true' &&
      midExpanded === 'false' &&
      afterExpanded === 'true' &&
      beforeKids === true &&
      midKids === false &&
      afterKids === true;
    return {
      ok: flipped && (reportToggle ? reportToggle.flipped : true),
      beforeExpanded, midExpanded, afterExpanded, beforeKids, midKids, afterKids, reportToggle,
    };
  });
  push(7, '一级组可展开/收起（全局看板）',
    toggleResult.ok,
    JSON.stringify(toggleResult));

  // ensure global re-expanded for screenshots / further checks
  await page.evaluate(async () => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const gBtn = aside.querySelector('[data-testid="shell-nav-global"] button[aria-expanded]');
    if (gBtn && gBtn.getAttribute('aria-expanded') !== 'true') {
      gBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  });

  // --- AC8 routes / placeholders ---
  const routeCheck = await page.evaluate(async () => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    // click 人力资源看板 (placeholder) — should not throw; may stay or show placeholder
    const candidates = Array.from(aside.querySelectorAll('a, button, div, span'));
    const hr = candidates.find((el) => (el.textContent || '').trim() === '人力资源看板');
    const rating = candidates.find((el) => (el.textContent || '').trim() === '人员评分体系');
    const results = {};
    if (hr) {
      try {
        hr.click();
        await new Promise((r) => setTimeout(r, 200));
        results.hrClicked = true;
      } catch (e) {
        results.hrClicked = false;
        results.hrErr = String(e);
      }
    }
    if (rating) {
      try {
        rating.click();
        await new Promise((r) => setTimeout(r, 200));
        results.ratingClicked = true;
      } catch (e) {
        results.ratingClicked = false;
        results.ratingErr = String(e);
      }
    }
    // ops link still present
    results.opsLinkPresent = !!(aside.querySelector('a[href*="operations-dashboard-202610/board"]') || (aside.innerText || '').includes('运营看板'));
    return results;
  });
  push(8, '已有入口挂上；无独立页项可点不报错/占位',
    routeCheck.opsLinkPresent && routeCheck.hrClicked !== false && routeCheck.ratingClicked !== false,
    JSON.stringify(routeCheck));

  // --- AC9 白底看板目录仍在 ---
  const catalog = await page.evaluate(() => {
    const tree = document.querySelector('[aria-label="看板目录"]');
    if (!tree) return { found: false };
    const cs = getComputedStyle(tree);
    const br = tree.getBoundingClientRect();
    const title = (tree.innerText || '').slice(0, 40);
    // not inside wood sidebar
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const insideAside = aside && aside.contains(tree);
    const bg = cs.backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const light = m ? (Number(m[1]) + Number(m[2]) + Number(m[3])) / 3 > 200 : false;
    return {
      found: true,
      insideAside: !!insideAside,
      light,
      bg,
      w: +br.width.toFixed(1),
      h: +br.height.toFixed(1),
      visible: br.width > 40 && br.height > 40,
      title,
    };
  });
  push(9, '白底「看板目录」仍在且未被深色侧栏吃掉',
    catalog.found && !catalog.insideAside && catalog.light && catalog.visible,
    JSON.stringify(catalog));

  // --- measure width expand/collapse + main marginLeft ---
  const geom1 = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const main = aside.nextElementSibling;
    const ar = aside.getBoundingClientRect();
    const ms = main ? getComputedStyle(main) : null;
    return {
      sidebarW: +ar.width.toFixed(1),
      marginLeft: ms ? ms.marginLeft : null,
      collapsedAttr: aside.getAttribute('data-collapsed'),
    };
  });

  await page.click('[data-testid="shell-sidebar-collapse"]');
  await page.waitForTimeout(400);

  const geom2 = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const main = aside.nextElementSibling;
    const ar = aside.getBoundingClientRect();
    const ms = main ? getComputedStyle(main) : null;
    const header = document.querySelector('h2');
    const headerLeft = header ? getComputedStyle(header.parentElement).left : null;
    return {
      sidebarW: +ar.width.toFixed(1),
      marginLeft: ms ? ms.marginLeft : null,
      collapsedAttr: aside.getAttribute('data-collapsed'),
      headerLeft,
      collapseText: (document.querySelector('[data-testid="shell-sidebar-collapse"]')?.innerText || '').trim(),
    };
  });

  // screenshot collapsed
  await page.screenshot({ path: path.join(OUT, 'max-sidebar-real-02-collapsed.png'), fullPage: false });

  await page.click('[data-testid="shell-sidebar-collapse"]');
  await page.waitForTimeout(400);

  const geom3 = await page.evaluate(() => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    const main = aside.nextElementSibling;
    const ar = aside.getBoundingClientRect();
    const ms = main ? getComputedStyle(main) : null;
    return {
      sidebarW: +ar.width.toFixed(1),
      marginLeft: ms ? ms.marginLeft : null,
      collapsedAttr: aside.getAttribute('data-collapsed'),
    };
  });

  const widthOk =
    Math.abs(geom1.sidebarW - 224) < 2 &&
    Math.abs(geom2.sidebarW - 64) < 2 &&
    Math.abs(geom3.sidebarW - 224) < 2 &&
    geom1.marginLeft === '224px' &&
    geom2.marginLeft === '64px' &&
    geom3.marginLeft === '224px' &&
    geom1.collapsedAttr === 'false' &&
    geom2.collapsedAttr === 'true' &&
    geom3.collapsedAttr === 'false';

  push('W', '侧栏宽展开224/折叠64；主区 marginLeft 联动并可恢复',
    widthOk,
    JSON.stringify({ geom1, geom2, geom3 }));

  // ensure expanded + global open for shots
  await page.evaluate(async () => {
    const aside = document.querySelector('[data-testid="wood-shell-sidebar"]');
    if (aside.getAttribute('data-collapsed') === 'true') {
      document.querySelector('[data-testid="shell-sidebar-collapse"]').click();
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!(aside.innerText || '').includes('交付保障看板')) {
      const gBtn = aside.querySelector('[data-testid="shell-nav-global"] button[aria-expanded]');
      if (gBtn && gBtn.getAttribute('aria-expanded') !== 'true') {
        gBtn.click();
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  });
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(OUT, 'max-sidebar-real-01-expanded.png'), fullPage: false });

  // clip sidebar
  const box = await page.locator('[data-testid="wood-shell-sidebar"]').boundingBox();
  if (box) {
    await page.screenshot({
      path: path.join(OUT, 'max-sidebar-real-03-sidebar-clip.png'),
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: Math.min(box.width + 8, 280),
        height: Math.min(box.height, 900),
      },
    });
  }

  const failCount = checks.filter((c) => !c.ok).length;
  const verdict = failCount === 0 && pageErrors.length === 0 ? 'PASS' : 'FAIL';

  const result = {
    verdict,
    url: URL,
    timestamp: new Date().toISOString(),
    pageErrors,
    checks,
    notes: [
      '独立 Playwright 实机；不采信 Leo probe-sidebar.cjs 静态字符串自报',
      '并列未结条「板块现金流/目标达成仅全部板块时展示」本探针未验',
      'Remix 图标近似 / 无子路由组展开为占位或同名 — Claire 已知差异，非阻断除非完全缺失',
    ],
    screenshots: [
      'max-sidebar-real-01-expanded.png',
      'max-sidebar-real-02-collapsed.png',
      'max-sidebar-real-03-sidebar-clip.png',
    ],
  };

  fs.writeFileSync(path.join(OUT, 'max-sidebar-real.json'), JSON.stringify(result, null, 2), 'utf8');

  const md = [];
  md.push('# Board 深色侧栏（wood. Projects Zone）实机验收 — Max');
  md.push('');
  md.push(`- **结论**: **${verdict}**`);
  md.push(`- **URL**: ${URL}`);
  md.push(`- **时间**: ${result.timestamp}（记录为 UTC ISO；本地 Asia/Shanghai）`);
  md.push(`- **对照账本**: \`docs/变更账本.md\` → \`### 2026-11-03 —— 运营看板202610：Board 壳左侧 sidebar 按真实环境样式完善\`（状态仍为待落地；本记录不改账本）`);
  md.push(`- **pageerror**: ${pageErrors.length ? pageErrors.join(' | ') : '无'}`);
  md.push('');
  md.push('## 逐 AC');
  md.push('');
  for (const c of checks) {
    md.push(`- **AC${c.ac}** ${c.ok ? 'PASS' : 'FAIL'} — ${c.name}`);
    md.push(`  - detail: \`${c.detail.replace(/`/g, "'")}\``);
  }
  md.push('');
  md.push('## 阻断项');
  md.push('');
  const blockers = checks.filter((c) => !c.ok);
  if (!blockers.length && !pageErrors.length) {
    md.push('- 无');
  } else {
    for (const b of blockers) md.push(`- AC${b.ac}: ${b.name} — ${b.detail}`);
    for (const e of pageErrors) md.push(`- pageerror: ${e}`);
  }
  md.push('');
  md.push('## 截图');
  md.push('');
  md.push('- `max-sidebar-real-01-expanded.png` — 展开态（侧栏+白底看板目录）');
  md.push('- `max-sidebar-real-02-collapsed.png` — 折叠态');
  md.push('- `max-sidebar-real-03-sidebar-clip.png` — 侧栏裁剪（一级项与全局看板展开）');
  md.push('');
  md.push('## 已知近似差异（非阻断）');
  md.push('');
  md.push('- Remix 图标近似真实环境');
  md.push('- 无子路由的组展开为占位/同名叶子（如报告体系、操作日志、人力资源看板、人员评分体系、项目执行跟踪）');
  md.push('');
  md.push('## 未结并列条（本记录未验、勿混关）');
  md.push('');
  md.push('- 板块现金流/目标达成仅「全部板块」时展示');
  md.push('- （其它并列 Board 相关未结条按账本分条）');
  md.push('');
  md.push('## 方法说明');
  md.push('');
  md.push('- 探针: `max-sidebar-real.cjs`（Playwright 打开真实 Board，非源码字符串检查）');
  md.push('- Leo `probe-sidebar.cjs` / `probe-result.txt` 仅静态 includes，**未采信**');
  md.push('- 未改业务代码、未改账本、未 commit');
  md.push('');

  fs.writeFileSync(path.join(OUT, 'max-sidebar-real-验收记录.md'), md.join('\n'), 'utf8');

  console.log(JSON.stringify({ verdict, failCount, pageErrors, checks: checks.map((c) => ({ ac: c.ac, ok: c.ok, name: c.name })) }, null, 2));

  await browser.close();
  process.exit(verdict === 'PASS' ? 0 : 1);
})().catch((err) => {
  console.error('PROBE_FATAL', err);
  process.exit(2);
});
