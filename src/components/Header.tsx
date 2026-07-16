'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, UserCheck } from 'lucide-react';

interface HeaderProps {
  title: string;
  currentUser: {
    nameEn: string;
    role: string;
  } | null;
}

export default function Header({ title, currentUser }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 flex items-center justify-between flex-shrink-0 transition-colors duration-200">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info Capsule */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full border border-slate-200 dark:border-zinc-700/50 text-xs font-semibold text-slate-600 dark:text-zinc-300">
            <UserCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>Logged in as: <strong className="text-slate-800 dark:text-slate-100">{currentUser.nameEn}</strong></span>
          </div>
        )}

        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition-all duration-200 focus:outline-none"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
