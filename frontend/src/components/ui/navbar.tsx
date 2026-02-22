import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface NavLink {
  href: string;
  label: string;
  variant?: 'default' | 'primary';
}

interface NavbarProps {
  brandName?: string;
  brandIcon?: ReactNode;
  status?: { label: string; pulseColor?: string };
  links?: NavLink[];
  className?: string;
}

export const Navbar = ({
  brandName = 'Pryo',
  brandIcon,
  status,
  links = [],
  className,
}: NavbarProps) => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative z-50 flex items-center justify-between px-4 md:px-6 py-2.5 w-full',
        'border-b border-white/5 bg-background-dark/60 backdrop-blur-md',
        className
      )}
    >
      {/* Logo / Brand */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="size-6 bg-white/5 rounded border border-white/10 flex items-center justify-center group-hover:border-primary/30 transition-colors shrink-0 overflow-hidden">
          {brandIcon || (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <span className="font-display font-bold text-sm tracking-tight text-white">
          {brandName}
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4 text-[9px] uppercase font-mono tracking-widest text-slate-500">
        {status && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'size-1.5 rounded-full animate-pulse',
                status.pulseColor || 'bg-emerald-500'
              )}
            />
            <span>{status.label}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'relative py-1 transition-colors hover:text-white',
                link.variant === 'primary' &&
                  'bg-primary hover:bg-primary-glow text-white px-3 py-1.5 rounded text-[10px] font-bold'
              )}
            >
              {link.variant !== 'primary' ? (
                <span className="relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary-glow after:transition-[width] after:duration-200 hover:after:w-full">
                  {link.label}
                </span>
              ) : (
                link.label
              )}
            </Link>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};
