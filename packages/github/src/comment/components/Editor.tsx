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
import {
  CustomTabs,
  HeaderIcon,
  MarkdownIcon,
  MarkdownText,
  QuotingIcon,
  TabActionButton,
  TabItem,
  ThemeContext,
} from '@dialectica-org/commons'
import { css } from '@emotion/react'
import { Button, Input, Tag } from 'antd'
import React, { useContext } from 'react'
import { useEditorViewModel } from '../hooks/use-editor-view-model'

const { TextArea } = Input

/**
 * Metadata for a button in the editor footer
 */
export interface ButtonMetadata {
  /** The label text for the button */
  label: string
  /** The key to identify the button action (save, cancel, custom) */
  key: 'save' | 'cancel' | 'custom'
  /** Whether the button should be disabled */
  disabled?: boolean
  /** Whether the button should show loading state */
  loading?: boolean
  /** The button type (primary, default, etc.) */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'

  /** Callback function when the button is clicked (only for custom buttons) */
  onClick?: () => void
}

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    outerContainer: css`
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: ${theme.spacing.sm};
    `,

    innerContainer: css`
      width: 0;
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
  /** Array of buttons to display in the footer */
  buttons?: ButtonMetadata[]

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
  buttons,
  onSave,
  onCancel,
  onTabHeaderAction,
  onTextChange,
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

        {buttons && buttons.length > 0 && (
          <div css={styles.footer}>
            {buttons.map((button, index) => {
              const handleClick = () => {
                if (button.key === 'save') {
                  handleSave()
                } else if (button.key === 'cancel') {
                  handleCancel()
                } else if (button.key === 'custom' && button.onClick) {
                  button.onClick()
                }
              }

              return (
                <Button
                  key={index}
                  type={button.type || 'default'}
                  size="middle"
                  onClick={handleClick}
                  disabled={button.disabled || isSubmitting}
                  loading={button.loading || isSubmitting}
                  data-testid={`editor-button-${button.label.toLowerCase().replaceAll(' ', '-')}`}
                >
                  {button.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
