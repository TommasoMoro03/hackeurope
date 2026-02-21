'use client';

import React, { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import {
  IconLogout,
  IconCode,
  IconFileText,
  IconSettings,
  IconBrandGithub,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const iconClass = 'h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200';

const sidebarLinks = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <IconCode className={iconClass} />,
  },
  {
    label: 'Repositories',
    href: '/',
    icon: <IconFileText className={iconClass} />,
  },
  {
    label: 'Settings',
    href: '#',
    icon: <IconSettings className={iconClass} />,
  },
];

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {sidebarLinks.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </div>
        </div>
        <div>
          {status === 'loading' ? (
            <div className="h-10 flex items-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : session ? (
            <div className="space-y-2">
              <SidebarLink
                link={{
                  label: session.user?.name || session.user?.email || 'User',
                  href: '#',
                  icon: (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User'} />
                      <AvatarFallback className="text-xs">
                        {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ),
                }}
              />
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => signOut()}
              >
                <IconLogout className="h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => signIn('github')}
            >
              <IconBrandGithub className="h-4 w-4" />
              <span>Sign in with GitHub</span>
            </Button>
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

function Logo() {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        GitHub AI
      </motion.span>
    </a>
  );
}

function LogoIcon() {
  return (
    <a
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
}
