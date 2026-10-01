import type { AppMetric, QuickAction, ToolDefinition } from '../types'

export const appMetrics: AppMetric[] = [
  {
    label: 'Active tools',
    value: '12',
    detail: 'Across core workflows',
    tone: 'positive',
  },
  {
    label: 'Automation coverage',
    value: '88%',
    detail: 'High confidence throughput',
    tone: 'positive',
  },
  {
    label: 'Review queue',
    value: '4',
    detail: 'Tasks pending review',
    tone: 'neutral',
  },
  {
    label: 'Alerts',
    value: '2',
    detail: 'Needs triage',
    tone: 'warning',
  },
]

export const quickActions: QuickAction[] = [
  {
    title: 'Launch workspace review',
    description: 'Run a full health check across the active workspace.',
    action: 'Review',
  },
  {
    title: 'Open tool catalog',
    description: 'Browse utilities and setup patterns for the current project.',
    action: 'Browse',
  },
  {
    title: 'Check shipping readiness',
    description: 'Evaluate build viability and readiness for release.',
    action: 'Run',
  },
]

export const toolCatalog: ToolDefinition[] = [
  {
    id: 'workspace-health',
    name: 'Workspace Health',
    category: 'Operations',
    description: 'Monitors completeness of the app foundation, config, and validation checks.',
    status: 'ready',
    version: '1.4.0',
    lastUpdated: '2026-09-25',
    tags: ['validation', 'build', 'health'],
  },
  {
    id: 'routing-foundation',
    name: 'Routing Foundation',
    category: 'Navigation',
    description: 'Keeps the app structure consistent and makes new pages easy to insert.',
    status: 'ready',
    version: '1.2.0',
    lastUpdated: '2026-09-21',
    tags: ['router', 'pages', 'navigation'],
  },
  {
    id: 'config-sentinel',
    name: 'Config Sentinel',
    category: 'Infrastructure',
    description: 'Validates shared environment configuration and baseline project settings.',
    status: 'beta',
    version: '0.9.0',
    lastUpdated: '2026-09-17',
    tags: ['config', 'settings', 'env'],
  },
  {
    id: 'insight-stream',
    name: 'Insight Stream',
    category: 'Reporting',
    description: 'Summarizes operational signals into a compact, actionable overview.',
    status: 'experimental',
    version: '0.7.0',
    lastUpdated: '2026-09-14',
    tags: ['analytics', 'reporting', 'summary'],
  },
]
