import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CommunitiesTable, type CommunityListRow } from '../communities-table'

const row = (over: Partial<CommunityListRow>): CommunityListRow => ({
  id: 'id',
  vantaca_id: 'X',
  name: 'Name',
  community_type: null,
  portfolio: null,
  manager_name: null,
  doors: null,
  status: 'active',
  is_test: false,
  ...over,
})

describe('CommunitiesTable', () => {
  it('shows counts and a labeled switch per row', () => {
    const html = renderToStaticMarkup(
      createElement(CommunitiesTable, {
        initialRows: [
          row({ id: 'a', name: 'Sample A', doors: 1200 }),
          row({ id: 'b', name: 'Sample Test', is_test: true }),
        ],
      }),
    )
    expect(html).toContain('>2</span> communities')
    expect(html).toContain('>1</span> marked as test')
    expect(html).toContain('aria-label="Test association: Sample A"')
    expect(html).toContain('aria-checked="true"')
    expect(html).toContain('1,200')
  })
})
