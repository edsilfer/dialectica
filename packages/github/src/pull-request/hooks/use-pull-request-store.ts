import { useAsync } from '@commons'
import { LineRequest, LoadMoreLinesResult } from '@edsilfer/diff-viewer'
import { GitHubInlineComment, GitHubPullRequest, GitHubUser, PrKey } from '@github'
import { useCallback, useMemo } from 'react'
import { PullRequestRemoteStore } from '../data/PullRequestRemoteStore'
import { PullRequestRepository } from '../data/PullRequestRepository'

/**
 * Fetches pull request data
 *
 * @param prKey    - The pull request key
 * @param token    - The GitHub token for API authentication
 * @param useMocks - Whether to use mock data instead of real API calls
 * @param setTitle - Whether to set the document title (default: true)
 * @returns The pull request data with loading states, errors, and operations
 */
export function usePullRequestStore(prKey?: PrKey, token?: string, useMocks?: boolean, setTitle: boolean = true) {
  const repository = useMemo(() => {
    const remoteStore = new PullRequestRemoteStore(token, useMocks)
    return new PullRequestRepository(remoteStore)
  }, [token, useMocks])

  // REQUESTS ---------------------------------------------------------------------------------------------
  const userReq = useAsync<GitHubUser>(true, [token, useMocks], async () => {
    const data = await repository.readUser()
    return data
  })

  const metadataRq = useAsync<GitHubPullRequest>(!!prKey, [prKey, token, useMocks], async () => {
    const data = await repository.readMetadata(prKey!)
    if (setTitle) {
      document.title = data.title ?? 'Diff Viewer Demo'
    }
    return data
  })

  const diffRq = useAsync<string>(!!prKey && !!metadataRq.data, [prKey, metadataRq.data, token, useMocks], async () =>
    repository.readDiff(prKey!),
  )

  const commentsRq = useAsync<GitHubInlineComment[]>(
    !!prKey && !!metadataRq.data && !!diffRq.data,
    [prKey, metadataRq.data, diffRq.data, token, useMocks],
    async () => repository.listComments(prKey!),
  )

  const loadMoreLines = useCallback(
    async (request: LineRequest): Promise<LoadMoreLinesResult> => {
      if (!metadataRq.data?.base?.sha || !metadataRq.data?.head?.sha || !prKey) {
        throw new Error('Cannot load more lines: missing commit SHAs or PR key')
      }
      return repository.loadLines(prKey, metadataRq.data.base.sha, metadataRq.data.head.sha, request)
    },
    [metadataRq.data?.base?.sha, metadataRq.data?.head?.sha, prKey, token, useMocks],
  )

  // RESPONSES ---------------------------------------------------------------------------------------------
  const loading = {
    user: userReq.loading,
    metadata: metadataRq.loading,
    diff: diffRq.loading,
    comments: commentsRq.loading,
  }

  const errors = {
    user: userReq.error,
    metadata: metadataRq.error,
    diff: diffRq.error,
    comments: commentsRq.error,
  }

  return {
    user: userReq.data,
    metadata: metadataRq.data,
    diff: diffRq.data,
    comments: commentsRq.data,
    loading,
    errors,
    loadMoreLines,
  }
}
