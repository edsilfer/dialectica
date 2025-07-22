import { vi } from 'vitest'
import type { CodePanelConfigContextState } from '../components/file-list/providers/types'

export const createMockCodePanelConfig = (
  overrides: Partial<CodePanelConfigContextState> = {},
): CodePanelConfigContextState => {
  const defaults: CodePanelConfigContextState = {
    config: { mode: 'unified' as const, ignoreWhitespace: false },
    fileStateMap: new Map(),
    allFileKeys: [],
    getFileState: vi.fn().mockReturnValue({ isCollapsed: false, isViewed: false }),
    setViewed: vi.fn(),
    setCollapsed: vi.fn(),
    setAllFileKeys: vi.fn(),
    setConfig: vi.fn(),
  }
  return { ...defaults, ...overrides }
}
