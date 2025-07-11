import { DiffLineType } from '../../../models/LineDiff'
import { Widget } from '../components/types'
import { DiffLineViewModel } from './DiffLineViewModel'

/**
 * A view model for a diff row
 *
 * @param line    - The line to display
 * @param widgets - The widgets to display
 */
export class DiffRowViewModel {
  constructor(
    private readonly line: DiffLineViewModel,
    private readonly widgets: Widget[],
  ) {}

  getContent(side?: 'left' | 'right'): string {
    if (!side) {
      // Unified view: use the left content (unified view only populates left side)
      return this.line.highlightedContentLeft ?? '&nbsp;'
    }
    const leftContent = this.line.highlightedContentLeft ?? '&nbsp;'
    const rightContent = this.line.highlightedContentRight ?? '&nbsp;'
    return side === 'left' ? leftContent : rightContent
  }

  getLineType(side?: 'left' | 'right'): DiffLineType {
    if (!side) {
      // Unified view: use the left type (unified view only populates left side)
      return this.line.typeLeft ?? 'context'
    }
    return (side === 'left' ? this.line.typeLeft : this.line.typeRight) ?? 'context'
  }

  getLineNumber(side?: 'left' | 'right'): number | null {
    if (!side) {
      // Unified view: use the left line number (unified view only populates left side)
      return this.line.lineNumberLeft
    }
    return side === 'left' ? this.line.lineNumberLeft : this.line.lineNumberRight
  }

  get rawLine(): DiffLineViewModel {
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
