import { DiffLine } from '../../../models/LineDiff'
import { LineMetadata } from '../models/LineMetadata'
import { CommonParser } from './common-parser'

export class SplitLineParser extends CommonParser {
  protected processLine = (change: DiffLine, rows: LineMetadata[], language: string): void => {
    switch (change.type) {
      case 'context':
        rows.push(
          LineMetadata.build(language, {
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
          LineMetadata.build(language, {
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
          const addLine = LineMetadata.build(language, {
            typeLeft: 'empty',
            typeRight: 'add',
            contentRight: change.content,
            lineNumberRight: change.lineNumberNew,
          })
          lastRow.typeRight = addLine.typeRight
          lastRow.contentRight = addLine.contentRight
          lastRow.lineNumberRight = addLine.lineNumberRight
        } else {
          rows.push(
            LineMetadata.build(language, {
              typeLeft: 'empty',
              typeRight: 'add',
              contentRight: change.content,
              lineNumberRight: change.lineNumberNew,
            }),
          )
        }
        break
      }
      case 'empty':
        rows.push(
          LineMetadata.build(language, {
            typeLeft: 'empty',
            typeRight: 'empty',
            contentLeft: change.content,
            contentRight: change.content,
            lineNumberLeft: change.lineNumberOld,
            lineNumberRight: change.lineNumberNew,
          }),
        )
        break
      case 'hunk':
        rows.push(
          LineMetadata.build(language, {
            typeLeft: 'hunk',
            typeRight: 'hunk',
            contentLeft: change.content,
            contentRight: change.content,
            language,
          }),
        )
        break
    }
  }
}
