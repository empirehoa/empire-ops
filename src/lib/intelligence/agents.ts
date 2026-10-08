// The scheduled intelligence agents, in the order the dashboards list them.
// Each one lives at POST /api/automation/<key>.

export type AgentKey =
  | 'sales-intelligence'
  | 'financial-health'
  | 'client-retention'
  | 'cross-sell'
  | 'competitive-intel'
  | 'sync-notion-daily'

export type AgentInfo = { key: AgentKey; label: string; sources: string }

export const AGENTS: AgentInfo[] = [
  { key: 'sales-intelligence', label: 'Sales intelligence', sources: 'HubSpot deals' },
  { key: 'financial-health', label: 'Financial health', sources: 'Vantaca AR aging, QuickBooks P&L' },
  { key: 'client-retention', label: 'Client retention', sources: 'Vantaca AR aging and action items' },
  { key: 'cross-sell', label: 'Cross-sell', sources: 'Vantaca action items' },
  { key: 'competitive-intel', label: 'Fee benchmarks', sources: 'Vantaca community list (internal only)' },
  { key: 'sync-notion-daily', label: 'Notion daily report', sources: 'All of the above' },
]

export const AGENT_KEYS = AGENTS.map((a) => a.key)

export function agentLabel(key: string): string {
  return AGENTS.find((a) => a.key === key)?.label ?? key
}
