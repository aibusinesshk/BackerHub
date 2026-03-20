export default function SubmitResultLoading() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-white/[0.04] rounded animate-pulse" />
        </div>

        <div className="rounded-xl bg-[#111318] border border-white/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/[0.06] animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-48 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-white/[0.04] rounded animate-pulse" />
              <div className="h-10 w-full bg-white/[0.04] rounded-lg animate-pulse" />
            </div>
          ))}

          <div className="h-12 w-full bg-white/[0.06] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
