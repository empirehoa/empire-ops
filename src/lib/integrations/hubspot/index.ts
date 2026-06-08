export { runHubSpotSync, type HubSpotSyncOptions } from './sync'
export {
  fetchDeals,
  fetchAllDeals,
  fetchContacts,
  fetchAllContacts,
  fetchCompanies,
  fetchAllCompanies,
  fetchOwners,
  getHubSpotAccessToken,
  HubSpotAuthError,
  HubSpotRateLimitError,
  HubSpotApiError,
} from './client'
export {
  mapDealStageToLeadStage,
  HUBSPOT_STAGE_MAP,
  type HubSpotDeal,
  type HubSpotContact,
  type HubSpotCompany,
  type HubSpotOwner,
  type HubSpotSyncEntityType,
  type HubSpotSyncLogEntry,
  type HubSpotSyncResult,
} from './types'
