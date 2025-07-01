/**
 * Get a value from localStorage.
 *
 * @param key          - The key to get the value for.
 * @param defaultValue - The default value to return if the key is not found.
 * @returns              The value from localStorage.
 */
export const getStorageValue = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue

  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : defaultValue
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * Set a value in localStorage.
 *
 * @param key   - The key to set the value for.
 * @param value - The value to set.
 */
export const setStorageValue = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage:`, error)
  }
}
