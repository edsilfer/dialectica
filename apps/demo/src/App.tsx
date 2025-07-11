import { LineRequest, LoadMoreLinesResult, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Alert } from 'antd'
import { useCallback, useEffect, useMemo, useReducer } from 'react'

import AppToolbar from './components/AppToolbar'
import CodeReview from './components/CodeReview'
import Footer from './components/Footer'
import type { UseGetPrDiffReturn, UseGetPrMetadataReturn } from './hooks/types'
import useGetPrDiff from './hooks/use-get-pr-diff'
import useGetPrMetadata from './hooks/use-get-pr-metadata'
import useListInlineComments from './hooks/use-list-inline-comments'
import useLoadMoreLines from './hooks/use-load-more-lines'
import { useSettings } from './provider/setttings-provider'
import { initialState, prViewReducer } from './reducers'

function useStyles({ theme }: ReturnType<typeof useDiffViewerConfig>) {
  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        gap: ${theme.spacing.sm};
        padding: ${theme.spacing.md};
        background-color: ${theme.colors.hunkViewerBg};
        overflow: hidden;
      `,
      content: css`
        flex: 1;
        overflow: hidden;
      `,
    }),
    [theme],
  )
}

export default function App() {
  const config = useDiffViewerConfig()
  const styles = useStyles(config)

  const { githubPat, useMocks } = useSettings()
  const [state, dispatch] = useReducer(prViewReducer, initialState)

  useEffect(() => dispatch({ type: 'INITIALIZE_FROM_URL' }), [])

  useEffect(() => void (document.title = state.pageTitle), [state.pageTitle])
  const updateDiff = useCallback((diff: string | undefined) => {
    dispatch({ type: 'PARSE_DIFF', payload: diff })
  }, [])

  const updatePageTitle = useCallback((prTitle?: string) => {
    dispatch({ type: 'UPDATE_PAGE_TITLE', payload: prTitle })
  }, [])

  const prParams = useMemo(
    () => ({
      owner: state.selectedPr?.owner ?? '',
      repo: state.selectedPr?.repo ?? '',
      pullNumber: state.selectedPr?.prNumber ?? 0,
    }),
    [state.selectedPr],
  )

  const prMetadata = useGetPrMetadata(prParams)
  const prDiff = useGetPrDiff(prParams)
  const inlineComments = useListInlineComments(prParams)
  const { fetchLines } = useLoadMoreLines({
    ...prParams,
    githubToken: githubPat,
    baseSha: prMetadata.data?.base_sha ?? '',
    headSha: prMetadata.data?.head_sha ?? '',
  })

  useEffect(() => updateDiff(prDiff.data), [prDiff.data, updateDiff])
  useEffect(() => updatePageTitle(prMetadata.data?.title), [prMetadata.data?.title, updatePageTitle])

  const computeError = useCallback(
    (prMetadata: UseGetPrMetadataReturn, prDiff: UseGetPrDiffReturn) => {
      return !!(
        prMetadata.error ||
        prDiff.error ||
        (!prMetadata.loading && !prMetadata.data) ||
        (!prDiff.loading && !state.displayedDiff && prDiff.data)
      )
    },
    [state.displayedDiff],
  )

  const loadMore = useCallback(
    async (request: LineRequest): Promise<LoadMoreLinesResult> => {
      if (!prMetadata.data?.head_sha) {
        throw new Error('Cannot load more lines: PR metadata with head SHA is required')
      }
      return fetchLines(request)
    },
    [fetchLines, prMetadata.data?.head_sha],
  )

  return (
    <div css={styles.container}>
      <AppToolbar onSearch={(pr) => dispatch({ type: 'SELECT_PR', payload: pr })} />

      {useMocks && (
        <Alert message="All the data is mocked. You can change it in the settings." type="warning" showIcon closable />
      )}

      <div css={styles.content}>
        <CodeReview
          error={computeError(prMetadata, prDiff)}
          prMetadata={prMetadata}
          prDiff={prDiff}
          inlineComments={inlineComments}
          displayedDiff={state.displayedDiff}
          loadMore={loadMore}
        />
      </div>

      <Footer />
    </div>
  )
}
