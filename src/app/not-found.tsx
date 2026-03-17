import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center">
      <div className="relative mb-8">
        <span className="text-[8rem] font-bold leading-none tracking-tighter text-white/[0.04] sm:text-[12rem]">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="text-white">4</span>
          <span className="bg-gradient-to-br from-[#f8cc55] via-[#f5b81c] to-[#c57a09] bg-clip-text text-transparent">0</span>
          <span className="text-white">4</span>
        </span>
      </div>

      <h1 className="mb-3 text-xl font-semibold text-white sm:text-2xl">
        Page Not Found
      </h1>
      <p className="mb-8 max-w-md text-white/50">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/en"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#f5b81c] px-8 text-sm font-semibold text-black transition-colors hover:bg-[#f8cc55]"
        style={{ boxShadow: '0 0 20px rgba(245, 184, 28, 0.15)' }}
      >
        Go Home
      </Link>
    </div>
  );
}
