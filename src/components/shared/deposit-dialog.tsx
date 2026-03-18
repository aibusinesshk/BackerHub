'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CRYPTO_COINS, PLATFORM_WALLET, MIN_DEPOSIT } from '@/lib/constants';
import { Loader2, Copy, Check, QrCode } from 'lucide-react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'form' | 'address';

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const t = useTranslations('wallet');
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [coin, setCoin] = useState<'usdt' | 'usdc'>('usdt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const reset = () => {
    setStep('form');
    setAmount('');
    setCoin('usdt');
    setLoading(false);
    setError('');
    setReferenceNumber('');
    setCopiedAddr(false);
    setCopiedRef(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < MIN_DEPOSIT) {
      setError(t('minDepositError', { min: MIN_DEPOSIT }));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, paymentMethod: coin, currency: 'USD' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create deposit');
        return;
      }

      setReferenceNumber(data.referenceNumber);
      setStep('address');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_WALLET.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const copyReference = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const selectedCoin = CRYPTO_COINS.find((c) => c.id === coin);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#111318] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t('depositTitle')}</DialogTitle>
          <DialogDescription className="text-white/50">
            {step === 'form' ? t('depositDescription') : t('depositPendingDescription')}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
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
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                        coin === c
                          ? 'border-gold-500/50 bg-gold-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className={`text-lg font-bold ${coin === c ? 'text-gold-400' : 'text-white/40'}`}>
                        {coinData.icon}
                      </span>
                      <span className={`text-xs font-medium ${coin === c ? 'text-gold-400' : 'text-white/60'}`}>
                        {coinData.name}
                      </span>
                      <span className="text-[10px] text-white/30">{coinData.network}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('amount')} (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <Input
                  type="number"
                  placeholder={`${t('minimum')}: $${MIN_DEPOSIT}`}
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(''); }}
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  min={MIN_DEPOSIT}
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button
              onClick={handleSubmit}
              disabled={loading || !amount}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('confirmDeposit')}
            </Button>
          </div>
        )}

        {step === 'address' && (
          <div className="space-y-4">
            {/* Reference Number */}
            <div className="rounded-xl bg-gold-500/5 border border-gold-500/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">{t('referenceNumber')}</span>
                <button onClick={copyReference} className="flex items-center gap-1 text-gold-400 text-xs hover:text-gold-300">
                  {copiedRef ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedRef ? t('copied') : t('copy')}
                </button>
              </div>
              <p className="text-sm font-mono font-bold text-gold-400">{referenceNumber}</p>
            </div>

            {/* Wallet Address */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white p-2">
                  <QrCode className="h-14 w-14 text-black" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">{t('sendTo')} ({selectedCoin?.name} - {PLATFORM_WALLET.networkShort})</p>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                  <code className="flex-1 text-xs text-white/80 break-all font-mono">{PLATFORM_WALLET.address}</code>
                  <button onClick={copyAddress} className="flex-shrink-0 text-gold-400 hover:text-gold-300">
                    {copiedAddr ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                <span className="text-white/50">{t('sendExactAmount')}</span>
                <span className="text-gold-400 font-semibold">${amount} {selectedCoin?.name}</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-300">{t('cryptoDepositInstructions')}</p>
            </div>

            <Badge variant="outline" className="w-full justify-center border-yellow-500/30 text-yellow-400 py-1">
              {t('pendingConfirmation')}
            </Badge>

            <Button
              variant="outline"
              onClick={() => { handleOpenChange(false); onSuccess(); }}
              className="w-full border-white/10 text-white/60 hover:text-white"
            >
              {t('done')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
