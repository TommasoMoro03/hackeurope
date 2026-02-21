import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { MovingBorder } from '@/components/ui/moving-border';
import { Zap, Shield, Globe } from 'lucide-react';

export const Home = () => {
  const features = [
    {
      icon: Zap,
      title: 'Fast & Modern',
      description: 'Built with the latest technologies for optimal performance and seamless experimentation.',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'JWT authentication with Google OAuth integration. Your data stays protected.',
    },
    {
      icon: Globe,
      title: 'Easy to Deploy',
      description: 'Docker-ready for seamless deployment anywhere. Scale with confidence.',
    },
  ];

  return (
    <AuroraBackground className="min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-clip-text">
              Analytics & Experimentation
            </h1>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
              Create, simulate, and manage AI-driven workflows visually. 
              Sign up to get started or login to continue.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/signup">
              <MovingBorder className="inline-block">
                <button className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors">
                  Get Started
                </button>
              </MovingBorder>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3 border border-zinc-600 hover:border-violet-500 text-zinc-300 hover:text-white font-medium rounded-lg transition-all">
                Sign In
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                className="group relative rounded-2xl border border-zinc-700/50 bg-zinc-900/50 p-6 backdrop-blur-sm hover:border-violet-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30 transition-colors">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
};
