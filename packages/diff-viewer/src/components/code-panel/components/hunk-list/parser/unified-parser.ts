import { LineDiff } from '../../../../../models/LineDiff'
import { LinePair } from '../../hunk-list/models/LinePair'
import { CommonParser } from './common-parser'

export class UnifiedLineParser extends CommonParser {
  protected processLine = (change: LineDiff, rows: LinePair[], language: string): void => {
    switch (change.type) {
      case 'context':
        rows.push(
          LinePair.build(change, language, {
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
          LinePair.build(change, language, {
            typeLeft: 'delete',
            typeRight: 'empty',
            contentLeft: change.content,
            lineNumberLeft: change.lineNumberOld,
          }),
        )
        break
      case 'add':
        rows.push(
          LinePair.build(change, language, {
            typeLeft: 'add',
            typeRight: 'empty',
            contentLeft: change.content,
            lineNumberRight: change.lineNumberNew,
          }),
        )
        break
      case 'empty':
        rows.push(
          LinePair.build(change, language, {
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
          LinePair.build(change, language, {
            typeLeft: 'hunk',
            typeRight: 'hunk',
            contentLeft: change.content,
            contentRight: change.content,
          }),
        )
        break
    }
  }
}
