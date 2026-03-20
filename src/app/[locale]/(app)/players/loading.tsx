export default function PlayersLoading() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center space-y-4">
          <div className="h-6 w-32 bg-white/[0.06] rounded-full mx-auto animate-pulse" />
          <div className="h-10 w-64 bg-white/[0.06] rounded-lg mx-auto animate-pulse" />
        </div>

        <div className="flex gap-3 justify-center">
          <div className="h-10 w-64 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-[#111318] border border-white/[0.06] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/[0.06] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/[0.04] rounded animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="h-3 w-12 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-5 w-8 bg-white/[0.06] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
