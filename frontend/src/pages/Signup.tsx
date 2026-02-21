import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/FormInput';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { MovingBorder } from '@/components/ui/moving-border';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  username: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const Signup = () => {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await signup(data);
    } catch {
      // Error handled by toast in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuroraBackground className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">Create account</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Sign up to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormInput
              label="Full Name (Optional)"
              type="text"
              placeholder="John Doe"
              error={errors.full_name?.message}
              className="bg-zinc-800/50 placeholder:text-zinc-500"
              {...register('full_name')}
            />

            <FormInput
              label="Username (Optional)"
              type="text"
              placeholder="johndoe"
              error={errors.username?.message}
              className="bg-zinc-800/50 placeholder:text-zinc-500"
              {...register('username')}
            />

            <FormInput
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              className="bg-zinc-800/50 placeholder:text-zinc-500"
              {...register('email')}
            />

            <FormInput
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              className="bg-zinc-800/50 placeholder:text-zinc-500"
              {...register('password')}
            />

            <MovingBorder>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 font-medium text-white hover:bg-violet-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </MovingBorder>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-zinc-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleLoginButton />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
};
