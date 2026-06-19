import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengeApi } from '@/services/api/challenge.api';
import { questionApi } from '@/services/api/question.api';
import type { MegaChallenge as IMegaChallenge, ChallengeStatus } from '@/types/api.types';
import { Table } from '@/components/shared/Table';
import { Dialog } from '@/components/shared/Dialog';
import { Input, Select, Textarea } from '@/components/shared/FormComponents';
import { useToast } from '@/context/ToastContext';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Award,
  ArrowUp,
  ArrowDown,
  Eye,
  Import,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

const challengeFormSchema = zod.object({
  title: zod.string().min(3, 'Title is required (min 3 chars)'),
  description: zod.string().min(5, 'Description is required (min 5 chars)'),
  rewardAmount: zod.number().min(100, 'Reward amount must be at least ₹100'),
  bannerImage: zod.string().optional(),
  startDate: zod.string().min(1, 'Start date is required'),
  endDate: zod.string().min(1, 'End date is required'),
  status: zod.enum(['draft', 'open', 'closed', 'completed']),
  questions: zod.array(
    zod.object({
      question: zod.string().min(3, 'Question text is required'),
      options: zod.array(zod.string().min(1, 'Option is required')).length(4, 'Must have exactly 4 options'),
      correctAnswerIndex: zod.number().min(0).max(3),
      points: zod.number(),
    })
  ).length(10, 'A Mega Challenge must have exactly 10 questions'),
});

type ChallengeFormSchemaType = zod.infer<typeof challengeFormSchema>;

export const MegaChallenge: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<IMegaChallenge | null>(null);
  const [drawingChallenge, setDrawingChallenge] = useState<IMegaChallenge | null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<IMegaChallenge | null>(null);
  const [importBankOpen, setImportBankOpen] = useState(false);
  const [selectedQuestionIndexForImport, setSelectedQuestionIndexForImport] = useState<number | null>(null);

  // Fetch challenges
  const { data, isLoading } = useQuery({
    queryKey: ['megaChallenges'],
    queryFn: () => challengeApi.getAllChallenges(1, 100),
  });

  const challenges = data?.challenges || [];

  // Fetch question bank for imports
  const { data: questionBank = [] } = useQuery({
    queryKey: ['questionBank'],
    queryFn: questionApi.getQuestionBank,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ChallengeFormSchemaType>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: '',
      description: '',
      rewardAmount: 100000,
      bannerImage: '',
      startDate: '',
      endDate: '',
      status: 'draft',
      questions: Array(10).fill({
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        points: 10,
      }),
    },
  });

  const { fields, move } = useFieldArray({
    control,
    name: 'questions',
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: challengeApi.createChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['megaChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      showToast('Mega challenge created successfully', 'success');
      setIsOpen(false);
      reset();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to create challenge', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, challenge }: { id: string; challenge: Partial<IMegaChallenge> }) =>
      challengeApi.updateChallenge(id, challenge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['megaChallenges'] });
      showToast('Mega challenge updated successfully', 'success');
      setIsOpen(false);
      setEditingChallenge(null);
      reset();
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to update challenge', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: challengeApi.deleteChallenge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['megaChallenges'] });
      showToast('Mega challenge deleted successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to delete challenge', 'error');
    },
  });

  const drawMutation = useMutation({
    mutationFn: challengeApi.drawWinner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['megaChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      showToast('Draw completed! Winner has been credited.', 'success');
      setDrawingChallenge(null);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to draw winner.', 'error');
    },
  });

  const handleOpenCreate = () => {
    setEditingChallenge(null);
    reset({
      title: '',
      description: '',
      rewardAmount: 100000,
      bannerImage: '',
      startDate: '',
      endDate: '',
      status: 'draft',
      questions: Array(10).fill({
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        points: 10,
      }),
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (challenge: IMegaChallenge) => {
    setEditingChallenge(challenge);

    const formatDateTime = (dateStr: string) => {
      const d = new Date(dateStr);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    // Pad questions if less than 10
    const loadedQuestions = [...(challenge.questions || [])];
    while (loadedQuestions.length < 10) {
      loadedQuestions.push({
        question: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        points: 10,
      });
    }

    reset({
      title: challenge.title,
      description: challenge.description,
      rewardAmount: challenge.rewardAmount,
      bannerImage: challenge.bannerImage || '',
      startDate: formatDateTime(challenge.startDate),
      endDate: formatDateTime(challenge.endDate),
      status: challenge.status,
      questions: loadedQuestions,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this Mega Challenge?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleImportFromBank = (index: number) => {
    setSelectedQuestionIndexForImport(index);
    setImportBankOpen(true);
  };

  const handleSelectBankQuestion = (bankQ: any) => {
    if (selectedQuestionIndexForImport !== null) {
      setValue(`questions.${selectedQuestionIndexForImport}.question`, bankQ.question);
      setValue(`questions.${selectedQuestionIndexForImport}.options.0`, bankQ.options[0] || '');
      setValue(`questions.${selectedQuestionIndexForImport}.options.1`, bankQ.options[1] || '');
      setValue(`questions.${selectedQuestionIndexForImport}.options.2`, bankQ.options[2] || '');
      setValue(`questions.${selectedQuestionIndexForImport}.options.3`, bankQ.options[3] || '');
      setValue(`questions.${selectedQuestionIndexForImport}.correctAnswerIndex`, bankQ.correctAnswerIndex);
      
      showToast(`Imported Question #${selectedQuestionIndexForImport + 1}`, 'success');
      setImportBankOpen(false);
      setSelectedQuestionIndexForImport(null);
    }
  };

  const handleExecuteDraw = () => {
    if (drawingChallenge) {
      drawMutation.mutate(drawingChallenge._id);
    }
  };

  const onSubmit = (values: ChallengeFormSchemaType) => {
    const payload: Partial<IMegaChallenge> = {
      title: values.title,
      description: values.description,
      rewardAmount: values.rewardAmount,
      bannerImage: values.bannerImage,
      startDate: new Date(values.startDate).toISOString() as any,
      endDate: new Date(values.endDate).toISOString() as any,
      status: values.status as any,
      questions: values.questions,
    };

    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge._id, challenge: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getStatusBadge = (status: ChallengeStatus) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase">Open</span>;
      case 'closed':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md uppercase">Closed</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-xxs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md uppercase">Completed</span>;
      case 'draft':
      default:
        return <span className="px-2 py-0.5 text-xxs font-bold bg-white/5 text-text-muted border border-white/10 rounded-md uppercase">Draft</span>;
    }
  };

  const columns: ColumnDef<IMegaChallenge>[] = [
    {
      id: 'title',
      header: 'Title',
      accessorKey: 'title',
      cell: (info) => <span className="font-semibold text-white">{info.getValue() as string}</span>,
    },
    {
      id: 'rewardAmount',
      header: 'Reward Pool',
      accessorKey: 'rewardAmount',
      cell: (info) => <span className="text-gold font-bold">₹{Number(info.getValue() as number).toLocaleString()}</span>,
    },
    {
      id: 'startDate',
      header: 'Start Date',
      accessorKey: 'startDate',
      cell: (info) => <span>{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      id: 'endDate',
      header: 'End Date',
      accessorKey: 'endDate',
      cell: (info) => <span>{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: (info) => getStatusBadge(info.getValue() as ChallengeStatus),
    },
    {
      id: 'totalParticipants',
      header: 'Participants',
      accessorKey: 'totalParticipants',
      cell: (info) => <span className="font-bold text-white">{info.getValue() as number || 0}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const challenge = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewingQuestions(challenge)}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-gold/20 rounded-lg text-text-muted hover:text-gold cursor-pointer"
              title="Inspect Questions"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(challenge)}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-gold/20 rounded-lg text-text-muted hover:text-white cursor-pointer"
              title="Edit Challenge"
            >
              <Edit className="w-4 h-4" />
            </button>
            {challenge.status === 'closed' && (
              <button
                onClick={() => setDrawingChallenge(challenge)}
                className="p-1.5 hover:bg-gold/10 border border-gold/15 hover:border-gold/30 rounded-lg text-gold cursor-pointer"
                title="Select Winner Draw"
              >
                <Award className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(challenge._id)}
              className="p-1.5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-lg text-text-muted hover:text-rose-400 cursor-pointer"
              title="Delete Challenge"
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">Mega Challenges</h2>
          <p className="text-xs text-text-muted mt-0.5">Define multi-stage quizzes, manage shortlist, and run draws</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-background stroke-[3]" />
          Create Mega Challenge
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Fetching Mega Challenges...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={challenges}
            searchPlaceholder="Search challenges by title..."
            exportFileName="gyaanchakra-megachallenges"
          />
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingChallenge ? 'Modify Mega Challenge' : 'Assemble Mega Challenge'}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gold uppercase tracking-wider border-b border-white/5 pb-2">Challenge Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Challenge Title"
                type="text"
                placeholder="e.g. Mega Independence Day Challenge"
                error={errors.title?.message}
                {...register('title')}
              />
              <Input
                label="Reward Pool (₹)"
                type="number"
                placeholder="100000"
                error={errors.rewardAmount?.message}
                {...register('rewardAmount', { valueAsNumber: true })}
              />
              <Input
                label="Banner Image URL"
                type="text"
                placeholder="https://image-bucket/banner.jpg"
                error={errors.bannerImage?.message}
                {...register('bannerImage')}
              />
            </div>

            <Textarea
              label="Description & Instructions"
              placeholder="Detail the entry requirements, topics covered, and structure..."
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Opening Datetime"
                type="datetime-local"
                error={errors.startDate?.message}
                {...register('startDate')}
              />
              <Input
                label="Closing Datetime"
                type="datetime-local"
                error={errors.endDate?.message}
                {...register('endDate')}
              />
              <Select
                label="Publish Status"
                error={errors.status?.message}
                options={[
                  { label: 'Draft (Setup mode)', value: 'draft' },
                  { label: 'Open (Live for entries)', value: 'open' },
                  { label: 'Closed (Awaiting draw)', value: 'closed' },
                  { label: 'Completed (Draw complete)', value: 'completed' },
                ]}
                {...register('status')}
              />
            </div>
          </div>

          {/* Questions array */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold text-gold uppercase tracking-wider">
                Mega Challenge Questions (Exactly 10 Required)
              </h3>
              {errors.questions?.message && (
                <span className="text-xs font-bold text-rose-500">{errors.questions?.message}</span>
              )}
            </div>

            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-5 bg-background/50 rounded-2xl border border-white/5 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold tracking-wide">
                      Question #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleImportFromBank(idx)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold rounded-lg text-xxs font-bold cursor-pointer"
                      >
                        <Import className="w-3 h-3" />
                        Import
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => move(idx, idx - 1)}
                        className="p-1 hover:bg-white/5 rounded text-text-muted disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === 9}
                        onClick={() => move(idx, idx + 1)}
                        className="p-1 hover:bg-white/5 rounded text-text-muted disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Input
                    placeholder="Enter question text..."
                    error={errors.questions?.[idx]?.question?.message}
                    {...register(`questions.${idx}.question`)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Option A"
                      placeholder="Option 1"
                      error={errors.questions?.[idx]?.options?.[0]?.message}
                      {...register(`questions.${idx}.options.0`)}
                    />
                    <Input
                      label="Option B"
                      placeholder="Option 2"
                      error={errors.questions?.[idx]?.options?.[1]?.message}
                      {...register(`questions.${idx}.options.1`)}
                    />
                    <Input
                      label="Option C"
                      placeholder="Option 3"
                      error={errors.questions?.[idx]?.options?.[2]?.message}
                      {...register(`questions.${idx}.options.2`)}
                    />
                    <Input
                      label="Option D"
                      placeholder="Option 4"
                      error={errors.questions?.[idx]?.options?.[3]?.message}
                      {...register(`questions.${idx}.options.3`)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Correct Answer Index"
                      error={errors.questions?.[idx]?.correctAnswerIndex?.message}
                      options={[
                        { label: 'Option A (0)', value: 0 },
                        { label: 'Option B (1)', value: 1 },
                        { label: 'Option C (2)', value: 2 },
                        { label: 'Option D (3)', value: 3 },
                      ]}
                      {...register(`questions.${idx}.correctAnswerIndex`, { valueAsNumber: true })}
                    />
                    <Input
                      label="Points Allocation"
                      type="number"
                      error={errors.questions?.[idx]?.points?.message}
                      {...register(`questions.${idx}.points`, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              ))}
            </div>
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
              )}
              {editingChallenge ? 'Save Changes' : 'Publish Challenge'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Question Inspect View */}
      <Dialog
        isOpen={!!viewingQuestions}
        onClose={() => setViewingQuestions(null)}
        title="Mega Challenge Question Board"
        size="lg"
      >
        {viewingQuestions && (
          <div className="space-y-6">
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {viewingQuestions.questions?.map((q, idx) => (
                <div key={idx} className="p-4 bg-background/50 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold">Question #{idx + 1}</span>
                    <span className="text-xxs text-text-muted uppercase tracking-wider">{q.points || 10} Points</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{q.question}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border ${
                          oIdx === q.correctAnswerIndex
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-semibold'
                            : 'bg-white/2 border-white/5 text-text-muted'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setViewingQuestions(null)}
                className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Draw Confirmation */}
      <Dialog
        isOpen={!!drawingChallenge}
        onClose={() => setDrawingChallenge(null)}
        title="Select Mega Challenge Winners"
        size="sm"
      >
        {drawingChallenge && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
              <Award className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs leading-tight font-semibold">
                Executing this draw selects a random winner from the shortlisted players (players who scored perfectly or qualified).
              </p>
            </div>

            <div className="space-y-2 text-xs text-text-muted">
              <div><strong className="text-white">Challenge:</strong> {drawingChallenge.title}</div>
              <div><strong className="text-white">Shortlisted Pool:</strong> {drawingChallenge.shortlistedCount} participant(s)</div>
              <div><strong className="text-white">Reward Amount:</strong> ₹{Number(drawingChallenge.rewardAmount).toLocaleString()}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setDrawingChallenge(null)}
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
                  'Trigger Mega Draw'
                )}
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Question Bank Import Selector Dialog */}
      <Dialog
        isOpen={importBankOpen}
        onClose={() => {
          setImportBankOpen(false);
          setSelectedQuestionIndexForImport(null);
        }}
        title="Select Question from Bank"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">Select an MCQ question from the bank to populate Question #{selectedQuestionIndexForImport !== null ? selectedQuestionIndexForImport + 1 : ''}.</p>
          
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {questionBank.length > 0 ? (
              questionBank.map((bankQ) => (
                <div
                  key={bankQ.id}
                  onClick={() => handleSelectBankQuestion(bankQ)}
                  className="p-3 bg-background/50 hover:bg-gold/5 border border-white/5 hover:border-gold/30 rounded-xl cursor-pointer transition-all duration-150 space-y-2 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xxs font-bold text-gold uppercase tracking-wider">{bankQ.category} | {bankQ.difficulty}</span>
                    <span className="text-xxs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">Click to import</span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{bankQ.question}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                Question Bank is empty. Add questions to the bank first.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={() => {
                setImportBankOpen(false);
                setSelectedQuestionIndexForImport(null);
              }}
              className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
export default MegaChallenge;
