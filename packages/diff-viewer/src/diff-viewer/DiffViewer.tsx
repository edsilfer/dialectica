import { css } from '@emotion/react'
import React, { useContext, useEffect } from 'react'
import { DiffViewerThemeProvider, ThemeContext } from '../shared/providers/theme-provider'
import { Themes } from '../shared/themes'
import FileViewer from './components/file-viewer/FileViewer'
import type { DisplayConfig as DiffViewerConfig, DiffViewerProps } from './types'

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

/** The default display configuration for the diff viewer. */
const DEFAULT_DISPLAY_CONFIG: DiffViewerConfig = {
  mode: 'unified',
  highlightSyntax: false,
  showLineNumbers: true,
  ignoreWhitespace: false,
  wrapLines: true,
}

export const DiffViewer: React.FC<DiffViewerProps> = (props) => {
  return (
    <DiffViewerThemeProvider theme={props.config?.theme || Themes.light}>
      <Content
        diff={props.diff}
        scrollTo={props.scrollTo}
        config={props.config}
        css={props.css}
        className={props.className}
        onLineClick={props.onLineClick}
      />
    </DiffViewerThemeProvider>
  )
}

const Content: React.FC<DiffViewerProps> = (props) => {
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
          config={props.config || DEFAULT_DISPLAY_CONFIG}
        />
      ))}
    </div>
  )
}
