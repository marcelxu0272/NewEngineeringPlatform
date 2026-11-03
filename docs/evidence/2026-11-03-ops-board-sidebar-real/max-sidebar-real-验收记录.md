# Board 深色侧栏（wood. Projects Zone）实机验收 — Max

- **结论**: **PASS**
- **URL**: http://localhost:3001/operations-dashboard-202610/board
- **时间**: 2026-11-03T02:54:35.205Z（记录为 UTC ISO；本地 Asia/Shanghai）
- **对照账本**: `docs/变更账本.md` → `### 2026-11-03 —— 运营看板202610：Board 壳左侧 sidebar 按真实环境样式完善`（状态仍为待落地；本记录不改账本）
- **pageerror**: 无

## 逐 AC

- **AC1** PASS — 深色侧栏 + wood. Projects Zone + 项目数据中台
  - detail: `{"hasWood":true,"hasSubtitle":true,"darkish":true,"bg":"rgb(47, 54, 64)","width":224,"textSample":"wood.Projects Zone 项目数据中台 待办提醒 全局看板 运营看板 交付保障看板 人力资源看板 项目管理 报告体系 平台设置 操作日志 人员评分体"}`
- **AC2** PASS — 待办提醒入口可见（铃铛图标）
  - detail: `{"hasLabel":true,"bell":true,"nearIcon":true,"iconClasses":["ri-notification-3-line shrink-0 text-[16px] leading-none","ri-dashboard-line shrink-0 text-[16px] leading-none","ri-bar-chart-box-line shrink-0 text-[16px] leading-none","ri-file-chart-line shrink-0 text-[16px] leading-none","ri-settings-3-line shrink-0 text-[16px] leading-none","ri-file-list-3-line shrink-0 text-[16px] leading-none","ri-user-star-line shrink-0 text-[16px] leading-none","ri-crosshair-2-line shrink-0 text-[16px] leading-none"]}`
- **AC3** PASS — 全局看板展开组：运营/交付保障/人力 + 选中浅底 + 展开指示
  - detail: `{"hasGlobal":true,"hasOps":true,"hasDelivery":true,"hasHr":true,"childrenVisible":true,"opsHighlight":true,"arrowHint":false,"anyArrow":false,"groupTextSample":"全局看板 运营看板 交付保障看板 人力资源看板"}`
- **AC4** PASS — 一级六项可见且带图标；可折叠项有下箭头（或等价）
  - detail: `{"found":{"项目管理":true,"报告体系":true,"平台设置":true,"操作日志":true,"人员评分体系":true,"项目执行跟踪":true},"allFound":true,"iconCount":8,"downArrows":0}`
- **AC5** PASS — 侧栏底右折叠控制 «（或等价）
  - detail: `{"label":"折叠侧栏","text":"«","nearBottom":true,"nearRight":true,"codePoints":["ab"]}`
- **AC6** PASS — 全局看板默认展开；进入 Board 时运营看板选中
  - detail: `{"collapsed":"false","globalExpanded":true,"currentish":true,"clues":["flex w-full items-center rounded-md py-1.5 pl-9 pr-2.5 text-left text-[13px] tra","mt-0.5 space-y-0.5 rounded-lg bg-white/5 py-1  ","px-2  ","flex flex-1 flex-col gap-1 overflow-y-auto py-3   "]}`
- **AC7** PASS — 一级组可展开/收起（全局看板）
  - detail: `{"ok":true,"beforeExpanded":"true","midExpanded":"false","afterExpanded":"true","beforeKids":true,"midKids":false,"afterKids":true,"reportToggle":{"r0":"false","r1":"true","r2":"false","flipped":true}}`
- **AC8** PASS — 已有入口挂上；无独立页项可点不报错/占位
  - detail: `{"hrClicked":true,"ratingClicked":true,"opsLinkPresent":true}`
- **AC9** PASS — 白底「看板目录」仍在且未被深色侧栏吃掉
  - detail: `{"found":true,"insideAside":false,"light":true,"bg":"rgb(255, 255, 255)","w":224,"h":872,"visible":true,"title":"看板目录\n运营看板\n市场看板\n机会清单\n占位\n市场数据\n占位\n合同看板\n占位\n人"}`
- **ACW** PASS — 侧栏宽展开224/折叠64；主区 marginLeft 联动并可恢复
  - detail: `{"geom1":{"sidebarW":224,"marginLeft":"224px","collapsedAttr":"false"},"geom2":{"sidebarW":64,"marginLeft":"64px","collapsedAttr":"true","headerLeft":"64px","collapseText":"»"},"geom3":{"sidebarW":224,"marginLeft":"224px","collapsedAttr":"false"}}`

## 阻断项

- 无

## 截图

- `max-sidebar-real-01-expanded.png` — 展开态（侧栏+白底看板目录）
- `max-sidebar-real-02-collapsed.png` — 折叠态
- `max-sidebar-real-03-sidebar-clip.png` — 侧栏裁剪（一级项与全局看板展开）

## 已知近似差异（非阻断）

- Remix 图标近似真实环境
- 无子路由的组展开为占位/同名叶子（如报告体系、操作日志、人力资源看板、人员评分体系、项目执行跟踪）

## 未结并列条（本记录未验、勿混关）

- 板块现金流/目标达成仅「全部板块」时展示
- （其它并列 Board 相关未结条按账本分条）

## 方法说明

- 探针: `max-sidebar-real.cjs`（Playwright 打开真实 Board，非源码字符串检查）
- Leo `probe-sidebar.cjs` / `probe-result.txt` 仅静态 includes，**未采信**
- 未改业务代码、未改账本、未 commit
