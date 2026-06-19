import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { authApi } from '@/services/api/auth.api';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/shared/FormComponents';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const forgotPasswordSchema = zod.object({
  mobile: zod
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number too long'),
});

type ForgotPasswordSchemaType = zod.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordSchemaType) => {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(values);
      showToast('OTP code sent successfully. Check your email or backend logs.', 'success');
      navigate('/reset-password', { state: { mobile: values.mobile } });
    } catch (err: any) {
      showToast(err.message || 'Verification request failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B16] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gold/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-background-card border border-gold/10 p-8 rounded-2xl shadow-2xl glass-panel relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center shadow-lg shadow-gold/20 mb-4">
            <ShieldCheck className="w-6 h-6 text-background" />
          </div>
          <h2 className="text-xl font-bold tracking-wider leading-none text-white text-center">
            Recover Access
          </h2>
          <span className="text-xxs text-text-muted mt-2 text-center max-w-xs">
            Enter your administrative mobile number. We will send an OTP confirmation to your registered account.
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Administrative Mobile"
            type="text"
            placeholder="Enter mobile number"
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl gold-gradient-bg hover:opacity-90 active:scale-[0.98] text-background font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-gold/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-background" />
                Sending OTP...
              </>
            ) : (
              'Send Security OTP'
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs font-semibold text-gold hover:text-gold-light hover:underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
