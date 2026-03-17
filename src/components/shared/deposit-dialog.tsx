'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_BANK_DETAILS, MIN_DEPOSIT } from '@/lib/constants';
import { Loader2, Copy, Check, Building2, CreditCard } from 'lucide-react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'form' | 'bank-details' | 'ecpay-redirect';

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const t = useTranslations('wallet');
  const locale = useLocale();
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank-tw' | 'ecpay'>('bank-tw');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setStep('form');
    setAmount('');
    setMethod('bank-tw');
    setLoading(false);
    setError('');
    setReferenceNumber('');
    setCopied(false);
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
        body: JSON.stringify({ amount: numAmount, paymentMethod: method, currency: 'USD' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create deposit');
        return;
      }

      setReferenceNumber(data.referenceNumber);

      if (method === 'bank-tw') {
        setStep('bank-details');
      } else {
        // ECPay — for now show pending message (ECPay form redirect added later)
        setStep('ecpay-redirect');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyReference = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bankName = locale === 'zh-TW' ? PLATFORM_BANK_DETAILS.bankName : PLATFORM_BANK_DETAILS.bankNameEn;
  const holderName = locale === 'zh-TW' ? PLATFORM_BANK_DETAILS.accountHolderZh : PLATFORM_BANK_DETAILS.accountHolder;

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
            {/* Payment Method Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('bank-tw')}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  method === 'bank-tw'
                    ? 'border-gold-500/50 bg-gold-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Building2 className={`h-5 w-5 ${method === 'bank-tw' ? 'text-gold-400' : 'text-white/40'}`} />
                <span className={`text-xs font-medium ${method === 'bank-tw' ? 'text-gold-400' : 'text-white/60'}`}>
                  {t('bankTransfer')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('ecpay')}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  method === 'ecpay'
                    ? 'border-gold-500/50 bg-gold-500/10'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <CreditCard className={`h-5 w-5 ${method === 'ecpay' ? 'text-gold-400' : 'text-white/40'}`} />
                <span className={`text-xs font-medium ${method === 'ecpay' ? 'text-gold-400' : 'text-white/60'}`}>
                  ECPay
                </span>
              </button>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs text-white/50 mb-1 block">{t('amount')}</label>
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

        {step === 'bank-details' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gold-500/5 border border-gold-500/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">{t('referenceNumber')}</span>
                <button onClick={copyReference} className="flex items-center gap-1 text-gold-400 text-xs hover:text-gold-300">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>
              <p className="text-lg font-mono font-bold text-gold-400">{referenceNumber}</p>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">{t('bankName')}</span>
                <span className="text-white">{bankName} ({PLATFORM_BANK_DETAILS.bankCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{t('accountNumber')}</span>
                <span className="text-white font-mono">{PLATFORM_BANK_DETAILS.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{t('accountHolder')}</span>
                <span className="text-white">{holderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">{t('amount')}</span>
                <span className="text-gold-400 font-semibold">${amount}</span>
              </div>
            </div>

            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-xs text-blue-300">{t('bankTransferInstructions')}</p>
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

        {step === 'ecpay-redirect' && (
          <div className="space-y-4 text-center py-4">
            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 py-1">
              {t('pendingConfirmation')}
            </Badge>
            <p className="text-sm text-white/50">{t('ecpayPending')}</p>
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
