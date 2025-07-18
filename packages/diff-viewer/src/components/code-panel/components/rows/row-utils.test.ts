import { describe, expect, it } from 'vitest'
import { classes } from './row-utils'

describe('row-utils', () => {
  describe('classes', () => {
    it('given mixed valid and falsy class names, when concatenated, expect only valid classes joined', () => {
      // GIVEN
      const classNames: (string | undefined | null | false)[] = ['btn', undefined, 'btn-primary', null, 'active', false]

      // WHEN
      const result = classes(...classNames)

      // EXPECT
      expect(result).toBe('btn btn-primary active')
    })
  })
})
