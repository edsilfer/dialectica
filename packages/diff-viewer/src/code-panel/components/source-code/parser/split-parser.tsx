import { DiffLine } from '../../../../shared/parsers/types'
import { LinePair } from '../../file-viewer/types'
import { LinePairBuilder, CommonParser } from './commons'

/** Parser for converting FileDiff objects to LinePair arrays for split view rendering. */
export class SplitParser extends CommonParser {
  protected processChange = (change: DiffLine, rows: LinePair[], language: string): void => {
    switch (change.type) {
      case 'context':
        rows.push(
          LinePairBuilder.build(change, language, {
            typeLeft: 'context',
            typeRight: 'context',
            contentLeft: change.content,
            contentRight: change.content,
            lineNumberLeft: change.lineNumberOld,
            lineNumberRight: change.lineNumberNew,
          }),
        )
        break
      case 'delete':
        rows.push(
          LinePairBuilder.build(change, language, {
            typeLeft: 'delete',
            typeRight: 'empty',
            contentLeft: change.content,
            lineNumberLeft: change.lineNumberOld,
          }),
        )
        break
      case 'add': {
        // Add an insertion to the split view. If the previous row was a deletion with
        // no paired right-hand side we merge the two changes into a single visual row.
        const lastRow = rows.at(-1)
        if (lastRow?.typeLeft === 'delete' && lastRow.typeRight === 'empty') {
          const addLine = LinePairBuilder.build(change, language, {
            typeLeft: 'empty',
            typeRight: 'add',
            contentRight: change.content,
            lineNumberRight: change.lineNumberNew,
          })
          lastRow.typeRight = addLine.typeRight
          lastRow.contentRight = addLine.contentRight
          lastRow.highlightedContentRight = addLine.highlightedContentRight
          lastRow.lineNumberRight = addLine.lineNumberRight
        } else {
          rows.push(
            LinePairBuilder.build(change, language, {
              typeLeft: 'empty',
              typeRight: 'add',
              contentRight: change.content,
              lineNumberRight: change.lineNumberNew,
            }),
          )
        }
        break
      }
    }
  }
}
