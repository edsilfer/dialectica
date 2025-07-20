import { ChevronDown, useDiffViewerConfig } from '@diff-viewer'
import { css } from '@emotion/react'
import { Button, Divider, Popover, Radio, Space } from 'antd'
import React, { useState } from 'react'
import { ReviewStatus } from '../../github/models'
import { Editor } from '../comments/components/Editor'
import { CommentMetadata, CommentState } from '../models/CommentMetadata'

export interface ReviewPayload {
  /** The status of the review */
  reviewStatus: ReviewStatus
  /** The comment of the review */
  comment?: string
  /** The commit SHA associated with the review (injected by parent). */
  commitId?: string
}

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    popoverContainer: css`
      width: 600px;
      max-height: 450px;
      padding: ${theme.spacing.xs};
      overflow-y: auto;
    `,

    radioGroup: css`
      margin: ${theme.spacing.sm} 0;

      .ant-radio-wrapper {
        display: block;
        font-family: ${theme.typography.regularFontFamily};
        font-size: ${theme.typography.regularFontSize}px;
      }
    `,

    radioDescription: css`
      font-size: 12px;
      color: ${theme.colors.textPrimaryPlaceholder};
    `,

    divider: css`
      margin: ${theme.spacing.sm} 0;
    `,

    footer: css`
      display: flex;
      justify-content: flex-end;
      margin-top: ${theme.spacing.md};
    `,

    buttonContent: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing.xs};
    `,

    chevron: css`
      transition: transform 0.2s ease-in-out;
      &.open {
        transform: rotate(180deg);
      }
    `,
  }
}

export interface ReviewButtonProps {
  /** The commit SHA associated with the review (injected by parent). */
  commitId?: string
  /** Array of CommentMetadata for pending review comments */
  comments: CommentMetadata[]
  /** Whether the current user is the PR author */
  isAuthor: boolean
  /** Whether the review is currently being posted */
  isPosting?: boolean
  /** Callback when the review is submitted */
  onSubmitReview?: (payload: ReviewPayload) => void
}

/**
 * A component that displays a review button which opens a popover for submitting code reviews.
 * The button label changes based on whether there are pending review comments.
 */
export const ReviewButton: React.FC<ReviewButtonProps> = ({
  commitId,
  comments,
  isAuthor,
  isPosting = false,
  onSubmitReview,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewType, setReviewType] = useState<ReviewStatus>(ReviewStatus.COMMENT)
  const styles = useStyles()

  const commentCount = comments.filter((c) => c.state === CommentState.PENDING).length
  const buttonLabel = commentCount === 0 ? 'Review changes' : `Finish your review (${commentCount})`

  const handleOpenChange = (open: boolean) => {
    setIsPopoverOpen(open)
    if (!open) {
      // Reset form when closing popover
      setReviewText('')
      setReviewType(ReviewStatus.COMMENT)
    }
  }

  const handleSubmitReview = () => {
    if (!onSubmitReview) return
    onSubmitReview({
      reviewStatus: reviewType,
      comment: reviewText.trim() || undefined,
      commitId: commitId,
    })
    setIsPopoverOpen(false)
    setReviewText('')
    setReviewType(ReviewStatus.COMMENT)
  }

  // Updated submit disabled logic
  const isSubmitDisabled =
    !onSubmitReview || isPosting || (reviewType === ReviewStatus.COMMENT && !reviewText.trim() && comments.length === 0)

  const popoverContent = (
    <div css={styles.popoverContainer}>
      <Editor initialText={reviewText} placeholder="Leave a comment" isVisible={true} onTextChange={setReviewText} />

      <Radio.Group
        css={styles.radioGroup}
        value={reviewType}
        onChange={(e) => setReviewType(e.target.value as ReviewStatus)}
      >
        <Radio value={ReviewStatus.COMMENT}>
          <Space direction="vertical" size={0}>
            <strong>Comment</strong>
            <span css={styles.radioDescription}>Submit general feedback without explicit approval.</span>
          </Space>
        </Radio>
        <Radio value={ReviewStatus.APPROVE} disabled={isAuthor}>
          <Space direction="vertical" size={0}>
            <strong>Approve</strong>
            <span css={styles.radioDescription}>Submit feedback and approve merging these changes.</span>
          </Space>
        </Radio>
        <Radio value={ReviewStatus.REQUEST_CHANGES} disabled={isAuthor}>
          <Space direction="vertical" size={0}>
            <strong>Request changes</strong>
            <span css={styles.radioDescription}>Submit feedback that must be addressed before merging.</span>
          </Space>
        </Radio>
      </Radio.Group>

      <Divider css={styles.divider} />

      <div css={styles.footer}>
        <Button type="primary" onClick={handleSubmitReview} disabled={isSubmitDisabled} loading={isPosting}>
          Submit Review
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <Popover
        title="Submit Review"
        content={popoverContent}
        trigger={['click']}
        open={isPopoverOpen}
        onOpenChange={handleOpenChange}
        placement="bottomRight"
      >
        <Button type="primary" disabled={isPosting} loading={isPosting}>
          <div css={styles.buttonContent}>
            <>
              {buttonLabel}
              <ChevronDown size={16} css={styles.chevron} className={isPopoverOpen ? 'open' : ''} />
            </>
          </div>
        </Button>
      </Popover>
    </>
  )
}
