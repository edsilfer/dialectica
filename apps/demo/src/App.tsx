import { css } from '@emotion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert, notification } from 'antd'
import Footer from './components/Footer'
import Toolbar from './components/Toolbar'

import { AddButton } from '@commons'
import { DiffViewer, ParsedDiff, useDiffViewerConfig } from '@diff-viewer'
import { PrKey } from '@github'

import { LineRange } from '@diff-viewer/src/components/diff-viewer/types'
import ErrorCard from './components/ErrorCard'
import InfoCard from './components/InfoCard'
import SearchForm from './components/search-form'
import { useCommentDatastore } from './hooks/data/use-comment-datastore'
import { usePrData } from './hooks/data/use-pr-datastore'
import { useReviewDatastore } from './hooks/data/use-review-datastore'
import { useWidgetDatastore } from './hooks/data/use-widget-datastore'
import { useCommentState } from './hooks/state/use-comment-state'
import { useSettings } from './provider/setttings-provider'
import { parseLineURL, parseURL, setLineURL } from './utils'

function useStyles({ theme }: ReturnType<typeof useDiffViewerConfig>) {
  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        padding: ${theme.spacing.xs} ${theme.spacing.md};
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
  const { useMocks } = useSettings()

  // STATE ---------------------------------------------------------------------------------------------
  const [prKey, setPrKey] = useState<PrKey | undefined>(() => parseURL())
  const [fileNames, setFileNames] = useState<string[]>([])
  const { handle: commentDatastore } = useCommentDatastore(prKey)
  const { handle: reviewDatastore } = useReviewDatastore(prKey)
  const { newComment, onDock, onCommentEvent } = useCommentState(commentDatastore)
  const { metadata, rawDiff, loading, errors, loadMore } = usePrData(prKey)
  const diff = useMemo(() => (rawDiff ? ParsedDiff.build(rawDiff) : undefined), [rawDiff])
  const widgetDatastore = useWidgetDatastore(commentDatastore, onCommentEvent)

  // ERRORS --------------------------------------------------------------------------------------------
  useEffect(() => {
    if (errors.comments) {
      notification.error({
        message: 'Failed to load inline comments',
        description: errors.comments.message,
      })
    }
  }, [errors.comments])

  useEffect(() => {
    if (metadata) {
      document.title = metadata.title ?? 'Diff Viewer Demo'
    }
  }, [metadata])

  useEffect(() => {
    if (diff) {
      const names = diff.files.map((file) => file.newPath || file.oldPath)
      setFileNames(names)
    } else {
      setFileNames([])
    }
  }, [diff])

  const onLineSelection = useCallback(
    (lineRange: LineRange) => {
      setLineURL(lineRange, fileNames)
    },
    [fileNames],
  )

  // RENDER --------------------------------------------------------------------------------------------
  const content = () => {
    if (errors.metadata || errors.diff) {
      return <ErrorCard error={errors.user || errors.metadata || errors.diff} />
    } else if (!loading.metadata && !metadata) {
      return (
        <InfoCard
          title="Load a Pull Request"
          description={
            <div>
              <p>No PR coordinates found in the URL. Use the search below to load a GitHub Pull Request.</p>
              <SearchForm onSearch={(pr) => setPrKey(pr)} />
            </div>
          }
        />
      )
    } else if (diff && metadata?.head?.sha) {
      // Render the diff viewer if the diff and metadata are loaded
      return (
        <DiffViewer
          diff={diff}
          toolbar={
            <Toolbar
              loading={loading.metadata}
              pr={metadata}
              reviewDatastore={reviewDatastore}
              commentDatastore={commentDatastore}
              onSearch={setPrKey}
            />
          }
          isMetadataLoading={loading.metadata}
          isDiffLoading={loading.diff}
          maxLinesToFetch={10}
          onLoadMoreLines={loadMore}
          onLineSelection={onLineSelection}
          highlightedLines={parseLineURL(fileNames)}
          overlays={[
            {
              unifiedDockIdx: 2,
              splitDockIdx: 1,
              content: <AddButton key="add-button" onClick={newComment} />,
              onDock,
            },
          ]}
          widgets={widgetDatastore.handle.list()}
        />
      )
    } else {
      return <InfoCard title="Loading Diff" description="Please wait while the diff is being loaded..." />
    }
  }

  return (
    <div css={styles.container}>
      {useMocks && (
        <Alert message="All the data is mocked. You can change it in the settings." type="warning" showIcon closable />
      )}

      <div css={styles.content}>{content()}</div>

      <Footer />
    </div>
  )
}
