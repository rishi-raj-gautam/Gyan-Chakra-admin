import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { winnerApi } from '@/services/api/winner.api';
import type { Winner, WinnerStatus } from '@/types/api.types';
import { Table } from '@/components/shared/Table';
import { Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

export const Winners: React.FC = () => {

  const { data: winners = [], isLoading } = useQuery({
    queryKey: ['winnersList'],
    queryFn: () => winnerApi.getRecentWinners(),
  });

  const getStatusBadge = (status: WinnerStatus) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">Paid</span>;
      case 'announced':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md uppercase">Announced</span>;
      case 'disqualified':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md uppercase">Disqualified</span>;
      case 'pending':
      default:
        return <span className="px-2 py-0.5 text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">Pending</span>;
    }
  };

  const columns: ColumnDef<Winner>[] = [
    {
      id: 'drawId',
      header: 'Draw Reference',
      accessorKey: 'drawId',
      cell: (info) => <span className="font-mono text-xxs text-text-muted">{info.getValue() as string}</span>,
    },
    {
      id: 'contestType',
      header: 'Contest Type',
      accessorKey: 'contestType',
      cell: (info) => <span className="capitalize font-bold text-white">{(info.getValue() as string)?.replace('_', ' ')}</span>,
    },
    {
      id: 'userName',
      header: 'Winner Player',
      accessorFn: (row) => row.userId?.name || 'N/A',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'userMobile',
      header: 'Mobile',
      accessorFn: (row) => row.userId?.mobile || 'N/A',
    },
    {
      id: 'rewardAmount',
      header: 'Reward Amount',
      accessorKey: 'rewardAmount',
      cell: (info) => <span className="text-gold font-bold">₹{info.getValue() as number}</span>,
    },
    {
      id: 'winnerStatus',
      header: 'Status',
      accessorKey: 'winnerStatus',
      cell: (info) => getStatusBadge(info.getValue() as WinnerStatus),
    },
    {
      id: 'announcementDate',
      header: 'Draw Time',
      accessorKey: 'announcementDate',
      cell: (info) => <span>{new Date(info.getValue() as string || Date.now()).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-wide text-white">Winner Approvals & History</h2>
        <p className="text-xs text-text-muted mt-0.5">Audit prize draw transactions and export winner ledgers</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Fetching draw outcomes...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={winners}
            searchPlaceholder="Search winners..."
            exportFileName="gyaanchakra-winners"
          />
        </div>
      )}
    </div>
  );
};
export default Winners;
