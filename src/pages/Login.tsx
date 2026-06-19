import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/shared/FormComponents';
import { Trophy, ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = zod.object({
  mobile: zod
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number too long'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchemaType = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginSchemaType) => {
    setSubmitting(true);
    try {
      await login(values);
      showToast('Logged in successfully', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gold/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gold/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-background-card border border-gold/10 p-8 rounded-2xl shadow-2xl glass-panel relative z-10"
      >
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gold-gradient-bg flex items-center justify-center shadow-lg shadow-gold/20 mb-4">
            <Trophy className="w-8 h-8 text-background" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider leading-none text-white text-center">
            Gyaan Chakra
          </h2>
          <span className="text-xs text-gold font-bold tracking-widest uppercase mt-2">
            Administrator Center
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Mobile Number"
            type="text"
            placeholder="Enter mobile number"
            error={errors.mobile?.message}
            {...register('mobile')}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-gold hover:text-gold-light hover:underline transition-colors mt-1"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl gold-gradient-bg hover:opacity-90 active:scale-[0.98] text-background font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-gold/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-background" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 flex gap-2 items-center justify-center p-3 bg-gold/5 rounded-xl border border-gold/10">
          <ShieldAlert className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="text-xxs text-text-muted leading-tight">
            Only registered ADMIN and SUPER_ADMIN roles are authorized to access this control system.
          </span>
        </div>
      </motion.div>
    </div>
  );
};
