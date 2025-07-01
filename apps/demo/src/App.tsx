import { DiffViewer, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Typography, Card } from 'antd'
import React, { useMemo, useCallback, useState } from 'react'
import AppToolbar from './components/AppToolbar'
import PixelHeartIcon from './components/icons/PixelHeartIcon'
import { ParsedPR } from './components/search-form/types'
import useGetPrMetadata from './hooks/use-get-pr-metadata'
import { PrHeader } from './components/pull-request'
import useGetPrDiff from './hooks/use-get-pr-diff'

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

  const { data: prMetadata, loading: prMetaLoading } = useGetPrMetadata({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
    forceDelayMs: 1000,
  })

  const { data: prDiffData, loading: prDiffLoading } = useGetPrDiff({
    owner: selectedPr?.owner ?? '',
    repo: selectedPr?.repo ?? '',
    pullNumber: selectedPr?.prNumber ?? 0,
  })

  const handleSearch = useCallback((pr: ParsedPR) => setSelectedPr(pr), [])

  const prHeader = useMemo(() => {
    if (!prMetadata) return undefined
    return <PrHeader pr={prMetadata} headingLevel={4} />
  }, [prMetadata])

  // Determine which diff to render (fallback to sample diff when no PR is selected)
  const displayedDiff: React.ComponentProps<typeof DiffViewer>['diff'] = prDiffData ?? emptyDiff

  return (
    <div css={styles.container}>
      <AppToolbar onSearch={handleSearch} />

      <div css={styles.content}>
        {selectedPr === null ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Card>
              <Text>Use the search bar above to load a GitHub Pull Request and explore its diff.</Text>
            </Card>
          </div>
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
