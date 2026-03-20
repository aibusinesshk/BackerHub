'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-yellow-500 mb-4">500</div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          {t('somethingWentWrong')}
        </h1>
        <p className="text-zinc-400 mb-8">
          {t('errorDescription500')}
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-600 mb-4">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
          >
            {t('tryAgain')}
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 transition-colors"
          >
            {t('backToHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
