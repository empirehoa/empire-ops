// ---------------------------------------------------------------------------
// HubSpot CRM API types
// ---------------------------------------------------------------------------

/** HubSpot API paginated response envelope */
export type HubSpotPaginatedResponse<T> = {
  results: T[]
  paging?: {
    next?: {
      after: string
      link: string
    }
  }
}

/** HubSpot deal object */
export type HubSpotDeal = {
  id: string
  properties: {
    dealname: string | null
    amount: string | null
    dealstage: string | null
    pipeline: string | null
    closedate: string | null
    createdate: string | null
    hs_lastmodifieddate: string | null
    hubspot_owner_id: string | null
    description: string | null
    num_associated_contacts: string | null
    [key: string]: string | null | undefined
  }
  createdAt: string
  updatedAt: string
  archived: boolean
}

/** HubSpot contact object */
export type HubSpotContact = {
  id: string
  properties: {
    firstname: string | null
    lastname: string | null
    email: string | null
    phone: string | null
    jobtitle: string | null
    company: string | null
    city: string | null
    state: string | null
    zip: string | null
    address: string | null
    createdate: string | null
    hs_lastmodifieddate: string | null
    hubspot_owner_id: string | null
    [key: string]: string | null | undefined
  }
  createdAt: string
  updatedAt: string
  archived: boolean
}

/** HubSpot company object */
export type HubSpotCompany = {
  id: string
  properties: {
    name: string | null
    domain: string | null
    phone: string | null
    city: string | null
    state: string | null
    zip: string | null
    address: string | null
    numberofemployees: string | null
    annualrevenue: string | null
    industry: string | null
    createdate: string | null
    hs_lastmodifieddate: string | null
    hubspot_owner_id: string | null
    [key: string]: string | null | undefined
  }
  createdAt: string
  updatedAt: string
  archived: boolean
}

/** HubSpot owner object (used to resolve hubspot_owner_id) */
export type HubSpotOwner = {
  id: string
  email: string
  firstName: string
  lastName: string
}

/** Sync entity types supported by HubSpot integration */
export type HubSpotSyncEntityType = 'deals' | 'contacts' | 'companies'

/** Sync log entry for tracking sync progress */
export type HubSpotSyncLogEntry = {
  entity_type: HubSpotSyncEntityType
  direction: 'pull'
  started_at: string
  completed_at: string | null
  records_processed: number
  records_created: number
  records_updated: number
  records_skipped: number
  records_failed: number
  error_message: string | null
  status: 'running' | 'completed' | 'failed'
}

/** HubSpot deal stage to Vera lead stage mapping */
export const HUBSPOT_STAGE_MAP: Record<string, string> = {
  // Default HubSpot deal pipeline stages
  appointmentscheduled: 'new',
  qualifiedtobuy: 'qualified',
  presentationscheduled: 'proposal',
  decisionmakerboughtin: 'negotiation',
  contractsent: 'negotiation',
  closedwon: 'won',
  closedlost: 'lost',
  // Common custom stages
  new: 'new',
  'new deal': 'new',
  lead: 'new',
  prospect: 'new',
  contacted: 'contacted',
  qualified: 'qualified',
  proposal: 'proposal',
  'proposal sent': 'proposal',
  negotiation: 'negotiation',
  won: 'won',
  lost: 'lost',
  closed: 'won',
}

/** Map a HubSpot dealstage value to a Vera lead stage */
export function mapDealStageToLeadStage(hubspotStage: string | null): string {
  if (!hubspotStage) return 'new'
  const normalized = hubspotStage.toLowerCase().replace(/[\s_-]+/g, '')
  return HUBSPOT_STAGE_MAP[normalized] ?? 'new'
}

/** Full sync result */
export type HubSpotSyncResult = {
  started_at: string
  completed_at: string
  entity_results: Partial<Record<HubSpotSyncEntityType, HubSpotSyncLogEntry>>
  totals: {
    processed: number
    created: number
    updated: number
    skipped: number
    failed: number
  }
}
