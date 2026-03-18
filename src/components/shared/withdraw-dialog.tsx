'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CRYPTO_COINS, MIN_WITHDRAWAL } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import { Loader2, Check } from 'lucide-react';

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  currency: string;
  onSuccess: () => void;
}

export function WithdrawDialog({ open, onOpenChange, balance, currency, onSuccess }: WithdrawDialogProps) {
  const t = useTranslations('wallet');
  const [amount, setAmount] = useState('');
  const [coin, setCoin] = useState<'usdt' | 'usdc'>('usdt');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setAmount('');
    setCoin('usdt');
    setWalletAddress('');
    setLoading(false);
    setError('');
    setSuccess(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      setError(t('minWithdrawError', { min: MIN_WITHDRAWAL }));
      return;
    }
    if (numAmount > balance) {
      setError(t('insufficientFunds'));
      return;
    }
    if (!walletAddress || walletAddress.length < 10) {
      setError(t('invalidWalletAddress'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          coin,
          walletAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit withdrawal');
        return;
      }

      setSuccess(true);
      onSuccess();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const setMax = () => setAmount(String(balance));
  const selectedCoin = CRYPTO_COINS.find((c) => c.id === coin);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#111318] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t('withdrawTitle')}</DialogTitle>
          <DialogDescription className="text-white/50">
            {t('withdrawDescription')}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm text-white/70">{t('withdrawSubmitted')}</p>
            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 py-1">
              {t('processingTime')}
            </Badge>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="w-full border-white/10 text-white/60 hover:text-white"
            >
              {t('done')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Available Balance */}
            <div className="rounded-xl bg-white/[0.03] p-3 flex justify-between items-center">
              <span className="text-xs text-white/50">{t('availableBalance')}</span>
              <span className="text-sm font-semibold text-gold-400">{formatCurrency(balance, currency)}</span>
            </div>

            {/* Coin Selection */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">{t('selectCoin')}</label>
              <div className="grid grid-cols-2 gap-3">
                {(['usdt', 'usdc'] as const).map((c) => {
                  const coinData = CRYPTO_COINS.find((x) => x.id === c)!;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoin(c)}
                      className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                        coin === c
                          ? 'border-gold-500/50 bg-gold-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className={`text-lg font-bold ${coin === c ? 'text-gold-400' : 'text-white/40'}`}>
                        {coinData.icon}
                      </span>
                      <div className="text-left">
                        <span className={`text-xs font-medium block ${coin === c ? 'text-gold-400' : 'text-white/60'}`}>
                          {coinData.name}
                        </span>
                        <span className="text-[10px] text-white/30">{coinData.network}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('amount')} (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input
                  type="number"
                  placeholder={`${t('minimum')}: $${MIN_WITHDRAWAL}`}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  className="pl-7 pr-16 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  min={MIN_WITHDRAWAL}
                  max={balance}
                />
                <button
                  type="button"
                  onClick={setMax}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gold-400 hover:text-gold-300 font-medium px-2 py-0.5 rounded bg-gold-500/10"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Wallet Address */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">
                {t('walletAddress')} ({selectedCoin?.network})
              </label>
              <Input
                type="text"
                placeholder="T..."
                value={walletAddress}
                onChange={(e) => { setWalletAddress(e.target.value); setError(''); }}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={loading || !amount || !walletAddress}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('confirmWithdraw')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
