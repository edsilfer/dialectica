import { css } from '@emotion/react'
import React, { useContext, useEffect } from 'react'
import { ThemeContext } from '../shared/providers/theme-context'
import FileViewer from './components/file-viewer/FileViewer'
import { CodePanelConfigProvider, useCodePanelConfig } from './providers/code-panel-context'
import type { CodePanelProps } from './types'
import { useDiffViewerConfig } from '../main/providers/diff-viewer-context'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.md};
    `,
  }
}

export const CodePanel: React.FC<CodePanelProps> = (props) => {
  let hasSpecificProvider = true
  try {
    void useCodePanelConfig()
  } catch {
    hasSpecificProvider = false
  }

  let inheritedConfig
  try {
    const diffViewerConfig = useDiffViewerConfig()
    inheritedConfig = diffViewerConfig.codePanelConfig
  } catch {
    inheritedConfig = undefined
  }

  const diffViewer = <CodePanelContent {...props} />

  if (hasSpecificProvider) {
    return diffViewer
  }

  // Otherwise create a provider, seeding it with any config we could inherit.
  return <CodePanelConfigProvider config={inheritedConfig}>{diffViewer}</CodePanelConfigProvider>
}

const CodePanelContent: React.FC<CodePanelProps> = (props) => {
  const styles = useStyles()
  const { setAllFileKeys } = useCodePanelConfig()

  useEffect(() => {
    if (props.scrollTo) {
      const element = document.getElementById(`file-diff-${props.scrollTo}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [props.scrollTo])

  useEffect(() => {
    const keys = props.diff.files.map((f) => f.newPath || f.oldPath)
    setAllFileKeys(keys)
  }, [props.diff.files, setAllFileKeys])

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      {props.diff.files.map((file) => (
        <FileViewer key={file.newPath || file.oldPath} id={`file-diff-${file.newPath || file.oldPath}`} file={file} />
      ))}
    </div>
  )
}
