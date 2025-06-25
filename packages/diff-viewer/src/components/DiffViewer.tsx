import React from 'react'
import type { ParsedDiff, DiffLine, DisplayConfig } from '../types/diff'
import FileViewer from './FileViewer'
import { Interpolation, Theme, css } from '@emotion/react'
import { theme } from 'antd'

const useStyles = () => {
  const { token } = theme.useToken()

  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${token.paddingMD}px;
    `,
  }
}

export type DiffViewerProps = {
  /** The parsed diff to display. */
  diff: ParsedDiff
  /** Display configuration options. */
  displayConfig?: DisplayConfig
  /** Callback for when a line is clicked. */
  onLineClick?: (line: DiffLine) => void
  /** Custom CSS class to apply to the component's root element. */
  css?: Interpolation<Theme>
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  displayConfig = {
    mode: 'unified',
    highlightSyntax: false,
    showLineNumbers: true,
    ignoreWhitespace: false,
  },
  css: customCss,
}) => {
  const styles = useStyles()

  return (
    <div css={[styles.container, customCss]}>
      {diff.files.map((file, index) => (
        <FileViewer key={index} file={file} config={displayConfig} />
      ))}
    </div>
  )
}
