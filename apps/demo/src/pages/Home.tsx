import { css } from '@emotion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Alert, Button, notification } from 'antd'

import { AddButton, InfoCard } from '@edsilfer/commons'
import { DiffViewer, ParsedDiff, useTheme } from '@edsilfer/diff-viewer'
import { CommentEvent, CommentState, useCommentController, useReviewController, useReviewDatastore } from '@github'

import { SettingOutlined } from '@ant-design/icons'
import { LineRange } from '@edsilfer/diff-viewer'
import { usePullRequestStore } from '@github'
import { useNavigate } from 'react-router-dom'
import ErrorCard from '../components/ErrorCard'
import Footer from '../components/Footer'
import { mapUser } from '../components/mappers'
import SearchForm from '../components/search-form'
import SettingsModal from '../components/settings/modals/SettingsModal'
import Toolbar from '../components/Toolbar'
import { useWidgetDatastore } from '../hooks/data/use-widget-datastore'
import { useSettings } from '../hooks/use-settings'
import { useUrl } from '../hooks/use-url'

function useStyles() {
  const theme = useTheme()
  return useMemo(
    () => ({
      container: css`
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        background-color: ${theme.colors.hunkViewerBg};
        overflow: hidden;
        padding: ${theme.spacing.sm} ${theme.spacing.md};
      `,
      content: css`
        flex: 1;
        overflow: hidden;
      `,
      alert: css`
        margin: ${theme.spacing.md} 0;
      `,
      settingsButton: css`
        display: flex;
        align-items: center;
        margin-top: ${theme.spacing.sm};

        /* Smooth rotation animation for the icon */
        .anticon {
          transition: transform 0.3s ease;
        }

        /* Rotate the cog when the button is hovered */
        &:hover .anticon {
          transform: rotate(90deg);
        }
      `,
    }),
    [theme],
  )
}

export default function Home() {
  const styles = useStyles()
  const { currentUser, githubPat: token, useMocks, enableTutorial, setCurrentUser } = useSettings()

  // STATE ---------------------------------------------------------------------------------------------
  const [fileNames, setFileNames] = useState<string[]>([])
  const { pr, range, setPrUrl, setLineUrl } = useUrl(fileNames)
  const { commentDs, onCommentEvent, onLineDock } = useCommentController(mapUser(currentUser), pr, token, useMocks)
  const { reviewDs } = useReviewDatastore(token, pr, useMocks)
  const { isPosting, onSubmitReview } = useReviewController(reviewDs, commentDs)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navigate = useNavigate()

  // Get pending comments from the comment datastore
  const pendingComments = useMemo(() => {
    return Array.from(commentDs.list(CommentState.PENDING).values())
  }, [commentDs])
  const { user, metadata, diff: rawDiff, loading, errors, loadMoreLines } = usePullRequestStore(pr, token, useMocks)
  const diff = useMemo(() => (rawDiff ? ParsedDiff.build(rawDiff) : undefined), [rawDiff])
  const widgetDatastore = useWidgetDatastore(commentDs, onCommentEvent)

  // ERRORS --------------------------------------------------------------------------------------------
  useEffect(() => {
    if (enableTutorial) {
      void navigate('/welcome')
    }
  }, [enableTutorial, navigate])

  useEffect(() => {
    if (errors.comments) {
      notification.error({
        message: 'Failed to load inline comments',
        description: errors.comments.message,
      })
    }
  }, [errors.comments])

  // SET CURRENT USER -----------------------------------------------------------------------------------
  useEffect(() => {
    if (user && setCurrentUser && (!currentUser || currentUser.login !== user.login)) {
      setCurrentUser({
        id: user.id,
        name: user.name || undefined,
        login: user.login,
        avatar_url: user.avatar_url,
      })
    }
  }, [user, setCurrentUser, currentUser])

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
      setLineUrl(lineRange)
    },
    [setLineUrl],
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
              <SearchForm onSearch={setPrUrl} />

              <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Button
                  css={styles.settingsButton}
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => void navigate('/welcome')}
                >
                  Back to Welcome
                </Button>
                <Button
                  css={styles.settingsButton}
                  type="default"
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsOpen(true)}
                >
                  Settings
                </Button>
              </div>
            </div>
          }
        />
      )
    } else if (diff && metadata?.head?.sha) {
      // Render the diff viewer if the diff and metadata are loaded
      return (
        <>
          {useMocks && (
            <Alert
              css={styles.alert}
              message="All the data is mocked. You can change it in the settings."
              type="warning"
              showIcon
              closable
            />
          )}

          <DiffViewer
            diff={diff}
            isMetadataLoading={loading.metadata}
            isDiffLoading={loading.diff}
            onLoadMoreLines={loadMoreLines}
            onLineSelection={onLineSelection}
            highlightedLines={range}
            widgets={widgetDatastore.handle.list()}
            toolbar={
              <Toolbar
                loading={loading.metadata}
                pr={metadata}
                isPosting={isPosting}
                comments={pendingComments}
                onSubmitReview={(payload) => onSubmitReview(payload, pendingComments)}
                commentDatastore={commentDs}
                onSearch={setPrUrl}
              />
            }
            overlays={[
              {
                unifiedDockIdx: 2,
                splitDockIdx: 1,
                content: <AddButton key="add-button" onClick={() => onCommentEvent(CommentEvent.ADD)} />,
                onDock: onLineDock,
              },
            ]}
          />

          <Footer />

          <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
      )
    } else {
      return <InfoCard title="Loading Diff" description="Please wait while the diff is being loaded..." />
    }
  }

  return (
    <div css={styles.container}>
      <div css={styles.content}>{content()}</div>
    </div>
  )
}
