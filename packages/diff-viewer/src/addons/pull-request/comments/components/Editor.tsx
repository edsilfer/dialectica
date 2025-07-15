import {
  BoldOutlined,
  CheckSquareOutlined,
  CodeOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { css } from '@emotion/react'
import { Button, Input, Tag } from 'antd'
import React from 'react'
import { useDiffViewerConfig } from '../../../../components/diff-viewer/providers/diff-viewer-context'
import { MarkdownText } from '../../../MarkdownText'
import { HeaderIcon, MarkdownIcon, QuotingIcon } from '../../../ui/icons'
import { useEditorViewModel } from '../hooks/use-editor-view-model'
import { CustomTabs } from './tabs'
import { TabActionButton, TabItem } from './types'

const { TextArea } = Input

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    outerContainer: css`
      display: flex;
      align-items: flex-start;
      gap: ${theme.spacing.sm};
    `,

    innerContainer: css`
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.sm};
    `,

    tabContent: css``,

    textArea: css`
      background-color: ${theme.colors.backgroundPrimary} !important;
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
      box-shadow: none !important;
      resize: vertical;
      min-height: 130px;
      overflow: auto;
    `,

    preview: css`
      background-color: ${theme.colors.backgroundPrimary};
      padding: ${theme.spacing.sm};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
      color: ${theme.colors.textPrimary};
      white-space: pre-wrap;
      word-wrap: break-word;
      min-height: 95px;
    `,

    footer: css`
      display: flex;
      gap: ${theme.spacing.xs};
      justify-content: flex-end;
    `,

    markdownTag: css`
      display: inline-flex;
      align-items: center;
      gap: ${theme.spacing.xs};
    `,
  }
}

export interface CommentEditorProps {
  /** The current comment text to edit */
  initialText: string
  /** Optional placeholder text for the editor */
  placeholder?: string
  /** Whether the editor is visible */
  isVisible?: boolean
  /** Whether there are saved drafts in the current context indicating review mode */
  isReviewing?: boolean

  /** Optional callback when edit is saved */
  onSave?: (newText: string) => void
  /** Optional callback when edit is cancelled */
  onCancel?: () => void
  /** Optional callback for tab header button actions */
  onTabHeaderAction?: (action: string) => void
  /** Optional callback when text changes in real-time */
  onTextChange?: (newText: string) => void
}

/**
 * A component that displays an editor interface for editing existing comments.
 *
 * @param currentUser - The current user data
 * @param initialText - The current comment text to edit
 * @param onSave - Optional callback when edit is saved
 * @param onCancel - Optional callback when edit is cancelled
 * @param placeholder - Optional placeholder text for the editor
 * @param isVisible - Whether the editor is visible
 * @param isReviewing - Whether there are saved drafts in the current context indicating review mode
 * @returns A React component that displays a comment editor interface
 */
export const Editor: React.FC<CommentEditorProps> = ({
  initialText,
  placeholder,
  isVisible = true,
  onSave,
  onCancel,
  onTabHeaderAction,
  onTextChange,
  isReviewing = false,
}) => {
  const styles = useStyles()
  const {
    editText,
    setEditText,
    previewText,
    isSubmitting,
    activeTab,
    textAreaRef,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleWrap,
    handleLinePrefix,
    handleTabClick,
    handleHeaderAction,
    hasChanges,
    isValid,
  } = useEditorViewModel({
    initialText,
    onSave,
    onCancel,
    onTabHeaderAction,
    onTextChange,
  })

  if (!isVisible) {
    return null
  }

  const tabs: TabItem[] = [
    {
      key: 'write',
      title: 'Write',
      helper: 'Edit your comment',
      content: (
        <TextArea
          ref={textAreaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          css={styles.textArea}
          data-testid="editor-textarea"
          rows={5}
          autoFocus
        />
      ),
      footer: (
        <Tag css={styles.markdownTag}>
          <MarkdownIcon inverted />
          <span>Markdown is supported</span>
        </Tag>
      ),
    },
    {
      key: 'preview',
      title: 'Preview',
      helper: 'Preview your comment',
      content: (
        <div css={styles.preview} data-testid="editor-preview">
          <MarkdownText>{previewText}</MarkdownText>
        </div>
      ),
    },
  ]

  const actions: TabActionButton[] = [
    {
      key: 'header',
      icon: <HeaderIcon />,
      tooltip: 'Add header (h3)',
      onClick: () => handleLinePrefix('### '),
      group: 1,
    },
    {
      key: 'bold',
      icon: <BoldOutlined />,
      tooltip: 'Add bold text',
      onClick: () => handleWrap('**', '**', 'strong text'),
      group: 1,
    },
    {
      key: 'italic',
      icon: <ItalicOutlined />,
      tooltip: 'Add italic text',
      onClick: () => handleWrap('_', '_', 'emphasized text'),
      group: 1,
    },
    {
      key: 'quote',
      icon: <QuotingIcon />,
      tooltip: 'Insert a quote',
      onClick: () => handleLinePrefix('> '),
      group: 1,
    },
    {
      key: 'code',
      icon: <CodeOutlined />,
      tooltip: 'Insert code',
      onClick: () => handleWrap('`', '`', 'code'),
      group: 1,
    },
    {
      key: 'numbered-list',
      icon: <OrderedListOutlined />,
      tooltip: 'Add numbered list',
      onClick: () => handleLinePrefix('1. '),
      group: 2,
    },
    {
      key: 'bulleted-list',
      icon: <UnorderedListOutlined />,
      tooltip: 'Add bulleted list',
      onClick: () => handleLinePrefix('- '),
      group: 2,
    },
    {
      key: 'task-list',
      icon: <CheckSquareOutlined />,
      tooltip: 'Add task list',
      onClick: () => handleLinePrefix('- [ ] '),
      group: 2,
    },
    {
      key: 'format',
      icon: <SettingOutlined />,
      tooltip: 'Format code',
      onClick: () => handleHeaderAction('format'),
      group: 3,
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      tooltip: 'Help',
      onClick: () => handleHeaderAction('help'),
      group: 3,
    },
  ]

  return (
    <div css={styles.outerContainer}>
      <div css={styles.innerContainer}>
        <CustomTabs tabs={tabs} actions={actions} activeTab={activeTab} onTabChange={handleTabClick} />

        {(onSave || onCancel) && (
          <div css={styles.footer}>
            {onCancel && (
              <Button onClick={handleCancel} size="middle" data-testid="cancel-button" disabled={isSubmitting}>
                Cancel
              </Button>
            )}

            {onSave && (
              <Button
                type="primary"
                size="middle"
                onClick={handleSave}
                disabled={!isValid || !hasChanges || isSubmitting}
                loading={isSubmitting}
              >
                {isReviewing ? 'Add review comment' : 'Start a review'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
