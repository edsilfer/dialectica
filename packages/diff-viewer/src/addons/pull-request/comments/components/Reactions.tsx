import { css } from '@emotion/react'
import { Button } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../../components/diff-viewer/providers/diff-viewer-context'

export interface CommentReactionsProps {
  /** The reactions data to display */
  reactions: Map<string, number>
  /** Optional callback when a reaction is clicked */
  onReactionClick?: (reactionType: string) => void
}

const REACTION_EMOJIS: Record<string, string> = {
  '+1': '👍',
  '-1': '👎',
  laugh: '😄',
  hooray: '🎉',
  confused: '😕',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
}

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    container: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing.xs};
      margin-top: ${theme.spacing.xs};
      margin-bottom: ${theme.spacing.xs};
    `,

    reactionButton: css`
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border: 1px solid ${theme.colors.border};
      border-radius: 12px;
      background-color: ${theme.colors.backgroundPrimary};
      color: ${theme.colors.textPrimaryPlaceholder};
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: ${theme.colors.backgroundContainer};
        border-color: ${theme.colors.accent};
      }

      &:active {
        transform: scale(0.95);
      }
    `,

    emoji: css`
      font-size: 14px;
    `,

    count: css`
      font-weight: 500;
      min-width: 8px;
      text-align: center;
    `,
  }
}

/**
 * A component that displays GitHub-style reactions for a comment.
 *
 * @param reactions - The reactions data to display as a Map
 * @param onReactionClick - Optional callback when a reaction is clicked
 * @returns A React component that displays comment reactions
 */
export const Reactions: React.FC<CommentReactionsProps> = ({ reactions, onReactionClick }) => {
  const styles = useStyles()

  const handleReactionClick = (reactionType: string) => {
    onReactionClick?.(reactionType)
  }

  // Only show reactions that have a count > 0
  const activeReactions = Array.from(reactions.entries()).filter(
    ([reactionType, count]) => count > 0 && REACTION_EMOJIS[reactionType],
  )

  if (activeReactions.length === 0) {
    return null
  }

  return (
    <div css={styles.container} data-testid="comment-reactions">
      {activeReactions.map(([reactionType, count]) => (
        <Button
          key={reactionType}
          type="text"
          size="small"
          onClick={() => handleReactionClick(reactionType)}
          css={styles.reactionButton}
          data-testid={`reaction-${reactionType}`}
        >
          <span css={styles.emoji}>{REACTION_EMOJIS[reactionType]}</span>
          <span css={styles.count}>{count}</span>
        </Button>
      ))}
    </div>
  )
}
