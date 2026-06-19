import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';
import type { User, UserStatus } from '@/types/api.types';
import { Table } from '@/components/shared/Table';
import { Dialog } from '@/components/shared/Dialog';
import { Select } from '@/components/shared/FormComponents';
import { useToast } from '@/context/ToastContext';
import {
  Loader2,
  Eye,
  UserCheck,
  UserX,
  Ban,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Fetch users list
  const { data, isLoading } = useQuery({
    queryKey: ['usersList', currentPage, search, statusFilter],
    queryFn: () => userApi.getUsers(currentPage, 20, search, statusFilter),
  });

  const users = data?.users || [];

  // Mutation to update user status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' | 'blocked' }) =>
      userApi.updateUserStatus(id, status),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      showToast(`User status updated to ${updatedUser.status}`, 'success');
      if (viewingUser && viewingUser._id === updatedUser._id) {
        setViewingUser(updatedUser);
      }
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update user status', 'error');
    },
  });

  const handleUpdateStatus = (id: string, status: 'active' | 'suspended' | 'blocked') => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">Active</span>;
      case 'suspended':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">Suspended</span>;
      case 'blocked':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md uppercase">Blocked</span>;
      case 'inactive':
      default:
        return <span className="px-2 py-0.5 text-xxs font-bold bg-white/5 text-text-muted border border-white/10 rounded-md uppercase">Inactive</span>;
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      id: 'name',
      header: 'Player Name',
      accessorKey: 'name',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'mobile',
      header: 'Mobile',
      accessorKey: 'mobile',
    },
    {
      id: 'city',
      header: 'City',
      accessorKey: 'city',
      cell: (info) => <span>{info.getValue() as string || 'N/A'}</span>,
    },
    {
      id: 'walletBalance',
      header: 'Wallet Balance',
      accessorKey: 'walletBalance',
      cell: (info) => <span className="text-gold font-bold">₹{info.getValue() as number}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (info) => getStatusBadge(info.getValue() as UserStatus),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const userObj = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingUser(userObj)}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-gold/20 rounded-lg text-text-muted hover:text-gold cursor-pointer"
              title="Inspect Profile"
            >
              <Eye className="w-4 h-4" />
            </button>
            {userObj.status !== 'active' && (
              <button
                onClick={() => handleUpdateStatus(userObj._id, 'active')}
                className="p-1.5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 rounded-lg text-text-muted hover:text-emerald-400 cursor-pointer"
                title="Activate Player"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
            {userObj.status === 'active' && (
              <button
                onClick={() => handleUpdateStatus(userObj._id, 'suspended')}
                className="p-1.5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/20 rounded-lg text-text-muted hover:text-amber-400 cursor-pointer"
                title="Suspend Player"
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
            {userObj.status !== 'blocked' && (
              <button
                onClick={() => handleUpdateStatus(userObj._id, 'blocked')}
                className="p-1.5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 rounded-lg text-text-muted hover:text-rose-400 cursor-pointer"
                title="Block Player"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-wide text-white">Player Directory</h2>
        <p className="text-xs text-text-muted mt-0.5">Audit user wallets, block abusers, and inspect profile history logs</p>
      </div>

      {/* Filter panel */}
      <div className="p-4 bg-background-card border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search players by name, mobile, or email..."
            className="w-full px-4 py-2 bg-background border border-gold/10 rounded-xl text-white placeholder-text-muted focus:border-gold text-sm"
          />
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-3">
          <Select
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Active Only', value: 'active' },
              { label: 'Suspended Only', value: 'suspended' },
              { label: 'Blocked Only', value: 'blocked' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-xs cursor-pointer"
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Loading player database...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={users}
            searchPlaceholder="Search table..."
            exportFileName="gyaanchakra-users"
          />
        </div>
      )}

      {/* Profile Detail Dialog */}
      <Dialog
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title="Player Profile Audit"
        size="lg"
      >
        {viewingUser && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 bg-background/50 rounded-2xl border border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold text-lg uppercase shadow-inner">
                {viewingUser.name.slice(0, 2)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-md font-bold text-white truncate">{viewingUser.name}</h3>
                  {getStatusBadge(viewingUser.status)}
                </div>
                <div className="text-xs text-text-muted mt-1 leading-none">
                  {viewingUser.mobile} {viewingUser.email ? `• ${viewingUser.email}` : ''}
                </div>
                <div className="text-xxs text-gold/80 font-semibold uppercase mt-1">
                  Referral: {viewingUser.referralCode}
                </div>
              </div>
            </div>

            {/* Financials & Game Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                <span className="block text-xxs font-bold text-text-muted uppercase">Wallet Balance</span>
                <span className="block text-lg font-black text-white mt-1">₹{viewingUser.walletBalance}</span>
              </div>
              <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                <span className="block text-xxs font-bold text-text-muted uppercase">Lifetime Profit</span>
                <span className="block text-lg font-black text-gold mt-1">₹{viewingUser.lifetimeEarnings}</span>
              </div>
              <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                <span className="block text-xxs font-bold text-text-muted uppercase">Contests Played</span>
                <span className="block text-lg font-black text-white mt-1">{viewingUser.totalContestsPlayed}</span>
              </div>
              <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                <span className="block text-xxs font-bold text-text-muted uppercase">Contests Won</span>
                <span className="block text-lg font-black text-emerald-400 mt-1">{viewingUser.totalContestsWon}</span>
              </div>
            </div>

            {/* Account controls */}
            <div className="p-5 bg-background/40 rounded-xl border border-white/5 space-y-3.5">
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider">Administrative Security Actions</h4>
              <div className="flex flex-wrap gap-2.5">
                {viewingUser.status !== 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(viewingUser._id, 'active')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activate Account
                  </button>
                )}
                {viewingUser.status === 'active' && (
                  <button
                    onClick={() => handleUpdateStatus(viewingUser._id, 'suspended')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                  >
                    <UserX className="w-4 h-4" />
                    Suspend Account
                  </button>
                )}
                {viewingUser.status !== 'blocked' && (
                  <button
                    onClick={() => handleUpdateStatus(viewingUser._id, 'blocked')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    Block Account
                  </button>
                )}
              </div>
            </div>

            {/* Closing footer */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default Users;
