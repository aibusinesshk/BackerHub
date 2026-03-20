export default function PlayerProfileLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Hero card skeleton */}
            <div className="rounded-xl bg-[#111318] border border-white/[0.06] overflow-hidden">
              <div className="h-56 sm:h-64 bg-white/[0.04] animate-pulse" />
              <div className="p-5 space-y-2">
                <div className="h-5 w-64 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-48 bg-white/[0.04] rounded animate-pulse" />
              </div>
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl bg-[#111318] border border-white/[0.06] p-4 text-center space-y-2">
                  <div className="h-5 w-5 mx-auto bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-5 w-16 mx-auto bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-20 mx-auto bg-white/[0.04] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div>
            <div className="rounded-xl bg-[#111318] border border-white/[0.06] p-6 space-y-4">
              <div className="h-5 w-32 bg-white/[0.06] rounded animate-pulse" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] p-4 space-y-3">
                  <div className="h-4 w-40 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-1 w-full bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-8 w-full bg-white/[0.06] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
