'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent, formatDate } from '@/lib/format';
import { DollarSign, TrendingUp, BarChart3, Layers, ArrowUpRight, ArrowDownRight, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { WalletBalance } from '@/components/shared/wallet-balance';

export default function InvestorDashboardPage() {
  const t = useTranslations('dashboard.investor');
  const locale = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/investor')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const apiStats = data?.stats || { totalBacked: 0, activeInvestments: 0, totalReturns: 0, roi: 0 };

  const stats = [
    { label: t('totalInvested'), value: formatCurrency(apiStats.totalBacked), icon: DollarSign, trend: '', up: true },
    { label: t('activeInvestments'), value: String(apiStats.activeInvestments), icon: Layers, trend: '', up: true },
    { label: t('totalReturns'), value: formatCurrency(apiStats.totalReturns), icon: TrendingUp, trend: '', up: true },
    { label: t('roi'), value: `${apiStats.roi >= 0 ? '+' : ''}${apiStats.roi}%`, icon: BarChart3, trend: '', up: apiStats.roi >= 0 },
  ];

  const portfolio = data?.portfolio || [];
  const transactions = data?.transactions || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-sm text-white/50">{t('welcome', { name: user?.displayName || 'Backer' })}</p>
        </div>
        <Button render={<Link href="/marketplace" />} className="bg-gold-500 text-black font-semibold hover:bg-gold-400">
          Browse Marketplace
        </Button>
      </div>

      <WalletBalance />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="border-white/[0.06] bg-[#111318]">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
                  <s.icon className="h-5 w-5 text-gold-400" />
                </div>
                <span className={`flex items-center gap-0.5 text-xs ${s.up ? 'text-green-400' : 'text-red-400'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gold-400" /></div>
      ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06] bg-[#111318]">
          <CardHeader><CardTitle className="text-white text-sm">{t('portfolio')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {portfolio.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">No investments yet</p>
            ) : portfolio.slice(0, 5).map((l: any) => {
              const name = locale === 'zh-TW' && l.player?.displayNameZh ? l.player.displayNameZh : l.player?.displayName || 'Player';
              const tName = locale === 'zh-TW' && l.tournament?.nameZh ? l.tournament.nameZh : l.tournament?.name || 'Tournament';
              const statusColors: Record<string, string> = {
                active: 'border-green-500/30 text-green-400',
                filled: 'border-gold-500/30 text-gold-400',
                pending_result: 'border-yellow-500/30 text-yellow-400',
                settled: 'border-blue-500/30 text-blue-400',
              };
              const statusLabel: Record<string, string> = {
                active: 'Active',
                filled: 'In Play',
                pending_result: 'Pending Result',
                settled: 'Settled',
                in_progress: 'In Play',
              };
              return (
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{name}</p>
                      {l.status && (
                        <Badge variant="outline" className={`text-[10px] ${statusColors[l.status] || 'border-white/10 text-white/40'}`}>
                          {statusLabel[l.status] || l.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/40">{tName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{formatCurrency((l.tournament?.buyIn || 0) * 0.1)}</p>
                    <span className="text-xs text-green-400">{formatPercent(l.player?.stats?.lifetimeROI || 0)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06] bg-[#111318]">
          <CardHeader><CardTitle className="text-white text-sm">{t('transactions')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">No transactions yet</p>
            ) : transactions.slice(0, 6).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] p-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {locale === 'zh-TW' && tx.descriptionZh ? tx.descriptionZh : tx.description || tx.type}
                  </p>
                  <p className="text-xs text-white/40">{formatDate(tx.createdAt, locale)} · {tx.paymentMethod || '-'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    tx.type === 'payout' || tx.type === 'deposit' || tx.type === 'refund' ? 'text-green-400' :
                    tx.type === 'withdrawal' ? 'text-red-400' : 'text-white'
                  }`}>
                    {tx.type === 'payout' || tx.type === 'deposit' || tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <Badge variant="outline" className={`text-[10px] ${
                    tx.status === 'completed' ? 'border-green-500/30 text-green-400' :
                    tx.status === 'pending' ? 'border-yellow-500/30 text-yellow-400' :
                    'border-red-500/30 text-red-400'
                  }`}>{tx.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
