import { LineRequest, LoadMoreLinesResult } from '@diff-viewer'
import {
  getInlineComments,
  getMoreLines,
  getPrDiff,
  getPrMetadata,
  getUserData,
  GitHubInlineComment,
  GitHubPullRequest,
  GitHubUser,
  PrKey,
} from '@diff-viewer-addons'
import { useCallback } from 'react'
import { useSettings } from '../../provider/setttings-provider'
import { useAsync } from '../use-async'

/**
 * Hook that fetches the pull request data and returns the metadata and raw diff.
 *
 * @param prKey - The pull request key.
 * @returns      The pull request data.
 */
export function usePrData(prKey?: PrKey) {
  const { githubPat: token, useMocks, setCurrentUser } = useSettings()

  const userReq = useAsync<GitHubUser>(true, [token, useMocks], async () => {
    const data = await getUserData({ token, useMocks })
    if (data) {
      setCurrentUser({
        id: data.id,
        name: data.name || undefined,
        login: data.login,
        avatar_url: data.avatar_url,
      })
    }
    return data
  })

  const metadataRq = useAsync<GitHubPullRequest>(!!prKey, [prKey, token, useMocks], async () => {
    const data = await getPrMetadata({ prKey: prKey!, token, useMocks })
    document.title = data.title ?? 'Diff Viewer Demo'
    return data
  })

  const diffRq = useAsync<string>(!!prKey && !!metadataRq.data, [prKey, metadataRq.data, token, useMocks], () =>
    getPrDiff({ prKey: prKey!, token, useMocks }),
  )
  const commentsRq = useAsync<GitHubInlineComment[]>(
    !!prKey && !!metadataRq.data && !!diffRq.data,
    [prKey, metadataRq.data, diffRq.data, token, useMocks],
    () => getInlineComments({ prKey: prKey!, token, useMocks }),
  )

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

  /**
   * Load more lines from the pull request.
   *
   * @param request - The request to load more lines.
   * @returns         The result of the load more lines request.
   */
  const loadMore = useCallback(
    async (request: LineRequest): Promise<LoadMoreLinesResult> => {
      if (!metadataRq.data?.base?.sha || !metadataRq.data?.head?.sha || !prKey) {
        throw new Error('Cannot load more lines: missing commit SHAs or PR key')
      }
      return getMoreLines(
        {
          prKey,
          token,
          useMocks,
          baseSha: metadataRq.data.base.sha,
          headSha: metadataRq.data.head.sha,
        },
        request,
      )
    },
    [metadataRq.data?.base?.sha, metadataRq.data?.head?.sha, prKey, token, useMocks],
  )

  return {
    user: userReq.data,
    metadata: metadataRq.data,
    rawDiff: diffRq.data,
    comments: commentsRq.data,
    loading,
    errors,
    loadMore,
  }
}
