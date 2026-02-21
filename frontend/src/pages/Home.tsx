import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, GitBranch, Target, BarChart3, Zap } from 'lucide-react';
import { AppBackground } from '@/components/ui/app-background';
import { Navbar } from '@/components/ui/navbar';

export const Home = () => {
  const features = [
    {
      icon: Zap,
      title: 'Automate A/B Tests',
      description: 'Run experiments automatically. No manual setup—define variants and let the agent orchestrate everything.',
    },
    {
      icon: GitBranch,
      title: 'Auto PR on Winner',
      description: 'When a variant wins, we automatically open a PR with the winning changes. Ship faster.',
    },
    {
      icon: BarChart3,
      title: 'Gather Data You Want',
      description: 'Define custom metrics and events. Collect exactly the data you need to make decisions.',
    },
    {
      icon: Target,
      title: 'Define Goals',
      description: 'Set clear success criteria. The system evaluates results against your goals and declares winners.',
    },
  ];

  return (
    <AppBackground>
      <Navbar
        brandIcon={<Terminal className="w-4 h-4 text-white" />}
        status={{ label: 'System Active' }}
        links={[
          { href: '/login', label: 'Sign In' },
          { href: '/signup', label: 'Get Started', variant: 'primary' },
        ]}
      />

      <main className="flex-1 relative z-20 flex flex-col items-center justify-center p-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow mb-6">
              Agentic A/B Testing
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
              A/B Tests, <br />
              <span className="italic text-primary-glow">Automated</span>
            </h1>
            <p className="font-display text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mt-6 font-light">
              Automate experiments, auto-PR winners, gather the data you need. Define your goals and let the agent run.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
          >
            <Link to="/signup">
              <button className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-glow text-white font-mono font-bold rounded glow-button flex items-center justify-center gap-2 transition-all">
                Get Started
              </button>
            </Link>
            <Link to="/login">
              <button className="w-full sm:w-auto px-8 py-3 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white font-mono font-bold rounded transition-all">
                Sign In
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="group glass-panel rounded-xl p-6 text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary-glow group-hover:bg-primary/30 transition-colors">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white font-display">{feature.title}</h3>
                </div>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </AppBackground>
  );
};
