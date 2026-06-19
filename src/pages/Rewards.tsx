import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { rewardApi } from '@/services/api/reward.api';
import { analyticsApi } from '@/services/api/analytics.api';
import { Table } from '@/components/shared/Table';
import { Coins, AlertCircle, Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Winner } from '@/types/api.types';

export const Rewards: React.FC = () => {
  // Fetch overview for totals
  const { data: analytics } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => analyticsApi.getDashboardStats(),
  });

  // Fetch pending count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pendingRewardsCount'],
    queryFn: rewardApi.getPendingRewardsCount,
  });

  // Fetch rewards transaction history (using winners endpoint)
  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['rewardsHistory'],
    queryFn: () => rewardApi.getRewardHistory(),
  });

  const columns: ColumnDef<Winner>[] = [
    {
      id: 'drawId',
      header: 'Transaction ID',
      accessorKey: 'drawId',
      cell: (info) => <span className="font-mono text-xxs text-text-muted">{info.getValue() as string}</span>,
    },
    {
      id: 'userName',
      header: 'Recieving Player',
      accessorFn: (row) => row.userId?.name || 'N/A',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'contest',
      header: 'Source Contest',
      accessorFn: (row) => row.contestType?.replace('_', ' ') || 'N/A',
      cell: (info) => <span className="capitalize font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'rewardAmount',
      header: 'Credited (₹)',
      accessorKey: 'rewardAmount',
      cell: (info) => <span className="text-gold font-bold">₹{info.getValue() as number}</span>,
    },
    {
      id: 'winnerStatus',
      header: 'Transfer Status',
      accessorKey: 'winnerStatus',
      cell: () => (
        <span className="px-2 py-0.5 text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">
          Completed
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: (info) => <span>{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold tracking-wide text-white">Rewards Distribution Ledger</h2>
        <p className="text-xs text-text-muted mt-0.5">Track wallet balance adjustments and cashout logs</p>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Total Disbursed</span>
            <h2 className="text-2xl font-black text-white">
              ₹{Number(analytics?.totalRewardsDistributed || 0).toLocaleString()}
            </h2>
            <p className="text-xxs text-text-muted">Total prize cash pool credited</p>
          </div>
          <div className="p-3 bg-gold/10 border border-gold/20 text-gold rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-6 bg-background-card border border-white/5 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-xxs font-bold text-text-muted uppercase tracking-wider">Awaiting Drawing</span>
            <h2 className="text-2xl font-black text-amber-400">{pendingCount}</h2>
            <p className="text-xxs text-text-muted">Expired contests needing winner draws</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* History table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Analyzing payouts...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={rewards}
            searchPlaceholder="Search reward ledger..."
            exportFileName="gyaanchakra-rewards-ledger"
          />
        </div>
      )}
    </div>
  );
};
export default Rewards;
