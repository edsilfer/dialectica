import { QuestionCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { css } from '@emotion/react'
import { Button, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { useDiffViewerConfig } from '../../../../components/diff-viewer/providers/diff-viewer-context'
import { CustomTabs } from './CustomTabs'
import { TabActionButton, TabItem } from './types'

const { TextArea } = Input

const useStyles = () => {
  const { theme } = useDiffViewerConfig()

  return {
    outerContainer: css`
      display: flex;
      align-items: flex-start;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.sm};
      background-color: ${theme.colors.backgroundContainer};
      border-top: 1px solid ${theme.colors.border};
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
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
      font-family: ${theme.typography.regularFontFamily};
      font-size: ${theme.typography.regularFontSize}px;
      box-shadow: none !important;
      resize: vertical;
      min-height: 130px;
      overflow: auto;
    `,

    preview: css`
      background-color: ${theme.colors.backgroundPrimary};
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.xs};
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
  }
}

export interface CommentEditorProps {
  /** The current comment text to edit */
  initialText: string
  /** Optional placeholder text for the editor */
  placeholder?: string
  /** Whether the editor is visible */
  isVisible?: boolean
  /** Optional callback when edit is saved */
  onSave?: (newText: string) => void
  /** Optional callback when edit is cancelled */
  onCancel?: () => void
  /** Optional callback for tab header button actions */
  onTabHeaderAction?: (action: string) => void
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
 * @returns A React component that displays a comment editor interface
 */
export const CommentEditor: React.FC<CommentEditorProps> = ({
  initialText,
  onSave,
  onCancel,
  placeholder = 'Edit your comment...',
  isVisible = true,
  onTabHeaderAction,
}) => {
  const [editText, setEditText] = useState(initialText)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const styles = useStyles()

  useEffect(() => setEditText(initialText), [initialText])

  const handleSave = () => {
    if (editText.trim() && onSave) {
      setIsSubmitting(true)
      try {
        onSave(editText.trim())
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCancel = () => {
    setEditText(initialText)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isVisible) {
    return null
  }

  const hasChanges = editText.trim() !== initialText.trim()
  const isValid = editText.trim().length > 0

  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey)
  }

  const handleHeaderAction = (action: string) => {
    onTabHeaderAction?.(action)
  }

  const tabs: TabItem[] = [
    {
      key: 'write',
      title: 'Write',
      helper: 'Edit your comment',
      content: (
        <TextArea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          css={styles.textArea}
          data-testid="editor-textarea"
          rows={4}
          autoFocus
        />
      ),
    },
    {
      key: 'preview',
      title: 'Preview',
      helper: 'Preview your comment',
      content: (
        <div css={styles.preview} data-testid="editor-preview">
          {editText || <span style={{ color: '#999' }}>Nothing to preview</span>}
        </div>
      ),
    },
  ]

  const actions: TabActionButton[] = [
    {
      key: 'format',
      icon: <SettingOutlined />,
      tooltip: 'Format code',
      onClick: () => handleHeaderAction('format'),
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      tooltip: 'Help',
      onClick: () => handleHeaderAction('help'),
    },
  ]

  return (
    <div css={styles.outerContainer} data-testid="comment-editor">
      <div css={styles.innerContainer}>
        <CustomTabs
          tabs={tabs}
          actions={actions}
          activeTab={activeTab}
          onTabChange={handleTabClick}
          data-testid="editor-tabs"
        />

        <div css={styles.footer}>
          <Button onClick={handleCancel} size="middle" data-testid="cancel-button" disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            type="primary"
            size="middle"
            onClick={handleSave}
            data-testid="post-button"
            disabled={!isValid || !hasChanges || isSubmitting}
            loading={isSubmitting}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  )
}
