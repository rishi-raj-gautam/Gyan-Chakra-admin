import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { authApi } from '@/services/api/auth.api';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/shared/FormComponents';
import { KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const resetPasswordSchema = zod.object({
  mobile: zod
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number too long'),
  otp: zod.string().min(4, 'OTP must be at least 4 digits').max(8, 'OTP too long'),
  newPassword: zod.string().min(6, 'New password must be at least 6 characters'),
});

type ResetPasswordSchemaType = zod.infer<typeof resetPasswordSchema>;

export const ResetPassword: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  // Read mobile passed from ForgotPassword route state
  const defaultMobile = location.state?.mobile || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      mobile: defaultMobile,
      otp: '',
      newPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordSchemaType) => {
    setSubmitting(true);
    try {
      await authApi.resetPassword(values);
      showToast('Password reset successful. Log in with your new password.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Verification or password reset failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B16] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gold/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-background-card border border-gold/10 p-8 rounded-2xl shadow-2xl glass-panel relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl gold-gradient-bg flex items-center justify-center shadow-lg shadow-gold/20 mb-4">
            <KeyRound className="w-6 h-6 text-background" />
          </div>
          <h2 className="text-xl font-bold tracking-wider leading-none text-white text-center">
            Set New Password
          </h2>
          <span className="text-xxs text-text-muted mt-2 text-center max-w-xs">
            Validate the confirmation OTP code sent to your account and enter your new password.
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Mobile Number"
            type="text"
            placeholder="Confirm mobile number"
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          <Input
            label="Verification OTP"
            type="text"
            placeholder="Enter security OTP"
            error={errors.otp?.message}
            {...register('otp')}
          />

          <Input
            label="New Access Password"
            type="password"
            placeholder="Create strong password (min 6 characters)"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl gold-gradient-bg hover:opacity-90 active:scale-[0.98] text-background font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-gold/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-background" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link
            to="/login"
            className="flex items-center gap-2 text-xs font-semibold text-gold hover:text-gold-light hover:underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Cancel and Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
