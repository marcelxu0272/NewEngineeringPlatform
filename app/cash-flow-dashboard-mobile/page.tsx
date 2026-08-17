export default function CashFlowDashboardMobilePage() {
  return (
    <div className="fixed inset-0 bg-[#f8faff]">
      <iframe
        src="/cash-flow-dashboard-mobile/index.html"
        title="现金流仪表盘（移动版）"
        className="h-full w-full border-0"
        allow="same-origin"
      />
    </div>
  );
}
