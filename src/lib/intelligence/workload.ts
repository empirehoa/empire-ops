// Manager workload: what each community manager carries, from the Vantaca
// community list (manager_name), open action items, and the latest AR snapshot.

import { AGED_ITEM_DAYS, isOpenItem, itemAgeDays, type ActionItemInput } from './action-items'
import { latestSnapshotPerCommunity, type ArSnapshotInput } from './ar'
import { activeCommunities, num, type CommunityInput } from './shared'

export const UNASSIGNED_MANAGER = 'No manager listed'

export type ManagerWorkload = {
  manager: string
  communities: number
  doors: number
  /** Associations in this book with no door count. */
  communitiesMissingDoors: number
  openItems: number
  agedItems: number
  ar90Plus: number
}

export function computeManagerWorkload(
  communities: CommunityInput[],
  items: ActionItemInput[],
  snapshots: ArSnapshotInput[],
  now: Date,
): ManagerWorkload[] {
  const active = activeCommunities(communities)
  const managerOf = new Map(active.map((c) => [c.id, c.manager_name?.trim() || UNASSIGNED_MANAGER]))
  const rows = new Map<string, ManagerWorkload>()
  const get = (manager: string) => {
    const r = rows.get(manager) ?? {
      manager,
      communities: 0,
      doors: 0,
      communitiesMissingDoors: 0,
      openItems: 0,
      agedItems: 0,
      ar90Plus: 0,
    }
    rows.set(manager, r)
    return r
  }

  for (const c of active) {
    const r = get(managerOf.get(c.id)!)
    r.communities++
    const doors = num(c.doors)
    if (doors === null) r.communitiesMissingDoors++
    else r.doors += doors
  }
  for (const item of items) {
    const manager = item.community_id ? managerOf.get(item.community_id) : undefined
    if (!manager || !isOpenItem(item)) continue
    const r = get(manager)
    r.openItems++
    const age = itemAgeDays(item, now)
    if (age !== null && age >= AGED_ITEM_DAYS) r.agedItems++
  }
  const latest = latestSnapshotPerCommunity(snapshots.filter((s) => managerOf.has(s.community_id)))
  for (const [communityId, s] of latest) get(managerOf.get(communityId)!).ar90Plus += num(s.days_90_plus) ?? 0

  return [...rows.values()].sort((a, b) => b.doors - a.doors || b.communities - a.communities)
}
