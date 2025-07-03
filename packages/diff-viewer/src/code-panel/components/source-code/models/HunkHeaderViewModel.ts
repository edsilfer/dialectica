import { LinePair } from '../../file-viewer/types'
import { escapeHtml } from '../highlight-utils'

/*  ░@@ -<lS>[,<lL>] +<rS>[,<rL>] @@░ */
const HUNK_HEADER_PATTERN = /@@[ \t\-+0-9,]*?-\s*(\d+)(?:,(\d+))?\s+\+\s*(\d+)(?:,(\d+))?\s+@@\s*(.*)/

export type FileMeta = {
  start: number
  end: number
  length: number
}

export type HunkDirection = 'up' | 'down' | 'out' | 'in' | 'in_up' | 'in_down'

/**
 * Represents a parsed unified diff hunk header with metadata and utility methods.
 *
 * A hunk header in a unified diff format looks like:
 * - `@@ -168,6 +167,7 @@` (classic format)
 * - `@@ -42 +42 @@` (single line change)
 * - `@@ -0,0 +1,5 @@ export const x = 1;` (with context)
 *
 * This class parses the header, extracts metadata, and provides methods for
 * direction calculation and conversion to UI components.
 */
export class HunkHeaderViewModel {
  /** The raw hunk header string as provided in the constructor */
  private rawHeader: string
  /** The file path associated with this hunk header */
  public filePath: string
  /** Metadata about the left side (original file) of the hunk */
  public left: FileMeta
  /** Metadata about the right side (modified file) of the hunk */
  public right: FileMeta
  /** Optional context that follows the hunk header (e.g., function name) */
  public context: string
  /** The direction indicator for UI expander glyphs ('up', 'down', 'out', 'in') */
  public direction?: HunkDirection

  /**
   * @param rawContent - The raw hunk header string to parse (e.g., "@@ -168,6 +167,7 @@")
   * @param filePath - The file path associated with this hunk header
   *
   * @throws {Error} If the hunk header format is invalid
   */
  constructor(rawContent: string, filePath: string) {
    this.rawHeader = rawContent
    this.filePath = filePath
    this.left = { start: 0, end: 0, length: 0 }
    this.right = { start: 0, end: 0, length: 0 }
    this.context = ''
    this.parse()
  }

  /**
   * @param hunk       - The hunk to build a line pair for
   * @param hunkIndex  - The index of the hunk in the hunks array
   * @param hunks      - Array of all HunkHeader instances for the file
   * @returns            The hunk header
   */
  static build(hunk: { content: string }, hunkIndex: number, hunks?: { content: string }[]): HunkHeaderViewModel {
    const hunkHeader = new HunkHeaderViewModel(hunk.content, '')
    const direction = HunkHeaderViewModel.parseDirection(
      hunkIndex,
      hunks?.map((h) => new HunkHeaderViewModel(h.content, '')),
    )
    hunkHeader.direction = direction
    return hunkHeader
  }

  /**
   * @returns The reconstructed hunk header string
   */
  toString(): string {
    const leftPart = `${this.left.start}${this.left.length > 1 || this.left.length === 0 ? `,${this.left.length}` : ''}`
    const rightPart = `${this.right.start}${this.right.length > 1 || this.right.length === 0 ? `,${this.right.length}` : ''}`
    const baseHeader = `@@ -${leftPart} +${rightPart} @@`

    return this.context ? `${baseHeader} ${this.context}` : baseHeader
  }

  /**
   * @returns a line pair with the hunk header and the hunk content.
   */
  toLinePair(): LinePair {
    return {
      typeLeft: 'hunk',
      contentLeft: escapeHtml(this.toString()),
      highlightedContentLeft: escapeHtml(this.toString()),
      lineNumberLeft: null,
      typeRight: 'hunk',
      contentRight: escapeHtml(this.toString()),
      highlightedContentRight: escapeHtml(this.toString()),
      lineNumberRight: null,
      hunkDirection: this.direction,
    }
  }

  /**
   * Calculates the direction indicator for a hunk header based on its position and gaps.
   *
   *  - 'up'  : Only hidden lines before this hunk (first hunk with gap above)
   *  - 'down': Only hidden lines after this hunk (last hunk with gap below)
   *  - 'out' : Both sides hidden, gap ≤ bigGap (small gap)
   *  - 'in'  : Both sides hidden, gap > bigGap (large gap – GitHub splits)
   *
   * @param index - The index of the hunk in the hunks array
   * @param hunks - Array of all HunkHeader instances for the file
   * @param bigGap - Threshold for considering a gap "large" (default: 20)
   * @returns The direction indicator for the hunk
   */
  static parseDirection(index: number, hunks: HunkHeaderViewModel[] = [], bigGap = 20): HunkDirection {
    if (!hunks.length) return 'out'

    const first = index === 0
    const last = index === hunks.length - 1
    const cur = hunks[index] // current hunk from array

    const gapAbove = (() => {
      if (first) return cur.left.start - 1
      const prev = hunks[index - 1]
      return Math.max(cur.left.start - prev.left.end - 1, cur.right.start - prev.right.end - 1, 0)
    })()

    const gapBelow = (() => {
      if (last) return 0
      const next = hunks[index + 1]
      return Math.max(next.left.start - cur.left.end - 1, next.right.start - cur.right.end - 1, 0)
    })()

    if (first && gapAbove > 0) return 'up'

    /*
     * If this is the last hunk and there is a significant gap above it we treat
     * it as an "in" hunk (large gaps on both sides) so that a synthetic "down"
     * expander can be rendered afterwards.
     */
    if (last && gapAbove > bigGap) return 'in'

    if (last && gapBelow > 0) return 'down'

    if (gapAbove > 0 && gapBelow > 0) {
      return gapAbove > bigGap || gapBelow > bigGap ? 'in' : 'out'
    }
    if (gapAbove > 0) return 'up'
    if (gapBelow > 0) return 'down'

    return 'out'
  }

  /**
   * - "@@ -168,6 +167,7 @@"                  → classic format
   * - "@@ -42 +42 @@"                        → single line
   * - "@@ -0,0 +1,5 @@ export const x = 1;"  → with context
   *
   * @throws {Error} If the hunk header format is invalid
   */
  private parse(): void {
    const match = HUNK_HEADER_PATTERN.exec(this.rawHeader)
    if (!match) throw new Error(`Invalid hunk header: "${this.rawHeader}"`)

    const [, lStartStr, lLenStr = '', rStartStr, rLenStr = '', context = ''] = match

    const lStart = Number(lStartStr)
    const lLen = lLenStr === '' ? 1 : Number(lLenStr)
    const rStart = Number(rStartStr)
    const rLen = rLenStr === '' ? 1 : Number(rLenStr)

    const calcEnd = (start: number, len: number) => (len === 0 ? start - 1 : start + len - 1)

    this.left = { start: lStart, end: calcEnd(lStart, lLen), length: lLen }
    this.right = { start: rStart, end: calcEnd(rStart, rLen), length: rLen }
    this.context = context
  }
}
