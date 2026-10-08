import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { ImportWizard } from '../import-wizard'

describe('ImportWizard', () => {
  it('renders the first step with labeled controls', () => {
    const html = renderToStaticMarkup(createElement(ImportWizard))
    expect(html).toContain('for="import-kind"')
    expect(html).toContain('for="import-file"')
    expect(html).toContain('AR aging')
    expect(html).toContain('up to 15 MB')
  })
})
