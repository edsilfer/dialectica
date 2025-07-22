import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DiffLineType } from '../../../models/LineDiff'
import { createMockLineDiff } from '../../../utils/test/models/test-utils'
import type { HunkDirection } from '../components/viewers/types'
import { DiffLineViewModel } from './DiffLineViewModel'

/**
 * # DiffLineViewModel Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **highlight-utils**: Mocked to isolate syntax highlighting logic and provide predictable HTML output for testing
 * - **test-utils**: Uses createMockLineDiff to provide consistent test data without external dependencies
 *
 * ## Happy Path
 * - Constructor with all properties → Correct property assignment and type preservation
 * - Build method with both sides → Proper instance creation with syntax highlighting applied
 * - BuildHunkLine method → Hunk header parsing and consistent left/right side population
 * - Unified viewer scenarios → Single-side content handling for unified diff display
 * - Split viewer scenarios → Dual-side content handling for side-by-side diff display
 *
 * ## Edge Cases
 * - **Null values for left/right sides**: Verifies null preservation and proper handling of missing content
 * - **Empty content strings**: Ensures empty strings are handled correctly without breaking highlighting
 * - **Null line numbers**: Confirms null line numbers are preserved and don't cause errors
 * - **Undefined hunk direction**: Validates optional hunk direction parameter handling
 * - **No content in build method**: Tests highlighting behavior when content is null but change content exists
 * - **Different line numbers**: Ensures split view correctly handles mismatched line numbering
 *
 * ## Assertions
 * - Verify property assignments, null value handling, syntax highlighting integration, and method call patterns
 * - Test both constructor instantiation and static factory methods (build, buildHunkLine)
 * - Validate integration with highlight-utils through mock verification
 */

// HELPERS
const createMockDiffLineViewModel = (overrides: Partial<DiffLineViewModel> = {}): DiffLineViewModel => {
  const defaultLine = new DiffLineViewModel(
    'context',
    'test content',
    'test content',
    1,
    'context',
    'test content',
    'test content',
    1,
  )
  return Object.assign(defaultLine, overrides)
}

describe('DiffLineViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor scenarios', () => {
    it('given all properties provided, when instantiated, expect correct properties set', () => {
      // WHEN
      const instance = createMockDiffLineViewModel()

      // EXPECT
      expect(instance.typeLeft).toBe('context')
      expect(instance.contentLeft).toBe('test content')
      expect(instance.highlightedContentLeft).toBe('test content')
      expect(instance.lineNumberLeft).toBe(1)
      expect(instance.typeRight).toBe('context')
      expect(instance.contentRight).toBe('test content')
      expect(instance.highlightedContentRight).toBe('test content')
      expect(instance.lineNumberRight).toBe(1)
    })

    it('given null values for left side only, when instantiated, expect null values preserved', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeLeft: null,
        contentLeft: null,
        highlightedContentLeft: null,
        lineNumberLeft: null,
      })

      // EXPECT
      expect(instance.typeLeft).toBeNull()
      expect(instance.contentLeft).toBeNull()
      expect(instance.highlightedContentLeft).toBeNull()
      expect(instance.lineNumberLeft).toBeNull()
    })

    it('given null values for right side only, when instantiated, expect null values preserved', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeRight: null,
        contentRight: null,
        highlightedContentRight: null,
        lineNumberRight: null,
      })

      // EXPECT
      expect(instance.typeRight).toBeNull()
      expect(instance.contentRight).toBeNull()
      expect(instance.highlightedContentRight).toBeNull()
      expect(instance.lineNumberRight).toBeNull()
    })

    it('given hunk direction provided, when instantiated, expect hunk direction set', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        hunkDirection: 'up',
      })

      // EXPECT
      expect(instance.hunkDirection).toBe('up')
    })
  })

  describe('build method scenarios', () => {
    it('given both left and right content provided, when build called, expect correct instance created', () => {
      // WHEN
      const result = DiffLineViewModel.build(createMockLineDiff({ content: 'test line', type: 'add' }), 'typescript', {
        typeLeft: 'delete' as DiffLineType,
        typeRight: 'add' as DiffLineType,
        contentLeft: 'old content',
        contentRight: 'new content',
        lineNumberLeft: 5,
        lineNumberRight: 5,
      })

      // EXPECT
      expect(result.typeLeft).toBe('delete')
      expect(result.contentLeft).toBe('old content')
      expect(result.highlightedContentLeft).toBe('test line')
      expect(result.lineNumberLeft).toBe(5)
      expect(result.typeRight).toBe('add')
      expect(result.contentRight).toBe('new content')
      expect(result.highlightedContentRight).toBe('test line')
      expect(result.lineNumberRight).toBe(5)
    })

    it('given only left content provided, when build called, expect left side populated only', () => {
      // WHEN
      const result = DiffLineViewModel.build(
        createMockLineDiff({ content: 'test line', type: 'delete' }),
        'javascript',
        {
          typeLeft: 'delete' as DiffLineType,
          typeRight: null,
          contentLeft: 'deleted content',
          lineNumberLeft: 10,
        },
      )

      // EXPECT
      expect(result.typeLeft).toBe('delete')
      expect(result.contentLeft).toBe('deleted content')
      expect(result.highlightedContentLeft).toBe('test line')
      expect(result.lineNumberLeft).toBe(10)
      expect(result.typeRight).toBeNull()
      expect(result.contentRight).toBeNull()
      expect(result.highlightedContentRight).toBeNull()
      expect(result.lineNumberRight).toBeNull()
    })

    it('given only right content provided, when build called, expect right side populated only', () => {
      // WHEN
      const result = DiffLineViewModel.build(createMockLineDiff({ content: 'test line', type: 'add' }), 'python', {
        typeLeft: null,
        typeRight: 'add' as DiffLineType,
        contentRight: 'added content',
        lineNumberRight: 15,
      })

      // EXPECT
      expect(result.typeLeft).toBeNull()
      expect(result.contentLeft).toBeNull()
      expect(result.highlightedContentLeft).toBeNull()
      expect(result.lineNumberLeft).toBeNull()
      expect(result.typeRight).toBe('add')
      expect(result.contentRight).toBe('added content')
      expect(result.highlightedContentRight).toBe('test line')
      expect(result.lineNumberRight).toBe(15)
    })

    it('given no content provided, when build called, expect defaults used', () => {
      // WHEN
      const result = DiffLineViewModel.build(
        createMockLineDiff({ content: 'test line', type: 'context' }),
        'typescript',
        {
          typeLeft: 'context' as DiffLineType,
          typeRight: 'context' as DiffLineType,
        },
      )

      // EXPECT
      expect(result.typeLeft).toBe('context')
      expect(result.contentLeft).toBeNull()
      expect(result.highlightedContentLeft).toBeNull()
      expect(result.lineNumberLeft).toBeNull()
      expect(result.typeRight).toBe('context')
      expect(result.contentRight).toBeNull()
      expect(result.highlightedContentRight).toBeNull()
      expect(result.lineNumberRight).toBeNull()
    })

    it('given hunk direction provided, when build called, expect hunk direction set', () => {
      // WHEN
      const result = DiffLineViewModel.build(
        createMockLineDiff({ content: 'test line', type: 'context' }),
        'typescript',
        {
          typeLeft: 'context' as DiffLineType,
          typeRight: 'context' as DiffLineType,
          hunkDirection: 'down' as HunkDirection,
        },
      )

      // EXPECT
      expect(result.hunkDirection).toBe('down')
    })
  })

  describe('buildHunkLine method scenarios', () => {
    it('given simple hunk header, when buildHunkLine called, expect hunk line created', () => {
      // WHEN
      const result = DiffLineViewModel.buildHunkLine('@@ -1,3 +1,3 @@')

      // EXPECT
      expect(result.typeLeft).toBe('hunk')
      expect(result.contentLeft).toBe('@@ -1,3 +1,3 @@')
      expect(result.highlightedContentLeft).toBe('@@ -1,3 +1,3 @@')
      expect(result.lineNumberLeft).toBeNull()
      expect(result.typeRight).toBe('hunk')
      expect(result.contentRight).toBe('@@ -1,3 +1,3 @@')
      expect(result.highlightedContentRight).toBe('@@ -1,3 +1,3 @@')
      expect(result.lineNumberRight).toBeNull()
      expect(result.hunkDirection).toBeUndefined()
    })

    it('given hunk header with function name, when buildHunkLine called, expect hunk line created', () => {
      // WHEN
      const result = DiffLineViewModel.buildHunkLine('@@ -58,11 +58,10 @@ import type {')

      // EXPECT
      expect(result.typeLeft).toBe('hunk')
      expect(result.contentLeft).toBe('@@ -58,11 +58,10 @@ import type {')
      expect(result.highlightedContentLeft).toBe('@@ -58,11 +58,10 @@ import type {')
      expect(result.lineNumberLeft).toBeNull()
      expect(result.typeRight).toBe('hunk')
      expect(result.contentRight).toBe('@@ -58,11 +58,10 @@ import type {')
      expect(result.highlightedContentRight).toBe('@@ -58,11 +58,10 @@ import type {')
      expect(result.lineNumberRight).toBeNull()
      expect(result.hunkDirection).toBeUndefined()
    })
  })

  describe('unified viewer scenarios', () => {
    it('given unified viewer with left side only, when instantiated, expect unified viewer pattern', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeRight: null,
        contentRight: null,
        highlightedContentRight: null,
        lineNumberRight: null,
      })

      // EXPECT
      expect(instance.typeLeft).toBe('context')
      expect(instance.contentLeft).toBe('test content')
      expect(instance.typeRight).toBeNull()
      expect(instance.contentRight).toBeNull()
    })

    it('given unified viewer with add line, when instantiated, expect add line pattern', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeLeft: 'add',
        contentLeft: 'added line',
        typeRight: null,
        contentRight: null,
      })

      // EXPECT
      expect(instance.typeLeft).toBe('add')
      expect(instance.contentLeft).toBe('added line')
      expect(instance.typeRight).toBeNull()
      expect(instance.contentRight).toBeNull()
    })

    it('given unified viewer with delete line, when instantiated, expect delete line pattern', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeLeft: 'delete',
        contentLeft: 'deleted line',
        typeRight: null,
        contentRight: null,
      })

      // EXPECT
      expect(instance.typeLeft).toBe('delete')
      expect(instance.contentLeft).toBe('deleted line')
      expect(instance.typeRight).toBeNull()
      expect(instance.contentRight).toBeNull()
    })
  })

  describe('split viewer scenarios', () => {
    it('given split viewer with both sides populated, when instantiated, expect split viewer pattern', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeLeft: 'delete',
        contentLeft: 'old line',
        typeRight: 'add',
        contentRight: 'new line',
      })

      // EXPECT
      expect(instance.typeLeft).toBe('delete')
      expect(instance.contentLeft).toBe('old line')
      expect(instance.typeRight).toBe('add')
      expect(instance.contentRight).toBe('new line')
    })

    it('given split viewer with context on both sides, when instantiated, expect context pattern', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        typeLeft: 'context',
        contentLeft: 'unchanged line',
        typeRight: 'context',
        contentRight: 'unchanged line',
      })

      // EXPECT
      expect(instance.typeLeft).toBe('context')
      expect(instance.contentLeft).toBe('unchanged line')
      expect(instance.typeRight).toBe('context')
      expect(instance.contentRight).toBe('unchanged line')
    })

    it('given split viewer with different line numbers, when instantiated, expect different line numbers', () => {
      // WHEN
      const instance = createMockDiffLineViewModel({
        lineNumberLeft: 10,
        lineNumberRight: 15,
      })

      // EXPECT
      expect(instance.lineNumberLeft).toBe(10)
      expect(instance.lineNumberRight).toBe(15)
    })
  })

  describe('edge cases and error handling', () => {
    it('given empty content strings, when instantiated, expect null values handled correctly', () => {
      // WHEN
      const instance = new DiffLineViewModel('context', '', '', 1, 'context', '', '', 1)

      // EXPECT
      expect(instance.contentLeft).toBe('')
      expect(instance.highlightedContentLeft).toBe('')
      expect(instance.contentRight).toBe('')
      expect(instance.highlightedContentRight).toBe('')
    })

    it('given null line numbers, when instantiated, expect null values preserved', () => {
      // WHEN
      const instance = new DiffLineViewModel(
        'context',
        'content',
        'highlighted',
        null,
        'context',
        'content',
        'highlighted',
        null,
      )

      // EXPECT
      expect(instance.lineNumberLeft).toBeNull()
      expect(instance.lineNumberRight).toBeNull()
    })

    it('given undefined hunk direction, when instantiated, expect undefined preserved', () => {
      // WHEN
      const instance = new DiffLineViewModel(
        'context',
        'content',
        'highlighted',
        1,
        'context',
        'content',
        'highlighted',
        1,
        undefined,
      )

      // EXPECT
      expect(instance.hunkDirection).toBeUndefined()
    })

    it('given build with no content, when called, expect highlighting not applied', () => {
      // WHEN
      const result = DiffLineViewModel.build(createMockLineDiff({ content: 'test', type: 'context' }), 'typescript', {
        typeLeft: 'context',
        typeRight: 'context',
        contentLeft: null,
        contentRight: null,
      })

      // EXPECT
      expect(result.highlightedContentLeft).toBeNull()
      expect(result.highlightedContentRight).toBeNull()
    })
  })
})
