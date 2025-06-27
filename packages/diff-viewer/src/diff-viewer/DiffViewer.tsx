import React, { useContext, useEffect } from 'react'
import type { ParsedDiff, DiffLine, DisplayConfig as DiffViewerConfig } from './types'
import FileViewer from './file-viewer/FileViewer'
import { Interpolation, Theme, css } from '@emotion/react'
import { DiffViewerThemeProvider, ThemeContext } from '../shared/providers/theme-provider'
import { Themes } from '../shared/themes'

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
}

export type DiffViewerProps = {
  /** The parsed diff to display. */
  diff: ParsedDiff
  /** The file to scroll to when the diff is loaded. */
  scrollTo?: string | null
  /** Display configuration options. */
  config?: DiffViewerConfig
  /** Kept to make typescript happy, but not used by emotion */
  css?: Interpolation<Theme>
  /** The content of css will be hashed and passed here */
  className?: string

  // Callbacks ____________________________________________
  /** Callback for when a line is clicked. */
  onLineClick?: (line: DiffLine) => void
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
