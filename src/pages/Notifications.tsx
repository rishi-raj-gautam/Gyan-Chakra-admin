import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/api/notification.api';
import type { ScheduledNotification } from '@/services/api/notification.api';
import { Table } from '@/components/shared/Table';
import { Dialog } from '@/components/shared/Dialog';
import { Input, Select, Textarea } from '@/components/shared/FormComponents';
import { useToast } from '@/context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Send, Trash2, Loader2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

const notificationFormSchema = zod.object({
  title: zod.string().min(3, 'Title is required (min 3 chars)').max(50, 'Title too long'),
  message: zod.string().min(5, 'Message is required (min 5 chars)').max(200, 'Message too long'),
  audience: zod.enum(['all', 'quiz_participants', 'challenge_participants', 'selected_users']),
  scheduleTime: zod.string().optional(),
});

type NotificationFormSchemaType = zod.infer<typeof notificationFormSchema>;

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications history
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notificationsHistory'],
    queryFn: notificationApi.getNotifications,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotificationFormSchemaType>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      audience: 'all',
      scheduleTime: '',
    },
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: notificationApi.saveNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationsHistory'] });
      showToast('Notification request completed successfully', 'success');
      setIsOpen(false);
      reset();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to dispatch notification', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationsHistory'] });
      showToast('Scheduled notification cancelled and deleted', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete notification', 'error');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Cancel and delete this notification?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (values: NotificationFormSchemaType) => {
    const payload: Partial<ScheduledNotification> = {
      title: values.title,
      message: values.message,
      audience: values.audience as any,
      scheduleTime: values.scheduleTime || undefined,
    };
    sendMutation.mutate(payload);
  };

  const columns: ColumnDef<ScheduledNotification>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'message',
      header: 'Message Body',
      accessorKey: 'message',
      cell: (info) => <span className="text-text-muted block max-w-sm truncate">{info.getValue() as string}</span>,
    },
    {
      id: 'audience',
      header: 'Audience Group',
      accessorKey: 'audience',
      cell: (info) => {
        const aud = info.getValue() as string;
        const formatted = aud.replace('_', ' ');
        return <span className="px-2.5 py-0.5 text-xxs font-bold bg-white/5 border border-white/10 rounded-md uppercase text-gold">{formatted}</span>;
      },
    },
    {
      id: 'status',
      header: 'Dispatch Status',
      accessorKey: 'status',
      cell: (info) => {
        const stat = info.getValue() as string;
        const color = stat === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return <span className={`px-2 py-0.5 text-xxs font-bold border rounded-md uppercase ${color}`}>{stat}</span>;
      },
    },
    {
      id: 'scheduleTime',
      header: 'Delivery Time',
      accessorKey: 'scheduleTime',
      cell: (info) => {
        const time = info.getValue() as string;
        return <span>{time ? new Date(time).toLocaleString() : 'Immediate'}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={() => handleDelete(row.original.id)}
          className="p-1.5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-lg text-text-muted hover:text-rose-400 cursor-pointer"
          title="Delete/Cancel"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">Broadcaster Center</h2>
          <p className="text-xs text-text-muted mt-0.5">Send immediate broadcasts and schedule system push alerts</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer"
        >
          <Send className="w-4 h-4 text-background stroke-[2.5]" />
          Dispatch Broadcast
        </button>
      </div>

      {/* Table history */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Loading dispatch logs...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={notifications}
            searchPlaceholder="Search broadcasts..."
            exportFileName="gyaanchakra-notifications"
          />
        </div>
      )}

      {/* Broadcast Compose Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Compose Push Broadcast" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Alert Title"
            type="text"
            placeholder="e.g. Contest is live! 🚀"
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            label="Message Body"
            placeholder="Write details of the broadcast (max 200 characters)..."
            error={errors.message?.message}
            {...register('message')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Audience Target Group"
              error={errors.audience?.message}
              options={[
                { label: 'All Registered Players', value: 'all' },
                { label: 'Daily Quiz Players Only', value: 'quiz_participants' },
                { label: 'Mega Challenge Entrants', value: 'challenge_participants' },
              ]}
              {...register('audience')}
            />
            <Input
              label="Schedule Release (Optional)"
              type="datetime-local"
              placeholder="Leave empty for immediate"
              error={errors.scheduleTime?.message}
              {...register('scheduleTime')}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="px-5 py-2 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-background" />
                  Dispatch
                </>
              )}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
export default Notifications;
