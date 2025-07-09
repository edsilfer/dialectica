import { vi, beforeEach } from 'vitest'
import { useCodePanelConfig } from '../../index'
import { createMockCodePanelConfig, setupAntdMocks } from './antd-utils'

/**
 * Sets up global mocks for the entire test environment.
 * This function should be called from the `vitest.setup.ts` file.
 */
export function setupGlobalTestMocks(): void {
  // Mock the antd library globally
  setupAntdMocks()

  // Mock global hooks and utilities
  vi.mock('../../index', () => ({
    useCodePanelConfig: vi.fn(),
  }))
}

/**
 * Sets up a clean-slate environment before each test.
 * This function should be called from the `vitest.setup.ts` file.
 */
export function setupBeforeEach(): void {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Reset the useCodePanelConfig mock to a default state
    vi.mocked(useCodePanelConfig).mockReturnValue(createMockCodePanelConfig())
  })
}
