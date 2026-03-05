/**
 * 从现有 TS 数据文件导入并写入 SQLite。首次运行：npm run db:init && npm run db:seed
 */
import { getDb } from './client';
import { SCHEMA_SQL } from './schema';

// 仅 seed 使用的数据源，运行时数据来自 SQLite
import {
  metrics,
  monthlyData,
  projectData,
  projectCostData,
  managementCostData,
  workloadPredictionData,
  departments,
  departmentCollaborationData,
  collaborationColumns,
  cardData,
} from './seed-sources/dashboard';
import { personnelData } from './seed-sources/SME_Person_data';
import { peopleData } from './seed-sources/ESK_Person_data';
import { treeData } from './seed-sources/ESK_Node_Data';

const COST_KEYS = [
  '差旅及报销', '人力成本', '低负荷成本', '一般付款', '涉外支付',
  '设计服务分包', '采购', '施工分包', '其他',
] as const;
const COST_COLS = [
  'travel', 'labor', 'low_load', 'general_payment', 'foreign_payment',
  'design_subcontract', 'procurement', 'construction_subcontract', 'other',
] as const;

function runSeed() {
  const db = getDb();
  db.exec(SCHEMA_SQL);

  db.exec('DELETE FROM metrics');
  const insMetric = db.prepare(
    'INSERT INTO metrics (id, name, has_yearly_target, sub_targets) VALUES (?, ?, ?, ?)'
  );
  for (const m of metrics) {
    insMetric.run(
      m.id,
      m.name,
      m.hasYearlyTarget ? 1 : 0,
      m.subTargets ? JSON.stringify(m.subTargets) : null
    );
  }

  db.exec('DELETE FROM monthly_data');
  const insMonthly = db.prepare(
    `INSERT INTO monthly_data (month, new_contracts, completed_contracts, invoiced_amount, received_payments, wip, accounts_receivable)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of monthlyData) {
    insMonthly.run(
      row.month,
      row.newContracts,
      row.completedContracts,
      row.invoicedAmount,
      row.receivedPayments,
      row.wip,
      row.accountsReceivable
    );
  }

  db.exec('DELETE FROM project_distribution');
  const insDist = db.prepare(
    'INSERT INTO project_distribution (category, name, value) VALUES (?, ?, ?)'
  );
  for (const d of projectData.managementDistribution) {
    insDist.run('management', d.name, d.value);
  }
  for (const d of projectData.businessTypeDistribution) {
    insDist.run('business', d.name, d.value);
  }

  db.exec('DELETE FROM project_cost');
  const insCost = db.prepare(
    `INSERT INTO project_cost (month, travel, labor, low_load, general_payment, foreign_payment, design_subcontract, procurement, construction_subcontract, other)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of projectCostData) {
    insCost.run(
      row.month,
      row['差旅及报销'],
      row['人力成本'],
      row['低负荷成本'],
      row['一般付款'],
      row['涉外支付'],
      row['设计服务分包'],
      row['采购'],
      row['施工分包'],
      row['其他']
    );
  }

  db.exec('DELETE FROM management_cost');
  const insMgmt = db.prepare('INSERT INTO management_cost (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(managementCostData)) {
    insMgmt.run(k, v);
  }

  db.exec('DELETE FROM workload_prediction');
  const insWork = db.prepare('INSERT INTO workload_prediction (month, rate) VALUES (?, ?)');
  for (const w of workloadPredictionData) {
    insWork.run(w.month, w.rate);
  }

  db.exec('DELETE FROM departments');
  const insDept = db.prepare('INSERT INTO departments (value, label) VALUES (?, ?)');
  for (const d of departments) {
    insDept.run(d.value, d.label);
  }

  db.exec('DELETE FROM card_data');
  const insCard = db.prepare(
    'INSERT INTO card_data (title, value, month_label, month_value, percentage, donut_value, sub_targets) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  for (const c of cardData) {
    insCard.run(
      c.title,
      c.value,
      c.monthLabel,
      c.monthValue,
      c.percentage,
      c.donutValue,
      JSON.stringify(c.subTargets)
    );
  }

  db.exec('DELETE FROM department_collaboration');
  const insCollab = db.prepare(
    `INSERT INTO department_collaboration (key, department, col0, col1, col2, col3, col4, col5, col6, col7, col8, col9) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const row of departmentCollaborationData) {
    const r = row as Record<string, unknown>;
    insCollab.run(
      r.key,
      r.department,
      r.col0 ?? null,
      r.col1 ?? null,
      r.col2 ?? null,
      r.col3 ?? null,
      r.col4 ?? null,
      r.col5 ?? null,
      r.col6 ?? null,
      r.col7 ?? null,
      r.col8 ?? null,
      r.col9 ?? null
    );
  }

  db.exec('DELETE FROM collaboration_columns');
  const insCol = db.prepare(
    'INSERT INTO collaboration_columns (title, data_index, width, fixed) VALUES (?, ?, ?, ?)'
  );
  for (const col of collaborationColumns) {
    const c = col as { title: string; dataIndex: string; width?: number; fixed?: string };
    insCol.run(c.title, c.dataIndex, c.width ?? null, c.fixed ?? null);
  }

  db.exec('DELETE FROM sme_personnel');
  const insSme = db.prepare(
    `INSERT INTO sme_personnel (name, email, phone, department, major, projects, industries, regions, skills, qualifications, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of personnelData) {
    insSme.run(
      p.name,
      p.email,
      p.phone ?? null,
      p.department ?? null,
      p.major ?? null,
      JSON.stringify(p.projects ?? []),
      JSON.stringify(p.industries ?? []),
      JSON.stringify(p.regions ?? []),
      JSON.stringify(p.skills ?? []),
      JSON.stringify(p.qualifications ?? []),
      p.location ?? null
    );
  }

  db.exec('DELETE FROM esk_person');
  const insEsk = db.prepare(
    `INSERT INTO esk_person (name, email, specialty, region, department, phone, score, skills)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of peopleData) {
    insEsk.run(
      p.name,
      p.email,
      p.specialty ?? null,
      p.region ?? null,
      p.department ?? null,
      p.phone ?? null,
      p.score ?? null,
      JSON.stringify(p.skills ?? [])
    );
  }

  db.exec('DELETE FROM esk_tree');
  db.prepare('INSERT INTO esk_tree (id, data) VALUES (1, ?)').run(JSON.stringify(treeData));

  console.log('Seed completed.');
}

runSeed();
