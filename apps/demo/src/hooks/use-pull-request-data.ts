import {
  getInlineComments,
  getPrDiff,
  getPrMetadata,
  GitHubInlineComment,
  GitHubPullRequest,
  PrKey,
} from '@diff-viewer'
import { useSettings } from '../provider/setttings-provider'
import { useAsync } from './use-async'

/**
 * Hook that fetches the pull request data and returns the metadata, raw diff, and comments.
 *
 * @param prKey - The pull request key.
 * @returns       The pull request data.
 */
export function usePullRequestData(prKey?: PrKey) {
  const { githubPat: token, useMocks } = useSettings()

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
    metadata: metadataRq.loading,
    diff: diffRq.loading,
    comments: commentsRq.loading,
  }

  const errors = {
    metadata: metadataRq.error,
    diff: diffRq.error,
    comments: commentsRq.error,
  }

  return {
    metadata: metadataRq.data,
    rawDiff: diffRq.data,
    comments: commentsRq.data,
    loading,
    errors,
  }
}
