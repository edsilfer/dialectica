import { beforeEach, vi } from 'vitest'

export function setupBeforeEach(): void {
  beforeEach(() => {
    vi.clearAllMocks()
  })
}
