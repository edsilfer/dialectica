import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { GetPrDiffRequest } from './types'
import { githubRequest } from './github-request'

/**
 * Retrieves the raw diff text of a GitHub Pull Request.
 *
 * @example
 *   const diffText = await getPrDiff({ owner: 'facebook', repo: 'react', pullNumber: 1 })
 */
export async function getPrDiff(params: GetPrDiffRequest): Promise<string> {
  const fetcher = async ({ prKey, token }: GetPrDiffRequest): Promise<string> => {
    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/${prKey.pullNumber}`
    const authToken = token && token.trim() !== '' ? token : undefined

    const res = await fetch(url, {
      headers: {
        ...buildHeaders(authToken),
        Accept: 'application/vnd.github.v3.diff',
      },
    })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return res.text()
  }

  return githubRequest<GetPrDiffRequest, string>(params, fetcher, { requestType: 'pr-diff' })
}
