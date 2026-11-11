/** completed-contract: dialogs. Private page context; no cross-dashboard state. */
export function register(ctx) {
function openModal(kind, rows, title, filterLabel) {
    ctx.modal.kind = kind;
    ctx.modal.rows = rows || [];
    ctx.modal.page = 1;
    ctx.modal.filterLabel = filterLabel || "";
    document.getElementById("modalTitle").textContent = title;
    const chip = document.getElementById("modalFilterChip");
    if (ctx.modal.filterLabel) {
      chip.hidden = false;
      document.getElementById("modalFilterText").textContent = "筛选：" + ctx.modal.filterLabel;
    } else {
      chip.hidden = true;
    }
    ctx.renderModal();
    document.getElementById("modal").classList.add("open");
    document.getElementById("modalMask").classList.add("open");
  }

function closeModal() {
    document.getElementById("modal").classList.remove("open");
    document.getElementById("modalMask").classList.remove("open");
  }

function renderModal() {
    const thead = document.querySelector("#modalTable thead");
    const tbody = document.querySelector("#modalTable tbody");
    const start = (ctx.modal.page - 1) * ctx.PAGE_SIZE;
    const pageRows = ctx.modal.rows.slice(start, start + ctx.PAGE_SIZE);
    const max = Math.max(1, Math.ceil(ctx.modal.rows.length / ctx.PAGE_SIZE) || 1);
    document.getElementById("modalPageInfo").textContent =
      "共 " + ctx.modal.rows.length + " 条 · 第 " + ctx.modal.page + " / " + max + " 页";
    document.getElementById("modalPrev").disabled = ctx.modal.page <= 1;
    document.getElementById("modalNext").disabled = ctx.modal.page >= max;

    if (ctx.modal.kind === "diff") {
      thead.innerHTML = "<tr><th>项目号</th><th>项目名称</th><th>项目经理</th><th class='num'>本月完成合同额（万元）</th><th class='num'>总合同额（万元）</th><th class='num'>当月开票（万元）</th><th class='num'>当月回款（万元）</th></tr>";
      tbody.innerHTML = pageRows.map(r => {
        const neg = Number(r.monthCompletion) < 0 ? " neg" : "";
        return "<tr><td>" + r.projectNo + "</td><td>" + r.projectName + "</td><td>" + r.pmName +
          "</td><td class='num" + neg + "'>" + ctx.formatWanFromYuan(r.monthCompletion) +
          "</td><td class='num'>" + ctx.formatWanFromYuan(r.totalContract) +
          "</td><td class='num'>" + ctx.formatWanFromYuan(r.monthInvoice) +
          "</td><td class='num'>" + ctx.formatWanFromYuan(r.monthPayment) + "</td></tr>";
      }).join("") || "<tr><td colspan='7' class='center'>本次填报没有项目</td></tr>";
    } else {
      thead.innerHTML = "<tr><th>项目号</th><th>项目名称</th><th>项目经理</th><th>异常类型</th></tr>";
      tbody.innerHTML = pageRows.map(r =>
        "<tr><td>" + r.projectNo + "</td><td>" + r.projectName + "</td><td>" + r.pmName +
        "</td><td>" + r.label + "</td></tr>"
      ).join("") || "<tr><td colspan='4' class='center'>未发现异常</td></tr>";
    }
  }

function openDiffModal(projectNos) {
    let rows = ctx.resolveProjects().filter(p => Math.abs(Number(p.monthCompletion)||0) >= ctx.COMPLETION_NEAR_ZERO || ctx.emptyTreeKind === "all-zero");
    if (ctx.emptyTreeKind === "none") rows = [];
    if (projectNos && projectNos.length) {
      const allow = {};
      projectNos.forEach(no => { allow[no] = true; });
      rows = rows.filter(r => allow[r.projectNo]);
    }
    ctx.openModal("diff", rows, "本月完成合同额情况（" + rows.length + "）", projectNos ? "其他项目" : "");
  }

function openAttentionModal(label) {
    let rows = ctx.showEmptyAlerts ? [] : ctx.DEMO_ALERT_ITEMS.slice();
    if (label) rows = rows.filter(r => r.label === label);
    ctx.openModal("attention", rows, "项目预警一览（" + rows.length + "）", label || "");
  }
Object.assign(ctx,{openModal,closeModal,renderModal,openDiffModal,openAttentionModal});
}
