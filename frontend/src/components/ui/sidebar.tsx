import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a Sidebar');
  }
  return context;
}

interface SidebarProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
  className?: string;
}

export function Sidebar({
  children,
  open: controlledOpen,
  setOpen: controlledSetOpen,
  animate = true,
  className,
}: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div
        className={cn(
          'group/sidebar relative flex shrink-0 flex-col border-r border-white/5 bg-background-dark/90 backdrop-blur-xl',
          'transition-[width] duration-300 ease-in-out',
          open ? 'w-56 md:w-64' : 'w-[52px] md:w-[56px]',
          className
        )}
        onMouseEnter={() => !controlledOpen && animate && setOpen(true)}
        onMouseLeave={() => !controlledOpen && animate && setOpen(false)}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

interface SidebarBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function SidebarBody({ children, className, ...props }: SidebarBodyProps) {
  return (
    <div
      className={cn('flex flex-1 flex-col overflow-hidden py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarLinkProps {
  link: {
    label: string;
    href?: string;
    icon: React.ReactNode;
  };
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export function SidebarLink({ link, onClick, className, active }: SidebarLinkProps) {
  const { open } = useSidebar();
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-colors cursor-pointer min-h-[40px]',
        'text-slate-400 hover:text-white hover:bg-white/5',
        active && 'bg-primary/20 text-primary-glow',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <span className="flex shrink-0 text-current [&>svg]:h-5 [&>svg]:w-5">{link.icon}</span>
      {open && (
        <span className="font-mono text-sm font-medium truncate overflow-hidden">
          {link.label}
        </span>
      )}
    </div>
  );

  if (link.href && !onClick) {
    return (
      <a href={link.href} className="block">
        {content}
      </a>
    );
  }
  return content;
}
