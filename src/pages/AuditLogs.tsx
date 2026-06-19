import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api/settings.api';
import type { AuditLog } from '@/types/api.types';
import { Table } from '@/components/shared/Table';
import { History, Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

export const AuditLogs: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogsList'],
    queryFn: () => settingsApi.getAuditLogs(1, 100),
  });

  const logs = data?.logs || [];

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: 'createdAt',
      header: 'Timestamp',
      accessorKey: 'createdAt',
      cell: (info) => <span>{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      id: 'action',
      header: 'Operation Action',
      accessorKey: 'action',
      cell: (info) => {
        const act = info.getValue() as string;
        const formatted = act.replace('_', ' ');
        return (
          <span className="px-2.5 py-0.5 text-xxs font-bold bg-gold/10 text-gold border border-gold/15 rounded-md uppercase tracking-wide">
            {formatted}
          </span>
        );
      },
    },
    {
      id: 'performedBy',
      header: 'Administrator',
      accessorFn: (row) => row.performedBy?.name || 'System',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'targetType',
      header: 'Target Object',
      accessorKey: 'targetType',
      cell: (info) => <span className="text-xxs text-text-muted uppercase font-bold tracking-wider">{info.getValue() as string || 'N/A'}</span>,
    },
    {
      id: 'details',
      header: 'Action Metadata',
      accessorKey: 'details',
      cell: (info) => {
        const detailsObj = info.getValue() as Record<string, any>;
        return (
          <span className="text-xxs font-mono text-text-muted block max-w-xs truncate">
            {JSON.stringify(detailsObj)}
          </span>
        );
      },
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (info) => <span className="text-xs text-text-muted font-mono">{info.getValue() as string || 'N/A'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">System Audit Registry</h2>
          <p className="text-xs text-text-muted mt-0.5">Read-only immutable sequence of administrative operations</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Loading audit records...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={logs}
            searchPlaceholder="Search audit trails..."
            exportFileName="gyaanchakra-auditlogs"
          />
        </div>
      )}
    </div>
  );
};
export default AuditLogs;
