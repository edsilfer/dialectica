import { CustomTabs, TabItem, ThemeContext, useIsMobile } from '@dialectica-org/commons'
import { DiffViewer, ParsedDiff } from '@dialectica-org/diff-viewer'
import { css } from '@emotion/react'
import { Editor, OnChange, OnMount } from '@monaco-editor/react'
import { Typography } from 'antd'
import { useCallback, useContext, useEffect, useState } from 'react'
import { SlideWrapper } from '../../pages/Welcome'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

const SAMPLE_DIFF = `
diff --git a/HelloWorld.tsx b/apps/HelloWorld.tsx
index 9bd4364..82995e6 100644
--- a/HelloWorld.tsx
+++ b/HelloWorld.tsx
@@ -16,6 +16,7 @@ import ApiSlide from '../components/demo/ApiSlide'
import FileExplorerSlide from '../components/demo/FileExplorerSlide'
+import TryItSlide from '../components/demo/TryItSlide'
import { usePreferedTheme } from '../hooks/use-prefered-theme'

/**
@@ -75,15 +76,15 @@ export default function Welcome() {
  const preferredTheme = usePreferedTheme()

  return (
-      <div>Hello World!</div>
+      <div>Welcome to DiffViewer!</div>
  )
}
  `.trim()

const useStyles = () => {
  return {
    editorContainer: css`
      display: flex;
      height: 100%;
      overflow: hidden;
    `,

    tabs: css`
      width: 90%;
      height: 90%;
      overflow: hidden;
    `,
  }
}

export default function TryItSlide() {
  const theme = useContext(ThemeContext)
  const styles = useStyles()
  const sharedStyles = useSharedStyles(theme)
  const [activeTab, setActiveTab] = useState('editor')
  const [content, setContent] = useState(SAMPLE_DIFF)
  const [diff, setDiff] = useState<ParsedDiff | undefined>(ParsedDiff.build(SAMPLE_DIFF))

  const handleContentChange: OnChange = useCallback((value) => {
    if (value) {
      setContent(value)
    }
  }, [])

  useEffect(() => {
    setDiff(ParsedDiff.build(content))
  }, [content])

  const tabs: TabItem[] = [
    {
      key: 'editor',
      title: 'Editor',
      content: <DiffEditor content={content} onChange={handleContentChange} />,
    },
    {
      key: 'preview',
      title: 'Preview',
      content: diff ? <DiffViewer diff={diff} /> : null,
    },
  ]

  return (
    <SlideWrapper>
      <div css={sharedStyles.featureSlide('primary')}>
        <div
          css={[
            sharedStyles.featureLeft('30%', 'secondary', { topRight: true, bottomRight: true }),
            styles.editorContainer,
          ]}
        >
          <Title css={sharedStyles.title}>Try it live!</Title>
          <Paragraph css={sharedStyles.subtitle}>Change the diff and switch the tab for a live preview!</Paragraph>
        </div>

        <div css={sharedStyles.featureRight('70%', 'primary')}>
          <CustomTabs tabs={tabs} activeTab={activeTab} actions={[]} onTabChange={setActiveTab} css={styles.tabs} />
        </div>
      </div>
    </SlideWrapper>
  )
}

function DiffEditor({ content, onChange }: { content: string; onChange: OnChange }) {
  const isMobile = useIsMobile()
  const theme = useContext(ThemeContext)

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
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
    <Editor
      defaultLanguage="text"
      height="100%"
      value={content}
      defaultValue={content}
      onChange={onChange}
      options={{
        lineNumbers: 'on',
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
  )
}
