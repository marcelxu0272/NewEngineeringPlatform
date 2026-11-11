/** completed-contract: charts. Private page context; no cross-dashboard state. */
export function register(ctx) {
function disposeChart(key) {
    if (ctx.charts[key]) {
      ctx.charts[key].dispose();
      ctx.charts[key] = null;
    }
  }

function renderTree() {
    const el = document.getElementById("treeChart");
    const emptyEl = document.getElementById("treeEmpty");
    const legend = document.getElementById("treeLegend");
    const projects = ctx.resolveProjects();
    const treemap = ctx.buildCompletionTreemap(projects);
    let emptyKind = "";
    if (!projects.length) emptyKind = "none";
    else if (!(treemap.tiles || []).length) emptyKind = "all-zero";

    if (emptyKind) {
      ctx.disposeChart("tree");
      el.style.display = "none";
      el.hidden = true;
      legend.hidden = true;
      emptyEl.hidden = false;
      emptyEl.style.display = "flex";
      emptyEl.textContent = emptyKind === "none" ? "本次填报没有项目" : "本月完成合同额均为 0";
      return;
    }
    emptyEl.hidden = true;
    emptyEl.style.display = "none";
    legend.hidden = false;
    el.hidden = false;
    el.style.display = "block";
    if (typeof echarts === "undefined") {
      emptyEl.hidden = false;
      emptyEl.style.display = "flex";
      emptyEl.textContent = "图表库未加载";
      el.style.display = "none";
      el.hidden = true;
      return;
    }
    const c = ctx.chartColors();
    if (!ctx.charts.tree) {
      ctx.charts.tree = echarts.init(el);
      ctx.charts.tree.on("click", params => {
        const data = params && params.data;
        if (!data) return;
        if (data.projectNos) ctx.openDiffModal(data.projectNos);
      });
    }
    const data = (treemap.tiles || []).map(tile => {
      const negative = Number(tile.monthCompletion) < 0;
      return {
        name: tile.kind === "project" ? (tile.projectNo || "—") : tile.label,
        value: Math.abs(Number(tile.monthCompletion) || 0),
        kind: tile.kind,
        monthCompletion: tile.monthCompletion,
        projectNo: tile.projectNo,
        projectName: tile.projectName,
        pmName: tile.pmName,
        count: tile.count,
        projectNos: tile.projectNos,
        itemStyle: { color: negative ? c.dangerFill : c.brandFill },
        label: { color: negative ? c.dangerText : c.brandText }
      };
    });
    ctx.charts.tree.setOption({
      textStyle: { fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", Arial, sans-serif' },
      tooltip: Object.assign(ctx.tooltipBase({ extraCssText: "max-width:300px;" }), {
        trigger: "item",
        formatter: function (item) {
          const row = item && item.data;
          if (!row) return "";
          const amt = ctx.formatWanFromYuan(row.monthCompletion) + " 万";
          if (row.kind === "project") {
            return '<div style="font-weight:650;margin-bottom:4px;">' + (row.projectName || "—") + "</div>"
              + ctx.tooltipRow("", "项目号", row.projectNo || "—")
              + ctx.tooltipRow("", "项目经理", row.pmName || "—")
              + ctx.tooltipRow("", "本月完成合同额", amt);
          }
          return '<div style="font-weight:650;margin-bottom:4px;">' + (row.name || "") + "</div>"
            + ctx.tooltipRow("", "项目数", String(row.count || 0))
            + ctx.tooltipRow("", "合计", amt);
        }
      }),
      series: [{
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        label: {
          show: true,
          fontSize: 12,
          formatter: function (info) {
            const row = info.data || {};
            return row.name || "";
          }
        },
        upperLabel: { show: false },
        itemStyle: { borderColor: "#fff", borderWidth: 2, gapWidth: 2 },
        data: data
      }]
    }, true);
    if (typeof ctx.scheduleResizeCharts === "function") ctx.scheduleResizeCharts(); else ctx.charts.tree.resize();
  }

function renderAlert() {
    const el = document.getElementById("alertChart");
    const emptyEl = document.getElementById("alertEmpty");
    const items = ctx.showEmptyAlerts ? [] : ctx.DEMO_ALERT_ITEMS;
    const ranked = ctx.buildAlertTypeRank(items);
    if (!ranked.length) {
      ctx.disposeChart("alert");
      el.style.display = "none";
      el.hidden = true;
      emptyEl.hidden = false;
      emptyEl.style.display = "flex";
      return;
    }
    emptyEl.hidden = true;
    emptyEl.style.display = "none";
    el.hidden = false;
    el.style.display = "block";
    if (typeof echarts === "undefined") return;
    const c = ctx.chartColors();
    if (!ctx.charts.alert) {
      ctx.charts.alert = echarts.init(el);
      ctx.charts.alert.on("click", params => {
        const label = params && params.data && params.data.label;
        if (label) ctx.openAttentionModal(label);
      });
    }
    const rankedAsc = ranked.slice().reverse();
    const labels = rankedAsc.map(r => ctx.truncateLabel(r.label, 12));
    const data = rankedAsc.map(r => ({
      value: r.count,
      label: r.label,
      itemStyle: { color: c.amber, borderRadius: [0, 4, 4, 0] }
    }));
    ctx.charts.alert.setOption({
      textStyle: { fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", Arial, sans-serif' },
      tooltip: Object.assign(ctx.tooltipBase({ extraCssText: "max-width:320px;" }), {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (items) {
          const list = Array.isArray(items) ? items : (items ? [items] : []);
          const item = list[0] || {};
          const full = (item.data && item.data.label) || item.name || "";
          if (!full) return "";
          return '<div style="font-weight:650;margin-bottom:4px;">' + full + "</div>"
            + ctx.tooltipRow(item.marker || "", "数量", (item.value == null ? "—" : String(item.value)) + " 条");
        }
      }),
      grid: { top: 8, left: 4, right: 36, bottom: 4, containLabel: true },
      xAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: c.faint, fontSize: 11 },
        splitLine: { lineStyle: { color: "rgba(15,23,42,0.06)" } }
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: c.muted, fontSize: 11 }
      },
      series: [{
        type: "bar",
        data: data,
        barMaxWidth: 18,
        label: {
          show: true,
          position: "right",
          color: "#92400e",
          fontSize: 11,
          formatter: "{c}"
        }
      }]
    }, true);
    if (typeof ctx.scheduleResizeCharts === "function") ctx.scheduleResizeCharts(); else ctx.charts.alert.resize();
  }

function renderTrend() {
    const el = document.getElementById("trendChart");
    if (typeof echarts === "undefined") return;
    const c = ctx.chartColors();
    if (!ctx.charts.trend) ctx.charts.trend = echarts.init(el);
    function toWanMonth(arr) {
      return (arr || []).map(v => v == null ? 0 : v / 10000);
    }
    function toWanYtd(arr) {
      let sum = 0;
      return (arr || []).map(v => { sum += Number(v) || 0; return sum / 10000; });
    }
    const mC = toWanMonth(ctx.trendCompletion);
    const mI = toWanMonth(ctx.trendInvoice);
    const mP = toWanMonth(ctx.trendPayment);
    const yC = toWanYtd(ctx.trendCompletion);
    const yI = toWanYtd(ctx.trendInvoice);
    const yP = toWanYtd(ctx.trendPayment);
    const axisLabel = { color: c.faint, fontSize: 11 };
    function bar(name, color, data) {
      return {
        name, type: "bar", yAxisIndex: 0, data, barMaxWidth: 14,
        itemStyle: { color, opacity: 0.78, borderRadius: [2, 2, 0, 0] }
      };
    }
    function line(name, color, data, opts) {
      return Object.assign({
        name, type: "line", yAxisIndex: 1, data, smooth: 0.2,
        symbol: "circle", symbolSize: 5,
        lineStyle: { width: 2.4, color },
        itemStyle: { color, borderColor: "#fff", borderWidth: 1.5 }
      }, opts || {});
    }
    const legend = [
      "完成合同额·当月", "完成开票额·当月", "完成回款额·当月",
      "完成合同额·累计", "完成开票额·累计", "完成回款额·累计"
    ];
    const idx = ctx.reportMonthIdx;
    ctx.charts.trend.setOption({
      color: [c.brand, c.invoice, c.payment, c.brand, c.invoice, c.payment],
      textStyle: { fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Microsoft YaHei", Arial, sans-serif' },
      tooltip: Object.assign(ctx.tooltipBase({ extraCssText: "max-width:320px;" }), {
        trigger: "axis",
        axisPointer: { type: "line" },
        formatter: function (items) {
          return ctx.tooltipAxisFormatter(items, function (raw) {
            return ctx.tooltipFmtNum(raw, "万");
          });
        }
      }),
      legend: {
        data: legend, top: 0, right: 0, itemWidth: 12, itemHeight: 8, itemGap: 12,
        textStyle: { color: c.muted, fontSize: 11 }
      },
      grid: { top: 48, left: 8, right: 12, bottom: 0, containLabel: true },
      xAxis: {
        type: "category", data: ctx.months,
        axisLine: { lineStyle: { color: c.border } },
        axisTick: { show: false },
        axisLabel
      },
      yAxis: [
        {
          type: "value", name: "当月·万", nameTextStyle: { color: c.faint, fontSize: 11 },
          axisLine: { show: false }, axisTick: { show: false }, axisLabel,
          splitLine: { lineStyle: { color: "rgba(15,23,42,0.06)" } }
        },
        {
          type: "value", name: "累计·万", nameTextStyle: { color: c.faint, fontSize: 11 },
          axisLine: { show: false }, axisTick: { show: false }, axisLabel,
          splitLine: { show: false }
        }
      ],
      series: [
        bar(legend[0], c.brand, mC),
        bar(legend[1], c.invoice, mI),
        bar(legend[2], c.payment, mP),
        line(legend[3], c.brand, yC, {
          markArea: idx < ctx.months.length - 1 ? {
            silent: true,
            itemStyle: { color: "rgba(15,23,42,0.028)" },
            label: {
              show: true, position: "insideTop", color: c.faint, fontSize: 11,
              padding: [4, 0, 0, 0], formatter: "预测"
            },
            data: [[{ xAxis: ctx.months[idx] }, { xAxis: ctx.months[ctx.months.length - 1] }]]
          } : undefined
        }),
        line(legend[4], c.invoice, yI),
        line(legend[5], c.payment, yP)
      ]
    }, true);
    if (typeof ctx.scheduleResizeCharts === "function") ctx.scheduleResizeCharts(); else ctx.charts.trend.resize();
  }

function renderAllCharts() {
    ctx.renderTree();
    ctx.renderAlert();
    ctx.renderTrend();
  }
Object.assign(ctx,{disposeChart,renderTree,renderAlert,renderTrend,renderAllCharts});
}
