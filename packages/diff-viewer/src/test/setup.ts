import { useCodePanelConfig } from '../components/code-panel/providers/code-panel-context'
import { beforeEach, vi } from 'vitest'
import { createMockCodePanelConfig } from './mock-utils'


export function setupBeforeEach(): void {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCodePanelConfig).mockReturnValue(createMockCodePanelConfig())
  })
}
