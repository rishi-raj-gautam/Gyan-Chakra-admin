import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi } from '@/services/api/quiz.api';
import type { DailyQuiz as IDailyQuiz, QuizStatus } from '@/types/api.types';
import { Table } from '@/components/shared/Table';
import { Dialog } from '@/components/shared/Dialog';
import { Input, Select, Textarea } from '@/components/shared/FormComponents';
import { useToast } from '@/context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Plus, Edit, Trash2, Trophy, Loader2, Eye, Award, HelpCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

const quizFormSchema = zod.object({
  title: zod.string().min(3, 'Title is required (min 3 chars)'),
  question: zod.string().min(5, 'Question text is required (min 5 chars)'),
  optionA: zod.string().min(1, 'Option A is required'),
  optionB: zod.string().min(1, 'Option B is required'),
  optionC: zod.string().min(1, 'Option C is required'),
  optionD: zod.string().min(1, 'Option D is required'),
  correctAnswerIndex: zod.number().min(0).max(3),
  rewardAmount: zod.number().min(1, 'Reward amount must be greater than 0'),
  startTime: zod.string().min(1, 'Start time is required'),
  endTime: zod.string().min(1, 'End time is required'),
  status: zod.enum(['draft', 'scheduled', 'active', 'expired', 'completed']),
});

type QuizFormSchemaType = zod.infer<typeof quizFormSchema>;

export const DailyQuiz: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<IDailyQuiz | null>(null);
  const [viewingStats, setViewingStats] = useState<IDailyQuiz | null>(null);
  const [drawingQuiz, setDrawingQuiz] = useState<IDailyQuiz | null>(null);

  // Fetch quizzes
  const { data, isLoading } = useQuery({
    queryKey: ['dailyQuizzes'],
    queryFn: () => quizApi.getAllQuizzes(1, 100),
  });

  const quizzes = data?.quizzes || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuizFormSchemaType>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: '',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswerIndex: 0,
      rewardAmount: 0,
      startTime: '',
      endTime: '',
      status: 'draft',
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: quizApi.createQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyQuizzes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      showToast('Daily quiz created successfully', 'success');
      setIsOpen(false);
      reset();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create quiz', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quiz }: { id: string; quiz: Partial<IDailyQuiz> }) =>
      quizApi.updateQuiz(id, quiz),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyQuizzes'] });
      showToast('Daily quiz updated successfully', 'success');
      setIsOpen(false);
      setEditingQuiz(null);
      reset();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update quiz', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: quizApi.deleteQuiz,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyQuizzes'] });
      showToast('Daily quiz deleted successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete quiz', 'error');
    },
  });

  const drawMutation = useMutation({
    mutationFn: quizApi.drawWinner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyQuizzes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      showToast('Draw completed! Winner has been credited.', 'success');
      setDrawingQuiz(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to draw winner.', 'error');
    },
  });

  const handleOpenCreate = () => {
    setEditingQuiz(null);
    reset({
      title: '',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswerIndex: 0,
      rewardAmount: 100,
      startTime: '',
      endTime: '',
      status: 'draft',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (quiz: IDailyQuiz) => {
    setEditingQuiz(quiz);
    
    // Format ISO date to datetime-local format (YYYY-MM-DDTHH:MM)
    const formatDateTime = (dateStr: string) => {
      const d = new Date(dateStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    reset({
      title: quiz.title,
      question: quiz.question,
      optionA: quiz.options[0]?.text || '',
      optionB: quiz.options[1]?.text || '',
      optionC: quiz.options[2]?.text || '',
      optionD: quiz.options[3]?.text || '',
      correctAnswerIndex: quiz.correctAnswerIndex,
      rewardAmount: quiz.rewardAmount,
      startTime: formatDateTime(quiz.startTime),
      endTime: formatDateTime(quiz.endTime),
      status: quiz.status,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this Daily Quiz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDraw = (quiz: IDailyQuiz) => {
    setDrawingQuiz(quiz);
  };

  const handleExecuteDraw = () => {
    if (drawingQuiz) {
      drawMutation.mutate(drawingQuiz._id);
    }
  };

  const onSubmit = (values: QuizFormSchemaType) => {
    const payload: Partial<IDailyQuiz> = {
      title: values.title,
      question: values.question,
      options: [
        { text: values.optionA, index: 0 },
        { text: values.optionB, index: 1 },
        { text: values.optionC, index: 2 },
        { text: values.optionD, index: 3 },
      ],
      correctAnswerIndex: values.correctAnswerIndex,
      rewardAmount: values.rewardAmount,
      startTime: new Date(values.startTime).toISOString() as any,
      endTime: new Date(values.endTime).toISOString() as any,
      status: values.status as any,
    };

    if (editingQuiz) {
      updateMutation.mutate({ id: editingQuiz._id, quiz: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getStatusBadge = (status: QuizStatus) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">Active</span>;
      case 'scheduled':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md uppercase">Scheduled</span>;
      case 'expired':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">Expired</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md uppercase">Completed</span>;
      case 'draft':
      default:
        return <span className="px-2 py-0.5 text-xxs font-bold bg-white/5 text-text-muted border border-white/10 rounded-md uppercase">Draft</span>;
    }
  };

  const columns: ColumnDef<IDailyQuiz>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'rewardAmount',
      header: 'Reward',
      accessorKey: 'rewardAmount',
      cell: (info) => <span className="text-gold font-bold">₹{info.getValue() as number}</span>,
    },
    {
      id: 'startTime',
      header: 'Start Date',
      accessorKey: 'startTime',
      cell: (info) => <span>{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      id: 'endTime',
      header: 'End Date',
      accessorKey: 'endTime',
      cell: (info) => <span>{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (info) => getStatusBadge(info.getValue() as QuizStatus),
    },
    {
      id: 'participantsCount',
      header: 'Participants',
      accessorKey: 'participantsCount',
      cell: (info) => <span className="font-bold text-white">{info.getValue() as number || 0}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const quiz = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingStats(quiz)}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-gold/20 rounded-lg text-text-muted hover:text-gold cursor-pointer"
              title="View Submission Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(quiz)}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-gold/20 rounded-lg text-text-muted hover:text-white cursor-pointer"
              title="Edit Quiz"
            >
              <Edit className="w-4 h-4" />
            </button>
            {quiz.status === 'expired' && !quiz.winnerId && (
              <button
                onClick={() => handleDraw(quiz)}
                className="p-1.5 hover:bg-gold/10 border border-gold/15 hover:border-gold/30 rounded-lg text-gold cursor-pointer"
                title="Draw Winner"
              >
                <Award className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(quiz._id)}
              className="p-1.5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-lg text-text-muted hover:text-rose-400 cursor-pointer"
              title="Delete Quiz"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">Daily Contests</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage daily quiz parameters and award prizes</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-background stroke-[3]" />
          Create Daily Quiz
        </button>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Loading Daily Contests...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={quizzes}
            searchPlaceholder="Search daily contests by title..."
            exportFileName="gyaanchakra-dailyquizzes"
          />
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingQuiz ? 'Modify Daily Quiz' : 'Compose Daily Quiz'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Quiz Title"
              type="text"
              placeholder="e.g. Daily General Knowledge #12"
              error={errors.title?.message}
              {...register('title')}
            />
            <Input
              label="Reward Amount (₹)"
              type="number"
              placeholder="100"
              error={errors.rewardAmount?.message}
              {...register('rewardAmount', { valueAsNumber: true })}
            />
          </div>

          <Textarea
            label="Quiz Question"
            placeholder="Type the daily trivia question..."
            error={errors.question?.message}
            {...register('question')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Option A"
              type="text"
              placeholder="Enter first option"
              error={errors.optionA?.message}
              {...register('optionA')}
            />
            <Input
              label="Option B"
              type="text"
              placeholder="Enter second option"
              error={errors.optionB?.message}
              {...register('optionB')}
            />
            <Input
              label="Option C"
              type="text"
              placeholder="Enter third option"
              error={errors.optionC?.message}
              {...register('optionC')}
            />
            <Input
              label="Option D"
              type="text"
              placeholder="Enter fourth option"
              error={errors.optionD?.message}
              {...register('optionD')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Correct Option"
              error={errors.correctAnswerIndex?.message}
              options={[
                { label: 'Option A', value: 0 },
                { label: 'Option B', value: 1 },
                { label: 'Option C', value: 2 },
                { label: 'Option D', value: 3 },
              ]}
              {...register('correctAnswerIndex', { valueAsNumber: true })}
            />
            <Input
              label="Start Datetime"
              type="datetime-local"
              error={errors.startTime?.message}
              {...register('startTime')}
            />
            <Input
              label="End Datetime"
              type="datetime-local"
              error={errors.endTime?.message}
              {...register('endTime')}
            />
          </div>

          <Select
            label="Publish Status"
            error={errors.status?.message}
            options={[
              { label: 'Draft (Saves configuration)', value: 'draft' },
              { label: 'Scheduled (Awaiting start time)', value: 'scheduled' },
              { label: 'Active (Live for submissions)', value: 'active' },
              { label: 'Expired (Bidding closed)', value: 'expired' },
              { label: 'Completed (Draw complete)', value: 'completed' },
            ]}
            {...register('status')}
          />

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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
              )}
              {editingQuiz ? 'Save Changes' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Stats View Dialog */}
      <Dialog
        isOpen={!!viewingStats}
        onClose={() => setViewingStats(null)}
        title="Contest Submissions & Statistics"
        size="md"
      >
        {viewingStats && (
          <div className="space-y-6">
            <div className="p-4 bg-background/50 rounded-xl border border-white/5">
              <span className="text-xxs font-bold text-gold uppercase tracking-wider">Trivia Question</span>
              <p className="text-sm font-semibold text-white mt-1">{viewingStats.question}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                <span className="block text-xxs font-bold text-text-muted uppercase tracking-wider">Total Submissions</span>
                <span className="block text-2xl font-black text-white mt-1">
                  {viewingStats.participantsCount || 0}
                </span>
              </div>
              <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                <span className="block text-xxs font-bold text-text-muted uppercase tracking-wider">Correct Answers</span>
                <span className="block text-2xl font-black text-emerald-400 mt-1">
                  {viewingStats.correctAnswersCount || 0}
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-gold uppercase tracking-wider">Incorrect vs Correct Answer Ratio</h4>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${
                      viewingStats.participantsCount
                        ? (viewingStats.correctAnswersCount / viewingStats.participantsCount) * 100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${
                      viewingStats.participantsCount
                        ? ((viewingStats.participantsCount - viewingStats.correctAnswersCount) /
                            viewingStats.participantsCount) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xxs text-text-muted">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full"/> Correct answers ({
                  viewingStats.participantsCount 
                    ? Math.round((viewingStats.correctAnswersCount / viewingStats.participantsCount) * 100)
                    : 0
                }%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full"/> Incorrect answers ({
                  viewingStats.participantsCount
                    ? Math.round(((viewingStats.participantsCount - viewingStats.correctAnswersCount) / viewingStats.participantsCount) * 100)
                    : 0
                }%)</span>
              </div>
            </div>

            {viewingStats.winnerId && (
              <div className="p-4 bg-gold/5 border border-gold/25 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-lg text-gold"><Trophy className="w-5 h-5"/></div>
                <div>
                  <span className="block text-xxs font-bold text-gold uppercase tracking-widest leading-none">Winner Selected</span>
                  <span className="block text-sm font-semibold text-white mt-1">
                    {typeof viewingStats.winnerId === 'object' ? (viewingStats.winnerId as any).name : 'Selected User'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setViewingStats(null)}
                className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Draw Confirmation Dialog */}
      <Dialog
        isOpen={!!drawingQuiz}
        onClose={() => setDrawingQuiz(null)}
        title="Execute Cryptographically Fair Draw"
        size="sm"
      >
        {drawingQuiz && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs leading-tight font-semibold">
                This action is irreversible. The draw will perform a fair random selection from all users who submitted the correct index.
              </p>
            </div>

            <div className="space-y-2 text-xs text-text-muted">
              <div><strong className="text-white">Contest:</strong> {drawingQuiz.title}</div>
              <div><strong className="text-white">Eligible Pool:</strong> {drawingQuiz.correctAnswersCount} correct participant(s)</div>
              <div><strong className="text-white">Prize Money:</strong> ₹{drawingQuiz.rewardAmount}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setDrawingQuiz(null)}
                className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDraw}
                disabled={drawMutation.isPending}
                className="px-5 py-2 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {drawMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                    Executing Draw...
                  </>
                ) : (
                  'Confirm & Credit Reward'
                )}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default DailyQuiz;
