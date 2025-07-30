import { githubRequest } from './github-request'
import { buildHeaders, decodeBase64, getGithubError, GITHUB_API_HOST } from './request-utils'
import type { GetFileContentRequest, GitHubFileContentResponse } from './types'

/**
 * Retrieves the content of a file from a GitHub repository at a specific commit SHA.
 */
export async function getFileContent(params: GetFileContentRequest): Promise<string> {
  const fetcher = async ({ prKey, token, filePath, sha }: GetFileContentRequest): Promise<string> => {
    if (!filePath || !sha) {
      throw new Error('filePath and sha are required')
    }

    const fileRes = await fetch(
      `${GITHUB_API_HOST}/repos/${prKey.owner}/${prKey.repo}/contents/${encodeURIComponent(filePath)}?ref=${sha}`,
      { headers: buildHeaders(token) },
    )

    // Handle 404s gracefully for new/deleted files
    if (!fileRes.ok) {
      if (fileRes.status === 404) return ''
      const errorMessage = await getGithubError(fileRes)
      throw new Error(errorMessage)
    }

    const fileJson = (await fileRes.json()) as GitHubFileContentResponse
    const content = decodeBase64(fileJson.content)
    return content
  }

  return githubRequest<GetFileContentRequest, string>(params, fetcher, { requestType: 'file-content' })
}
