export const BUSINESS_TYPES = ['设计及咨询', 'PMC', 'EPC'] as const;
export type BusinessType = typeof BUSINESS_TYPES[number];
export const STAGES = ['跟进中', '投标准备', '已投标', '已中标', '已签约'] as const;
export type MarketView = 'opportunity' | 'market-data' | 'contract-board';
export function isMarketView(view: string): view is MarketView {
  return ['opportunity', 'market-data', 'contract-board'].includes(view);
}
export type DateRange = [string, string] | null;
export type MarketFilters = {
  unit: string; types: BusinessType[]; stage: string;
  application: DateRange; bidTime: DateRange; bidDate: DateRange; contract: DateRange;
};
export type Opportunity = {
  id: string; name: string; unit: string; type: BusinessType; stage: string;
  customer: string; group: string; applicationDate: string; bidTime: string; bidDate: string;
  estimated: number; bid: number; weighted: number;
};
export type Contract = {
  id: string; opportunityId: string; name: string; unit: string; type: BusinessType;
  customer: string; group: string; date: string; amount: number; kind: '实际' | '预测';
  history2024: number; history2025: number;
};
export type Framework = {
  id: string; opportunityId: string; name: string; unit: string; type: BusinessType;
  customer: string; date: string; amount: number; kind: '新签框架' | '变更框架';
};
export type MarketDemo = { opportunities: Opportunity[]; contracts: Contract[]; frameworks: Framework[]; targets: { unit: string; type: BusinessType; amount: number }[] };

export const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const sum = <T,>(rows: readonly T[], value: (row: T) => number) => round(rows.reduce((n, row) => n + Math.round(value(row) * 100), 0) / 100);
export const money = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const rate = (amount: number, target: number) => target > 0 ? amount / target * 100 : null;
export const percent = (n: number | null) => n === null ? '—' : `${n.toFixed(2)}%`;
export const inRange = (date: string, range: DateRange) => !range || (date >= range[0] && date <= range[1]);
export const chinaToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const defaultFilters = (unit: string, today = chinaToday()): MarketFilters => ({
  unit, types: [...BUSINESS_TYPES], stage: '全部阶段', application: null, bidTime: null, bidDate: null,
  contract: ['2026-01-01', today < '2026-01-01' ? '2026-01-01' : today > '2026-12-31' ? '2026-12-31' : today],
});

/** Deterministic synthetic records, never company/customer production data. Amount unit: 万元. */
export function createMarketDemo(units: string[]): MarketDemo {
  const opportunities: Opportunity[] = [], contracts: Contract[] = [], frameworks: Framework[] = [];
  const targets: MarketDemo['targets'] = [];
  units.forEach((unit, u) => BUSINESS_TYPES.forEach((type, t) => {
    targets.push({ unit, type, amount: 4200 + u * 530 + t * 3100 });
    for (let month = 1; month <= 12; month++) for (let j = 0; j < 2; j++) {
      const id = `DEMO-${u + 1}-${t + 1}-${month}-${j + 1}`;
      const stageIndex = (u + t + month + j) % STAGES.length;
      const estimated = round(220 + u * 47.31 + t * 357.21 + month * 28.37 + j * 103.15);
      const bid = round(estimated * (0.58 + ((u + month) % 4) * 0.07));
      const weighted = stageIndex === 4 ? 0 : round(bid * [0.12, 0.25, 0.45, 0.8][stageIndex]);
      const customer = `模拟客户${String((u * 3 + t + month + j) % 12 + 1).padStart(2, '0')}`;
      const date = `2026-${String(month).padStart(2, '0')}`;
      const name = `模拟${['咨询评估', '项目管理', '工程总包'][t]}项目 ${u + 1}-${month}-${j + 1}`;
      const opportunity = { id, name, unit, type, stage: STAGES[stageIndex], customer,
        group: ['模拟西南项目群', '模拟东部项目群', '模拟海外项目群', '模拟制造项目群'][(u + month) % 4],
        applicationDate: `${date}-02`, bidTime: `${date}-12`, bidDate: `${date}-18`, estimated, bid, weighted };
      opportunities.push(opportunity);
      const amount = stageIndex === 4 ? round(bid * (0.92 + j * 0.04)) : weighted;
      contracts.push({ id: `CON-${id}`, opportunityId: id, name, unit, type, customer, group: opportunity.group,
        date: `${date}-${j ? '24' : '08'}`, amount, kind: stageIndex === 4 ? '实际' : '预测',
        history2024: stageIndex === 4 ? round(amount * (0.7 + (u % 4) * 0.12)) : 0,
        history2025: stageIndex === 4 ? round(amount * (0.9 + (t % 3) * 0.11)) : 0,
      });
      if (stageIndex === 4 && (u + month + j) % 2 === 0) frameworks.push({ id: `FW-${id}`, opportunityId: id,
        name: `${name}框架`, unit, type, customer, date: `${date}-08`, amount: round(amount * 0.15),
        kind: (u + month) % 3 === 0 ? '变更框架' : '新签框架' });
    }
  }));
  return { opportunities, contracts, frameworks, targets };
}

export function selectMarket(demo: MarketDemo, filters: MarketFilters, applyStage = false) {
  const opportunities = demo.opportunities.filter(row => (filters.unit === '全部板块' || row.unit === filters.unit)
    && filters.types.includes(row.type) && (!applyStage || filters.stage === '全部阶段' || row.stage === filters.stage)
    && inRange(row.applicationDate, filters.application) && inRange(row.bidTime, filters.bidTime) && inRange(row.bidDate, filters.bidDate));
  const ids = new Set(opportunities.map(row => row.id));
  const contracts = demo.contracts.filter(row => ids.has(row.opportunityId) && inRange(row.date, filters.contract));
  const actual = contracts.filter(row => row.kind === '实际');
  const forecast = contracts.filter(row => row.kind === '预测');
  const frameworks = demo.frameworks.filter(row => ids.has(row.opportunityId) && inRange(row.date, filters.contract));
  const targets = demo.targets.filter(row => (filters.unit === '全部板块' || row.unit === filters.unit) && filters.types.includes(row.type));
  return { opportunities, contracts, actual, forecast, frameworks, targets,
    signed: sum(actual, row => row.amount), target: sum(targets, row => row.amount),
    estimated: sum(opportunities, row => row.estimated), bid: sum(opportunities, row => row.bid), weighted: sum(opportunities, row => row.weighted),
    unsignedWon: sum(opportunities.filter(row => row.stage === '已中标'), row => row.bid),
  };
}
export type MarketSelection = ReturnType<typeof selectMarket>;

export function exportCsv(rows: Contract[]): string {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const headers = ['合同编号', '模拟项目名称', '板块/中心', '业务类型', '模拟客户', '模拟项目群', '日期', '金额（万元）', '数据类型'];
  return '\ufeff' + [headers, ...rows.map(row => [row.id, row.name, row.unit, row.type, row.customer, row.group, row.date, row.amount.toFixed(2), row.kind])]
    .map(row => row.map(quote).join(',')).join('\r\n');
}
