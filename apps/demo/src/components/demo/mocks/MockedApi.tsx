import { useIsMobile, useTheme } from '@commons'
import { css } from '@emotion/react'
import Editor, { OnMount } from '@monaco-editor/react'
import { useCallback } from 'react'

const useStyles = () => {
  const theme = useTheme()
  return {
    container: css`
      height: 100%;
      width: 100%;
      border-radius: ${theme.spacing.sm};
      border: 1px solid ${theme.colors.border};
      font-size: 0.7rem;
      color: ${theme.colors.textPrimary};
      overflow: hidden;
    `,
  }
}

export default function MockedApi() {
  const styles = useStyles()
  const theme = useTheme()
  const isMobile = useIsMobile()

  const content = `
  import { DiffViewer } from '@diff-viewer'

  /*
   * Supports for custom toolbar to render diff metadata. 
   */
  const toolbar = <Toolbar
    loading={loading.metadata}
    pr={metadata}
    isPosting={isPosting}
    comments={pendingComments}
    onSubmitReview={(payload) => onSubmitReview(payload, pendingComments)}
    commentDatastore={commentDs}
    onSearch={setPrUrl}
  />

  /*
   * Easily dusplay any custom component over the last docked line.
   */
  const overlays = [
    {
      unifiedDockIdx: 2,
      splitDockIdx: 1,
      content: <AddButton key="add-button" onClick={() => onCommentEvent(CommentEvent.ADD)} />,
      onDock: onLineDock,
    },
  ]

  /*
   * Easily dock any custom component on a line - perfect for inline comments.
   */
  const widgets = [
    {
      content: <CommentWidget key="comment-widget" />,
      line: 10,
      position: 'top',
      filepath: 'src/example.ts',
      side: 'right',
    },
  ]

  return (
    <DiffViewerConfigProvider
      theme={Themes.light}
      fileExplorerConfig={DEFAULT_FILE_EXPLORER_CONFIG}
      fileListConfig={DEFAULT_FILE_LIST_CONFIG}
      storage="local"
    >
      <DiffViewer
        diff={diff}
        isMetadataLoading={loading.metadata}
        isDiffLoading={loading.diff}
        onLoadMoreLines={loadMoreLines}
        onLineSelection={onLineSelection}
        highlightedLines={range}
        widgets={widgets}
        toolbar={toolbar}
        overlays={overlays}
      />
    </DiffViewerConfigProvider>
  )
  `.trim()

  const handleEditorMount: OnMount = useCallback(
    (_, monaco) => {
      monaco.editor.defineTheme('custom-theme', {
        base: theme.flavor === 'dark' ? 'vs-dark' : 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': theme.colors.backgroundPrimary,
        },
      })
      monaco.editor.setTheme('custom-theme')
    },
    [theme],
  )

  return (
    <div css={styles.container}>
      <Editor
        defaultLanguage="typescript"
        height="100%"
        value={content}
        options={{
          lineNumbers: 'on',
          readOnly: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
          renderLineHighlight: 'none',
          wordWrap: 'on',
          fontSize: isMobile ? 10 : 12,
        }}
        onMount={handleEditorMount}
        theme={theme.flavor === 'dark' ? 'vs-dark' : 'light'}
      />
    </div>
  )
}
