// Shapes of the HubSpot CRM v3 responses this integration reads.
// Every HubSpot property value arrives as a string (or null), including
// booleans ("true"/"false"), numbers ("1250.00") and dates (ISO strings).

export const HUBSPOT_DEAL_PROPERTIES = [
  'dealname',
  'amount',
  'dealstage',
  'pipeline',
  'closedate',
  'hubspot_owner_id',
  'createdate',
  'hs_lastmodifieddate',
  'hs_is_closed',
  'hs_is_closed_won',
  'hs_deal_stage_probability',
  'hs_v2_date_entered_current_stage',
] as const

export type HubSpotDealProperty = (typeof HUBSPOT_DEAL_PROPERTIES)[number]

export type HubSpotDeal = {
  id: string
  properties: Partial<Record<HubSpotDealProperty, string | null>>
  createdAt?: string
  updatedAt?: string
  archived?: boolean
}

export type HubSpotPaging = {
  next?: { after: string; link?: string }
}

export type HubSpotPage<T> = {
  results: T[]
  paging?: HubSpotPaging
}

export type HubSpotPipelineStage = {
  id: string
  label: string
  displayOrder?: number
  archived?: boolean
  /** Stage metadata values are strings, e.g. { isClosed: "true", probability: "0.2" }. */
  metadata?: Record<string, string | null | undefined>
}

export type HubSpotPipeline = {
  id: string
  label: string
  displayOrder?: number
  archived?: boolean
  stages: HubSpotPipelineStage[]
}

export type HubSpotOwner = {
  id: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  userId?: number | null
  archived?: boolean
}
