import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Infinity, Zap, Sparkles, GitBranch, BarChart3, ArrowRight } from 'lucide-react';
import { BackgroundBeams } from '../components/ui/background-beams';
import { Spotlight } from '../components/ui/spotlight';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';

const features = [
  { title: 'Instant Integration', description: 'Start integrating analytics instantly with the press of a button.', icon: <Zap className="size-5" /> },
  { title: 'Automatic Variations', description: 'AI automatically generates and serves test variations.', icon: <Sparkles className="size-5" /> },
  { title: 'Auto PR on Win', description: 'Automatic pull request generated when a winning variation is found.', icon: <GitBranch className="size-5" /> },
  { title: 'Gather Analytics', description: 'Collect actionable insights and measure real conversion lift.', icon: <BarChart3 className="size-5" /> },
  { title: 'Improve Endlessly', description: 'Continuously iterate and optimize your product endlessly.', icon: <Infinity className="size-5" /> },
];

export const Home = () => {
  return (
    <div className="min-h-screen bg-background-dark text-slate-100 overflow-x-hidden selection:bg-accent/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-5 md:px-12 bg-background-dark/80 backdrop-blur-md border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 bg-white rounded-full flex items-center justify-center">
            <Infinity className="text-background-dark size-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Agentic A/B testing</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/signup" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg hover:shadow-xl border border-slate-700">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex flex-col md:flex-row min-h-screen w-full pt-20">
        {/* Left Side - Hero Content */}
        <section className="w-full md:w-5/12 relative flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 bg-background-dark border-r border-slate-800/50 z-10 overflow-hidden">
          <Spotlight className="-top-40 left-0 md:left-32" fill="rgba(75, 43, 238, 0.15)" />

          <div className="max-w-md mx-auto w-full relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-[10px] uppercase tracking-widest font-bold text-slate-400"
            >
              <span className="size-2 rounded-full bg-accent animate-pulse"></span>
              Automated A/B Testing
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="font-serif text-5xl md:text-6xl leading-tight"
            >
              <TextGenerateEffect
                words="Agentic A/B testing"
                className="font-serif !mt-0 text-5xl md:text-6xl [&>div]:!mt-0 [&_span]:text-white"
              />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="text-slate-400 text-lg font-light leading-relaxed"
            >
              Connect GitHub → Select repo → Define test. AI handles the rest. Deploy winning variations as PRs instantly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="pt-4"
            >
              <Link
                to="/signup"
                className="w-full group flex items-center justify-center gap-3 bg-white hover:bg-slate-200 text-background-dark px-8 py-4 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl"
              >
                Integrate Now
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 text-xs uppercase tracking-widest font-semibold">
                <span>Free to start · No credit card</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Right Side - Features / Visuals */}
        <section className="w-full md:w-7/12 relative bg-[#010409] flex flex-col items-center justify-center overflow-hidden min-h-[500px] md:min-h-screen">
          <BackgroundBeams className="bg-[#010409]" />

          {/* Blobs */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-800/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[80px]"></div>
          </div>

          <div className="relative z-10 w-full max-w-xl px-6 py-12 md:py-16 flex flex-col">
            <motion.div 
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Core Value</h2>
              <div className="flex gap-2">
                <span className="size-2 rounded-full bg-slate-700"></span>
                <span className="size-2 rounded-full bg-slate-700"></span>
                <span className="size-2 rounded-full bg-slate-500"></span>
              </div>
            </motion.div>

            <div className="space-y-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 + idx * 0.1 }}
                  className="glass-panel p-5 rounded-2xl flex items-center justify-between group cursor-default transition-all duration-500 hover:translate-y-[-2px] hover:shadow-xl hover:border-slate-700/80"
                >
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 group-hover:text-accent group-hover:scale-110 transition-all duration-500 ease-[0.16,1,0.3,1]">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-accent transition-colors">{feature.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[280px]">{feature.description}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center">
                    <div className="size-8 rounded-full border border-slate-700 flex items-center justify-center bg-slate-900/50 group-hover:bg-accent group-hover:border-accent group-hover:shadow-lg transition-all duration-500">
                      <ArrowRight className="size-3.5 text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
