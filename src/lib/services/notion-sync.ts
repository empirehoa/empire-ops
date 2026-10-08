/**
 * Notion Sync Service
 *
 * Publishes the Empire Ops daily intelligence report to a Notion workspace using
 * the Notion API directly via fetch (no npm package).
 *
 * Environment variables:
 *   NOTION_API_KEY                Notion integration token (secret_xxx)
 *   NOTION_WORKSPACE_DATABASE_ID  Database for intelligence report entries
 *   NOTION_INTELLIGENCE_PAGE_ID   Parent page for intelligence report pages
 *
 * Notion API docs: https://developers.notion.com/reference
 * Rate limit: 3 requests/second; the service throttles every call.
 */

import { agentLabel } from '@/lib/intelligence/agents'
import { count, formatDateTime, formatDay, formatMonth, pct, usd } from '@/lib/intelligence/format'
import type { AgentRunSummary } from '@/lib/intelligence/load'
import { STALE_DEAL_DAYS } from '@/lib/intelligence/pipeline'
import type { IntelligenceSnapshot } from '@/lib/intelligence/snapshot'

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
 *   > Quote
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
        type: 'quote',
        quote: { rich_text: parseInlineFormatting(quoteMatch[1]) },
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

  // Notion allows 100 children per create call; send the first batch inline
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
// Daily report
// =========================================================================

async function findPageByTitle(databaseId: string, title: string): Promise<string | null> {
  const { results } = await queryDatabase(databaseId, { property: 'Name', title: { equals: title } })
  return results.length > 0 ? (results[0] as { id: string }).id : null
}

/** Delete every child block of a page, following Notion's pagination. */
async function clearPageContent(pageId: string): Promise<void> {
  for (;;) {
    const result = await notionFetch<{ results: { id: string }[]; has_more: boolean }>(
      `/blocks/${pageId}/children?page_size=100`,
      { method: 'GET' },
    )
    for (const block of result.data.results) {
      await notionFetch(`/blocks/${block.id}`, { method: 'DELETE' })
    }
    if (!result.data.has_more || result.data.results.length === 0) return
  }
}

export function notionConfigured(): boolean {
  return Boolean(
    process.env.NOTION_API_KEY &&
      (process.env.NOTION_WORKSPACE_DATABASE_ID || process.env.NOTION_INTELLIGENCE_PAGE_ID),
  )
}

const para = (text: string) => markdownToBlocks(text)
const heading = (text: string) => markdownToBlocks(`## ${text}`)
const divider: NotionBlock = { object: 'block', type: 'divider', divider: {} }

/** Build the report blocks. Pure, so it can be tested without Notion. */
export function buildDailyReportBlocks(snapshot: IntelligenceSnapshot, agentRuns: AgentRunSummary[]): NotionBlock[] {
  const blocks: NotionBlock[] = []
  blocks.push(
    ...para(
      `Generated ${formatDateTime(snapshot.generatedAt)} by Empire Ops. Portfolio figures exclude Vantaca test associations. ` +
        'Internal drafts for review by the responsible manager or CPA; not accounting or legal advice.',
    ),
    divider,
  )

  // Agent headlines
  if (agentRuns.length > 0) {
    blocks.push(...heading('Agent headlines'))
    blocks.push(
      buildTableBlock(
        ['Agent', 'Status', 'Headline', 'Run at'],
        agentRuns.map((r) => [agentLabel(r.agent), r.status, r.headline ?? r.error ?? '', formatDateTime(r.started_at)]),
      ),
    )
  }

  // Company revenue
  const { window, companies } = snapshot.revenue
  const connected = new Set(snapshot.sources.qboConnectedCompanyIds)
  blocks.push(
    ...heading(`Company revenue, ${formatMonth(window.months[0])} to ${formatMonth(window.months[window.months.length - 1])}`),
    ...para('From QuickBooks monthly P&L reports. Companies without QuickBooks data are not estimated.'),
    buildTableBlock(
      ['Company', 'Revenue', 'Net income', 'Months covered'],
      companies.map((c) =>
        c.hasData
          ? [c.name, usd(c.revenue), usd(c.netIncome), `${c.monthsCovered} of ${c.monthsExpected}`]
          : [c.name, connected.has(c.companyId) ? 'Connected, no P&L synced yet' : 'QuickBooks not connected', '', ''],
      ),
    ),
  )

  // Pipeline
  blocks.push(...heading('Sales pipeline (HubSpot)'))
  const p = snapshot.pipeline
  if (!p) {
    blocks.push(...para('HubSpot is not connected or has not synced. Set HUBSPOT_ACCESS_TOKEN and run a sync from /admin/integrations.'))
  } else {
    blocks.push(
      buildTableBlock(
        ['Metric', 'Value'],
        [
          ['Open deals', count(p.openCount)],
          ['Open value', usd(p.openValue)],
          ['Weighted by stage probability', usd(p.weightedValue)],
          [`Stale (no update in ${STALE_DEAL_DAYS}+ days)`, `${count(p.staleCount)} deals, ${usd(p.staleValue)}`],
          ['Win rate, trailing 365 days (deals)', pct(p.winRate.byCount)],
          ['Win rate, trailing 365 days (dollars)', pct(p.winRate.byValue)],
        ],
      ),
    )
  }

  // Homeowner AR
  blocks.push(...heading('Homeowner AR across managed associations (Vantaca)'))
  const ar = snapshot.ar
  if (!ar) {
    blocks.push(...para('No Vantaca AR aging imported. Upload the export at /admin/imports.'))
  } else {
    blocks.push(
      ...para(
        `${usd(ar.total)} across ${count(ar.communityCount)} associations; ${pct(ar.share90Plus)} is 90+ days (${usd(ar.days90Plus)}). Latest snapshots ${formatDay(ar.asOfMin)} to ${formatDay(ar.asOfMax)}.`,
      ),
      buildTableBlock(
        ['Association', '90+ days', 'Share of its AR', 'Total AR'],
        ar.topBy90Plus.map((l) => [l.name, usd(l.days90Plus), pct(l.share90Plus), usd(l.total)]),
      ),
    )
  }

  // Action items
  blocks.push(...heading('Action item aging (Vantaca)'))
  const aging = snapshot.aging
  if (!aging) {
    blocks.push(...para('No Vantaca action items imported. Upload the export at /admin/imports.'))
  } else {
    blocks.push(
      ...para(`${count(aging.openCount)} open items; ${count(aging.agedCount)} open ${aging.agedThresholdDays}+ days.`),
      buildTableBlock(
        ['Category', 'Open', `${aging.agedThresholdDays}+ days`],
        aging.byCategory.slice(0, 15).map((c) => [c.category, count(c.open), count(c.aged)]),
      ),
    )
  }

  // Retention
  const retention = snapshot.retention
  if (retention && retention.scored.some((r) => r.score > 0)) {
    blocks.push(...heading('Retention risk (heuristic)'), ...para(retention.method))
    blocks.push(
      buildTableBlock(
        ['Association', 'Score', 'Signals'],
        retention.scored
          .filter((r) => r.score > 0)
          .slice(0, 10)
          .map((r) => [r.name, String(r.score), r.signals.filter((s) => s.points > 0).map((s) => s.explanation).join(' ')]),
      ),
    )
  }

  // Cross-sell
  const cs = snapshot.crossSell
  if (cs) {
    blocks.push(
      ...heading('Cross-sell signals'),
      ...para(`Action items open or opened in the last ${cs.windowDays} days whose category or type matches sister-company work. Leads, not estimates.`),
      buildTableBlock(
        ['Company', 'Matches', 'Associations'],
        cs.byCompany.map((c) => [c.companyName, count(c.matches), count(c.communities)]),
      ),
    )
    if (cs.byCommunity.length > 0) {
      blocks.push(
        buildTableBlock(
          ['Association', 'Company', 'Items', 'Keywords'],
          cs.byCommunity.slice(0, 15).map((m) => [m.name, m.companyName, count(m.count), m.keywords.join(', ')]),
        ),
      )
    }
  }

  // Fee per door
  const pricing = snapshot.pricing
  if (pricing) {
    blocks.push(
      ...heading('Fee per door by size (internal)'),
      ...para(pricing.label),
      buildTableBlock(
        ['Size band', 'Associations', 'Doors', '25th pct', 'Median', '75th pct'],
        pricing.bands
          .filter((b) => b.count > 0)
          .map((b) => [b.label, count(b.count), count(b.doors), usd(b.p25, 2), usd(b.median, 2), usd(b.p75, 2)]),
      ),
    )
  }

  // Workload
  if (snapshot.workload && snapshot.workload.length > 0) {
    blocks.push(
      ...heading('Manager workload'),
      buildTableBlock(
        ['Manager', 'Associations', 'Doors', 'Open items', '60+ days', '90+ homeowner AR'],
        snapshot.workload.map((w) => [w.manager, count(w.communities), count(w.doors), count(w.openItems), count(w.agedItems), usd(w.ar90Plus)]),
      ),
    )
  }

  return blocks
}

/**
 * Create or replace today's report page. With NOTION_WORKSPACE_DATABASE_ID the
 * page is found by its Name title and its content replaced; otherwise a new page
 * is created under NOTION_INTELLIGENCE_PAGE_ID.
 */
export async function publishDailyReport(
  snapshot: IntelligenceSnapshot,
  agentRuns: AgentRunSummary[],
): Promise<{ id: string; url: string; title: string }> {
  const databaseId = process.env.NOTION_WORKSPACE_DATABASE_ID
  const parentPageId = process.env.NOTION_INTELLIGENCE_PAGE_ID
  if (!databaseId && !parentPageId) {
    throw new Error('Either NOTION_WORKSPACE_DATABASE_ID or NOTION_INTELLIGENCE_PAGE_ID must be configured')
  }

  const title = `Empire Ops daily report ${snapshot.generatedAt.slice(0, 10)}`
  const blocks = buildDailyReportBlocks(snapshot, agentRuns)

  if (databaseId) {
    const existingId = await findPageByTitle(databaseId, title)
    if (existingId) {
      await clearPageContent(existingId)
      await appendBlocks(existingId, blocks)
      return { id: existingId, url: `https://notion.so/${existingId.replace(/-/g, '')}`, title }
    }
    return { ...(await createPage(databaseId, title, blocks, 'database_id')), title }
  }
  return { ...(await createPage(parentPageId!, title, blocks, 'page_id')), title }
}
