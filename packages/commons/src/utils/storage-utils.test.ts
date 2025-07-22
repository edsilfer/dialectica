// MOCKS
const mockGetItem = vi.fn()
const mockSetItem = vi.fn()
const mockConsoleWarn = vi.fn()

// UTILS
const setupLocalStorageMock = () => {
  vi.stubGlobal('window', {
    localStorage: {
      getItem: mockGetItem,
      setItem: mockSetItem,
    },
  })
  vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn)
}

const setupNoWindowEnvironment = () => {
  vi.stubGlobal('window', undefined)
}

const resetMocks = () => {
  mockGetItem.mockReset()
  mockSetItem.mockReset()
  mockConsoleWarn.mockReset()
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readStorageValue, writeStorageValue } from './storage-utils'

describe('storage-utils', () => {
  beforeEach(() => {
    resetMocks()
    setupLocalStorageMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('readStorageValue', () => {
    it('given valid JSON in localStorage, when reading, expect parsed value', () => {
      // MOCK
      mockGetItem.mockReturnValue('{"name":"test","value":123}')

      // GIVEN
      const key = 'test-key'
      const defaultValue = null

      // WHEN
      const result = readStorageValue(key, defaultValue)

      // EXPECT
      expect(mockGetItem).toHaveBeenCalledWith(key)
      expect(result).toEqual({ name: 'test', value: 123 })
    })

    it('given missing key in localStorage, when reading, expect default value', () => {
      // MOCK
      mockGetItem.mockReturnValue(null)

      // GIVEN
      const key = 'missing-key'
      const defaultValue = { fallback: true }

      // WHEN
      const result = readStorageValue(key, defaultValue)

      // EXPECT
      expect(mockGetItem).toHaveBeenCalledWith(key)
      expect(result).toBe(defaultValue)
    })

    it('given invalid JSON in localStorage, when reading, expect default value and warning', () => {
      // MOCK
      mockGetItem.mockReturnValue('invalid-json{')

      // GIVEN
      const key = 'invalid-key'
      const defaultValue = { error: true }

      // WHEN
      const result = readStorageValue(key, defaultValue)

      // EXPECT
      expect(mockGetItem).toHaveBeenCalledWith(key)
      expect(result).toBe(defaultValue)
      expect(mockConsoleWarn).toHaveBeenCalledWith(`Failed to read ${key} from localStorage:`, expect.any(Error))
    })

    it('given no window object, when reading, expect default value', () => {
      // MOCK
      setupNoWindowEnvironment()

      // GIVEN
      const key = 'test-key'
      const defaultValue = { noWindow: true }

      // WHEN
      const result = readStorageValue(key, defaultValue)

      // EXPECT
      expect(result).toBe(defaultValue)
      expect(mockGetItem).not.toHaveBeenCalled()
    })

    it('given localStorage throws error, when reading, expect default value and warning', () => {
      // MOCK
      const error = new Error('localStorage access denied')
      mockGetItem.mockImplementation(() => {
        throw error
      })

      // GIVEN
      const key = 'error-key'
      const defaultValue = { error: true }

      // WHEN
      const result = readStorageValue(key, defaultValue)

      // EXPECT
      expect(result).toBe(defaultValue)
      expect(mockConsoleWarn).toHaveBeenCalledWith(`Failed to read ${key} from localStorage:`, error)
    })

    it('given null default value, when key missing, expect null', () => {
      // MOCK
      mockGetItem.mockReturnValue(null)

      // GIVEN
      const key = 'missing-key'

      // WHEN
      const result = readStorageValue(key)

      // EXPECT
      expect(result).toBeNull()
    })
  })

  describe('writeStorageValue', () => {
    it('given valid value, when writing, expect localStorage setItem called with stringified value', () => {
      // GIVEN
      const key = 'test-key'
      const value = { name: 'test', count: 42 }

      // WHEN
      writeStorageValue(key, value)

      // EXPECT
      expect(mockSetItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })

    it('given no window object, when writing, expect no localStorage interaction', () => {
      // MOCK
      setupNoWindowEnvironment()

      // GIVEN
      const key = 'test-key'
      const value = { test: true }

      // WHEN
      writeStorageValue(key, value)

      // EXPECT
      expect(mockSetItem).not.toHaveBeenCalled()
    })

    it('given localStorage throws error, when writing, expect warning logged', () => {
      // MOCK
      const error = new Error('localStorage quota exceeded')
      mockSetItem.mockImplementation(() => {
        throw error
      })

      // GIVEN
      const key = 'error-key'
      const value = { large: 'data' }

      // WHEN
      writeStorageValue(key, value)

      // EXPECT
      expect(mockSetItem).toHaveBeenCalledWith(key, JSON.stringify(value))
      expect(mockConsoleWarn).toHaveBeenCalledWith(`Failed to write ${key} to localStorage:`, error)
    })

    it('given complex object, when writing, expect JSON stringified correctly', () => {
      // GIVEN
      const key = 'complex-key'
      const value = {
        nested: { deep: { object: true } },
        array: [1, 2, 3],
        null: null,
        boolean: false,
      }

      // WHEN
      writeStorageValue(key, value)

      // EXPECT
      expect(mockSetItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })
  })
})
