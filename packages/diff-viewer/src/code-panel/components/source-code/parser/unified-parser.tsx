import { DiffLine } from '../../../../shared/models/Line'
import { LinePair } from '../../file-viewer/types'
import { LinePairBuilder, CommonParser } from './commons'

/** Parser for converting FileDiff objects to LinePair arrays for unified view rendering. */
export class UnifiedParser extends CommonParser {
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
      case 'add':
        rows.push(
          LinePairBuilder.build(change, language, {
            typeLeft: 'add',
            typeRight: 'empty',
            contentLeft: change.content,
            lineNumberRight: change.lineNumberNew,
          }),
        )
        break
    }
  }
}
