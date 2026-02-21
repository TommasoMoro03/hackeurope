import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, Plus, Github, LogOut } from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';

interface Project {
  id: number;
  name: string;
  full_name: string;
  stars_count: number;
  is_private: boolean;
}

type ExperimentItem = { id: number; name: string; status: string };

interface DashboardSidebarProps<T extends ExperimentItem = ExperimentItem> {
  project: Project;
  experiments: T[];
  selectedExperiment: T | null;
  user: { username?: string; email?: string } | null;
  onSelectExperiment: (exp: T | null) => void;
  onToggleRepoPopup: () => void;
  onLogout: () => void;
}

export function DashboardSidebar<T extends ExperimentItem = ExperimentItem>({
  project,
  experiments,
  selectedExperiment,
  user,
  onSelectExperiment,
  onToggleRepoPopup,
  onLogout,
}: DashboardSidebarProps<T>) {
  return (
    <Sidebar open={undefined} setOpen={undefined} animate={true}>
      <SidebarBody className="justify-between gap-6">
        <DashboardSidebarContent
          project={project}
          experiments={experiments}
          selectedExperiment={selectedExperiment}
          user={user}
          onSelectExperiment={onSelectExperiment}
          onToggleRepoPopup={onToggleRepoPopup}
          onLogout={onLogout}
        />
      </SidebarBody>
    </Sidebar>
  );
}

function DashboardSidebarContent<T extends ExperimentItem>({
  project,
  experiments,
  selectedExperiment,
  user,
  onSelectExperiment,
  onToggleRepoPopup,
  onLogout,
}: DashboardSidebarProps<T>) {
  const { open } = useSidebar();

  return (
    <>
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {/* Logo */}
          <div className="px-3 pb-4">
            <Link
              to="/"
              className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal text-white"
            >
              <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-primary to-primary-glow" />
              {open && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-display font-bold whitespace-pre text-white"
                >
                  A/B Lab
                </motion.span>
              )}
            </Link>
          </div>

          {/* New experiment */}
          <SidebarLink
            link={{
              label: 'New experiment',
              icon: <Plus className="h-5 w-5 shrink-0" />,
            }}
            onClick={() => onSelectExperiment(null)}
            active={!selectedExperiment}
          />

          {/* Experiments section */}
          <div className="mt-2 flex flex-col gap-1">
            {open && (
              <div className="px-3 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Experiments
                </span>
              </div>
            )}
            {experiments.length === 0 && open && (
              <div className="px-5 py-2 text-xs text-slate-500">No experiments yet</div>
            )}
            {experiments.map((exp) => (
              <SidebarLink
                key={exp.id}
                link={{
                  label: exp.name,
                  icon: <FlaskConical className="h-4 w-4 shrink-0" />,
                }}
                onClick={() => onSelectExperiment(exp)}
                active={selectedExperiment?.id === exp.id}
              />
            ))}
          </div>

        </div>

        {/* Bottom: Repo + User + Logout */}
        <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
          <SidebarLink
            link={{
              label: project.name,
              icon: <Github className="h-4 w-4 shrink-0" />,
            }}
            onClick={onToggleRepoPopup}
          />
          {open && (
            <div className="px-5 py-2">
              <span className="text-[10px] text-slate-500 truncate block">
                {user?.username || user?.email}
              </span>
            </div>
          )}
          <SidebarLink
            link={{
              label: 'Logout',
              icon: <LogOut className="h-4 w-4 shrink-0" />,
            }}
            onClick={onLogout}
          />
        </div>
    </>
  );
}
