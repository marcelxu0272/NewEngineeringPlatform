export const SYNC_TIP = "审批阶段，当月尚未结束，仅代表截至同步时刻的累计发生额，不代表全月最终结果，不作为本次审批口径。";

export const COMPLETION_NEAR_ZERO = 50;

export const TREEMAP_NAMED_CAP = 12;

export const TREEMAP_MIN_RATIO = 0.15;

export const TREEMAP_FALLBACK_CAP = 8;

export const ALERT_TYPE_ORDER = [
    "累计开票超总合同额",
    "累计回款超总合同额",
    "累计回款超累计开票",
    "存量合同额为负",
    "有完成额无工时",
    "有工时无完成额"
  ];

export const PAGE_SIZE = 10;

export const DEMO_PROJECTS_RAW = [
    { projectNo:"P-2026-011", projectName:"滨江科创园设计", pmName:"王磊", monthCompletion:4205000, totalContract:18000000, monthInvoice:2100000, monthPayment:1800000 },
    { projectNo:"P-2026-018", projectName:"轨道 TOD 综合体", pmName:"李倩", monthCompletion:3102000, totalContract:22000000, monthInvoice:1500000, monthPayment:1200000 },
    { projectNo:"P-2026-022", projectName:"市政管网改造", pmName:"陈晨", monthCompletion:1880000, totalContract:9000000, monthInvoice:900000, monthPayment:700000 },
    { projectNo:"P-2026-031", projectName:"智慧园区运维", pmName:"赵敏", monthCompletion:1568000, totalContract:6000000, monthInvoice:720000, monthPayment:650000 },
    { projectNo:"P-2026-040", projectName:"产业园二期", pmName:"王磊", monthCompletion:984000, totalContract:5000000, monthInvoice:400000, monthPayment:350000 },
    { projectNo:"P-2026-045", projectName:"数据中心机电", pmName:"周宁", monthCompletion:-900000, totalContract:8000000, monthInvoice:200000, monthPayment:100000 },
    { projectNo:"P-2026-052", projectName:"学校改扩建", pmName:"李倩", monthCompletion:763000, totalContract:4500000, monthInvoice:380000, monthPayment:300000 },
    { projectNo:"P-2026-061", projectName:"医院改扩建", pmName:"陈晨", monthCompletion:641000, totalContract:7000000, monthInvoice:310000, monthPayment:280000 },
    { projectNo:"P-2026-070", projectName:"小型景观提升", pmName:"赵敏", monthCompletion:210000, totalContract:800000, monthInvoice:90000, monthPayment:80000 },
    { projectNo:"P-2026-071", projectName:"零星维修A", pmName:"周宁", monthCompletion:180000, totalContract:500000, monthInvoice:50000, monthPayment:40000 },
    { projectNo:"P-2026-072", projectName:"零星维修B", pmName:"王磊", monthCompletion:95000, totalContract:300000, monthInvoice:30000, monthPayment:20000 },
    { projectNo:"P-2026-073", projectName:"咨询顾问包", pmName:"李倩", monthCompletion:88000, totalContract:400000, monthInvoice:40000, monthPayment:30000 },
    { projectNo:"P-2026-080", projectName:"近零样例", pmName:"陈晨", monthCompletion:20, totalContract:100000, monthInvoice:0, monthPayment:0 },
    { projectNo:"P-2026-081", projectName:"近零样例2", pmName:"赵敏", monthCompletion:-10, totalContract:100000, monthInvoice:0, monthPayment:0 }
  ];

export const DEMO_ALERT_ITEMS = [
    { projectNo:"P-2026-011", projectName:"滨江科创园设计", pmName:"王磊", label:"累计开票超总合同额" },
    { projectNo:"P-2026-018", projectName:"轨道 TOD 综合体", pmName:"李倩", label:"累计开票超总合同额" },
    { projectNo:"P-2026-022", projectName:"市政管网改造", pmName:"陈晨", label:"累计回款超总合同额" },
    { projectNo:"P-2026-031", projectName:"智慧园区运维", pmName:"赵敏", label:"累计回款超累计开票" },
    { projectNo:"P-2026-040", projectName:"产业园二期", pmName:"王磊", label:"存量合同额为负" },
    { projectNo:"P-2026-045", projectName:"数据中心机电", pmName:"周宁", label:"有完成额无工时" },
    { projectNo:"P-2026-052", projectName:"学校改扩建", pmName:"李倩", label:"有工时无完成额" },
    { projectNo:"P-2026-061", projectName:"医院改扩建", pmName:"陈晨", label:"累计回款超总合同额" },
    { projectNo:"P-2026-070", projectName:"小型景观提升", pmName:"赵敏", label:"有完成额无工时" },
    { projectNo:"P-2026-071", projectName:"零星维修A", pmName:"周宁", label:"累计开票超总合同额" }
  ];

export const DEMO_PM = [
    { pm:"王磊", count:4, invoice:312.4, payment:280.1, completion:518.9, ytd:2860.5 },
    { pm:"李倩", count:3, invoice:245.0, payment:210.6, completion:386.5, ytd:2140.2 },
    { pm:"陈晨", count:3, invoice:198.2, payment:170.0, completion:252.1, ytd:1688.4 },
    { pm:"赵敏", count:2, invoice:120.5, payment:98.4, completion:156.8, ytd:920.0 },
    { pm:"周宁", count:2, invoice:88.1, payment:53.5, completion:-90.0, ytd:640.3 }
  ];

export const months = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

export const trendCompletion = [6200000,7100000,6800000,8200000,9000000,8600000,9400000,10200000,9800000,11000000,11800000,12500000];

export const trendInvoice    = [4800000,5200000,5000000,6100000,6700000,6400000,7000000,7600000,7200000,8000000,8600000,9100000];

export const trendPayment    = [4100000,4500000,4300000,5200000,5800000,5500000,6000000,6500000,6100000,6900000,7400000,7900000];

export const reportMonthIdx = 9;
