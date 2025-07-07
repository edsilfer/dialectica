import {
  DefaultToolbar,
  DiffViewer,
  LineRequest,
  ParsedDiff,
  PullRequestHeader,
  useDiffViewerConfig,
} from '@diff-viewer'
import { css } from '@emotion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppToolbar from './components/AppToolbar'
import ErrorCard from './components/ErrorCard'
import Footer from './components/Footer'
import InfoCard from './components/InfoCard'
import { ParsedPR } from './components/search-form/types'
import useGetPrDiff from './hooks/use-get-pr-diff'
import useGetPrMetadata from './hooks/use-get-pr-metadata'
import useLoadMoreLines from './hooks/use-load-more-lines'
import { useSettings } from './provider/setttings-provider'
import { parseURL, setURL } from './utils'

const createStyles = (theme: ReturnType<typeof useDiffViewerConfig>['theme']) => ({
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
})

export default function App() {
  const { theme } = useDiffViewerConfig()
  const { githubPat } = useSettings()
  const styles = useMemo(() => createStyles(theme), [theme])
  const [selectedPr, setSelectedPr] = useState<ParsedPR | null>(null)

  useEffect(() => setSelectedPr(parseURL()), [])
  useEffect(() => setURL(selectedPr), [selectedPr])
  const handleSearch = useCallback((pr: ParsedPR) => setSelectedPr(pr), [])

  const prMetadata = useGetPrMetadata({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
  })

  const prDiff = useGetPrDiff({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
  })

  const { fetchLines } = useLoadMoreLines({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
    githubToken: githubPat,
    headSha: prMetadata.data?.head_sha ?? '',
  })

  const displayedDiff = useMemo(() => {
    if (!prDiff.data || prDiff.data.trim() === '') return undefined
    try {
      return ParsedDiff.build(prDiff.data)
    } catch (error) {
      console.error('Failed to parse diff:', error)
      return undefined
    }
  }, [prDiff.data])

  const loadMore = useCallback(
    async (request: LineRequest) => {
      if (!prMetadata.data?.head_sha) {
        throw new Error('Cannot load more lines: PR metadata with head SHA is required')
      }
      return fetchLines(request)
    },
    [fetchLines, prMetadata.data?.head_sha],
  )

  const error =
    prMetadata.error ||
    prDiff.error ||
    (!prMetadata.loading && !prMetadata.data) ||
    (!prDiff.loading && !displayedDiff && prDiff.data)

  const renderContent = () => {
    if (error) {
      const errorMessage = prMetadata.error || prDiff.error || 'Unknown error'
      const errorObj = typeof errorMessage === 'string' ? new Error(errorMessage) : errorMessage
      return <ErrorCard error={errorObj} />
    } else if ((!prMetadata.loading && !prMetadata.data) || selectedPr === null) {
      return (
        <InfoCard
          title="Load a Pull Request"
          description="Use the search bar above to load a GitHub Pull Request and explore its diff."
        />
      )
    } else if (displayedDiff && prMetadata.data?.head_sha) {
      return (
        <DiffViewer
          diff={displayedDiff}
          toolbar={
            <DefaultToolbar
              loading={prMetadata.loading}
              header={prMetadata.data ? <PullRequestHeader pr={prMetadata.data} /> : undefined}
            />
          }
          isMetadataLoading={prMetadata.loading}
          isDiffLoading={prDiff.loading || !prDiff.data}
          maxLinesToFetch={10}
          onLoadMoreLines={loadMore}
        />
      )
    } else {
      return <InfoCard title="Loading Diff" description="Please wait while the diff is being loaded..." />
    }
  }

  return (
    <div css={styles.container}>
      <AppToolbar onSearch={handleSearch} />

      <div css={styles.content}>{renderContent()}</div>

      <Footer />
    </div>
  )
}
