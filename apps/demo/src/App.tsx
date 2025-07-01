import { DiffViewer, PullRequestHeader, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Typography } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AppToolbar from './components/AppToolbar'
import ErrorCard from './components/ErrorCard'
import PixelHeartIcon from './components/icons/PixelHeartIcon'
import InfoCard from './components/InfoCard'
import { ParsedPR } from './components/search-form/types'
import useGetPrDiff from './hooks/use-get-pr-diff'
import useGetPrMetadata from './hooks/use-get-pr-metadata'

const { Text } = Typography

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
  footer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    * {
      font-size: 0.8rem !important;
    }
  `,
})

export default function App() {
  const { theme } = useDiffViewerConfig()
  // Memoize style object so Emotion doesn't recompute the classes on every drag frame
  const styles = useMemo(() => createStyles(theme), [theme])
  const emptyDiff = useMemo<React.ComponentProps<typeof DiffViewer>['diff']>(() => ({ files: [] }), [])
  const [selectedPr, setSelectedPr] = useState<ParsedPR | null>(null)

  // Synchronize state with URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const owner = params.get('owner')
    const repo = params.get('repo')
    const pullStr = params.get('pull')
    if (owner && repo && pullStr) {
      const prNumber = Number(pullStr)
      if (!Number.isNaN(prNumber)) {
        setSelectedPr({ owner, repo, prNumber })
      }
    }
  }, [])

  // Push selected PR details to the URL
  useEffect(() => {
    if (selectedPr) {
      const params = new URLSearchParams()
      params.set('owner', selectedPr.owner)
      params.set('repo', selectedPr.repo)
      params.set('pull', String(selectedPr.prNumber))
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.pushState({}, '', newUrl)
    }
  }, [selectedPr])

  const {
    data: prMetadata,
    loading: prMetaLoading,
    error: prMetaError,
  } = useGetPrMetadata({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
    forceDelayMs: 1000,
  })

  const {
    data: prDiffData,
    loading: prDiffLoading,
    error: prDiffError,
  } = useGetPrDiff({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
  })

  const handleSearch = useCallback((pr: ParsedPR) => setSelectedPr(pr), [])

  // Aggregate any errors returned by metadata or diff hooks
  const error = prMetaError ?? prDiffError

  const prHeader = useMemo(() => {
    if (!prMetadata) return undefined
    return <PullRequestHeader pr={prMetadata} />
  }, [prMetadata])

  // Determine which diff to render (fallback to sample diff when no PR is selected)
  const displayedDiff: React.ComponentProps<typeof DiffViewer>['diff'] = prDiffData ?? emptyDiff

  return (
    <div css={styles.container}>
      <AppToolbar onSearch={handleSearch} />

      <div css={styles.content}>
        {selectedPr === null ? (
          <InfoCard
            title="Load a Pull Request"
            description="Use the search bar above to load a GitHub Pull Request and explore its diff."
          />
        ) : error ? (
          <ErrorCard error={error} />
        ) : (
          <DiffViewer
            diff={displayedDiff}
            title={prHeader}
            isMetadataLoading={prMetaLoading}
            isDiffLoading={prDiffLoading || !prDiffData}
          />
        )}
      </div>

      <div css={styles.footer}>
        <Text>
          Made with
          <PixelHeartIcon size={14} />
          by edsilfer
        </Text>
      </div>
    </div>
  )
}
