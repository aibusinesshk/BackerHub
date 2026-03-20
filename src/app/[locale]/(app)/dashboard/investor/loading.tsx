export default function InvestorDashboardLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-white/[0.04] rounded animate-pulse" />
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-[#111318] border border-white/[0.06] p-5 space-y-3">
              <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
              <div className="h-7 w-20 bg-white/[0.06] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Portfolio section */}
        <div className="rounded-xl bg-[#111318] border border-white/[0.06] p-6 space-y-4">
          <div className="h-5 w-32 bg-white/[0.06] rounded animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
              <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-white/[0.06] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
