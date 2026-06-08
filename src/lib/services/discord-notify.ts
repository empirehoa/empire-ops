/**
 * Discord Notification Service
 *
 * TypeScript replacement for the legacy docs/agent-reports/post_discord.py.
 * Posts formatted embeds to a Discord webhook for agent reporting.
 *
 * Usage:
 *   import { postAgentReport, postDailyDigest } from '@/lib/services/discord-notify'
 *
 *   await postAgentReport('sales-intelligence', 'Pipeline healthy', {
 *     activeLeads: 42,
 *     staleLeads: 3,
 *     pipelineValue: 250000,
 *   }, 'healthy')
 *
 *   await postDailyDigest(agentStatuses)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'healthy' | 'warning' | 'critical'

export interface AgentStatus {
  name: string
  status: 'success' | 'failed' | 'skipped'
  elapsedMs?: number
  summary?: string
  error?: string
}

interface DiscordEmbed {
  title: string
  description: string
  color: number
  timestamp: string
  footer: { text: string }
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
}

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<Severity, number> = {
  healthy: 0x10b981,  // Emerald green
  warning: 0xf59e0b,  // Amber yellow
  critical: 0xef4444, // Red
}

const STATUS_EMOJI: Record<string, string> = {
  success: '✅',  // green check
  failed: '❌',   // red X
  skipped: '⏭️',   // skip
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getWebhookUrl(): string | null {
  return process.env.DISCORD_WEBHOOK_URL ?? process.env.DISCORD_AUTOMATION_WEBHOOK_URL ?? null
}

async function sendEmbed(embed: DiscordEmbed): Promise<boolean> {
  const webhookUrl = getWebhookUrl()
  if (!webhookUrl) return false

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
      }),
    })
    return response.ok
  } catch {
    // Non-fatal — Discord delivery should never block automation
    return false
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

function formatMetricValue(value: unknown): string {
  if (typeof value === 'number') {
    // Format large numbers with commas and currency-like precision
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    }
    if (Number.isInteger(value)) return String(value)
    return value.toFixed(2)
  }
  return String(value)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Post a single agent report to Discord as a formatted embed.
 *
 * @param agentName  - Agent identifier (e.g. "sales-intelligence")
 * @param summary    - Brief summary of the report findings
 * @param metrics    - Key-value metrics to display as embed fields
 * @param severity   - Color coding: healthy (green), warning (yellow), critical (red)
 */
export async function postAgentReport(
  agentName: string,
  summary: string,
  metrics: Record<string, unknown>,
  severity: Severity = 'healthy'
): Promise<boolean> {
  const fields = Object.entries(metrics).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: formatMetricValue(value),
    inline: true,
  }))

  // Discord embeds support max 25 fields
  const embed: DiscordEmbed = {
    title: `Agent Report: ${agentName}`,
    description: truncate(summary, 4096),
    color: SEVERITY_COLORS[severity],
    timestamp: new Date().toISOString(),
    footer: { text: 'Vera Automation' },
    fields: fields.slice(0, 25),
  }

  return sendEmbed(embed)
}

/**
 * Post a consolidated daily digest showing all agent statuses.
 * Intended to be called after the run-all cron completes.
 *
 * @param agentStatuses - Array of status objects from each agent run
 */
export async function postDailyDigest(
  agentStatuses: AgentStatus[]
): Promise<boolean> {
  const succeeded = agentStatuses.filter((a) => a.status === 'success').length
  const failed = agentStatuses.filter((a) => a.status === 'failed').length
  const skipped = agentStatuses.filter((a) => a.status === 'skipped').length
  const total = agentStatuses.length

  const totalElapsed = agentStatuses.reduce(
    (sum, a) => sum + (a.elapsedMs ?? 0),
    0
  )

  // Determine overall severity
  let severity: Severity = 'healthy'
  if (failed > 0 && failed <= 2) severity = 'warning'
  if (failed > 2) severity = 'critical'

  // Build status lines
  const statusLines = agentStatuses.map((agent) => {
    const emoji = STATUS_EMOJI[agent.status] ?? '❓'
    const elapsed = agent.elapsedMs ? ` (${agent.elapsedMs}ms)` : ''
    const detail = agent.status === 'failed' && agent.error
      ? ` — ${truncate(agent.error, 100)}`
      : agent.summary
        ? ` — ${truncate(agent.summary, 100)}`
        : ''
    return `${emoji} **${agent.name}**${elapsed}${detail}`
  })

  const description = [
    `**${succeeded}/${total}** agents succeeded`,
    failed > 0 ? `, **${failed}** failed` : '',
    skipped > 0 ? `, **${skipped}** skipped` : '',
    `\nTotal elapsed: ${totalElapsed}ms`,
    '',
    ...statusLines,
  ].join('\n')

  const embed: DiscordEmbed = {
    title: failed === 0
      ? 'Daily Agent Digest: All Systems Operational'
      : `Daily Agent Digest: ${failed} Failure${failed > 1 ? 's' : ''} Detected`,
    description: truncate(description, 4096),
    color: SEVERITY_COLORS[severity],
    timestamp: new Date().toISOString(),
    footer: { text: 'Vera Automation | Daily Cron 06:00 UTC' },
    fields: [
      { name: 'Succeeded', value: String(succeeded), inline: true },
      { name: 'Failed', value: String(failed), inline: true },
      { name: 'Skipped', value: String(skipped), inline: true },
    ],
  }

  return sendEmbed(embed)
}

/**
 * Post a simple status message to Discord (for ad-hoc notifications).
 *
 * @param title    - Embed title
 * @param message  - Embed description
 * @param severity - Color coding
 */
export async function postStatusMessage(
  title: string,
  message: string,
  severity: Severity = 'healthy'
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title,
    description: truncate(message, 4096),
    color: SEVERITY_COLORS[severity],
    timestamp: new Date().toISOString(),
    footer: { text: 'Vera Platform' },
  }

  return sendEmbed(embed)
}
