import { setupAntdMocks } from './antd-utils'

/**
 * Sets up global mocks for the entire test environment.
 * This function should be called from the `vitest.setup.ts` file.
 */
export function setupGlobalTestMocks(): void {
  // Mock the antd library globally
  setupAntdMocks()
}
