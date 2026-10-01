import type { NavItem } from '../types'

export const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    description: 'Overview and operational status',
    badge: 'Live',
  },
  {
    id: 'tools',
    label: 'Tools',
    to: '/tools',
    description: 'Catalog of available utilities',
  },
  {
    id: 'insights',
    label: 'Insights',
    to: '/insights',
    description: 'Metrics and trend overview',
  },
  {
    id: 'settings',
    label: 'Settings',
    to: '/settings',
    description: 'Workspace preferences',
  },
]
