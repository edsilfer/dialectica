import { buildHeaders, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { GetMoreLineRequest } from './types'
import type { GitHubInlineComment } from '../models'
import { githubRequest } from './github-request'

/**
 * Retrieves the inline comments (review comments) of a GitHub Pull Request.
 */
export async function getInlineComments(params: GetMoreLineRequest): Promise<GitHubInlineComment[]> {
  const fetcher = async ({ prKey, token }: GetMoreLineRequest): Promise<GitHubInlineComment[]> => {
    const url = `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/pulls/${prKey.pullNumber}/comments`
    const githubToken = token && token.trim() !== '' ? token : undefined
    const res = await fetch(url, { cache: 'no-store', headers: buildHeaders(githubToken) })

    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await getGithubError(res)}`)
    }

    return (await res.json()) as GitHubInlineComment[]
  }

  return githubRequest<GetMoreLineRequest, GitHubInlineComment[]>(params, fetcher, { requestType: 'inline-comments' })
}
