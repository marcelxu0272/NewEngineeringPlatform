# 外部人员考勤线上化设计（方案 B）

日期：2026-04-17  
状态：已确认到可研发阶段（内部闭环 + 外部预留接口）

## 1. 已确认业务边界

- 仅做内部流程闭环：`考勤填报 -> 采购确认 -> 成本测算 -> 应付单生成 -> 推送付款模块`。
- 角色仅保留：`项目经理`、`采购`。
- 不纳入本范围：`财务角色`、`管理员专属权限`（由平台全局能力统一处理）。
- 合同费率来源于外部系统，本系统只读不维护。
- 外部供应商侧能力本期不做，仅预留接口。

## 2. 目标流程（MVP）

1. 项目经理创建月度考勤单并录入（可导入 Excel）。
2. 项目经理提交后，由采购确认通过或驳回（非审批流，仅为业务确认）。
3. 确认通过后，系统读取费率并生成成本快照。
4. 采购生成应付单。
5. 采购触发推送到平台付款模块，接收回执。

## 3. 状态机

主单 `attendance_monthly_sheet.status`：

- `DRAFT`：草稿，可编辑
- `SUBMITTED`：已提交，待采购确认
- `REJECTED`：驳回，待项目经理修订
- `APPROVED`：采购已确认，明细冻结，允许生成应付单
- `PAYABLE_GENERATED`：应付单已生成
- `PUSHED_TO_PAYMENT`：应付单已推送至付款模块

约束规则：

- 仅 `DRAFT/REJECTED` 允许修改考勤明细。
- `APPROVED` 后如需修改，必须走“作废重开”机制（留痕并提升版本号）。
- 推送付款必须具备有效成本快照。

## 4. 数据库 DDL 草案（MySQL 8）

> 说明：字段按可追溯、可审计设计；金额统一 `DECIMAL(18,2)`，小时统一 `DECIMAL(8,2)`。

```sql
CREATE TABLE attendance_monthly_sheet (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sheet_no VARCHAR(64) NOT NULL UNIQUE,
  project_id VARCHAR(64) NOT NULL,
  project_code VARCHAR(64) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  year_num INT NOT NULL,
  month_num INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  version_no INT NOT NULL DEFAULT 1,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at DATETIME NULL,
  approved_at DATETIME NULL,
  rejected_reason VARCHAR(1024) NULL,
  UNIQUE KEY uk_project_period (project_id, year_num, month_num)
);

CREATE TABLE attendance_person_row (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sheet_id BIGINT NOT NULL,
  external_person_id VARCHAR(64) NOT NULL,
  person_name VARCHAR(128) NOT NULL,
  vendor_id VARCHAR(64) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  job_role VARCHAR(128) NULL,
  actual_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  ot_weekend_paid DECIMAL(8,2) NOT NULL DEFAULT 0,
  ot_weekday_paid DECIMAL(8,2) NOT NULL DEFAULT 0,
  ot_holiday_paid DECIMAL(8,2) NOT NULL DEFAULT 0,
  ot_comp_off DECIMAL(8,2) NOT NULL DEFAULT 0,
  annual_leave_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  project_leave_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  personal_leave_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  sick_leave_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  remark VARCHAR(1024) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_person_row_sheet FOREIGN KEY (sheet_id) REFERENCES attendance_monthly_sheet(id),
  KEY idx_sheet_vendor (sheet_id, vendor_id)
);

CREATE TABLE attendance_daily_entry (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  person_row_id BIGINT NOT NULL,
  day_no INT NOT NULL,
  entry_type VARCHAR(32) NOT NULL,
  hours DECIMAL(8,2) NULL,
  raw_symbol VARCHAR(16) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_daily_row FOREIGN KEY (person_row_id) REFERENCES attendance_person_row(id),
  UNIQUE KEY uk_person_day (person_row_id, day_no)
);

CREATE TABLE attendance_approval_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sheet_id BIGINT NOT NULL,
  action VARCHAR(32) NOT NULL,
  operator_id VARCHAR(64) NOT NULL,
  operator_name VARCHAR(128) NOT NULL,
  comment_text VARCHAR(1024) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_approval_sheet FOREIGN KEY (sheet_id) REFERENCES attendance_monthly_sheet(id),
  KEY idx_sheet_action_time (sheet_id, action, created_at)
);

CREATE TABLE cost_calc_snapshot (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sheet_id BIGINT NOT NULL,
  person_row_id BIGINT NOT NULL,
  calc_version INT NOT NULL,
  rate_source VARCHAR(64) NOT NULL,
  rate_ref_id VARCHAR(128) NOT NULL,
  rate_payload_json JSON NOT NULL,
  formula_payload_json JSON NOT NULL,
  calc_result_amount DECIMAL(18,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_calc_sheet FOREIGN KEY (sheet_id) REFERENCES attendance_monthly_sheet(id),
  CONSTRAINT fk_calc_person_row FOREIGN KEY (person_row_id) REFERENCES attendance_person_row(id),
  KEY idx_sheet_calc_ver (sheet_id, calc_version)
);

CREATE TABLE payable_sheet (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payable_no VARCHAR(64) NOT NULL UNIQUE,
  sheet_id BIGINT NOT NULL,
  vendor_id VARCHAR(64) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  project_id VARCHAR(64) NOT NULL,
  period_ym VARCHAR(7) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  amount_total DECIMAL(18,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  push_attempts INT NOT NULL DEFAULT 0,
  last_push_at DATETIME NULL,
  last_push_error VARCHAR(2048) NULL,
  external_payment_id VARCHAR(128) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payable_sheet FOREIGN KEY (sheet_id) REFERENCES attendance_monthly_sheet(id),
  KEY idx_vendor_period (vendor_id, period_ym)
);

CREATE TABLE payable_line (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payable_id BIGINT NOT NULL,
  person_row_id BIGINT NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  person_name VARCHAR(128) NOT NULL,
  role_name VARCHAR(128) NULL,
  actual_hours DECIMAL(8,2) NOT NULL,
  ot_weekday_paid DECIMAL(8,2) NOT NULL DEFAULT 0,
  ot_weekend_paid DECIMAL(8,2) NOT NULL DEFAULT 0,
  ot_holiday_paid DECIMAL(8,2) NOT NULL DEFAULT 0,
  rate_ref_id VARCHAR(128) NOT NULL,
  rate_snapshot_json JSON NOT NULL,
  line_amount DECIMAL(18,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_line_payable FOREIGN KEY (payable_id) REFERENCES payable_sheet(id),
  KEY idx_payable_person (payable_id, person_id)
);
```

## 5. OpenAPI 草案（内部 API）

### 5.1 考勤主流程

- `POST /api/attendance-sheets`
- `GET /api/attendance-sheets`
- `GET /api/attendance-sheets/{sheetId}`
- `PUT /api/attendance-sheets/{sheetId}`
- `POST /api/attendance-sheets/{sheetId}/rows`
- `PUT /api/attendance-sheets/{sheetId}/rows/{rowId}/daily-entries`
- `POST /api/attendance-sheets/{sheetId}/import`
- `POST /api/attendance-sheets/{sheetId}/submit`
- `POST /api/attendance-sheets/{sheetId}/approve`
- `POST /api/attendance-sheets/{sheetId}/reject`

### 5.2 应付单流程

- `POST /api/attendance-sheets/{sheetId}/generate-payable`
- `GET /api/payables/{payableId}`
- `POST /api/payables/{payableId}/push-to-payment`
- `POST /api/payables/{payableId}/retry-push`

### 5.3 状态流转约束（接口层）

- `submit`：仅 `DRAFT/REJECTED`
- `approve/reject`：仅 `SUBMITTED`
- `generate-payable`：仅 `APPROVED`
- `push/retry-push`：仅 `PAYABLE_GENERATED` 或 `PUSH_FAILED`

## 6. 对付款模块的推送契约（预留）

接收端建议：

- `POST /api/payment-intake/payables`

请求头：

- `X-Idempotency-Key: {payableId}-{versionNo}`
- `X-Trace-Id: {uuid}`

请求体（示例）：

```json
{
  "source_system": "engineering-platform-attendance",
  "payable_id": "PAY-2026-04-0001",
  "version_no": 3,
  "period": "2026-03",
  "project": { "id": "PJT-10023", "name": "XX项目" },
  "vendor": { "id": "VND-7788", "name": "某供应商" },
  "currency": "CNY",
  "amount_total": 185600.00,
  "lines": [
    {
      "person_id": "EXT-001",
      "person_name": "张三",
      "role": "测试工程师",
      "actual_hours": 168,
      "ot_weekday_paid": 12,
      "ot_weekend_paid": 8,
      "ot_holiday_paid": 0,
      "rate_ref_id": "RATE-8891",
      "rate_snapshot": {
        "normal_hourly_rate": 120,
        "ot_weekday_coef": 1.5,
        "ot_weekend_coef": 2.0,
        "ot_holiday_coef": 3.0
      },
      "line_amount": 23760.00
    }
  ],
  "audit": {
    "attendance_sheet_id": "ATS-2026-03-0099",
    "approved_by": "u_purchaser_01",
    "approved_at": "2026-04-02T10:33:12+08:00",
    "calc_snapshot_id": "CALC-2026-03-445"
  }
}
```

响应体（示例）：

```json
{
  "accepted": true,
  "external_payment_id": "PMTREQ-2026-55123",
  "status": "RECEIVED",
  "message": "ok",
  "accepted_at": "2026-04-02T10:33:15+08:00"
}
```

## 7. 异常与补偿策略

- 幂等：同一 `X-Idempotency-Key` 返回相同业务结果。
- 4xx：标记 `PUSH_FAILED`，采购修正后手动重推。
- 5xx/超时：自动重试 3 次（1m/5m/15m），仍失败转人工重推。
- 回执丢失：按 `trace_id/payable_id` 做定时对账补偿。

## 8. 第一批开发任务拆解

- 后端 A：主单、明细、状态机、确认与操作日志。
- 后端 B：费率读取适配、测算引擎、快照落库。
- 后端 C：应付单、推送集成、重试与补偿。
- 前端 A（项目经理）：建单、日历矩阵编辑、导入、提交。
- 前端 B（采购）：确认、测算结果、应付生成、推送重推。
- 测试：状态机、费率缺失、幂等、推送失败补偿、金额一致性。

## 9. MVP 验收标准

- 项目经理能完成：建单 -> 填报 -> 提交。
- 采购能完成：确认 -> 测算 -> 生成应付 -> 推送付款模块。
- 推送失败可追踪、可重试、可对账补偿。
- 任一金额可回溯到：考勤明细 + 费率快照 + 计算快照。

