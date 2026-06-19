import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '@/services/api/question.api';
import type { BankQuestion } from '@/services/api/question.api';
import { Table } from '@/components/shared/Table';
import { Dialog } from '@/components/shared/Dialog';
import { Input, Select, Textarea } from '@/components/shared/FormComponents';
import { useToast } from '@/context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Loader2,
  FileDown,
  AlertCircle,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const questionFormSchema = zod.object({
  question: zod.string().min(5, 'Question text is required (min 5 chars)'),
  optionA: zod.string().min(1, 'Option A is required'),
  optionB: zod.string().min(1, 'Option B is required'),
  optionC: zod.string().min(1, 'Option C is required'),
  optionD: zod.string().min(1, 'Option D is required'),
  correctAnswerIndex: zod.number().min(0).max(3),
  category: zod.string().min(2, 'Category is required'),
  difficulty: zod.enum(['easy', 'medium', 'hard']),
  tags: zod.string().optional(),
  type: zod.enum(['MCQ', 'image', 'video']),
  mediaUrl: zod.string().url('Invalid URL format').or(zod.string().length(0)).optional(),
});

type QuestionFormSchemaType = zod.infer<typeof questionFormSchema>;

interface ImportError {
  row: number;
  question: string;
  error: string;
}

export const QuestionBank: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);

  // Bulk Import state
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
  } | null>(null);
  const [parsedValidQuestions, setParsedValidQuestions] = useState<Partial<BankQuestion>[]>([]);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);

  // Fetch Question Bank
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questionBank'],
    queryFn: questionApi.getQuestionBank,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuestionFormSchemaType>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswerIndex: 0,
      category: 'General',
      difficulty: 'medium',
      tags: '',
      type: 'MCQ',
      mediaUrl: '',
    },
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: questionApi.saveQuestionBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionBank'] });
      showToast('Question Bank updated successfully', 'success');
      setIsOpen(false);
      setIsImportOpen(false);
      reset();
      setImportSummary(null);
      setParsedValidQuestions([]);
      setImportErrors([]);
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to save Question Bank', 'error');
    },
  });

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    reset({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswerIndex: 0,
      category: 'General',
      difficulty: 'medium',
      tags: '',
      type: 'MCQ',
      mediaUrl: '',
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (q: BankQuestion) => {
    setEditingQuestion(q);
    reset({
      question: q.question,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      correctAnswerIndex: q.correctAnswerIndex,
      category: q.category,
      difficulty: q.difficulty,
      tags: q.tags.join(', '),
      type: q.type,
      mediaUrl: q.mediaUrl || '',
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updated = questions.filter((q) => q.id !== id);
      saveMutation.mutate(updated);
    }
  };

  const onSubmit = (values: QuestionFormSchemaType) => {
    const payload: BankQuestion = {
      id: editingQuestion ? editingQuestion.id : Math.random().toString(36).substr(2, 9),
      question: values.question,
      options: [values.optionA, values.optionB, values.optionC, values.optionD],
      correctAnswerIndex: values.correctAnswerIndex,
      category: values.category,
      difficulty: values.difficulty,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      type: values.type,
      mediaUrl: values.mediaUrl || undefined,
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
    };

    const updated = editingQuestion
      ? questions.map((q) => (q.id === editingQuestion.id ? payload : q))
      : [payload, ...questions];

    saveMutation.mutate(updated);
  };

  // Bulk parser & validator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => validateParsedData(results.data),
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        validateParsedData(data);
      };
      reader.readAsBinaryString(file);
    } else {
      showToast('Unsupported file format. Please upload CSV or Excel.', 'error');
    }
  };

  const validateParsedData = (rows: any[]) => {
    const valid: Partial<BankQuestion>[] = [];
    const errorsList: ImportError[] = [];
    let duplicateCount = 0;

    rows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const questionText = (row.question || '').trim();
      const optionA = (row.optionA || '').trim();
      const optionB = (row.optionB || '').trim();
      const optionC = (row.optionC || '').trim();
      const optionD = (row.optionD || '').trim();
      const correctIdx = parseInt(row.correctAnswerIndex);
      const category = (row.category || 'General').trim();
      const difficulty = (row.difficulty || 'medium').trim().toLowerCase();
      const type = (row.type || 'MCQ').trim();
      const tagsStr = (row.tags || '').trim();

      // Check fields present
      if (!questionText) {
        errorsList.push({ row: rowNum, question: 'Unknown', error: 'Question text is empty' });
        return;
      }
      if (!optionA || !optionB || !optionC || !optionD) {
        errorsList.push({ row: rowNum, question: questionText, error: 'One or more option columns are empty' });
        return;
      }
      if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) {
        errorsList.push({ row: rowNum, question: questionText, error: 'CorrectAnswerIndex must be an integer between 0 and 3' });
        return;
      }
      if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
        errorsList.push({ row: rowNum, question: questionText, error: "Difficulty must be one of: 'easy', 'medium', 'hard'" });
        return;
      }
      if (type !== 'MCQ' && type !== 'image' && type !== 'video') {
        errorsList.push({ row: rowNum, question: questionText, error: "Type must be one of: 'MCQ', 'image', 'video'" });
        return;
      }

      // Check Duplicates in bank
      const exists = questions.some((q) => q.question.toLowerCase() === questionText.toLowerCase());
      const isParsedDuplicate = valid.some((q) => q.question?.toLowerCase() === questionText.toLowerCase());
      if (exists || isParsedDuplicate) {
        duplicateCount++;
        errorsList.push({ row: rowNum, question: questionText, error: 'Duplicate entry detected in database/import batch' });
        return;
      }

      valid.push({
        id: Math.random().toString(36).substr(2, 9),
        question: questionText,
        options: [optionA, optionB, optionC, optionD],
        correctAnswerIndex: correctIdx,
        category,
        difficulty: difficulty as any,
        tags: tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        type: type as any,
        mediaUrl: row.mediaUrl ? row.mediaUrl.trim() : undefined,
        createdAt: new Date().toISOString(),
      });
    });

    setImportSummary({
      total: rows.length,
      valid: valid.length,
      errors: errorsList.length - duplicateCount,
      duplicates: duplicateCount,
    });
    setParsedValidQuestions(valid);
    setImportErrors(errorsList);
  };

  const handleConfirmImport = () => {
    if (parsedValidQuestions.length === 0) return;
    const merged = [...parsedValidQuestions as BankQuestion[], ...questions];
    saveMutation.mutate(merged);
  };

  const handleDownloadErrorReport = () => {
    if (importErrors.length === 0) return;
    const csv = Papa.unparse(importErrors);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `import-error-report-${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<BankQuestion>[] = [
    {
      id: 'question',
      header: 'Question',
      accessorKey: 'question',
      cell: (info) => <span className="font-semibold text-white whitespace-normal block max-w-md">{info.getValue() as string}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      cell: (info) => <span className="px-2 py-0.5 text-xxs font-semibold bg-white/5 border border-white/10 rounded">{info.getValue() as string}</span>,
    },
    {
      id: 'difficulty',
      header: 'Difficulty',
      accessorKey: 'difficulty',
      cell: (info) => {
        const diff = info.getValue() as string;
        const color = diff === 'easy' ? 'text-emerald-400' : diff === 'medium' ? 'text-amber-400' : 'text-rose-400';
        return <span className={`text-xs font-bold uppercase ${color}`}>{diff}</span>;
      },
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: (info) => <span className="text-xxs font-bold text-gold/80">{info.getValue() as string}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const q = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(q)}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-gold/20 rounded-lg text-text-muted hover:text-white cursor-pointer"
              title="Edit Question"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(q.id)}
              className="p-1.5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 rounded-lg text-text-muted hover:text-rose-400 cursor-pointer"
              title="Delete Question"
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
          <h2 className="text-lg font-bold tracking-wide text-white">Question Repository</h2>
          <p className="text-xs text-text-muted mt-0.5">Manage centralized question bank and perform bulk imports</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gold/15 hover:border-gold/30 bg-background-card hover:bg-background-card/85 text-gold hover:text-gold-light font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Bulk Importer
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-background stroke-[3]" />
            Add Question
          </button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-background-card rounded-2xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <span className="text-xs text-text-muted">Loading repository...</span>
        </div>
      ) : (
        <div className="p-6 bg-background-card border border-white/5 rounded-2xl shadow-xl">
          <Table
            columns={columns}
            data={questions}
            searchPlaceholder="Search question bank..."
            exportFileName="gyaanchakra-questionbank"
          />
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editingQuestion ? 'Modify Question' : 'Compose Bank Question'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Textarea
            label="Question Text"
            placeholder="Type question trivia details..."
            error={errors.question?.message}
            {...register('question')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Option A"
              placeholder="First option value"
              error={errors.optionA?.message}
              {...register('optionA')}
            />
            <Input
              label="Option B"
              placeholder="Second option value"
              error={errors.optionB?.message}
              {...register('optionB')}
            />
            <Input
              label="Option C"
              placeholder="Third option value"
              error={errors.optionC?.message}
              {...register('optionC')}
            />
            <Input
              label="Option D"
              placeholder="Fourth option value"
              error={errors.optionD?.message}
              {...register('optionD')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Correct Option"
              error={errors.correctAnswerIndex?.message}
              options={[
                { label: 'Option A (0)', value: 0 },
                { label: 'Option B (1)', value: 1 },
                { label: 'Option C (2)', value: 2 },
                { label: 'Option D (3)', value: 3 },
              ]}
              {...register('correctAnswerIndex', { valueAsNumber: true })}
            />
            <Input
              label="Category"
              placeholder="e.g. Science, Sports"
              error={errors.category?.message}
              {...register('category')}
            />
            <Select
              label="Difficulty"
              error={errors.difficulty?.message}
              options={[
                { label: 'Easy', value: 'easy' },
                { label: 'Medium', value: 'medium' },
                { label: 'Hard', value: 'hard' },
              ]}
              {...register('difficulty')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Question Type"
              error={errors.type?.message}
              options={[
                { label: 'MCQ Text Only', value: 'MCQ' },
                { label: 'Image-Based Question', value: 'image' },
                { label: 'Video-Based Question', value: 'video' },
              ]}
              {...register('type')}
            />
            <Input
              label="Tags (Comma separated)"
              placeholder="e.g. general, space, hist"
              error={errors.tags?.message}
              {...register('tags')}
            />
            <Input
              label="Media URL (Image/Video)"
              placeholder="https://bucket/img.jpg"
              error={errors.mediaUrl?.message}
              {...register('mediaUrl')}
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
              disabled={saveMutation.isPending}
              className="px-5 py-2 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
              )}
              {editingQuestion ? 'Save Changes' : 'Add to Bank'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Bulk Importer Dialog */}
      <Dialog
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportSummary(null);
          setParsedValidQuestions([]);
          setImportErrors([]);
        }}
        title="Question Bulk Importer"
        size="lg"
      >
        <div className="space-y-6">
          {/* File Picker */}
          {!importSummary ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gold/25 rounded-2xl p-8 flex flex-col items-center justify-center bg-background/30 text-center gap-3">
                <Upload className="w-10 h-10 text-gold" />
                <div className="space-y-1">
                  <span className="block text-sm font-semibold text-white">Upload Question File</span>
                  <span className="block text-xxs text-text-muted">Supports CSV, XLSX, and XLS formats</span>
                </div>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-import-input"
                />
                <label
                  htmlFor="file-import-input"
                  className="px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/20 text-gold text-xs font-bold rounded-xl cursor-pointer mt-2"
                >
                  Choose File
                </label>
              </div>

              {/* Sample format instructions */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-text-muted space-y-2">
                <strong className="text-white text-xs">Standard Import Header Schema:</strong>
                <code className="block p-2 bg-background/50 rounded border border-white/5 leading-relaxed overflow-x-auto text-[10px]">
                  question,optionA,optionB,optionC,optionD,correctAnswerIndex,category,difficulty,type,tags,mediaUrl
                </code>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong className="text-white">correctAnswerIndex:</strong> Integer index (0 = A, 1 = B, 2 = C, 3 = D).</li>
                  <li><strong className="text-white">difficulty:</strong> Must be 'easy', 'medium', or 'hard'.</li>
                  <li><strong className="text-white">type:</strong> Must be 'MCQ', 'image', or 'video'.</li>
                </ul>
              </div>
            </div>
          ) : (
            // Import Summary Panel
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-background/30 rounded-xl border border-white/5 text-center">
                  <span className="block text-xxs font-bold text-text-muted uppercase">Total Rows</span>
                  <span className="block text-2xl font-black text-white mt-1">{importSummary.total}</span>
                </div>
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-center">
                  <span className="block text-xxs font-bold text-emerald-400 uppercase">Valid Rows</span>
                  <span className="block text-2xl font-black text-emerald-400 mt-1">{importSummary.valid}</span>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center">
                  <span className="block text-xxs font-bold text-amber-400 uppercase">Duplicates</span>
                  <span className="block text-2xl font-black text-amber-400 mt-1">{importSummary.duplicates}</span>
                </div>
                <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 text-center">
                  <span className="block text-xxs font-bold text-rose-400 uppercase">Errors</span>
                  <span className="block text-2xl font-black text-rose-400 mt-1">{importSummary.errors}</span>
                </div>
              </div>

              {/* Error messages log */}
              {importErrors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Parsing Errors & Duplicates Logs ({importErrors.length})
                    </h4>
                    <button
                      onClick={handleDownloadErrorReport}
                      className="flex items-center gap-1.5 px-2.5 py-1 border border-rose-500/20 hover:border-rose-500/40 bg-rose-950/20 text-rose-400 rounded-lg text-xxs font-bold cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      Download Error Report
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-rose-500/20 rounded-xl bg-rose-950/5 p-3 space-y-2 text-xxs font-medium text-text-muted">
                    {importErrors.map((err, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-rose-400 font-bold whitespace-nowrap">Row {err.row}:</span>
                        <span className="text-white max-w-sm truncate">"{err.question}"</span>
                        <span className="text-rose-400/80 ml-auto">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setImportSummary(null);
                    setParsedValidQuestions([]);
                    setImportErrors([]);
                  }}
                  className="px-4 py-2 border border-gold/15 hover:border-gold/30 rounded-xl text-xs font-semibold text-text-muted hover:text-white cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={parsedValidQuestions.length === 0 || saveMutation.isPending}
                  className="px-5 py-2 rounded-xl gold-gradient-bg text-background font-extrabold text-xs shadow-lg shadow-gold/10 hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saveMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-background" />
                  )}
                  Import {parsedValidQuestions.length} Valid Question(s)
                </button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
};
export default QuestionBank;
