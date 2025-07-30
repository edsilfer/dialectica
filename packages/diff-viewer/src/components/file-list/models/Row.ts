import { DiffLineType } from '../../../models/LineDiff'
import { Widget } from '../../../models/LineExtensions'
import { LineMetadata } from './LineMetadata'
import { Side } from './types'

/**
 * A view model to feed the row components
 *
 * @param line    - The line to display
 * @param widgets - The widgets to display
 */
export class Row {
  constructor(
    private readonly line: LineMetadata,
    private readonly widgets: Widget[],
  ) {}

  getContent(side?: Side): string | undefined {
    if (!side) {
      // Unified view: use the left content (unified view only populates left side)
      return this.line.contentLeft ?? undefined
    }
    const leftContent = this.line.contentLeft ?? undefined
    const rightContent = this.line.contentRight ?? undefined
    return side === 'left' ? leftContent : rightContent
  }

  getLanguage(): string {
    return this.line.language
  }

  getLineType(side?: Side): DiffLineType {
    if (!side) {
      // Unified view: use the left type (unified view only populates left side)
      return this.line.typeLeft ?? 'context'
    }
    return (side === 'left' ? this.line.typeLeft : this.line.typeRight) ?? 'context'
  }

  getLineNumber(side?: Side): number | null {
    if (!side) {
      // Unified view: use the left line number (unified view only populates left side)
      return this.line.lineNumberLeft
    }
    return side === 'left' ? this.line.lineNumberLeft : this.line.lineNumberRight
  }

  get rawLine(): LineMetadata {
    return this.line
  }

  get topWidgets(): Widget[] {
    return this.getWidgets('top')
  }

  get bottomWidgets(): Widget[] {
    return this.getWidgets('bottom')
  }

  private getWidgets(dock: 'top' | 'bottom'): Widget[] {
    return (
      this.widgets?.filter((w) => {
        const widgetLineNumber = w.side === 'left' ? this.line.lineNumberLeft : this.line.lineNumberRight
        return w.position === dock && w.line === widgetLineNumber
      }) ?? []
    )
  }
}
