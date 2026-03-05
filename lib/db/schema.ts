export const SCHEMA_SQL = `
-- Dashboard: 指标
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  has_yearly_target INTEGER NOT NULL,
  sub_targets TEXT
);

-- Dashboard: 月度数据
CREATE TABLE IF NOT EXISTS monthly_data (
  month TEXT PRIMARY KEY,
  new_contracts REAL NOT NULL,
  completed_contracts REAL NOT NULL,
  invoiced_amount REAL NOT NULL,
  received_payments REAL NOT NULL,
  wip REAL NOT NULL,
  accounts_receivable REAL NOT NULL
);

-- Dashboard: 项目分布 (managementDistribution / businessTypeDistribution)
CREATE TABLE IF NOT EXISTS project_distribution (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  value INTEGER NOT NULL
);

-- Dashboard: 项目成本 (每月一行，成本列)
CREATE TABLE IF NOT EXISTS project_cost (
  month TEXT PRIMARY KEY,
  travel REAL, labor REAL, low_load REAL, general_payment REAL,
  foreign_payment REAL, design_subcontract REAL, procurement REAL,
  construction_subcontract REAL, other REAL
);

-- Dashboard: 管理成本 (key-value)
CREATE TABLE IF NOT EXISTS management_cost (
  key TEXT PRIMARY KEY,
  value REAL NOT NULL
);

-- Dashboard: 工作负荷预测
CREATE TABLE IF NOT EXISTS workload_prediction (
  month TEXT PRIMARY KEY,
  rate INTEGER NOT NULL
);

-- Dashboard: 部门
CREATE TABLE IF NOT EXISTS departments (
  value TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

-- Dashboard: 卡片数据
CREATE TABLE IF NOT EXISTS card_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  month_label TEXT,
  month_value TEXT,
  percentage TEXT,
  donut_value REAL,
  sub_targets TEXT
);

-- Dashboard: 部门协作 (key, department, col0..col9)
CREATE TABLE IF NOT EXISTS department_collaboration (
  key INTEGER PRIMARY KEY,
  department TEXT NOT NULL,
  col0 INTEGER, col1 INTEGER, col2 INTEGER, col3 INTEGER, col4 INTEGER,
  col5 INTEGER, col6 INTEGER, col7 INTEGER, col8 INTEGER, col9 INTEGER
);

-- Dashboard: 协作列定义
CREATE TABLE IF NOT EXISTS collaboration_columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  data_index TEXT NOT NULL,
  width INTEGER,
  fixed TEXT
);

-- SME 专家
CREATE TABLE IF NOT EXISTS sme_personnel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  major TEXT,
  projects TEXT,
  industries TEXT,
  regions TEXT,
  skills TEXT,
  qualifications TEXT,
  location TEXT
);

-- ESK 人员 (工程软件技能)
CREATE TABLE IF NOT EXISTS esk_person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT,
  region TEXT,
  department TEXT,
  phone TEXT,
  score REAL,
  skills TEXT
);

-- ESK 技能树 (整棵树存 JSON)
CREATE TABLE IF NOT EXISTS esk_tree (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
`;
