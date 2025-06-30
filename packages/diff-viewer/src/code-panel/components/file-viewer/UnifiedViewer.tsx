import { css } from '@emotion/react'
import React, { useContext, useLayoutEffect, useRef, useState } from 'react'
import { ThemeContext } from '../../../shared/providers/theme-context'
import { useCodePanelConfig } from '../../providers/code-panel-context'
import DiffLine from '../line-viewer/DiffLine'
import { UnifiedViewerProps } from './types'

const useStyles = (wrapLines: boolean) => {
  const theme = useContext(ThemeContext)

  return {
    container: css`
      display: table;
      width: 100%;
      border-collapse: collapse;
      table-layout: ${wrapLines ? 'auto' : 'fixed'};
      overflow-y: hidden;
      ${!wrapLines ? 'display: block; overflow-x: auto;' : ''}
      background-color: ${theme.colors.hunkViewerBg};
    `,
  }
}

const UnifiedViewer: React.FC<UnifiedViewerProps> = ({ lines, wrapLines: initialWrapLines }) => {
  const { config } = useCodePanelConfig()
  const wrapLines = initialWrapLines ?? true
  const styles = useStyles(wrapLines)

  const tableRef = useRef<HTMLTableElement>(null)
  const [offsets, setOffsets] = useState<{ rightNumber: number; prefix: number }>({
    rightNumber: 0,
    prefix: 0,
  })

  // Measure column widths after first render
  useLayoutEffect(() => {
    if (!tableRef.current) return
    const firstRow = tableRef.current.querySelector('tbody tr')
    if (!firstRow) return
    const cells = Array.from(firstRow.children) as HTMLElement[]
    if (cells.length < 3) return
    const leftWidth = cells[0].getBoundingClientRect().width
    const rightWidth = cells[1].getBoundingClientRect().width
    setOffsets({ rightNumber: leftWidth, prefix: leftWidth + rightWidth })
  }, [lines])

  return (
    <table css={styles.container} ref={tableRef}>
      {/*
        React inserts whitespace text nodes for the literal spaces/newlines that
        appear between elements inside <colgroup>, which is invalid HTML and
        triggers a hydration error. By generating the <col> elements via a
        JavaScript expression and keeping the closing tag tight to the
        expression, no stray whitespace nodes are produced.
      */}
      <colgroup>
        {[<col key="left" />, <col key="right" />, <col key="prefix" />, <col key="code" />]}
      </colgroup>
      <tbody>
        {lines.map((line, i) => (
          <DiffLine
            key={i === 0 ? 'hunk-header' : `${line.type}-${i}`}
            leftNumber={line.lineNumberOld}
            rightNumber={line.lineNumberNew}
            content={line.highlightedContent}
            showNumber={!!config.showLineNumbers}
            type={line.type}
            onAddButtonClick={() => console.log('Add comment clicked')}
            wrapLines={wrapLines}
            view="unified"
            stickyOffsets={offsets}
          />
        ))}
      </tbody>
    </table>
  )
}

export default UnifiedViewer
