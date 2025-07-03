import { FileDiff } from '../../../../shared/parsers/types'
import { LinePair } from '../../file-viewer/types'
import { LinePairBuilder } from '../parser/commons'
import { ParserFactory } from '../parser/parser-factory'
import { HunkHeaderViewModel } from './HunkHeaderViewModel'

export type DisplayType = 'split' | 'unified'

export type HunkState = {
  start: number | undefined
  prev: number | undefined
  next: number | undefined
  prevRange: { start: number; end: number } | undefined
  nextRange: { start: number; end: number } | undefined
  upRange: { start: number; end: number } | undefined
  downRange: { start: number; end: number } | undefined
}

export class SourceCodeViewModel {
  private fileDiff: FileDiff
  private displayType: DisplayType
  private _lines: LinePair[]
  private maxLinesToFetch: number
  public get lines(): readonly LinePair[] {
    return this._lines
  }
  public get hunkStates(): ReadonlyMap<LinePair, HunkState> {
    return this._hunkState
  }

  public readonly fileKey: string
  private hunkHeaderMap: Map<LinePair, HunkHeaderViewModel>
  private _hunkState: Map<LinePair, HunkState>
  private listeners = new Set<() => void>()

  constructor(fileDiff: FileDiff, displayType: DisplayType, maxLinesToFetch: number = 10) {
    this.fileDiff = fileDiff
    this.displayType = displayType
    this.maxLinesToFetch = maxLinesToFetch
    this.fileKey = fileDiff.key

    this._lines = ParserFactory.build(displayType).parse(fileDiff)
    this.hunkHeaderMap = new Map()
    this._hunkState = new Map()
    this.buildHunkHeaderMap()
    this.updateHunkState()
  }

  public subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  setLines(lines: LinePair[]): void {
    this._lines = lines
    this.buildHunkHeaderMap() // Rebuild the map when lines change
    this.updateHunkState() // Update hunk state when lines change
    this.notify()
  }

  private updateHunkState(): void {
    this._hunkState.clear()

    const hunkLines: { line: LinePair; header: HunkHeaderViewModel }[] = []
    for (const line of this._lines) {
      const header = this.hunkHeaderMap.get(line)
      if (header) hunkLines.push({ line, header })
    }

    const MAX = this.maxLinesToFetch

    hunkLines.forEach(({ line, header }, idx) => {
      const prevHeader = idx > 0 ? hunkLines[idx - 1].header : undefined
      const nextHeader = idx < hunkLines.length - 1 ? hunkLines[idx + 1].header : undefined

      const startOfCurrent = header.left.start
      const endOfCurrent = header.left.end

      // Find the last visible line before this hunk
      const hunkIndex = this._lines.indexOf(line)
      let lastVisibleLineBefore: number | undefined
      for (let i = hunkIndex - 1; i >= 0; i--) {
        const prevLine = this._lines[i]
        if (prevLine.lineNumberLeft && prevLine.typeLeft !== 'hunk') {
          lastVisibleLineBefore = prevLine.lineNumberLeft
          break
        }
      }

      let prevRange: { start: number; end: number } | undefined
      if (lastVisibleLineBefore) {
        // Use the last visible line before this hunk as the starting point for expansion
        const start = lastVisibleLineBefore + 1
        const end = Math.min(lastVisibleLineBefore + MAX, startOfCurrent - 1)
        if (start <= end) prevRange = { start, end }
      } else if (startOfCurrent > 1) {
        // No visible line found - fallback to classic "up" behaviour
        const end = startOfCurrent - 1
        const start = Math.max(1, end - MAX + 1)
        if (start <= end) prevRange = { start, end }
      }

      let nextRange: { start: number; end: number } | undefined
      const downStart = endOfCurrent + 1
      if (nextHeader) {
        const rangeEnd = Math.min(endOfCurrent + MAX, nextHeader.left.start - 1)
        if (downStart <= rangeEnd) nextRange = { start: downStart, end: rangeEnd }
      } else {
        // last hunk – just offer MAX more lines
        nextRange = { start: downStart, end: endOfCurrent + MAX }
      }

      // upRange: expand upward from hunk start (for in_up)
      let upRange: { start: number; end: number } | undefined
      if (startOfCurrent > 1) {
        const end = startOfCurrent - 1
        const start = Math.max(1, startOfCurrent - MAX)
        if (start <= end) upRange = { start, end }
      }

      // downRange: expand downward from last visible line (for in_down)
      let downRange: { start: number; end: number } | undefined
      if (lastVisibleLineBefore) {
        const start = lastVisibleLineBefore + 1
        const end = Math.min(lastVisibleLineBefore + MAX, startOfCurrent - 1)
        if (start <= end) downRange = { start, end }
      }

      this._hunkState.set(line, {
        start: startOfCurrent,
        prev: prevHeader ? prevHeader.left.end : undefined,
        next: nextHeader?.left.start,
        prevRange,
        nextRange,
        upRange,
        downRange,
      })
    })
  }

  filePath(): string {
    return this.fileDiff.oldPath === this.fileDiff.newPath
      ? this.fileDiff.newPath
      : `${this.fileDiff.oldPath} → ${this.fileDiff.newPath}`
  }

  /**
   * Inserts fetched context lines and, if the file boundary is reached,
   * removes the hunk header (`pivot`) that was clicked.
   *
   * @param lines     line-number → text map from the server
   * @param pivot     the hunk-header LinePair that triggered the fetch
   * @param position  'before' → expanding up,  'after' → expanding down
   * @returns         the new LinePair[] (caller must pass it to setLines)
   */
  injectLines(lines: Record<number, string>, pivot: LinePair, position: 'before' | 'after'): LinePair[] {
    /* ------------------------------------------------------------------- */
    /* 1) Build the new context lines                                      */
    /* ------------------------------------------------------------------- */
    const mapped: LinePair[] = Object.entries(lines).map(([ln, content]) =>
      LinePairBuilder.build(
        { type: 'context', content, lineNumberOld: +ln, lineNumberNew: +ln },
        this.fileDiff.language,
        {
          typeLeft: 'context',
          typeRight: 'context',
          contentLeft: content,
          contentRight: content,
          lineNumberLeft: +ln,
          lineNumberRight: +ln,
        },
      ),
    )

    /* ------------------------------------------------------------------- */
    /* 2) Splice them into a copy of _lines                                 */
    /* ------------------------------------------------------------------- */
    const baseIdx = this._lines.indexOf(pivot)
    if (baseIdx === -1) return this._lines // should never happen

    const insertIdx = position === 'before' ? baseIdx : baseIdx + 1
    const next = [...this._lines]
    next.splice(insertIdx, 0, ...mapped)

    /* ------------------------------------------------------------------- */
    /* 3) Decide whether the pivot header is still needed                   */
    /* ------------------------------------------------------------------- */
    const insertedNumbers = Object.keys(lines).map(Number)
    const minInserted = Math.min(...insertedNumbers)

    let removePivot = false

    if (position === 'before') {
      // expanding up – reached the top if we now have line 1
      if (minInserted === 1) removePivot = true
    } else {
      // expanding down – header is obsolete if no further hunk headers remain
      const hasHunkBelow = next
        .slice(next.indexOf(pivot) + 1)
        .some((l) => l.typeLeft === 'hunk' || l.typeRight === 'hunk')
      if (!hasHunkBelow) removePivot = true
    }

    if (removePivot) {
      const idx = next.indexOf(pivot)
      if (idx !== -1) next.splice(idx, 1)
    }

    /* ------------------------------------------------------------------- */
    /* 4) Return – caller will commit via setLines(next)                    */
    /* ------------------------------------------------------------------- */
    return next
  }

  private buildHunkHeaderMap(): void {
    this.hunkHeaderMap.clear()
    const isHunk = (l: LinePair) => l.typeLeft === 'hunk' || l.typeRight === 'hunk'

    let hunkIndex = 0
    for (const line of this._lines) {
      if (isHunk(line)) {
        const hunkContent = line.contentLeft || line.contentRight
        if (hunkContent) {
          this.hunkHeaderMap.set(
            line,
            HunkHeaderViewModel.build(
              { content: hunkContent },
              hunkIndex,
              this.fileDiff.hunks.map((h) => ({ content: h.content })),
            ),
          )
          hunkIndex++
        }
      }
    }
  }
}
