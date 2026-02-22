import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { useAuth } from '@/contexts/AuthContext';
import { FormInput } from '@/components/FormInput';
import { AppBackground } from '@/components/ui/app-background';
import { GlassPanel } from '@/components/ui/glass-panel';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
    <AppBackground>
      {/* Nav */}
      <Navbar
        brandIcon={<Terminal className="w-4 h-4 text-white" />}
      />

      {/* Main */}
      <main className="flex-1 relative z-20 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 order-2 lg:order-1"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow mb-4">
                Registration
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                Create <br />
                <span className="italic text-primary-glow">Account</span>
              </h1>
              <p className="font-display text-slate-400 max-w-md text-base md:text-lg font-light leading-relaxed pt-2">
                Join to automate A/B tests, define goals, gather data, and auto-PR winners to your repo.
              </p>
            </div>
            <div className="space-y-4 pt-4 border-l border-white/10 pl-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                  Fields
                </span>
                <span className="text-sm text-slate-300">Optional username</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                  Sign-In
                </span>
                <span className="text-sm text-slate-300">Email</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Form in glass panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="order-1 lg:order-2 w-full flex justify-center lg:justify-end"
          >
            <GlassPanel title="auth — signup" className="w-full max-w-md">
              <div className="p-6 md:p-8 space-y-6 font-mono text-sm relative">
                <div className="bg-black/20 rounded-lg border border-white/5 p-6 flex flex-col gap-4">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormInput
                      label="Username (Optional)"
                      type="text"
                      placeholder="johndoe"
                      error={errors.username?.message}
                      className="bg-black/30 border-white/5 placeholder:text-slate-600 font-mono text-sm"
                      {...register('username')}
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email?.message}
                      className="bg-black/30 border-white/5 placeholder:text-slate-600 font-mono text-sm"
                      {...register('email')}
                    />
                    <FormInput
                      label="Password"
                      type="password"
                      placeholder="At least 6 characters"
                      error={errors.password?.message}
                      className="bg-black/30 border-white/5 placeholder:text-slate-600 font-mono text-sm"
                      {...register('password')}
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full mt-2 bg-primary hover:bg-primary-glow text-white font-mono font-bold py-3 px-6 rounded glow-button flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="flex justify-between items-center text-[10px] uppercase text-slate-600 font-bold tracking-widest pt-2">
                  <span>Connection: Idle</span>
                  <span>Secure</span>
                </div>
                <div className="absolute bottom-4 left-6 h-4 w-2 bg-primary/50 animate-pulse" />
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-glow hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </AppBackground>
  );
};
