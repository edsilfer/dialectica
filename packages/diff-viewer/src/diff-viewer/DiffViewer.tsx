import { css } from '@emotion/react'
import React, { useContext, useEffect } from 'react'
import { ThemeContext } from '../shared/providers/theme-context'
import FileViewer from './components/file-viewer/FileViewer'
import { DiffViewerConfigProvider, useDiffViewerConfig } from './providers/diff-viewer-context'
import type { DiffViewerProps } from './types'

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

export const DiffViewer: React.FC<DiffViewerProps> = (props) => {
  let hasProvider = true
  try {
    void useDiffViewerConfig()
  } catch {
    hasProvider = false
  }

  const diffViewer = <DiffViewerContent {...props} />

  return hasProvider ? (
    diffViewer
  ) : (
    <DiffViewerConfigProvider>{diffViewer}</DiffViewerConfigProvider>
  )
}

const DiffViewerContent: React.FC<DiffViewerProps> = (props) => {
  const styles = useStyles()

  useEffect(() => {
    if (props.scrollTo) {
      const element = document.getElementById(`file-diff-${props.scrollTo}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [props.scrollTo])

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      {props.diff.files.map((file) => (
        <FileViewer
          key={file.newPath || file.oldPath}
          id={`file-diff-${file.newPath || file.oldPath}`}
          file={file}
        />
      ))}
    </div>
  )
}
