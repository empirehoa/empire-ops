/**
 * Import kinds and their target fields. Pure module: safe for client components.
 *
 * The synonyms below are NOT Vantaca's column names. Vantaca's export headers
 * are unknown and vary by report, so these are only common spellings used to
 * pre-select a column. The admin sees the file's real headers and confirms or
 * changes every choice before anything is imported.
 */
export type FieldType = 'text' | 'money' | 'integer' | 'date'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  required: boolean
  /** One line shown under the field name on the mapping screen. */
  help?: string
  synonyms: string[]
}

export const IMPORT_KINDS = ['communities', 'ar_aging', 'action_items'] as const
export type ImportKind = (typeof IMPORT_KINDS)[number]

export function isImportKind(v: unknown): v is ImportKind {
  return typeof v === 'string' && (IMPORT_KINDS as readonly string[]).includes(v)
}

const ASSOCIATION_SYNONYMS = [
  'association',
  'association id',
  'association code',
  'association number',
  'association name',
  'assoc',
  'assoc id',
  'assoc code',
  'assoc name',
  'community',
  'community id',
  'community code',
  'community name',
  'vantaca id',
]

export type KindDef = {
  kind: ImportKind
  label: string
  description: string
  fields: FieldDef[]
}

export const KINDS: Record<ImportKind, KindDef> = {
  communities: {
    kind: 'communities',
    label: 'Communities',
    description: 'One row per association. Updates existing communities by Vantaca ID and adds new ones.',
    fields: [
      {
        key: 'vantaca_id',
        label: 'Vantaca ID',
        type: 'text',
        required: true,
        help: 'The association code or ID that is unique in Vantaca.',
        synonyms: [
          'vantaca id',
          'association id',
          'association code',
          'association number',
          'assoc id',
          'assoc code',
          'assoc number',
          'community id',
          'community code',
          'code',
        ],
      },
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        synonyms: ['name', 'association', 'association name', 'assoc name', 'community', 'community name', 'legal name'],
      },
      {
        key: 'community_type',
        label: 'Type',
        type: 'text',
        required: false,
        help: 'For example HOA or condominium.',
        synonyms: ['type', 'association type', 'assoc type', 'community type'],
      },
      { key: 'city', label: 'City', type: 'text', required: false, synonyms: ['city'] },
      { key: 'county', label: 'County', type: 'text', required: false, synonyms: ['county'] },
      {
        key: 'portfolio',
        label: 'Portfolio',
        type: 'text',
        required: false,
        synonyms: ['portfolio', 'portfolio name'],
      },
      {
        key: 'manager_name',
        label: 'Manager',
        type: 'text',
        required: false,
        synonyms: ['manager', 'manager name', 'community manager', 'association manager', 'assigned manager', 'cam'],
      },
      {
        key: 'doors',
        label: 'Doors',
        type: 'integer',
        required: false,
        help: 'Number of units or lots. Whole number.',
        synonyms: ['doors', 'door count', 'units', 'unit count', 'number of units', 'total units', 'lots', 'homes'],
      },
      {
        key: 'monthly_management_fee',
        label: 'Monthly management fee',
        type: 'money',
        required: false,
        help: 'Dollars per month.',
        synonyms: ['monthly management fee', 'management fee', 'mgmt fee', 'monthly fee', 'monthly mgmt fee'],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'text',
        required: false,
        help: 'Left unchanged when the cell is blank.',
        synonyms: ['status', 'association status', 'community status'],
      },
    ],
  },
  ar_aging: {
    kind: 'ar_aging',
    label: 'AR aging',
    description:
      'One row per association with its receivable balance by age. Matched to communities by Vantaca ID, then by exact name.',
    fields: [
      {
        key: 'association',
        label: 'Association',
        type: 'text',
        required: true,
        help: 'Vantaca ID or exact association name. Rows that match no community are skipped.',
        synonyms: ASSOCIATION_SYNONYMS,
      },
      {
        key: 'as_of',
        label: 'As-of date',
        type: 'date',
        required: true,
        help: 'Map a column, or set one date for the whole file below.',
        synonyms: ['as of', 'as of date', 'aging date', 'report date', 'statement date'],
      },
      {
        key: 'current_due',
        label: 'Current',
        type: 'money',
        required: false,
        help: 'Blank cells count as $0.00.',
        synonyms: ['current', 'current due', 'current balance', '0 30', '0 30 days'],
      },
      {
        key: 'days_30',
        label: '30 days',
        type: 'money',
        required: false,
        help: 'Blank cells count as $0.00.',
        synonyms: ['30', '30 days', 'over 30', 'over 30 days', '31 60', '31 60 days', '30 59', '30 59 days'],
      },
      {
        key: 'days_60',
        label: '60 days',
        type: 'money',
        required: false,
        help: 'Blank cells count as $0.00.',
        synonyms: ['60', '60 days', 'over 60', 'over 60 days', '61 90', '61 90 days', '60 89', '60 89 days'],
      },
      {
        key: 'days_90_plus',
        label: '90+ days',
        type: 'money',
        required: false,
        help: 'Blank cells count as $0.00.',
        synonyms: ['90+', '90+ days', 'over 90', 'over 90 days', '91+', '91+ days', '90 days', '90 and over'],
      },
      {
        key: 'total',
        label: 'Total',
        type: 'money',
        required: false,
        help: 'If not mapped, the sum of the mapped age columns.',
        synonyms: ['total', 'total due', 'total balance', 'balance', 'balance due', 'total ar'],
      },
    ],
  },
  action_items: {
    kind: 'action_items',
    label: 'Action items',
    description: 'One row per action item (XN). Updates existing items by XN and adds new ones.',
    fields: [
      {
        key: 'xn',
        label: 'XN',
        type: 'text',
        required: true,
        help: 'The action item number.',
        synonyms: ['xn', 'xn number', 'xn id', 'action item number', 'action item id', 'action item', 'action number', 'item number'],
      },
      {
        key: 'association',
        label: 'Association',
        type: 'text',
        required: false,
        help: 'Vantaca ID or exact association name. Rows with an association that matches no community are skipped.',
        synonyms: ASSOCIATION_SYNONYMS,
      },
      {
        key: 'category',
        label: 'Category',
        type: 'text',
        required: false,
        synonyms: ['category', 'action item category', 'action category'],
      },
      {
        key: 'item_type',
        label: 'Type',
        type: 'text',
        required: false,
        synonyms: ['type', 'item type', 'action item type', 'action type'],
      },
      {
        key: 'step',
        label: 'Step',
        type: 'text',
        required: false,
        synonyms: ['step', 'current step', 'workflow step', 'stage'],
      },
      { key: 'status', label: 'Status', type: 'text', required: false, synonyms: ['status', 'action item status'] },
      {
        key: 'opened_on',
        label: 'Opened',
        type: 'date',
        required: false,
        synonyms: ['opened', 'opened on', 'open date', 'date opened', 'opened date', 'created', 'created on', 'created date', 'date created'],
      },
      {
        key: 'closed_on',
        label: 'Closed',
        type: 'date',
        required: false,
        synonyms: ['closed', 'closed on', 'close date', 'closed date', 'date closed', 'completed date', 'date completed'],
      },
      {
        key: 'days_open',
        label: 'Days open',
        type: 'integer',
        required: false,
        synonyms: ['days open', 'age', 'age days', 'days old', 'open days'],
      },
      {
        key: 'assigned_to',
        label: 'Assigned to',
        type: 'text',
        required: false,
        synonyms: ['assigned to', 'assigned', 'assignee', 'assigned user', 'assigned employee'],
      },
    ],
  },
}

/** Field key → chosen header (exactly as in the file), or null when not mapped. */
export type Mapping = Record<string, string | null>

// ── Header matching ──────────────────────────────────────────────────────────

const ABBREVIATIONS: Record<string, string> = {
  assoc: 'association',
  assn: 'association',
  mgmt: 'management',
  mgt: 'management',
  mgr: 'manager',
  no: 'number',
  num: 'number',
  nbr: 'number',
  dt: 'date',
  amt: 'amount',
  bal: 'balance',
  cnt: 'count',
  comm: 'community',
}

/** Lowercase words: "#" → number, "+" → plus, "&" → and, abbreviations expanded. */
export function normalizeHeader(h: string): string[] {
  const s = h
    .toLowerCase()
    .replace(/#/g, ' number ')
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (s === '') return []
  return s.split(' ').map((w) => ABBREVIATIONS[w] ?? w)
}

/** 0..1 similarity between two headers after normalization. */
export function headerSimilarity(a: string, b: string): number {
  const ta = normalizeHeader(a)
  const tb = normalizeHeader(b)
  if (ta.length === 0 || tb.length === 0) return 0
  if (ta.join(' ') === tb.join(' ')) return 1
  const compact = (h: string) => h.toLowerCase().replace(/#/g, 'number').replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '')
  if (ta.join('') === tb.join('') || compact(a) === compact(b)) return 0.98
  const sa = new Set(ta)
  const sb = new Set(tb)
  let common = 0
  for (const t of sa) if (sb.has(t)) common++
  // Numbers must agree: "30 days" is never "60 days".
  const nums = (s: Set<string>) => [...s].filter((t) => /^\d+$/.test(t)).sort().join(',')
  if (nums(sa) !== nums(sb)) return 0
  const dice = (2 * common) / (sa.size + sb.size)
  return dice === 1 ? 0.95 : dice
}

export const SUGGESTION_THRESHOLD = 0.75

export type Suggestion = { field: string; header: string; score: number }

/**
 * Best-effort default mapping. Each header is suggested for at most one field
 * and each field gets at most one header; the strongest matches win.
 * Suggestions are defaults for the admin to confirm, never applied on their own.
 */
export function suggestMapping(kind: ImportKind, headers: string[]): { mapping: Mapping; suggestions: Suggestion[] } {
  const fields = KINDS[kind].fields
  const candidates: (Suggestion & { fieldIndex: number; headerIndex: number })[] = []
  fields.forEach((f, fieldIndex) => {
    const names = [f.key.replace(/_/g, ' '), f.label, ...f.synonyms]
    headers.forEach((header, headerIndex) => {
      let score = 0
      for (const name of names) score = Math.max(score, headerSimilarity(header, name))
      if (score >= SUGGESTION_THRESHOLD) candidates.push({ field: f.key, header, score, fieldIndex, headerIndex })
    })
  })
  candidates.sort(
    (a, b) =>
      b.score - a.score ||
      Number(fields[b.fieldIndex].required) - Number(fields[a.fieldIndex].required) ||
      a.fieldIndex - b.fieldIndex ||
      a.headerIndex - b.headerIndex,
  )
  const mapping: Mapping = Object.fromEntries(fields.map((f) => [f.key, null]))
  const usedHeaders = new Set<number>()
  const suggestions: Suggestion[] = []
  for (const c of candidates) {
    if (mapping[c.field] !== null || usedHeaders.has(c.headerIndex)) continue
    mapping[c.field] = c.header
    usedHeaders.add(c.headerIndex)
    suggestions.push({ field: c.field, header: c.header, score: Math.round(c.score * 100) / 100 })
  }
  return { mapping, suggestions }
}
