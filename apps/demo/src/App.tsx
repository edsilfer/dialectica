import { css } from '@emotion/react'
import { useEffect, useMemo, useState } from 'react'

import { Alert, notification } from 'antd'
import AppToolbar from './components/AppToolbar'
import Footer from './components/Footer'

import {
  AddButton,
  DefaultToolbar,
  DiffViewer,
  ParsedDiff,
  PrKey,
  PullRequestHeader,
  ReviewButton,
  useDiffViewerConfig,
  ReviewPayload,
} from '@diff-viewer'

import ErrorCard from './components/ErrorCard'
import InfoCard from './components/InfoCard'
import { mapPullRequestMetadata } from './components/mappers'
import { useReview } from './hooks/state/use-review-state'
import { useCommentState } from './hooks/state/use-comment-state'
import { useSettings } from './provider/setttings-provider'
import { useCommentDatastore } from './hooks/data/use-comment-datastore'
import { usePrData } from './hooks/data/use-pr-datastore'
import { useWidgetDatastore } from './hooks/data/use-widget-datastore'
import { useReviewDatastore } from './hooks/data/use-review-datastore'
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
  const { useMocks, currentUser } = useSettings()

  // STATE ---------------------------------------------------------------------------------------------
  const [prKey, setPrKey] = useState<PrKey | undefined>(parseURL())
  const { handle: commentDatastore } = useCommentDatastore(prKey)
  const { handle: reviewDatastore } = useReviewDatastore(prKey)
  const { isPosting, comments, onSubmitReview } = useReview(reviewDatastore, commentDatastore)
  const { newComment, onDock, onCommentEvent } = useCommentState(commentDatastore)
  const { metadata, rawDiff, loading, errors, loadMore } = usePrData(prKey)
  const diff = useMemo(() => (rawDiff ? ParsedDiff.build(rawDiff) : undefined), [rawDiff])
  const widgetDatastore = useWidgetDatastore(commentDatastore, onCommentEvent)

  /**
   * Determine if the current user is the author of the pull request.
   */
  const isPrAuthor = useMemo(() => {
    return metadata?.user?.login === currentUser?.login
  }, [metadata?.user?.login, currentUser?.login])

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
      return <ErrorCard error={errors.user || errors.metadata || errors.diff} />
    } else if (!loading.metadata && !metadata) {
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
              additionalWidget={[
                {
                  key: 'review-button',
                  component: (
                    <ReviewButton
                      commitId={metadata?.head?.sha}
                      isPosting={isPosting}
                      comments={comments}
                      isAuthor={isPrAuthor}
                      onSubmitReview={(payload: ReviewPayload) => {
                        void onSubmitReview(payload)
                      }}
                    />
                  ),
                  side: 'right',
                },
              ]}
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
      <AppToolbar onSearch={setPrKey} />

      {useMocks && (
        <Alert message="All the data is mocked. You can change it in the settings." type="warning" showIcon closable />
      )}

      <div css={styles.content}>{content()}</div>

      <Footer />
    </div>
  )
}
