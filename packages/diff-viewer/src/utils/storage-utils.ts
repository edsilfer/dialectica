/*
 * Utility helpers for persisting JSON-serialisable data.
 *
 * These helpers centralise localStorage access and JSON (de)serialization so
 * individual modules don't have to repeat boilerplate or error-handling logic.
 * They are deliberately small and opinionated: we silently fall back to the
 * provided default value (or `null`) when running in non-browser environments
 * or when parsing fails.
 */

export type WebStorage = 'local' | 'in-memory'

/**
 * Read a JSON-serialisable value from localStorage.
 *
 * @param key          Storage key.
 * @param defaultValue Fallback when the key is absent or can't be read.
 */
export const readStorageValue = <T>(key: string, defaultValue: T | null = null): T | null => {
  if (typeof window === 'undefined') return defaultValue

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : defaultValue
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * Write a JSON-serialisable value to localStorage.
 *
 * @param key   Storage key.
 * @param value Any JSON-serialisable value.
 */
export const writeStorageValue = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage:`, error)
  }
}
