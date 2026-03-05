import { getDb } from './client';

const costCols = [
  'travel', 'labor', 'low_load', 'general_payment', 'foreign_payment',
  'design_subcontract', 'procurement', 'construction_subcontract', 'other',
] as const;
const costKeys = [
  '差旅及报销', '人力成本', '低负荷成本', '一般付款', '涉外支付',
  '设计服务分包', '采购', '施工分包', '其他',
] as const;

function projectCostRow(row: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = { month: row.month as string };
  costCols.forEach((col, i) => {
    out[costKeys[i]] = Number(row[col]) || 0;
  });
  return out;
}

export function getDashboardData() {
  const db = getDb();

  const metrics = db.prepare('SELECT * FROM metrics ORDER BY id').all() as Array<{
    id: string;
    name: string;
    has_yearly_target: number;
    sub_targets: string | null;
  }>;
  const metricsOut = metrics.map((m) => ({
    id: m.id,
    name: m.name,
    hasYearlyTarget: !!m.has_yearly_target,
    subTargets: m.sub_targets ? JSON.parse(m.sub_targets) : undefined,
  }));

  const monthlyData = db.prepare('SELECT * FROM monthly_data ORDER BY month').all() as Array<{
    month: string;
    new_contracts: number;
    completed_contracts: number;
    invoiced_amount: number;
    received_payments: number;
    wip: number;
    accounts_receivable: number;
  }>;
  const monthlyDataOut = monthlyData.map((r) => ({
    month: r.month,
    newContracts: r.new_contracts,
    completedContracts: r.completed_contracts,
    invoicedAmount: r.invoiced_amount,
    receivedPayments: r.received_payments,
    wip: r.wip,
    accountsReceivable: r.accounts_receivable,
  }));

  const dist = db.prepare('SELECT * FROM project_distribution ORDER BY id').all() as Array<{
    category: string;
    name: string;
    value: number;
  }>;
  const managementDistribution = dist.filter((d) => d.category === 'management').map((d) => ({ name: d.name, value: d.value }));
  const businessTypeDistribution = dist.filter((d) => d.category === 'business').map((d) => ({ name: d.name, value: d.value }));
  const projectData = { managementDistribution, businessTypeDistribution };

  const projectCostRows = db.prepare('SELECT * FROM project_cost ORDER BY month').all() as Array<Record<string, unknown>>;
  const projectCostData = projectCostRows.map(projectCostRow);

  const mgmtRows = db.prepare('SELECT * FROM management_cost').all() as Array<{ key: string; value: number }>;
  const managementCostData = mgmtRows.reduce((acc, r) => {
    acc[r.key as keyof typeof acc] = r.value;
    return acc;
  }, {} as Record<string, number>);

  const workloadPredictionData = db.prepare('SELECT * FROM workload_prediction ORDER BY month').all() as Array<{ month: string; rate: number }>;

  const departments = db.prepare('SELECT * FROM departments ORDER BY value').all() as Array<{ value: string; label: string }>;

  const collabRows = db.prepare('SELECT * FROM department_collaboration ORDER BY key').all() as Array<Record<string, unknown>>;
  const departmentCollaborationData = collabRows.map((r) => {
    const out: Record<string, unknown> = { key: r.key, department: r.department };
    for (let i = 0; i <= 9; i++) out[`col${i}`] = r[`col${i}`];
    return out;
  });

  const colRows = db.prepare('SELECT * FROM collaboration_columns ORDER BY id').all() as Array<{ title: string; data_index: string; width: number | null; fixed: string | null }>;
  const collaborationColumns = colRows.map((c) => ({
    title: c.title,
    dataIndex: c.data_index,
    width: c.width ?? undefined,
    fixed: c.fixed ?? undefined,
  }));

  const cardRows = db.prepare('SELECT * FROM card_data ORDER BY id').all() as Array<{
    title: string;
    value: string;
    month_label: string | null;
    month_value: string | null;
    percentage: string | null;
    donut_value: number;
    sub_targets: string | null;
  }>;
  const cardData = cardRows.map((c) => ({
    title: c.title,
    value: c.value,
    monthLabel: c.month_label ?? undefined,
    monthValue: c.month_value ?? undefined,
    percentage: c.percentage ?? undefined,
    donutValue: c.donut_value,
    subTargets: c.sub_targets ? JSON.parse(c.sub_targets) : undefined,
  }));

  return {
    metrics: metricsOut,
    monthlyData: monthlyDataOut,
    projectData,
    projectCostData,
    managementCostData,
    workloadPredictionData,
    departments,
    departmentCollaborationData,
    collaborationColumns,
    cardData,
  };
}

export function getSmePersonnel() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM sme_personnel ORDER BY id').all() as Array<{
    name: string;
    email: string;
    phone: string | null;
    department: string | null;
    major: string | null;
    projects: string;
    industries: string;
    regions: string;
    skills: string;
    qualifications: string;
    location: string | null;
  }>;
  return rows.map((r) => ({
    name: r.name,
    email: r.email,
    phone: r.phone ?? undefined,
    department: r.department ?? undefined,
    major: r.major ?? undefined,
    projects: JSON.parse(r.projects || '[]'),
    industries: JSON.parse(r.industries || '[]'),
    regions: JSON.parse(r.regions || '[]'),
    skills: JSON.parse(r.skills || '[]'),
    qualifications: JSON.parse(r.qualifications || '[]'),
    location: r.location ?? undefined,
  }));
}

export function getEskPeople() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM esk_person ORDER BY id').all() as Array<{
    name: string;
    email: string;
    specialty: string | null;
    region: string | null;
    department: string | null;
    phone: string | null;
    score: number | null;
    skills: string;
  }>;
  return rows.map((r) => ({
    name: r.name,
    email: r.email,
    specialty: r.specialty ?? undefined,
    region: r.region ?? undefined,
    department: r.department ?? undefined,
    phone: r.phone ?? undefined,
    score: r.score ?? undefined,
    skills: JSON.parse(r.skills || '[]'),
  }));
}

export function getEskTree() {
  const db = getDb();
  const row = db.prepare('SELECT data FROM esk_tree WHERE id = 1').get() as { data: string } | undefined;
  return row ? JSON.parse(row.data) : [];
}
