// Central theme config per role
// Usage: import { useTheme } from '../hooks/useTheme'

import { useAuth } from '../context/AuthContext';

export const themes = {
  super_admin: {
    primary:      'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    primaryText:  'text-amber-500',
    primaryBg:    'bg-amber-50',
    primaryBorder:'border-amber-200',
    primaryRing:  'focus:ring-amber-400/30 focus:border-amber-400',
    badge:        'bg-amber-50 text-amber-700 border-amber-200',
    iconBg:       'bg-amber-50',
    iconColor:    'text-amber-500',
    accent:       '#f59e0b',
    bar:          'bg-amber-500',
  },
  admin: {
    primary:      'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryText:  'text-blue-600',
    primaryBg:    'bg-blue-50',
    primaryBorder:'border-blue-200',
    primaryRing:  'focus:ring-blue-400/30 focus:border-blue-400',
    badge:        'bg-blue-50 text-blue-700 border-blue-200',
    iconBg:       'bg-blue-50',
    iconColor:    'text-blue-600',
    accent:       '#2563eb',
    bar:          'bg-blue-600',
  },
  employee: {
    primary:      'bg-violet-600',
    primaryHover: 'hover:bg-violet-700',
    primaryText:  'text-violet-600',
    primaryBg:    'bg-violet-50',
    primaryBorder:'border-violet-200',
    primaryRing:  'focus:ring-violet-400/30 focus:border-violet-400',
    badge:        'bg-violet-50 text-violet-700 border-violet-200',
    iconBg:       'bg-violet-50',
    iconColor:    'text-violet-600',
    accent:       '#7c3aed',
    bar:          'bg-violet-600',
  },
};

export const useTheme = () => {
  const { user } = useAuth();
  return themes[user?.role] || themes.employee;
};
