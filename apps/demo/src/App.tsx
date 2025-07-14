import { css } from '@emotion/react'
import { useEffect, useMemo, useState } from 'react'

import { Alert, notification } from 'antd'
import AppToolbar from './components/AppToolbar'
import Footer from './components/Footer'

import { AddButton, DefaultToolbar, DiffViewer, PrKey, PullRequestHeader, useDiffViewerConfig } from '@diff-viewer'

import ErrorCard from './components/ErrorCard'
import InfoCard from './components/InfoCard'
import { mapPullRequestMetadata } from './components/mappers'
import { usePrViewModel } from './hooks/use-pr-view-model'
import { CommentProvider } from './provider/comment-provider'
import { useSettings } from './provider/setttings-provider'
import { parseURL } from './utils'

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
  const { useMocks } = useSettings()

  // STATE ---------------------------------------------------------------------------------------------
  const [prKey, setPrKey] = useState<PrKey | undefined>(parseURL())
  const { metadata, loading, errors, diff, commentWidgets, loadMore, onDock, onAddButton, existingComments } =
    usePrViewModel(prKey)

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

  // RENDER --------------------------------------------------------------------------------------------
  const content = () => {
    if (errors.metadata || errors.diff) {
      // Return an error card if failed to fetch critical data
      return <ErrorCard error={errors.metadata || errors.diff} />
    } else if (!loading.metadata && !metadata) {
      // Tell the user to load a pull request
      return (
        <InfoCard
          title="Load a Pull Request"
          description="Use the search bar above to load a GitHub Pull Request and explore its diff."
        />
      )
    } else if (diff && metadata?.head?.sha) {
      // Render the diff viewer if the diff and metadata are loaded
      return (
        <DiffViewer
          diff={diff}
          toolbar={
            <DefaultToolbar
              loading={loading.metadata}
              header={metadata ? <PullRequestHeader pr={mapPullRequestMetadata(metadata)} /> : undefined}
            />
          }
          isMetadataLoading={loading.metadata}
          isDiffLoading={loading.diff}
          maxLinesToFetch={10}
          onLoadMoreLines={loadMore}
          overlays={[
            {
              unifiedDockIdx: 2,
              splitDockIdx: 1,
              content: <AddButton key="add-button" onClick={onAddButton} />,
              onDock,
            },
          ]}
          widgets={commentWidgets}
        />
      )
    } else {
      return <InfoCard title="Loading Diff" description="Please wait while the diff is being loaded..." />
    }
  }

  return (
    <div css={styles.container}>
      <AppToolbar onSearch={setPrKey} />

      {useMocks && (
        <Alert message="All the data is mocked. You can change it in the settings." type="warning" showIcon closable />
      )}

      <CommentProvider existingComments={existingComments} diff={diff}>
        <div css={styles.content}>{content()}</div>
      </CommentProvider>

      <Footer />
    </div>
  )
}
