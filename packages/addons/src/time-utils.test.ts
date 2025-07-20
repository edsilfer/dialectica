import { describe, expect, it, vi, beforeEach } from 'vitest'
import { formatTimestamp } from './time-utils'

describe('formatTimestamp', () => {
  let mockDate: Date

  beforeEach(() => {
    // Mock the current date to ensure consistent test results
    mockDate = new Date('2024-01-15T12:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  describe('recent timestamps (less than 1 hour)', () => {
    const testCases = [
      {
        description: 'timestamp 30 minutes ago',
        timestamp: '2024-01-15T11:30:00.000Z',
        expected: 'just now',
      },
      {
        description: 'timestamp 59 minutes ago',
        timestamp: '2024-01-15T11:01:00.000Z',
        expected: 'just now',
      },
      {
        description: 'timestamp 0 minutes ago (current time)',
        timestamp: '2024-01-15T12:00:00.000Z',
        expected: 'just now',
      },
    ]

    testCases.forEach(({ description, timestamp, expected }) => {
      it(`given ${description}, when formatted, expect "${expected}"`, () => {
        // WHEN
        const result = formatTimestamp(timestamp)

        // EXPECT
        expect(result).toBe(expected)
      })
    })
  })

  describe('hour-based timestamps (1-23 hours)', () => {
    const testCases = [
      {
        description: 'timestamp 1 hour ago',
        timestamp: '2024-01-15T11:00:00.000Z',
        expected: '1 hour ago',
      },
      {
        description: 'timestamp 2 hours ago',
        timestamp: '2024-01-15T10:00:00.000Z',
        expected: '2 hours ago',
      },
      {
        description: 'timestamp 23 hours ago',
        timestamp: '2024-01-14T13:00:00.000Z',
        expected: '23 hours ago',
      },
      {
        description: 'timestamp 12.5 hours ago (should round down)',
        timestamp: '2024-01-14T23:30:00.000Z',
        expected: '12 hours ago',
      },
    ]

    testCases.forEach(({ description, timestamp, expected }) => {
      it(`given ${description}, when formatted, expect "${expected}"`, () => {
        // WHEN
        const result = formatTimestamp(timestamp)

        // EXPECT
        expect(result).toBe(expected)
      })
    })
  })

  describe('day-based timestamps (24+ hours)', () => {
    const testCases = [
      {
        description: 'timestamp 1 day ago',
        timestamp: '2024-01-14T12:00:00.000Z',
        expected: '1 day ago',
      },
      {
        description: 'timestamp 2 days ago',
        timestamp: '2024-01-13T12:00:00.000Z',
        expected: '2 days ago',
      },
      {
        description: 'timestamp 7 days ago',
        timestamp: '2024-01-08T12:00:00.000Z',
        expected: '7 days ago',
      },
      {
        description: 'timestamp 25 hours ago (should round down to 1 day)',
        timestamp: '2024-01-14T11:00:00.000Z',
        expected: '1 day ago',
      },
      {
        description: 'timestamp 48.5 hours ago (should round down to 2 days)',
        timestamp: '2024-01-13T11:30:00.000Z',
        expected: '2 days ago',
      },
    ]

    testCases.forEach(({ description, timestamp, expected }) => {
      it(`given ${description}, when formatted, expect "${expected}"`, () => {
        // WHEN
        const result = formatTimestamp(timestamp)

        // EXPECT
        expect(result).toBe(expected)
      })
    })
  })

  describe('edge cases and boundary conditions', () => {
    it('given timestamp exactly 1 hour ago, when formatted, expect "1 hour ago"', () => {
      // GIVEN
      const timestamp = '2024-01-15T11:00:00.000Z'

      // WHEN
      const result = formatTimestamp(timestamp)

      // EXPECT
      expect(result).toBe('1 hour ago')
    })

    it('given timestamp exactly 24 hours ago, when formatted, expect "1 day ago"', () => {
      // GIVEN
      const timestamp = '2024-01-14T12:00:00.000Z'

      // WHEN
      const result = formatTimestamp(timestamp)

      // EXPECT
      expect(result).toBe('1 day ago')
    })

    it('given timestamp with milliseconds, when formatted, expect correct calculation', () => {
      // GIVEN
      const timestamp = '2024-01-15T11:30:45.123Z'

      // WHEN
      const result = formatTimestamp(timestamp)

      // EXPECT
      expect(result).toBe('just now')
    })

    it('given timestamp in different timezone format, when formatted, expect correct calculation', () => {
      // GIVEN
      const timestamp = '2024-01-15T11:00:00+00:00'

      // WHEN
      const result = formatTimestamp(timestamp)

      // EXPECT
      expect(result).toBe('1 hour ago')
    })
  })

  describe('future timestamps', () => {
    it('given future timestamp, when formatted, expect "just now"', () => {
      // GIVEN
      const timestamp = '2024-01-15T13:00:00.000Z' // 1 hour in the future

      // WHEN
      const result = formatTimestamp(timestamp)

      // EXPECT
      expect(result).toBe('just now')
    })

    it('given timestamp 1 minute in future, when formatted, expect "just now"', () => {
      // GIVEN
      const timestamp = '2024-01-15T12:01:00.000Z'

      // WHEN
      const result = formatTimestamp(timestamp)

      // EXPECT
      expect(result).toBe('just now')
    })
  })

  describe('invalid input handling', () => {
    it('given invalid date string, when formatted, expect "NaN day ago"', () => {
      // GIVEN
      const invalidTimestamp = 'invalid-date'

      // WHEN
      const result = formatTimestamp(invalidTimestamp)

      // EXPECT
      expect(result).toBe('NaN day ago')
    })

    it('given empty string, when formatted, expect "NaN day ago"', () => {
      // GIVEN
      const emptyTimestamp = ''

      // WHEN
      const result = formatTimestamp(emptyTimestamp)

      // EXPECT
      expect(result).toBe('NaN day ago')
    })

    it('given null string, when formatted, expect "19737 days ago"', () => {
      // GIVEN
      const nullTimestamp = null as unknown as string

      // WHEN
      const result = formatTimestamp(nullTimestamp)

      // EXPECT
      expect(result).toBe('19737 days ago')
    })

    it('given undefined string, when formatted, expect "NaN day ago"', () => {
      // GIVEN
      const undefinedTimestamp = undefined as unknown as string

      // WHEN
      const result = formatTimestamp(undefinedTimestamp)

      // EXPECT
      expect(result).toBe('NaN day ago')
    })
  })
})
