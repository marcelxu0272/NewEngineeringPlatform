export default function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="h-full overflow-auto bg-[#f5f7fa] p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-400"
          >
            占位
          </div>
        ))}
      </div>
    </div>
  );
}
