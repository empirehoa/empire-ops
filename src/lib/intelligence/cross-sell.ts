// Cross-sell signals: Vantaca action items whose category or type mentions work
// one of the Riance LLC companies does. A match is a lead for a conversation,
// not a sale or a dollar estimate. Each association is listed separately.

import { isOpenItem, type ActionItemInput } from './action-items'
import { addDays, byIdMap, parseDate, portfolioCommunities, type CommunityInput } from './shared'

export type CrossSellCompany = 'wfw' | 'fixiq' | 'riance-realty'

export type CrossSellRule = {
  company: CrossSellCompany
  companyName: string
  keywords: string[]
  pattern: RegExp
}

export const CROSS_SELL_RULES: CrossSellRule[] = [
  {
    company: 'wfw',
    companyName: 'Wind Fire & Water',
    keywords: ['water', 'leak', 'mold', 'flood', 'fire', 'storm'],
    pattern: /\b(water|leak(?:s|ing|age)?|mold|mould|flood(?:s|ing|ed)?|fires?|storms?)\b/gi,
  },
  {
    company: 'fixiq',
    companyName: 'FixIQ',
    keywords: ['repair', 'maintenance', 'handyman', 'landscape', 'paint', 'pressure wash'],
    pattern: /\b(repairs?|maintenance|handyman|landscap(?:e|es|ing)|paint(?:s|ing)?|pressure[\s-]?wash(?:es|ing)?)\b/gi,
  },
  {
    company: 'riance-realty',
    companyName: 'Riance Realty',
    keywords: ['sale', 'resale', 'estoppel', 'closing'],
    pattern: /\b(sales?|resales?|estoppels?|closings?)\b/gi,
  },
]

/** Items count if still open, or opened within this many days. */
export const CROSS_SELL_WINDOW_DAYS = 90

/** Which rules an item's category/type text matches, with the matched words (lowercased). */
export function matchItem(item: Pick<ActionItemInput, 'category' | 'item_type'>): Array<{ rule: CrossSellRule; words: string[] }> {
  const text = [item.category, item.item_type].filter(Boolean).join(' ')
  if (!text) return []
  const out: Array<{ rule: CrossSellRule; words: string[] }> = []
  for (const rule of CROSS_SELL_RULES) {
    const words = [...text.matchAll(rule.pattern)].map((m) => m[0].toLowerCase().replace(/\s+/g, ' '))
    if (words.length > 0) out.push({ rule, words: [...new Set(words)] })
  }
  return out
}

export type CrossSellSample = {
  xn: string
  category: string | null
  itemType: string | null
  openedOn: string | null
  open: boolean
}

export type CrossSellCommunityMatch = {
  communityId: string
  name: string
  manager: string | null
  company: CrossSellCompany
  companyName: string
  count: number
  openCount: number
  keywords: string[]
  samples: CrossSellSample[]
}

export type CrossSellResult = {
  windowDays: number
  totalMatches: number
  byCompany: Array<{ company: CrossSellCompany; companyName: string; matches: number; communities: number }>
  byCommunity: CrossSellCommunityMatch[]
}

export function matchCrossSell(
  items: ActionItemInput[],
  communities: CommunityInput[],
  now: Date,
  options: { samplesPerMatch?: number } = {},
): CrossSellResult {
  const samplesPerMatch = options.samplesPerMatch ?? 3
  const portfolio = byIdMap(portfolioCommunities(communities))
  const since = addDays(now, -CROSS_SELL_WINDOW_DAYS)
  const groups = new Map<string, CrossSellCommunityMatch>()

  for (const item of items) {
    const community = item.community_id ? portfolio.get(item.community_id) : undefined
    if (!community) continue
    const open = isOpenItem(item)
    const opened = parseDate(item.opened_on)
    if (!open && !(opened && opened >= since)) continue

    for (const { rule, words } of matchItem(item)) {
      const key = `${community.id}:${rule.company}`
      const g = groups.get(key) ?? {
        communityId: community.id,
        name: community.name,
        manager: community.manager_name,
        company: rule.company,
        companyName: rule.companyName,
        count: 0,
        openCount: 0,
        keywords: [],
        samples: [],
      }
      g.count++
      if (open) g.openCount++
      for (const w of words) if (!g.keywords.includes(w)) g.keywords.push(w)
      if (g.samples.length < samplesPerMatch) {
        g.samples.push({ xn: item.xn, category: item.category, itemType: item.item_type, openedOn: item.opened_on, open })
      }
      groups.set(key, g)
    }
  }

  const byCommunity = [...groups.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const byCompany = CROSS_SELL_RULES.map((rule) => {
    const rows = byCommunity.filter((g) => g.company === rule.company)
    return {
      company: rule.company,
      companyName: rule.companyName,
      matches: rows.reduce((s, g) => s + g.count, 0),
      communities: rows.length,
    }
  })

  return {
    windowDays: CROSS_SELL_WINDOW_DAYS,
    totalMatches: byCompany.reduce((s, c) => s + c.matches, 0),
    byCompany,
    byCommunity,
  }
}
