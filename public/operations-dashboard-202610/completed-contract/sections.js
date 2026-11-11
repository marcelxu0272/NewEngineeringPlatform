/** completed-contract: sections. Private page context; no cross-dashboard state. */
export function register(ctx) {
function renderPm() {
    const totalYtd = ctx.DEMO_PM.reduce((s, r) => s + r.ytd, 0) || 1;
    const absComp = ctx.DEMO_PM.reduce((s, r) => s + Math.abs(r.completion), 0) || 1;
    const rows = ctx.DEMO_PM.slice().sort((a, b) => {
      const av = a[ctx.sortKey], bv = b[ctx.sortKey];
      if (ctx.sortKey === "shareCurrent") {
        const as = Math.abs(a.completion) / absComp, bs = Math.abs(b.completion) / absComp;
        return ctx.sortDir === "asc" ? as - bs : bs - as;
      }
      if (ctx.sortKey === "shareYtd") {
        const as = a.ytd / totalYtd, bs = b.ytd / totalYtd;
        return ctx.sortDir === "asc" ? as - bs : bs - as;
      }
      if (typeof av === "string") return ctx.sortDir === "asc" ? av.localeCompare(bv, "zh") : bv.localeCompare(av, "zh");
      return ctx.sortDir === "asc" ? av - bv : bv - av;
    });
    document.querySelector("#pmTable tbody").innerHTML = rows.map(r => {
      const share = (Math.abs(r.completion) / absComp * 100).toFixed(1);
      const ytdShare = (r.ytd / totalYtd * 100).toFixed(1);
      const neg = r.completion < 0 ? " neg" : "";
      return "<tr><td>" + r.pm + "</td><td class='center'>" + r.count +
        "</td><td class='num'>" + ctx.moneyWan(r.invoice) +
        "</td><td class='num'>" + ctx.moneyWan(r.payment) +
        "</td><td class='num" + neg + "'>" + ctx.moneyWan(r.completion) +
        "</td><td class='num'>" + ctx.moneyWan(r.ytd) +
        "</td><td class='center'>" + share + "%</td><td class='center'>" + ytdShare + "%</td></tr>";
    }).join("");
  }
Object.assign(ctx,{renderPm});
}
