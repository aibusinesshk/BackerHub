export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <div className="h-6 w-32 bg-white/[0.06] rounded-full mx-auto animate-pulse" />
          <div className="h-10 w-80 bg-white/[0.06] rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-96 bg-white/[0.04] rounded-lg mx-auto animate-pulse" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex gap-3 justify-center">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-white/[0.06] rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-[#111318] border border-white/[0.06] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
              <div className="h-3 w-full bg-white/[0.04] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/[0.04] rounded animate-pulse" />
              <div className="flex justify-between">
                <div className="h-8 w-20 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-8 w-24 bg-gold-500/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
