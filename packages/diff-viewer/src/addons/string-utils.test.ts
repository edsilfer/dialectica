import { describe, expect, it } from 'vitest'
import { hashString } from './string-utils'

describe('hashString', () => {
  describe('basic functionality', () => {
    it('given empty string, when hashed, expect zero', () => {
      // WHEN
      const result = hashString('')

      // EXPECT
      expect(result).toBe(0)
    })

    it('given single character string, when hashed, expect positive number', () => {
      // WHEN
      const result = hashString('a')

      // EXPECT
      expect(result).toBeGreaterThan(0)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('given simple string, when hashed, expect consistent result', () => {
      // WHEN
      const result1 = hashString('hello')
      const result2 = hashString('hello')

      // EXPECT
      expect(result1).toBe(result2)
      expect(result1).toBeGreaterThan(0)
    })
  })

  describe('string characteristics', () => {
    it('given strings with different characters, when hashed, expect different results', () => {
      // WHEN
      const hash1 = hashString('hello')
      const hash2 = hashString('world')
      const hash3 = hashString('hello world')

      // EXPECT
      expect(hash1).not.toBe(hash2)
      expect(hash1).not.toBe(hash3)
      expect(hash2).not.toBe(hash3)
    })

    it('given strings with same characters in different order, when hashed, expect different results', () => {
      // WHEN
      const hash1 = hashString('hello')
      const hash2 = hashString('olleh')

      // EXPECT
      expect(hash1).not.toBe(hash2)
    })

    it('given case sensitive strings, when hashed, expect different results', () => {
      // WHEN
      const hash1 = hashString('Hello')
      const hash2 = hashString('hello')

      // EXPECT
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('edge cases', () => {
    it('given string with special characters, when hashed, expect valid result', () => {
      // WHEN
      const result = hashString('!@#$%^&*()')

      // EXPECT
      expect(result).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('given string with unicode characters, when hashed, expect valid result', () => {
      // WHEN
      const result = hashString('café 🍕')

      // EXPECT
      expect(result).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('given very long string, when hashed, expect valid result', () => {
      // WHEN
      const longString = 'a'.repeat(1000)
      const result = hashString(longString)

      // EXPECT
      expect(result).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(result)).toBe(true)
    })

    it('given string with numbers, when hashed, expect valid result', () => {
      // WHEN
      const result = hashString('12345')

      // EXPECT
      expect(result).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(result)).toBe(true)
    })
  })

  describe('hash properties', () => {
    it('given any input string, when hashed, expect result is always positive', () => {
      const testCases = ['positive', 'negative', 'zero', 'special!@#', 'unicode🚀', 'numbers123', 'spaces and tabs']

      testCases.forEach((testCase) => {
        // WHEN
        const result = hashString(testCase)

        // EXPECT
        expect(result).toBeGreaterThanOrEqual(0)
      })
    })

    it('given any input string, when hashed, expect result is always integer', () => {
      const testCases = ['integer test', 'float test', 'decimal test', 'fraction test']

      testCases.forEach((testCase) => {
        // WHEN
        const result = hashString(testCase)

        // EXPECT
        expect(Number.isInteger(result)).toBe(true)
      })
    })

    it('given same string multiple times, when hashed, expect consistent results', () => {
      // GIVEN
      const testString = 'consistency test string'

      // WHEN
      const results = Array.from({ length: 10 }, () => hashString(testString))

      // EXPECT
      const firstResult = results[0]
      results.forEach((result) => {
        expect(result).toBe(firstResult)
      })
    })
  })

  describe('hash distribution', () => {
    it('given different strings, when hashed, expect reasonable distribution', () => {
      // WHEN
      const hashes = [
        'string1',
        'string2',
        'string3',
        'string4',
        'string5',
        'string6',
        'string7',
        'string8',
        'string9',
        'string10',
      ].map(hashString)

      // EXPECT
      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBeGreaterThan(5) // Most should be unique
    })

    it('given similar strings, when hashed, expect different results', () => {
      // WHEN
      const hashes = ['test', 'test1', 'test2', 'test3', 'test4'].map(hashString)

      // EXPECT
      const uniqueHashes = new Set(hashes)
      expect(uniqueHashes.size).toBe(5) // All should be different
    })
  })
})
