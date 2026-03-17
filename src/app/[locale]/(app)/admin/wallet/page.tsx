'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/format';
import { Loader2, Check, X, ArrowDownToLine, ArrowUpFromLine, ShieldCheck } from 'lucide-react';

interface PendingTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  paymentMethod: string;
  referenceNumber: string;
  bankAccountInfo: any;
  status: string;
  description: string;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    displayNameZh?: string;
    email: string;
    region: string;
  } | null;
}

export default function AdminWalletPage() {
  const t = useTranslations('admin.wallet');
  const locale = useLocale();
  const { user } = useAuth();
  const [tab, setTab] = useState<'deposit' | 'withdrawal'>('deposit');
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchPending = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/wallet/pending?type=${tab}`)
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (txId: string, action: string) => {
    setProcessingId(txId);
    const endpoint = tab === 'deposit'
      ? '/api/admin/wallet/deposits'
      : '/api/admin/wallet/withdrawals';

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: txId,
          action,
          adminNote: adminNotes[txId] || '',
        }),
      });

      if (res.ok) {
        fetchPending();
      }
    } catch {
      // silently fail
    } finally {
      setProcessingId(null);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-white/50">{t('forbidden')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-gold-400" />
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={tab === 'deposit' ? 'default' : 'outline'}
          onClick={() => setTab('deposit')}
          className={tab === 'deposit' ? 'bg-gold-500 text-black' : 'border-white/10 text-white/50 hover:text-white'}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          {t('pendingDeposits')}
        </Button>
        <Button
          size="sm"
          variant={tab === 'withdrawal' ? 'default' : 'outline'}
          onClick={() => setTab('withdrawal')}
          className={tab === 'withdrawal' ? 'bg-gold-500 text-black' : 'border-white/10 text-white/50 hover:text-white'}
        >
          <ArrowUpFromLine className="mr-2 h-4 w-4" />
          {t('pendingWithdrawals')}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        </div>
      ) : transactions.length === 0 ? (
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardContent className="py-12 text-center">
            <p className="text-white/40">{t('noPending')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => {
            const userName = locale === 'zh-TW' && tx.user?.displayNameZh
              ? tx.user.displayNameZh
              : tx.user?.displayName || 'Unknown';
            const isProcessing = processingId === tx.id;

            return (
              <Card key={tx.id} className="border-white/[0.06] bg-[#111318]">
                <CardContent className="pt-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-white">{userName}</p>
                        <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">
                          {tx.user?.email}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span>{formatDate(tx.createdAt, locale)}</span>
                        <span>{tx.paymentMethod}</span>
                        {tx.referenceNumber && (
                          <span className="font-mono text-gold-400">{tx.referenceNumber}</span>
                        )}
                      </div>
                      {tx.type === 'withdrawal' && tx.bankAccountInfo && (
                        <div className="text-xs text-white/40 space-x-3">
                          <span>{tx.bankAccountInfo.bankName}</span>
                          <span className="font-mono">****{tx.bankAccountInfo.accountNumber?.slice(-4)}</span>
                          <span>{tx.bankAccountInfo.accountHolder}</span>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={`text-lg font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Admin actions */}
                  <div className="mt-4 flex flex-col sm:flex-row items-end gap-3 pt-4 border-t border-white/[0.06]">
                    <Input
                      placeholder={t('adminNote')}
                      value={adminNotes[tx.id] || ''}
                      onChange={(e) => setAdminNotes((prev) => ({ ...prev, [tx.id]: e.target.value }))}
                      className="flex-1 bg-white/5 border-white/10 text-white text-xs placeholder:text-white/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleAction(tx.id, tab === 'deposit' ? 'approve' : 'complete')}
                        className="bg-green-600 text-white hover:bg-green-500"
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        {tab === 'deposit' ? t('approve') : t('complete')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isProcessing}
                        onClick={() => handleAction(tx.id, 'reject')}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <X className="mr-1 h-4 w-4" />
                        {t('reject')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
