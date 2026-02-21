import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Check, ArrowRight } from 'lucide-react';
import { AppBackground } from '@/components/ui/app-background';
import { Navbar } from '@/components/ui/navbar';
import { GlareCard } from '@/components/ui/glare-card';
import { MovingBorder } from '@/components/ui/moving-border';

const features = [
  { label: 'Architecture', text: 'AI-driven generative UI/UX' },
  { label: 'Logic', text: 'Real-time Bayesian statistical optimization' },
  { label: 'Infrastructure', text: 'Zero-latency edge delivery' },
  { label: 'Algorithm', text: 'Multi-armed bandit A/B testing' },
];

const logLines = [
  { time: '14:02:45', type: 'info', color: 'text-blue-400', msg: 'Injecting variant CSS...' },
  { time: '14:02:46', type: 'opt', color: 'text-purple-400', msg: 'Recalculating layout shift (CLS: 0.02)' },
  { time: '14:02:47', type: 'succ', color: 'text-emerald-400', msg: 'DOM mutation complete. Node #442 updated.' },
  { time: '14:02:48', type: 'info', color: 'text-blue-400', msg: "Tracking event: 'view_variant_b'" },
];

export const Home = () => {
  return (
    <AppBackground>
      <Navbar
        brandIcon={<Terminal className="w-3 h-3 text-white" />}
        links={[
          { href: '/login', label: 'Sign In' },
          { href: '/signup', label: 'Get Started', variant: 'primary' },
        ]}
      />

      <main className="flex-1 relative z-20 flex flex-col md:flex-row min-h-0 w-full overflow-hidden">
        {/* Left: Copy */}
        <section className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-8 md:py-12 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Agentic A/B Testing
            </div>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-white">
              A/B Tests. <br />
              <span className="italic text-primary-glow">Fully Automated</span>
            </h1>
            <div className="space-y-5 pt-2">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-4"
                >
                  <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">{f.label}</p>
                    <p className="text-base md:text-lg font-medium text-slate-200">{f.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6">
              <Link to="/signup">
                <button className="bg-primary hover:bg-primary-glow text-white px-8 py-4 rounded-lg font-bold text-base transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 glow-button">
                  Get Started
                </button>
              </Link>
              <Link to="/login" className="group flex items-center gap-2 font-bold text-slate-300 hover:text-primary-glow transition-colors">
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Right: Vibe-style visual */}
        <section className="w-full md:w-1/2 relative bg-[#121118] overflow-hidden flex items-center justify-center p-4 md:p-6 min-h-[50vh] md:min-h-0">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 w-full max-w-2xl max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">Live Optimizing • Variant 1/3</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="glass-panel-vibe px-3 py-1.5 rounded flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-serif italic">Confidence</span>
                  <span className="text-xs font-bold text-white font-mono">98.4%</span>
                </div>
                <div className="glass-panel-vibe px-3 py-1.5 rounded flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-serif italic">Traffic</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">65%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-56 md:h-64 mb-4">
              {/* Original card - GlareCard for Linear-style hover */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="h-full"
              >
                <GlareCard className="h-full p-1 group" glareColor="rgba(255,255,255,0.05)">
                  <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[8px] uppercase tracking-widest text-slate-400">
                    Original
                  </div>
                  <div className="h-full w-full bg-slate-800/50 rounded flex flex-col gap-2 p-4 opacity-50 grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100">
                    <div className="h-2 w-1/3 bg-slate-600 rounded-full mb-3" />
                    <div className="h-16 w-full bg-slate-700/50 rounded mb-2" />
                    <div className="flex gap-2">
                      <div className="h-16 flex-1 bg-slate-700/30 rounded" />
                      <div className="h-16 flex-1 bg-slate-700/30 rounded" />
                    </div>
                  </div>
                </GlareCard>
              </motion.div>

              {/* AI Variant card - MovingBorder for gradient glow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="h-full"
              >
                <MovingBorder className="h-full" innerClassName="bg-[#121118] shadow-[0_0_20px_-5px_rgba(109,40,217,0.3)]">
                  <div className="relative h-full rounded-lg overflow-hidden">
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-primary/90 backdrop-blur rounded text-[8px] uppercase tracking-widest text-white font-bold shadow-lg">
                      AI Variant
                    </div>
                    <div className="h-full w-full bg-[#1a1825] rounded flex flex-col gap-3 p-4 relative">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full pointer-events-none" />
                      <div className="h-3 w-1/2 bg-white/20 rounded-full mb-2" />
                      <div className="h-2 w-3/4 bg-white/10 rounded-full mb-3" />
                      <div className="flex-1 w-full bg-gradient-to-br from-primary/10 to-transparent rounded border border-white/5 p-3 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          <span className="text-[9px] text-emerald-400 font-mono">+14.2% Conv.</span>
                        </div>
                        <div className="h-7 w-full bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded shadow-lg shadow-primary/20">
                          Start Now
                        </div>
                      </div>
                    </div>
                  </div>
                </MovingBorder>
              </motion.div>
            </div>

            {/* Terminal log */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="glass-panel-vibe rounded-lg p-0 font-mono text-[10px] leading-relaxed text-slate-400 relative overflow-hidden"
            >
              <div className="h-8 flex items-center px-3 border-b border-white/5 bg-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                <span className="ml-3 text-slate-500 text-[10px]">live_stream.log</span>
              </div>
              <div className="p-3 space-y-1 h-24 overflow-hidden">
                {logLines.map((line, i) => (
                  <div key={i} className={`flex gap-2 ${i >= 2 ? 'opacity-70' : ''} ${i >= 3 ? 'opacity-50' : ''}`}>
                    <span className="text-slate-600 shrink-0">{line.time}</span>
                    <span className={`shrink-0 ${line.color}`}>{line.type}</span>
                    <span className="text-slate-300 truncate">{line.msg}</span>
                  </div>
                ))}
                <div className="flex gap-2 opacity-40 items-center overflow-hidden">
                  <span className="text-slate-600 shrink-0">14:02:48</span>
                  <span className="text-slate-500 shrink-0">...</span>
                  <span className="w-0 animate-code-typing overflow-hidden inline-block align-bottom whitespace-nowrap border-r-2 border-primary pr-0.5">
                    Analyzing user interaction heatmaps...
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </AppBackground>
  );
};
