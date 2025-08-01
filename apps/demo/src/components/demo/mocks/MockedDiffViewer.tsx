import { AddButton, useTheme } from '@edsilfer/commons'
import { DiffViewer, ParsedDiff } from '@edsilfer/diff-viewer'
import { css, SerializedStyles } from '@emotion/react'
import {
  CommentState,
  PrKey,
  useCommentController,
  usePullRequestStore,
  useReviewController,
  useReviewDatastore,
} from '@github'
import React, { useMemo } from 'react'
import Toolbar from '../../Toolbar'
import { MOCKED_PR, MOCKED_USER_1 } from './constants'

const useStyles = () => {
  const theme = useTheme()
  const isDark = theme.name === 'dark'

  return {
    container: css`
      height: 100%;
      padding: ${theme.spacing.lg};
      z-index: 1;

      * {
        font-size: 0.8rem !important;
      }
    `,
    browserFrame: css`
      width: 100%;
      height: 100%;
      border-radius: 12px;
      box-shadow: ${isDark
        ? `0 0 0 1px rgba(255, 255, 255, 0.08), 0 4px 12px rgba(255, 255, 255, 0.12), 0 16px 48px rgba(255, 255, 255, 0.06)`
        : `0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.2), 0 16px 48px rgba(0, 0, 0, 0.1)`};
      background-color: ${theme.colors.backgroundPrimary};
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `,
    browserHeader: css`
      height: 32px;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      padding: 0 12px;
    `,
    windowControls: css`
      display: flex;
      gap: 8px;
    `,
    redDot: css`
      width: 12px;
      height: 12px;
      background-color: #ff5f56;
      border-radius: 50%;
    `,
    yellowDot: css`
      width: 12px;
      height: 12px;
      background-color: #ffbd2e;
      border-radius: 50%;
    `,
    greenDot: css`
      width: 12px;
      height: 12px;
      background-color: #27c93f;
      border-radius: 50%;
    `,
    diffViewer: css`
      margin: ${theme.spacing.sm};
      height: 100%;
    `,
  }
}

const USE_MOCKS = true
const MOCKED_TOKEN = 'mocked-token'

// MOCKED COMPONENT ------------------------------------------------------------------------------
const MockedDiffViewer: React.FC<{ css?: SerializedStyles; className?: string }> = ({ css: customCss, className }) => {
  const styles = useStyles()

  const { commentDs } = useCommentController(MOCKED_USER_1, MOCKED_PR, MOCKED_TOKEN, USE_MOCKS)
  const { reviewDs } = useReviewDatastore(MOCKED_TOKEN, MOCKED_PR, USE_MOCKS)
  const { isPosting, onSubmitReview } = useReviewController(reviewDs, commentDs)
  const pr = usePullRequestStore(MOCKED_PR, MOCKED_TOKEN, USE_MOCKS, false)
  const diff = useMemo(() => (pr.diff ? ParsedDiff.build(pr.diff) : undefined), [pr.diff])

  const pendingComments = useMemo(() => {
    return Array.from(commentDs.list(CommentState.PENDING).values())
  }, [commentDs])

  const onSearch = useMemo(
    () => (prKey: PrKey) => {
      console.log('Search for PR:', prKey)
    },
    [],
  )

  if (!pr.metadata || !diff) return null

  return (
    <div css={[styles.container, customCss]} className={className}>
      <div css={styles.browserFrame}>
        <div css={styles.browserHeader}>
          <div css={styles.windowControls}>
            <span css={styles.redDot} />
            <span css={styles.yellowDot} />
            <span css={styles.greenDot} />
          </div>
        </div>

        <div css={styles.diffViewer}>
          <DiffViewer
            diff={diff}
            isMetadataLoading={false}
            isDiffLoading={false}
            toolbar={
              <Toolbar
                loading={false}
                pr={pr.metadata}
                isPosting={isPosting}
                comments={pendingComments}
                onSubmitReview={(payload) => onSubmitReview(payload, pendingComments)}
                commentDatastore={commentDs}
                onSearch={onSearch}
              />
            }
            overlays={[
              {
                unifiedDockIdx: 2,
                splitDockIdx: 1,
                content: <AddButton key="add-button" />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export default MockedDiffViewer
