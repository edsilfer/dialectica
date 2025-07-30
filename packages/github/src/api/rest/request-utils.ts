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

/** Small helper – works in the browser and Node  */
export const decodeBase64 = (b64: string) => {
  try {
    return atob(b64.replace(/\s/g, ''))
  } catch {
    // Handle Buffer for Node.js environments: use globalThis to access Buffer in a type-safe way
    const globalObj = globalThis as typeof globalThis & {
      Buffer?: {
        from: (str: string, encoding: string) => { toString: (encoding: string) => string }
      }
    }
    if (globalObj.Buffer) {
      return globalObj.Buffer.from(b64, 'base64').toString('utf-8')
    }
    throw new Error('Base64 decoding failed and Buffer is not available')
  }
}
