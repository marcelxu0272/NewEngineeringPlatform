/**
 * 现金流仪表盘（移动简版）— Vue 2 + ECharts
 * 演示数据与图示一致；后续可替换为 API。
 */
(function () {
  function formatWan(n) {
    var x = Number(n);
    if (isNaN(x)) return '—';
    var s = Math.round(x).toLocaleString('zh-CN');
    return s;
  }

  /** 根据筛选条件刷新展示（当前为静态演示，仅同步 UI 状态） */
  function buildChartOption(labels, inflow, outflow, net) {
    return {
      color: ['#2563eb', '#ef4444', '#16a34a'],
      grid: { left: 8, right: 8, top: 28, bottom: 4 },
      tooltip: {
        trigger: 'axis',
        confine: true,
        textStyle: { fontSize: 12 },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 10, interval: 0, rotate: labels.length > 8 ? 35 : 0 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      series: [
        {
          name: '现金流入',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2, color: '#2563eb' },
          itemStyle: { color: '#2563eb' },
          data: inflow,
        },
        {
          name: '现金流出',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2, color: '#ef4444' },
          itemStyle: { color: '#ef4444' },
          data: outflow,
        },
        {
          name: '净现金流',
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, type: 'dashed', color: '#16a34a' },
          itemStyle: { color: '#16a34a' },
          data: net,
        },
      ],
    };
  }

  new Vue({
    el: '#app',
    data: function () {
      return {
        draftSector: 'all',
        draftYearMonth: '2024-05',
        appliedSectorLabel: '全部板块',
        appliedMonthLabel: '2024年5月',
        netWan: -1370,
        netCompareText: '较上月 ↓ 71.3%',
        inflowWan: 4280,
        outflowWan: 5650,
        chartLabels: ['12', '2024-01', '02', '03', '04', '05'],
        chartInflow: [3200, 3100, 3500, 4000, 4100, 4280],
        chartOutflow: [4800, 4700, 4900, 5200, 5400, 5650],
        chartNet: [-1200, -800, -600, -400, -500, -1370],
        sectorRows: [
          { name: '制造板块', dot: 'blue', inflow: 2100, outflow: 2580, net: -480 },
          { name: '销售板块', dot: 'orange', inflow: 1820, outflow: 1260, net: 560 },
          { name: '研发板块', dot: 'blue', inflow: 580, outflow: 920, net: -340 },
          { name: '营运板块', dot: 'orange', inflow: 1560, outflow: 1890, net: -330 },
          { name: '职能板块', dot: 'blue', inflow: 360, outflow: 540, net: -180 },
        ],
        sectorOptions: [
          { value: 'all', label: '全部板块' },
          { value: 'mfg', label: '制造板块' },
          { value: 'sales', label: '销售板块' },
          { value: 'rnd', label: '研发板块' },
          { value: 'ops', label: '营运板块' },
          { value: 'func', label: '职能板块' },
        ],
        monthOptions: [
          { value: '2024-01', label: '2024年1月' },
          { value: '2024-02', label: '2024年2月' },
          { value: '2024-03', label: '2024年3月' },
          { value: '2024-04', label: '2024年4月' },
          { value: '2024-05', label: '2024年5月' },
        ],
        chartInstance: null,
      };
    },
    computed: {
      netClass: function () {
        return this.netWan >= 0 ? 'val-pos' : 'val-neg';
      },
      compareClass: function () {
        return this.netWan >= 0 ? 'val-pos' : 'val-neg';
      },
    },
    methods: {
      formatWan: formatWan,
      formatNetCell: function (n) {
        var sign = n > 0 ? '+' : '';
        return sign + formatWan(n);
      },
      netCellClass: function (n) {
        return n >= 0 ? 'val-pos' : 'val-neg';
      },
      onSearch: function () {
        var self = this;
        var sec = this.sectorOptions.find(function (o) {
          return o.value === self.draftSector;
        });
        var mo = this.monthOptions.find(function (o) {
          return o.value === self.draftYearMonth;
        });
        this.appliedSectorLabel = sec ? sec.label : '全部板块';
        this.appliedMonthLabel = mo ? mo.label : '';
        if (self.chartInstance) {
          self.$nextTick(function () {
            self.renderChart();
          });
        }
      },
      renderChart: function () {
        if (!this.chartInstance || typeof echarts === 'undefined') return;
        this.chartInstance.setOption(
          buildChartOption(this.chartLabels, this.chartInflow, this.chartOutflow, this.chartNet),
          true
        );
      },
      onResize: function () {
        if (this.chartInstance) this.chartInstance.resize();
      },
    },
    mounted: function () {
      var self = this;
      this.onSearch();
      this.$nextTick(function () {
        var el = document.getElementById('cf-trend-chart');
        if (!el || typeof echarts === 'undefined') return;
        self.chartInstance = echarts.init(el);
        self.renderChart();
        window.addEventListener('resize', self.onResize);
      });
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.onResize);
      if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
      }
    },
  });
})();
