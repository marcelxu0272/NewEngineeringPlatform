export default function CashFlowDashboardPage() {
  return (
    <div className="fixed inset-0 bg-white">
      <iframe
        src="/cash-flow-dashboard/index.html"
        title="现金流仪表盘"
        className="h-full w-full border-0"
        allow="same-origin"
      />
    </div>
  );
}
