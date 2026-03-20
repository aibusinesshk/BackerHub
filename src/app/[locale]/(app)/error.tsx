'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl font-bold text-yellow-500 mb-4">{t('oops')}</div>
        <h1 className="text-xl font-semibold text-white mb-2">
          {t('somethingWentWrong')}
        </h1>
        <p className="text-zinc-400 mb-6 text-sm">
          {t('errorDescription')}
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-600 mb-4">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors text-sm"
          >
            {t('tryAgain')}
          </button>
          <a
            href="/"
            className="px-5 py-2 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 transition-colors text-sm"
          >
            {t('backToHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
