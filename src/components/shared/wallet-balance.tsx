'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { DepositDialog } from './deposit-dialog';
import { WithdrawDialog } from './withdraw-dialog';

export function WalletBalance() {
  const t = useTranslations('wallet');
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const fetchBalance = useCallback(() => {
    fetch('/api/wallet')
      .then((r) => r.json())
      .then((data) => {
        setBalance(data.balance || 0);
        setCurrency(data.currency || 'USD');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleSuccess = () => {
    fetchBalance();
  };

  return (
    <>
      <div className="rounded-2xl border border-gold-500/20 bg-gradient-to-r from-gold-500/10 to-gold-500/5 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/20">
              <Wallet className="h-6 w-6 text-gold-400" />
            </div>
            <div>
              <p className="text-sm text-white/50">{t('balance')}</p>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-gold-400 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(balance, currency)}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => setDepositOpen(true)}
              className="bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              {t('deposit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
              className="border-gold-500/20 text-gold-400 hover:bg-gold-500/10"
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              {t('withdraw')}
            </Button>
          </div>
        </div>
      </div>

      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onSuccess={handleSuccess}
      />
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        balance={balance}
        currency={currency}
        onSuccess={handleSuccess}
      />
    </>
  );
}
