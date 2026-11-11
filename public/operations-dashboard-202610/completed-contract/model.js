/** completed-contract: model. Private page context; no cross-dashboard state. */
export function register(ctx) {
function buildCompletionTreemap(projects) {
    const list = projects || [];
    const significant = [];
    let nearZeroCount = 0;
    list.forEach(p => {
      if (!p) return;
      if (Math.abs(Number(p.monthCompletion) || 0) >= ctx.COMPLETION_NEAR_ZERO) significant.push(p);
      else nearZeroCount += 1;
    });
    significant.sort((a, b) => Math.abs(Number(b.monthCompletion)||0) - Math.abs(Number(a.monthCompletion)||0));
    let named = [];
    if (significant.length) {
      const maxAbs = Math.abs(Number(significant[0].monthCompletion) || 0);
      const floor = maxAbs * ctx.TREEMAP_MIN_RATIO;
      significant.forEach(p => {
        if (named.length >= ctx.TREEMAP_NAMED_CAP) return;
        if (Math.abs(Number(p.monthCompletion)||0) >= floor) named.push(p);
      });
      if (!named.length) named = significant.slice(0, ctx.TREEMAP_FALLBACK_CAP);
    }
    const namedNos = {};
    named.forEach(p => { namedNos[p.projectNo || ""] = true; });
    const rest = significant.filter(p => !namedNos[p.projectNo || ""]);
    const tiles = named.map(p => ({
      kind: "project",
      projectNo: p.projectNo,
      projectName: p.projectName,
      pmName: p.pmName,
      monthCompletion: p.monthCompletion,
      totalContract: p.totalContract,
      monthInvoice: p.monthInvoice,
      monthPayment: p.monthPayment
    }));
    if (rest.length) {
      let sum = 0; const nos = [];
      rest.forEach(p => { sum += Number(p.monthCompletion)||0; nos.push(p.projectNo||""); });
      if (Math.abs(sum) >= ctx.COMPLETION_NEAR_ZERO) {
        tiles.push({ kind: "other", label: "其他项目", monthCompletion: sum, count: rest.length, projectNos: nos });
      }
    }
    return { tiles, nearZeroCount };
  }

function buildAlertTypeRank(items) {
    const counts = {};
    (items || []).forEach(item => {
      if (!item || !item.label) return;
      counts[item.label] = (counts[item.label] || 0) + 1;
    });
    const orderIndex = {};
    ctx.ALERT_TYPE_ORDER.forEach((label, idx) => { orderIndex[label] = idx; });
    return Object.keys(counts)
      .filter(label => counts[label] > 0)
      .sort((a, b) => {
        const dc = counts[b] - counts[a];
        if (dc !== 0) return dc;
        return (orderIndex[a] ?? 999) - (orderIndex[b] ?? 999);
      })
      .map(label => ({ label, count: counts[label] }));
  }

function resolveProjects() {
    if (ctx.emptyTreeKind === "none") return [];
    if (ctx.emptyTreeKind === "all-zero") {
      return ctx.DEMO_PROJECTS_RAW.map(p => Object.assign({}, p, { monthCompletion: 0 }));
    }
    return ctx.DEMO_PROJECTS_RAW.slice();
  }
Object.assign(ctx,{buildCompletionTreemap,buildAlertTypeRank,resolveProjects});
}
