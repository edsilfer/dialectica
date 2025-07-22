import { useCodePanelConfig } from '../components/code-panel/providers/code-panel-context'
import { beforeEach, vi } from 'vitest'
import { createMockCodePanelConfig } from './mock-utils'

export function setupGlobalTestMocks(): void {
  // Add any global mocks needed for diff-viewer tests
}

export function setupBeforeEach(): void {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCodePanelConfig).mockReturnValue(createMockCodePanelConfig())
  })
}
