/** GitHub REST API host */
export const GITHUB_API_HOST = 'https://api.github.com'

/** Latest GA version of the GitHub REST API we want to target */
export const GITHUB_API_VERSION = '2022-11-28'

/**
 * Builds the headers object for GitHub requests.
 *
 * @param token - The GitHub token to use for the request.
 * @returns       The headers object.
 */
export const buildHeaders = (token?: string): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  'X-GitHub-Api-Version': GITHUB_API_VERSION,
})

/**
 * Extracts the error message from a failing GitHub fetch call.
 *
 * @param res - The response from the GitHub API.
 * @returns     The error message.
 */
export async function getGithubError(res: Response): Promise<string> {
  try {
    const { message } = (await res.json()) as { message?: string }
    return message ?? res.statusText
  } catch {
    return res.statusText
  }
}
