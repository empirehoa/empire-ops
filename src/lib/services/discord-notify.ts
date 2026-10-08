/**
 * Discord notifications for Empire Ops.
 *
 * Posts embeds to DISCORD_WEBHOOK_URL. When it is unset, every call is a no-op
 * that returns false. Delivery failures never throw: Discord must not block a run.
 */

export type Severity = 'healthy' | 'warning' | 'critical'

type DiscordEmbed = {
  title: string
  description: string
  color: number
  timestamp: string
  footer: { text: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
}

// Empire brand: blue for healthy, coral for warning, deep coral for critical.
const SEVERITY_COLORS: Record<Severity, number> = {
  healthy: 0x1c74ac,
  warning: 0xf98761,
  critical: 0xc05a2e,
}

const FOOTER = 'Empire Ops'

async function sendEmbed(embed: DiscordEmbed): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return false
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
    return response.ok
  } catch {
    return false
  }
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`
}

function formatMetricValue(value: unknown): string {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }
  return String(value)
}

/** One agent's headline plus up to 25 metrics as embed fields. */
export async function postAgentReport(
  agentName: string,
  summary: string,
  metrics: Record<string, unknown>,
  severity: Severity = 'healthy',
): Promise<boolean> {
  const fields = Object.entries(metrics).map(([key, value]) => ({
    name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: formatMetricValue(value),
    inline: true,
  }))
  return sendEmbed({
    title: `Agent report: ${agentName}`,
    description: truncate(summary, 4096),
    color: SEVERITY_COLORS[severity],
    timestamp: new Date().toISOString(),
    footer: { text: FOOTER },
    fields: fields.slice(0, 25),
  })
}

/** A plain titled message, used for the daily run summary. */
export async function postStatusMessage(
  title: string,
  message: string,
  severity: Severity = 'healthy',
): Promise<boolean> {
  return sendEmbed({
    title,
    description: truncate(message, 4096),
    color: SEVERITY_COLORS[severity],
    timestamp: new Date().toISOString(),
    footer: { text: FOOTER },
  })
}
