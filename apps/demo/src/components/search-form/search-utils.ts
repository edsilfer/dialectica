import { ParsedPR } from './types'

const PR_URL_REGEX = /^(?:https?:\/\/)?github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/

/**
 * Parse a GitHub pull-request URL (optionally prefixed with http/https)
 *
 * @param value - The URL to parse
 * @returns       The parsed PR object or null if the URL is invalid
 */
export const parse = (value: string): ParsedPR | null => {
  const trimmed = value.trim()
  const match = trimmed.match(PR_URL_REGEX)
  if (!match) return null
  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3], 10),
  }
}
