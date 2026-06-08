/**
 * Notion Sync Service
 *
 * Pushes Vera intelligence data to a Notion workspace using the Notion API
 * directly via fetch — no npm package required.
 *
 * Environment variables:
 *   NOTION_API_KEY                — Notion integration token (secret_xxx)
 *   NOTION_WORKSPACE_DATABASE_ID  — Database for intelligence report entries
 *   NOTION_INTELLIGENCE_PAGE_ID   — Parent page for intelligence report pages
 *
 * Notion API docs: https://developers.notion.com/reference
 * Rate limit: 3 requests/second — the service enforces per-call throttling.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

/** Minimum interval between Notion API calls to stay under 3 req/s. */
const RATE_LIMIT_MS = 350

/** Notion blocks endpoint accepts at most 100 children per request. */
const MAX_BLOCKS_PER_REQUEST = 100

/** Notion rich_text array max length per block element. */
const MAX_RICH_TEXT_LENGTH = 2000

// ---------------------------------------------------------------------------
// Rate-limiter (module-scoped singleton)
// ---------------------------------------------------------------------------

let lastCallTimestamp = 0

async function throttle(): Promise<void> {
  const now = Date.now()
  const elapsed = now - lastCallTimestamp
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed))
  }
  lastCallTimestamp = Date.now()
}

// ---------------------------------------------------------------------------
// Internal fetch wrapper
// ---------------------------------------------------------------------------

type NotionResponse<T = Record<string, unknown>> = {
  ok: boolean
  status: number
  data: T
}

async function notionFetch<T = Record<string, unknown>>(
  path: string,
  options: {
    method?: string
    body?: unknown
  } = {}
): Promise<NotionResponse<T>> {
  const apiKey = process.env.NOTION_API_KEY
  if (!apiKey) {
    throw new Error('NOTION_API_KEY environment variable is not configured')
  }

  await throttle()

  const url = `${NOTION_API_BASE}${path}`
  const method = options.method ?? 'GET'

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }

  const fetchOptions: RequestInit = { method, headers }
  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, fetchOptions)
  const data = (await response.json()) as T

  if (!response.ok) {
    const errorBody = data as Record<string, unknown>
    const message = (errorBody.message as string) ?? response.statusText
    throw new NotionApiError(message, response.status, errorBody)
  }

  return { ok: true, status: response.status, data }
}

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class NotionApiError extends Error {
  public readonly status: number
  public readonly body: Record<string, unknown>

  constructor(message: string, status: number, body: Record<string, unknown>) {
    super(`Notion API error (${status}): ${message}`)
    this.name = 'NotionApiError'
    this.status = status
    this.body = body
  }
}

// ---------------------------------------------------------------------------
// Notion block / rich-text types
// ---------------------------------------------------------------------------

export type RichTextItem = {
  type: 'text'
  text: { content: string; link?: { url: string } | null }
  annotations?: {
    bold?: boolean
    italic?: boolean
    strikethrough?: boolean
    underline?: boolean
    code?: boolean
    color?: string
  }
}

export type NotionBlock = {
  object: 'block'
  type: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Helper: buildRichText
// ---------------------------------------------------------------------------

/**
 * Build a Notion rich_text array from a plain string. Splits into chunks if
 * the string exceeds Notion's 2 000 character limit.
 */
export function buildRichText(
  text: string,
  annotations?: RichTextItem['annotations']
): RichTextItem[] {
  if (!text) return [{ type: 'text', text: { content: '' } }]

  const items: RichTextItem[] = []
  let remaining = text
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, MAX_RICH_TEXT_LENGTH)
    remaining = remaining.slice(MAX_RICH_TEXT_LENGTH)
    items.push({
      type: 'text',
      text: { content: chunk },
      ...(annotations ? { annotations } : {}),
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Helper: buildTableBlock
// ---------------------------------------------------------------------------

/**
 * Build a Notion table block (table + table_row children).
 *
 * @param headers  Column header labels.
 * @param rows     2-D array of cell values (strings).
 */
export function buildTableBlock(
  headers: string[],
  rows: string[][]
): NotionBlock {
  const width = headers.length

  const headerRow: NotionBlock = {
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: headers.map((h) => buildRichText(h, { bold: true })),
    },
  }

  const dataRows: NotionBlock[] = rows.map((row) => ({
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: row
        .slice(0, width)
        .concat(Array(Math.max(0, width - row.length)).fill(''))
        .map((cell) => buildRichText(String(cell))),
    },
  }))

  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: width,
      has_column_header: true,
      has_row_header: false,
      children: [headerRow, ...dataRows],
    },
  }
}

// ---------------------------------------------------------------------------
// Helper: markdownToBlocks
// ---------------------------------------------------------------------------

/**
 * Convert a simplified markdown string into Notion block objects.
 *
 * Supported syntax:
 *   # Heading 1  /  ## Heading 2  /  ### Heading 3
 *   - Bullet list item
 *   1. Numbered list item
 *   > Blockquote / callout
 *   --- (divider)
 *   **bold**, *italic*, `code` (inline annotations)
 *   Plain paragraph
 */
export function markdownToBlocks(md: string): NotionBlock[] {
  const lines = md.split('\n')
  const blocks: NotionBlock[] = []

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Skip empty lines
    if (line.trim() === '') continue

    // --- Divider
    if (/^-{3,}$/.test(line.trim())) {
      blocks.push({ object: 'block', type: 'divider', divider: {} })
      continue
    }

    // # Heading 1
    const h1Match = line.match(/^#\s+(.+)/)
    if (h1Match) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: { rich_text: parseInlineFormatting(h1Match[1]) },
      })
      continue
    }

    // ## Heading 2
    const h2Match = line.match(/^##\s+(.+)/)
    if (h2Match) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: parseInlineFormatting(h2Match[1]) },
      })
      continue
    }

    // ### Heading 3
    const h3Match = line.match(/^###\s+(.+)/)
    if (h3Match) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: parseInlineFormatting(h3Match[1]) },
      })
      continue
    }

    // - Bulleted list
    const bulletMatch = line.match(/^[-*]\s+(.+)/)
    if (bulletMatch) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: parseInlineFormatting(bulletMatch[1]) },
      })
      continue
    }

    // 1. Numbered list
    const numberedMatch = line.match(/^\d+\.\s+(.+)/)
    if (numberedMatch) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: { rich_text: parseInlineFormatting(numberedMatch[1]) },
      })
      continue
    }

    // > Callout / blockquote
    const quoteMatch = line.match(/^>\s+(.+)/)
    if (quoteMatch) {
      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: parseInlineFormatting(quoteMatch[1]),
          icon: { type: 'emoji', emoji: 'ℹ️' },
        },
      })
      continue
    }

    // Plain paragraph
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: parseInlineFormatting(line) },
    })
  }

  return blocks
}

/**
 * Parse basic inline markdown formatting (**bold**, *italic*, `code`)
 * and produce an array of Notion rich_text items.
 */
function parseInlineFormatting(text: string): RichTextItem[] {
  const items: RichTextItem[] = []
  // Regex matches: **bold**, *italic*, `code`, or plain text
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|([^*`]+))/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      items.push({
        type: 'text',
        text: { content: match[2] },
        annotations: { bold: true },
      })
    } else if (match[3]) {
      // *italic*
      items.push({
        type: 'text',
        text: { content: match[3] },
        annotations: { italic: true },
      })
    } else if (match[4]) {
      // `code`
      items.push({
        type: 'text',
        text: { content: match[4] },
        annotations: { code: true },
      })
    } else if (match[5]) {
      // plain text
      items.push({
        type: 'text',
        text: { content: match[5] },
      })
    }
  }

  return items.length > 0 ? items : buildRichText(text)
}

// =========================================================================
// Core Notion CRUD operations
// =========================================================================

/**
 * Create a page under a parent (page or database).
 *
 * @param parentId  The parent page_id or database_id.
 * @param title     Page title.
 * @param content   Array of Notion blocks to add as page children.
 * @param parentType  Whether the parent is a 'page_id' or 'database_id'.
 */
export async function createPage(
  parentId: string,
  title: string,
  content: NotionBlock[],
  parentType: 'page_id' | 'database_id' = 'page_id'
): Promise<{ id: string; url: string }> {
  const properties: Record<string, unknown> =
    parentType === 'database_id'
      ? { Name: { title: buildRichText(title) } }
      : { title: { title: buildRichText(title) } }

  const body: Record<string, unknown> = {
    parent: { [parentType]: parentId },
    properties,
  }

  // Notion only allows 100 children per create call — send first batch inline
  if (content.length > 0) {
    body.children = content.slice(0, MAX_BLOCKS_PER_REQUEST)
  }

  const result = await notionFetch<{ id: string; url: string }>('/pages', {
    method: 'POST',
    body,
  })

  // Append remaining blocks in batches if content exceeds 100
  if (content.length > MAX_BLOCKS_PER_REQUEST) {
    await appendBlocks(result.data.id, content.slice(MAX_BLOCKS_PER_REQUEST))
  }

  return { id: result.data.id, url: result.data.url }
}

/**
 * Update page properties (e.g., title, status, date).
 */
export async function updatePage(
  pageId: string,
  properties: Record<string, unknown>
): Promise<{ id: string }> {
  const result = await notionFetch<{ id: string }>(`/pages/${pageId}`, {
    method: 'PATCH',
    body: { properties },
  })
  return { id: result.data.id }
}

/**
 * Append content blocks to an existing page. Automatically batches into
 * groups of 100 to respect the Notion API limit.
 */
export async function appendBlocks(
  pageId: string,
  blocks: NotionBlock[]
): Promise<void> {
  for (let i = 0; i < blocks.length; i += MAX_BLOCKS_PER_REQUEST) {
    const batch = blocks.slice(i, i + MAX_BLOCKS_PER_REQUEST)
    await notionFetch(`/blocks/${pageId}/children`, {
      method: 'PATCH',
      body: { children: batch },
    })
  }
}

/**
 * Query a Notion database with an optional filter.
 */
export async function queryDatabase(
  databaseId: string,
  filter?: Record<string, unknown>
): Promise<{ results: Record<string, unknown>[] }> {
  const body: Record<string, unknown> = {}
  if (filter) body.filter = filter

  const result = await notionFetch<{ results: Record<string, unknown>[] }>(
    `/databases/${databaseId}/query`,
    { method: 'POST', body }
  )
  return { results: result.data.results }
}

// =========================================================================
// Intelligence report upsert
// =========================================================================

/**
 * Find an existing page in the intelligence database by its title (date-based).
 * Returns the page ID if found, or null.
 */
async function findPageByTitle(
  databaseId: string,
  title: string
): Promise<string | null> {
  const { results } = await queryDatabase(databaseId, {
    property: 'Name',
    title: { equals: title },
  })
  if (results.length > 0) {
    return (results[0] as { id: string }).id
  }
  return null
}

/**
 * Delete all children blocks from a page (to allow full content replacement).
 */
async function clearPageContent(pageId: string): Promise<void> {
  const result = await notionFetch<{ results: { id: string }[] }>(
    `/blocks/${pageId}/children?page_size=100`,
    { method: 'GET' }
  )

  for (const block of result.data.results) {
    await notionFetch(`/blocks/${block.id}`, { method: 'DELETE' })
  }
}

// ---------------------------------------------------------------------------
// Format helpers for intelligence data
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPct(value: number): string {
  return `${value}%`
}

function buildIntelligenceBlocks(data: Record<string, unknown>): NotionBlock[] {
  const blocks: NotionBlock[] = []
  const now = new Date().toISOString()

  // Header
  blocks.push(...markdownToBlocks(`> Generated at ${now} by Vera Intelligence Engine`))
  blocks.push({ object: 'block', type: 'divider', divider: {} })

  // --- Portfolio Metrics ---
  const portfolio = data.portfolio_metrics as Record<string, number> | undefined
  if (portfolio) {
    blocks.push(...markdownToBlocks('## Portfolio Metrics'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Total Associations', String(portfolio.total_associations ?? 0)],
          ['Active Associations', String(portfolio.active_associations ?? 0)],
          ['Total Units (Doors)', String(portfolio.total_units ?? 0)],
          ['Total Contacts', String(portfolio.total_contacts ?? 0)],
        ]
      )
    )
  }

  // --- Financial Health ---
  const financial = data.financial_health as Record<string, number> | undefined
  if (financial) {
    blocks.push(...markdownToBlocks('## Financial Health'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Total AR', formatCurrency(financial.total_ar ?? 0)],
          ['Total Delinquent', formatCurrency(financial.total_delinquent ?? 0)],
          ['Delinquency Rate', formatPct(financial.delinquency_rate ?? 0)],
          ['Collections Rate', formatPct(financial.collections_rate ?? 0)],
          ['Monthly Revenue', formatCurrency(financial.monthly_revenue ?? 0)],
          ['Aging 90+ Days', formatCurrency(financial.aging_90_plus ?? 0)],
        ]
      )
    )
  }

  // --- Compliance Health ---
  const compliance = data.compliance_health as Record<string, unknown> | undefined
  if (compliance) {
    blocks.push(...markdownToBlocks('## Compliance Health'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Open Violations', String(compliance.open_violations ?? 0)],
          ['Total Violations', String(compliance.total_violations ?? 0)],
          ['Compliance Rate', formatPct(compliance.compliance_rate as number ?? 0)],
          ['Avg Resolution (days)', String(compliance.avg_resolution_days ?? 0)],
        ]
      )
    )

    const byCategory = compliance.violations_by_category as Record<string, number> | undefined
    if (byCategory && Object.keys(byCategory).length > 0) {
      blocks.push(...markdownToBlocks('### Violations by Category'))
      blocks.push(
        buildTableBlock(
          ['Category', 'Count'],
          Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, count]) => [cat, String(count)])
        )
      )
    }
  }

  // --- Operational Metrics ---
  const ops = data.operational_metrics as Record<string, unknown> | undefined
  if (ops) {
    blocks.push(...markdownToBlocks('## Operational Metrics'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Open Work Orders', String(ops.open_work_orders ?? 0)],
          ['Completed Work Orders', String(ops.completed_work_orders ?? 0)],
          ['Avg Response (days)', String(ops.avg_response_days ?? 0)],
          ['Maintenance Backlog (30d+)', String(ops.maintenance_backlog ?? 0)],
        ]
      )
    )
  }

  // --- Client Pipeline ---
  const pipeline = data.client_pipeline as Record<string, unknown> | undefined
  if (pipeline) {
    blocks.push(...markdownToBlocks('## Client Pipeline'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Active Leads', String(pipeline.active_leads ?? 0)],
          ['Pipeline Value', formatCurrency(pipeline.pipeline_value as number ?? 0)],
          ['Won This Month', String(pipeline.won_this_month ?? 0)],
          ['Conversion Rate', formatPct(pipeline.conversion_rate as number ?? 0)],
        ]
      )
    )
  }

  // --- Revenue Concentration ---
  const revenue = data.revenue_concentration as Record<string, unknown> | undefined
  if (revenue) {
    blocks.push(...markdownToBlocks('## Revenue Concentration'))
    blocks.push(
      ...markdownToBlocks(
        `- **Top 3 Concentration**: ${formatPct(revenue.top_3_concentration_pct as number ?? 0)}\n` +
          `- **Total Revenue**: ${formatCurrency(revenue.total_revenue as number ?? 0)}`
      )
    )

    const topCommunities = revenue.top_communities as Array<Record<string, unknown>> | undefined
    if (topCommunities && topCommunities.length > 0) {
      blocks.push(...markdownToBlocks('### Top Communities by Revenue'))
      blocks.push(
        buildTableBlock(
          ['Community', 'Units', 'Collected', 'Rev/Unit'],
          topCommunities.slice(0, 10).map((c) => [
            String(c.name ?? 'Unknown'),
            String(c.unit_count ?? 0),
            formatCurrency(c.total_collected as number ?? 0),
            formatCurrency(c.revenue_per_unit as number ?? 0),
          ])
        )
      )
    }
  }

  // --- Churn Risk ---
  const churnRisk = data.churn_risk as Array<Record<string, unknown>> | undefined
  if (churnRisk && churnRisk.length > 0) {
    blocks.push(...markdownToBlocks('## Churn Risk Communities'))
    blocks.push(
      ...markdownToBlocks(`> ${churnRisk.length} communities with health score below 60`)
    )
    blocks.push(
      buildTableBlock(
        ['Community', 'Score', 'Financial', 'Compliance', 'Maintenance', 'Trend'],
        churnRisk.slice(0, 15).map((c) => [
          String(c.name ?? 'Unknown'),
          String(c.overall_score ?? '-'),
          String(c.financial_score ?? '-'),
          String(c.compliance_score ?? '-'),
          String(c.maintenance_score ?? '-'),
          String(c.score_trend ?? '-'),
        ])
      )
    )
  }

  // --- Contract Insights ---
  const contracts = data.contract_insights as Record<string, number> | undefined
  if (contracts) {
    blocks.push(...markdownToBlocks('## Contract Insights'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Active Contracts', String(contracts.active_contracts ?? 0)],
          ['Monthly Contracted', formatCurrency(contracts.total_monthly_contracted ?? 0)],
          ['Annual Contracted', formatCurrency(contracts.total_annual_contracted ?? 0)],
        ]
      )
    )
  }

  return blocks
}

function buildCrossSellBlocks(data: Record<string, unknown>): NotionBlock[] {
  const blocks: NotionBlock[] = []

  blocks.push(...markdownToBlocks('> Cross-sell opportunity analysis across the Riance LLC portfolio'))
  blocks.push({ object: 'block', type: 'divider', divider: {} })

  const summary = data.summary as Record<string, unknown> | undefined
  if (summary) {
    blocks.push(...markdownToBlocks('## Summary'))
    const byCompany = summary.by_company as Record<string, number> | undefined
    const byPriority = summary.by_priority as Record<string, number> | undefined

    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Total Opportunities', String(summary.total_opportunities ?? 0)],
          ['Total Estimated Value', formatCurrency(summary.total_estimated_value as number ?? 0)],
          ['WFW Restoration', String(byCompany?.wfw_restoration ?? 0)],
          ['FixIQ Maintenance', String(byCompany?.fixiq_maintenance ?? 0)],
          ['Riance Realty', String(byCompany?.riance_realty ?? 0)],
          ['High Priority', String(byPriority?.high ?? 0)],
          ['Medium Priority', String(byPriority?.medium ?? 0)],
          ['Low Priority', String(byPriority?.low ?? 0)],
        ]
      )
    )
  }

  const opportunities = data.opportunities as Array<Record<string, unknown>> | undefined
  if (opportunities && opportunities.length > 0) {
    blocks.push(...markdownToBlocks('## Opportunities'))

    // Group by target company
    const grouped: Record<string, Array<Record<string, unknown>>> = {}
    for (const opp of opportunities) {
      const company = String(opp.target_company ?? 'Other')
      if (!grouped[company]) grouped[company] = []
      grouped[company].push(opp)
    }

    for (const [company, opps] of Object.entries(grouped)) {
      blocks.push(...markdownToBlocks(`### ${company}`))
      blocks.push(
        buildTableBlock(
          ['Community', 'Title', 'Priority', 'Est. Value'],
          opps.slice(0, 20).map((o) => [
            String(o.association_name ?? 'Unknown'),
            String(o.title ?? '').slice(0, 80),
            String(o.priority ?? '-'),
            formatCurrency(o.estimated_value as number ?? 0),
          ])
        )
      )
    }
  }

  return blocks
}

function buildPricingBlocks(data: Record<string, unknown>): NotionBlock[] {
  const blocks: NotionBlock[] = []

  blocks.push(...markdownToBlocks('> Pricing benchmarks and analysis for the Empire Management portfolio'))
  blocks.push({ object: 'block', type: 'divider', divider: {} })

  // Portfolio stats
  const stats = data.portfolio_stats as Record<string, unknown> | undefined
  if (stats) {
    blocks.push(...markdownToBlocks('## Portfolio Pricing Summary'))
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Communities Analyzed', String(stats.total_communities_analyzed ?? 0)],
          ['Total Units', String(stats.total_units ?? 0)],
          ['Avg Fee/Door', formatCurrency(stats.avg_fee_per_door as number ?? 0)],
          ['Median Fee/Door', formatCurrency(stats.median_fee_per_door as number ?? 0)],
          ['Total Monthly Fees', formatCurrency(stats.total_monthly_fees as number ?? 0)],
          ['Total Annual Fees', formatCurrency(stats.total_annual_fees as number ?? 0)],
          ['Communities Under-Priced', String(stats.communities_under_priced ?? 0)],
          ['Under-Priced %', formatPct(stats.under_priced_pct as number ?? 0)],
          ['Potential Monthly Lift', formatCurrency(stats.potential_monthly_revenue_lift as number ?? 0)],
          ['Potential Annual Lift', formatCurrency(stats.potential_annual_revenue_lift as number ?? 0)],
        ]
      )
    )
  }

  // Tier benchmarks
  const tiers = data.tier_benchmarks as Array<Record<string, unknown>> | undefined
  if (tiers && tiers.length > 0) {
    blocks.push(...markdownToBlocks('## Tier Benchmarks'))
    blocks.push(
      buildTableBlock(
        ['Tier', 'Communities', 'Units', 'Avg $/Door', 'Median $/Door', 'Min', 'Max'],
        tiers.map((t) => [
          String(t.label ?? t.tier),
          String(t.community_count ?? 0),
          String(t.total_units ?? 0),
          formatCurrency(t.avg_fee_per_door as number ?? 0),
          formatCurrency(t.median_fee_per_door as number ?? 0),
          formatCurrency(t.min_fee_per_door as number ?? 0),
          formatCurrency(t.max_fee_per_door as number ?? 0),
        ])
      )
    )
  }

  // Under-priced communities
  const underPriced = data.under_priced_communities as Array<Record<string, unknown>> | undefined
  if (underPriced && underPriced.length > 0) {
    blocks.push(...markdownToBlocks('## Under-Priced Communities'))
    blocks.push(
      ...markdownToBlocks(`> ${underPriced.length} communities below 75% of their tier median fee/door`)
    )
    blocks.push(
      buildTableBlock(
        ['Community', 'Units', 'Tier', 'Fee/Door', 'Gap', 'Source'],
        underPriced.slice(0, 25).map((c) => [
          String(c.name ?? 'Unknown'),
          String(c.unit_count ?? 0),
          String(c.size_tier ?? '-'),
          formatCurrency(c.fee_per_door as number ?? 0),
          `+${formatCurrency(c.pricing_gap as number ?? 0)}`,
          String(c.fee_source ?? '-'),
        ])
      )
    )
  }

  return blocks
}

// =========================================================================
// High-level upsert methods
// =========================================================================

export type IntelligenceReportData = {
  intelligence: Record<string, unknown>
  crossSell?: Record<string, unknown>
  pricing?: Record<string, unknown>
}

/**
 * Create or update the daily intelligence report page in Notion.
 *
 * Uses the configured NOTION_WORKSPACE_DATABASE_ID to query for an existing
 * page with today's date as the title. If found, the page content is replaced.
 * If not, a new page is created.
 *
 * Returns a summary of what was synced including page IDs and URLs.
 */
export async function upsertIntelligenceReport(
  data: IntelligenceReportData
): Promise<{
  pages_synced: string[]
  intelligence_page: { id: string; url: string } | null
  cross_sell_page: { id: string; url: string } | null
  pricing_page: { id: string; url: string } | null
}> {
  const databaseId = process.env.NOTION_WORKSPACE_DATABASE_ID
  const parentPageId = process.env.NOTION_INTELLIGENCE_PAGE_ID

  if (!databaseId && !parentPageId) {
    throw new Error(
      'Either NOTION_WORKSPACE_DATABASE_ID or NOTION_INTELLIGENCE_PAGE_ID must be configured'
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const pagesSynced: string[] = []
  let intelligencePage: { id: string; url: string } | null = null
  let crossSellPage: { id: string; url: string } | null = null
  let pricingPage: { id: string; url: string } | null = null

  // --- Intelligence Report ---
  const intelTitle = `Intelligence Report — ${today}`
  const intelBlocks = buildIntelligenceBlocks(data.intelligence)

  if (databaseId) {
    const existingId = await findPageByTitle(databaseId, intelTitle)
    if (existingId) {
      await clearPageContent(existingId)
      await appendBlocks(existingId, intelBlocks)
      await updatePage(existingId, {
        Name: { title: buildRichText(intelTitle) },
      })
      intelligencePage = { id: existingId, url: `https://notion.so/${existingId.replace(/-/g, '')}` }
    } else {
      intelligencePage = await createPage(databaseId, intelTitle, intelBlocks, 'database_id')
    }
  } else if (parentPageId) {
    intelligencePage = await createPage(parentPageId, intelTitle, intelBlocks, 'page_id')
  }
  pagesSynced.push('intelligence')

  // --- Cross-Sell Report ---
  if (data.crossSell) {
    const crossSellTitle = `Cross-Sell Opportunities — ${today}`
    const crossSellBlocks = buildCrossSellBlocks(data.crossSell)

    if (databaseId) {
      const existingId = await findPageByTitle(databaseId, crossSellTitle)
      if (existingId) {
        await clearPageContent(existingId)
        await appendBlocks(existingId, crossSellBlocks)
        crossSellPage = { id: existingId, url: `https://notion.so/${existingId.replace(/-/g, '')}` }
      } else {
        crossSellPage = await createPage(databaseId, crossSellTitle, crossSellBlocks, 'database_id')
      }
    } else if (parentPageId) {
      crossSellPage = await createPage(parentPageId, crossSellTitle, crossSellBlocks, 'page_id')
    }
    pagesSynced.push('cross_sell')
  }

  // --- Pricing Report ---
  if (data.pricing) {
    const pricingTitle = `Pricing Analysis — ${today}`
    const pricingBlocks = buildPricingBlocks(data.pricing)

    if (databaseId) {
      const existingId = await findPageByTitle(databaseId, pricingTitle)
      if (existingId) {
        await clearPageContent(existingId)
        await appendBlocks(existingId, pricingBlocks)
        pricingPage = { id: existingId, url: `https://notion.so/${existingId.replace(/-/g, '')}` }
      } else {
        pricingPage = await createPage(databaseId, pricingTitle, pricingBlocks, 'database_id')
      }
    } else if (parentPageId) {
      pricingPage = await createPage(parentPageId, pricingTitle, pricingBlocks, 'page_id')
    }
    pagesSynced.push('pricing')
  }

  return {
    pages_synced: pagesSynced,
    intelligence_page: intelligencePage,
    cross_sell_page: crossSellPage,
    pricing_page: pricingPage,
  }
}

/**
 * Create or update a named agent report page. Useful for individual automation
 * agents (sales intelligence, financial health, etc.) that want to push their
 * own reports to Notion independently.
 *
 * @param agentName  Human-readable agent name (e.g., "Sales Intelligence").
 * @param data       The raw report data — will be converted to markdown blocks.
 */
export async function upsertAgentReport(
  agentName: string,
  data: Record<string, unknown>
): Promise<{ id: string; url: string }> {
  const databaseId = process.env.NOTION_WORKSPACE_DATABASE_ID
  const parentPageId = process.env.NOTION_INTELLIGENCE_PAGE_ID

  if (!databaseId && !parentPageId) {
    throw new Error(
      'Either NOTION_WORKSPACE_DATABASE_ID or NOTION_INTELLIGENCE_PAGE_ID must be configured'
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const title = `${agentName} — ${today}`

  // Build generic blocks from the data payload
  const blocks: NotionBlock[] = [
    ...markdownToBlocks(`> Agent report generated at ${new Date().toISOString()}`),
    { object: 'block', type: 'divider', divider: {} },
    ...markdownToBlocks(`## ${agentName}`),
  ]

  // Render each top-level key as a section
  for (const [key, value] of Object.entries(data)) {
    const sectionTitle = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Array of objects -> table
      const headers = Object.keys(value[0] as Record<string, unknown>)
      const rows = value.map((item) =>
        headers.map((h) => String((item as Record<string, unknown>)[h] ?? ''))
      )
      blocks.push(...markdownToBlocks(`### ${sectionTitle}`))
      blocks.push(buildTableBlock(headers, rows.slice(0, 50)))
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Object -> key-value table
      const entries = Object.entries(value as Record<string, unknown>)
      blocks.push(...markdownToBlocks(`### ${sectionTitle}`))
      blocks.push(
        buildTableBlock(
          ['Key', 'Value'],
          entries.map(([k, v]) => [
            k.replace(/_/g, ' '),
            typeof v === 'number'
              ? v > 1000
                ? formatCurrency(v)
                : String(v)
              : String(v ?? '-'),
          ])
        )
      )
    } else {
      // Primitive value -> paragraph
      blocks.push(
        ...markdownToBlocks(`- **${sectionTitle}**: ${String(value)}`)
      )
    }
  }

  if (databaseId) {
    const existingId = await findPageByTitle(databaseId, title)
    if (existingId) {
      await clearPageContent(existingId)
      await appendBlocks(existingId, blocks)
      return { id: existingId, url: `https://notion.so/${existingId.replace(/-/g, '')}` }
    }
    return createPage(databaseId, title, blocks, 'database_id')
  }

  return createPage(parentPageId!, title, blocks, 'page_id')
}
