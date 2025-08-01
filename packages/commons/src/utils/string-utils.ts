/**
 * Simple hash function to convert long strings into shorter, consistent hashes.
 *
 * @param str - The string to hash
 * @returns     The hash of the string
 */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
