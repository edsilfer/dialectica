import {
  DefaultToolbar,
  DiffParserAdapter,
  DiffViewer,
  LineRequest,
  ParsedDiff,
  PullRequestHeader,
  useDiffViewerConfig,
} from '@diff-viewer'
import { css } from '@emotion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AppToolbar from './components/AppToolbar'
import ErrorCard from './components/ErrorCard'
import Footer from './components/Footer'
import InfoCard from './components/InfoCard'
import { ParsedPR } from './components/search-form/types'
import useGetPrDiff from './hooks/use-get-pr-diff'
import useGetPrMetadata from './hooks/use-get-pr-metadata'
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
  const styles = useMemo(() => createStyles(theme), [theme])
  const emptyDiff = useMemo<ParsedDiff>(() => ({ files: [] }), [])
  const [selectedPr, setSelectedPr] = useState<ParsedPR | null>(null)
  const parserRef = useRef(new DiffParserAdapter())

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

  const displayedDiff = useMemo(() => {
    if (!prDiff.data) return emptyDiff
    return parserRef.current.parse(prDiff.data)
  }, [prDiff.data, emptyDiff])

  const loadMore = useCallback((request: LineRequest) => {
    let lines: Record<number, string> = {}
    console.log('request', request)
    for (let i = request.startLine; i <= request.endLine; i++) {
      lines[i] = `${i} - Dummy line`
    }
    return lines
  }, [])

  const error = prMetadata.error || prDiff.error || (!prMetadata.loading && !prMetadata.data)
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
  }

  return (
    <div css={styles.container}>
      <AppToolbar onSearch={handleSearch} />

      <div css={styles.content}>
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
      </div>

      <Footer />
    </div>
  )
}
