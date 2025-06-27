import React, { useContext } from 'react'
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
        config={props.config}
        css={props.css}
        className={props.className}
      />
    </DiffViewerThemeProvider>
  )
}

const Content: React.FC<DiffViewerProps> = (props) => {
  const styles = useStyles()

  return (
    <div css={[styles.container, props.css]} className={props.className}>
      {props.diff.files.map((file, index) => (
        <FileViewer key={index} file={file} config={props.config || DEFAULT_DISPLAY_CONFIG} />
      ))}
    </div>
  )
}
