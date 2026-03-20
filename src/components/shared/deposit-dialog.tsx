'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CRYPTO_COINS, MIN_DEPOSIT } from '@/lib/constants';
import { Loader2, Copy, Check, CircleCheck, CircleAlert, Clock } from 'lucide-react';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = 'form' | 'paying' | 'confirmed' | 'failed';

interface DepositResponse {
  transactionId: string;
  referenceNumber: string;
  walletAddress: string;
  network: string;
  coin: string;
  payAmount?: number;
  payCurrency?: string;
  expiresAt?: string;
  paymentId?: string;
  mode: 'auto' | 'manual';
}

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const t = useTranslations('wallet');
  const [step, setStep] = useState<Step>('form');
  const [amount, setAmount] = useState('');
  const [coin, setCoin] = useState<string>('usdt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [depositData, setDepositData] = useState<DepositResponse | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    setStep('form');
    setAmount('');
    setCoin('usdt');
    setLoading(false);
    setError('');
    setDepositData(null);
    setCopiedAddr(false);
    setCopiedAmount(false);
    setPaymentStatus(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  // Poll for payment status when in 'paying' step
  useEffect(() => {
    if (step !== 'paying' || !depositData?.transactionId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/wallet/deposit/status?transactionId=${depositData.transactionId}`);
        if (!res.ok) return;
        const data = await res.json();

        setPaymentStatus(data.paymentStatus);

        if (data.status === 'completed') {
          setStep('confirmed');
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'failed') {
          setStep('failed');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Ignore polling errors
      }
    };

    // Poll every 10 seconds
    poll();
    pollRef.current = setInterval(poll, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, depositData?.transactionId]);

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
        body: JSON.stringify({ amount: numAmount, paymentMethod: coin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create deposit');
        return;
      }

      setDepositData(data);
      setStep('paying');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (!depositData) return;
    navigator.clipboard.writeText(depositData.walletAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const copyAmount = () => {
    if (!depositData?.payAmount) return;
    navigator.clipboard.writeText(String(depositData.payAmount));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const selectedCoin = CRYPTO_COINS.find((c) => c.id === coin);

  const statusLabel = (status: string | null) => {
    if (!status) return null;
    const map: Record<string, { text: string; color: string }> = {
      waiting: { text: 'Waiting for payment...', color: 'text-yellow-400' },
      confirming: { text: 'Confirming on blockchain...', color: 'text-blue-400' },
      confirmed: { text: 'Confirmed, processing...', color: 'text-blue-400' },
      sending: { text: 'Processing deposit...', color: 'text-blue-400' },
      partially_paid: { text: 'Partial payment received', color: 'text-orange-400' },
      finished: { text: 'Payment complete!', color: 'text-green-400' },
      failed: { text: 'Payment failed', color: 'text-red-400' },
      expired: { text: 'Payment expired', color: 'text-red-400' },
    };
    return map[status] || { text: status, color: 'text-white/50' };
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#111318] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{t('depositTitle')}</DialogTitle>
          <DialogDescription className="text-white/50">
            {step === 'form' && t('depositDescription')}
            {step === 'paying' && (depositData?.mode === 'auto'
              ? 'Send the exact amount to the address below. Your wallet will be credited automatically.'
              : t('depositPendingDescription'))}
            {step === 'confirmed' && 'Your deposit has been confirmed and credited to your wallet!'}
            {step === 'failed' && 'This payment has failed or expired. Please try again.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Form */}
        {step === 'form' && (
          <div className="space-y-4">
            {/* Coin Selection */}
            <div>
              <label className="text-xs text-white/50 mb-2 block">{t('selectCoin')}</label>
              <div className="grid grid-cols-2 gap-3">
                {CRYPTO_COINS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCoin(c.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                      coin === c.id
                        ? 'border-gold-500/50 bg-gold-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className={`text-lg font-bold ${coin === c.id ? 'text-gold-400' : 'text-white/40'}`}>
                      {c.icon}
                    </span>
                    <span className={`text-xs font-medium ${coin === c.id ? 'text-gold-400' : 'text-white/60'}`}>
                      {c.name}
                    </span>
                    <span className="text-[10px] text-white/30">{c.network}</span>
                  </button>
                ))}
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

        {/* Step 2: Payment address + waiting */}
        {step === 'paying' && depositData && (
          <div className="space-y-4">
            {/* Exact crypto amount to send (auto mode) */}
            {depositData.payAmount && (
              <div className="rounded-xl bg-gold-500/5 border border-gold-500/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Send exactly</span>
                  <button onClick={copyAmount} className="flex items-center gap-1 text-gold-400 text-xs hover:text-gold-300">
                    {copiedAmount ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedAmount ? t('copied') : t('copy')}
                  </button>
                </div>
                <p className="text-xl font-mono font-bold text-gold-400">
                  {depositData.payAmount} {depositData.payCurrency?.toUpperCase()}
                </p>
                <p className="text-xs text-white/40">≈ ${amount} USD</p>
              </div>
            )}

            {/* Wallet Address */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-2">
                  {depositData.mode === 'auto'
                    ? `Send to this unique address (${depositData.network})`
                    : `${t('sendTo')} (${selectedCoin?.name} - ${depositData.network})`}
                </p>
                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                  <code className="flex-1 text-xs text-white/80 break-all font-mono">
                    {depositData.walletAddress}
                  </code>
                  <button onClick={copyAddress} className="flex-shrink-0 text-gold-400 hover:text-gold-300">
                    {copiedAddr ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!depositData.payAmount && (
                <div className="flex justify-between text-sm pt-2 border-t border-white/[0.06]">
                  <span className="text-white/50">{t('sendExactAmount')}</span>
                  <span className="text-gold-400 font-semibold">${amount} {selectedCoin?.name}</span>
                </div>
              )}
            </div>

            {/* Reference Number (for manual mode) */}
            {depositData.mode === 'manual' && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-xs text-white/40 mb-1">{t('referenceNumber')}</p>
                <p className="text-sm font-mono font-bold text-white/70">{depositData.referenceNumber}</p>
              </div>
            )}

            {/* Live status indicator */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              {depositData.mode === 'auto' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gold-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${statusLabel(paymentStatus)?.color || 'text-yellow-400'}`}>
                      {statusLabel(paymentStatus)?.text || 'Waiting for payment...'}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">Auto-refreshing every 10 seconds</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400">{t('pendingConfirmation')}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Admin will review and approve your deposit</p>
                  </div>
                </>
              )}
            </div>

            {/* Expiry warning */}
            {depositData.expiresAt && (
              <p className="text-[10px] text-white/30 text-center">
                This payment address expires at {new Date(depositData.expiresAt).toLocaleString()}
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => { handleOpenChange(false); onSuccess(); }}
              className="w-full border-white/10 text-white/60 hover:text-white"
            >
              {t('done')}
            </Button>
          </div>
        )}

        {/* Step 3: Confirmed */}
        {step === 'confirmed' && (
          <div className="space-y-4 text-center py-4">
            <CircleCheck className="h-16 w-16 text-green-400 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-white">Deposit Confirmed!</p>
              <p className="text-sm text-white/50 mt-1">${amount} has been credited to your wallet.</p>
            </div>
            <Button
              onClick={() => { handleOpenChange(false); onSuccess(); }}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              {t('done')}
            </Button>
          </div>
        )}

        {/* Step 4: Failed */}
        {step === 'failed' && (
          <div className="space-y-4 text-center py-4">
            <CircleAlert className="h-16 w-16 text-red-400 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-white">Payment Failed</p>
              <p className="text-sm text-white/50 mt-1">
                The payment expired or failed. No funds have been charged.
              </p>
            </div>
            <Button
              onClick={() => { reset(); setStep('form'); }}
              className="w-full bg-gold-500 text-black font-semibold hover:bg-gold-400"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
