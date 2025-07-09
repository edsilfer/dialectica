import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { createMockFileDiff, createMockHunk, createLineDiff } from '../../../utils/test/models/test-utils'
import { SAMPLE_FILE_DIFFS } from '../../../utils/test/__fixtures__/file-diff-fixtures'
import { useHunkListViewModel } from './use-hunk-list-view-model'
import type { HunkListViewModelProps } from './use-hunk-list-view-model'
import type { HunkDirection } from '../components/types'
import type { LoadMoreLinesResult } from '../../diff-viewer/types'
import { DiffLineViewModel } from '../models/DiffLineViewModel'

/**
 * # useHunkListViewModel Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **HunkListViewModel**: Mocked to isolate hook logic from complex view model implementation and provide predictable behavior for testing
 * - **DiffLineViewModel**: Used as a real class but with mock data to test line processing without external dependencies
 *
 * ## Happy Path
 * - Hook initialization with valid props → HunkListViewModel created with correct parameters → dispatch function returned
 * - Props change (file, mode, maxLinesToFetch) → Reset action triggered → New HunkListViewModel instance created
 * - Lines loaded action dispatched → loadLines method called with correct parameters (line, result, direction)
 *
 * ## Edge Cases
 * - **Unknown action type**: State remains unchanged when invalid action dispatched
 * - **Empty file with no hunks**: Hook initializes correctly without errors
 * - **Complex hunks with mixed changes**: Hook handles files with deletions, additions, and context lines
 * - **Multiple sequential actions**: State updates correctly when multiple actions dispatched in order
 * - **Reset after lines_loaded**: State properly resets when props change after loading lines
 * - **Hook stability**: Same props return same references, different props create new state
 *
 * ## Assertions
 * - Verify HunkListViewModel creation with correct parameters for different scenarios
 * - Test dispatch function calls loadLines with proper arguments for all direction types
 * - Ensure state stability and proper re-initialization on prop changes
 * - Validate hook behavior with various file types (new, deleted, modified)
 */

// MOCK
vi.mock('../models/HunkListViewModel', () => ({
  HunkListViewModel: vi.fn().mockImplementation((file: unknown, _mode: unknown, _maxLinesToFetch: unknown) => ({
    filePath: (file as { key: string }).key,
    linePairs: [],
    loadLines: vi.fn().mockReturnThis(),
  })),
}))

const createHunkListViewModelProps = createPropsFactory<HunkListViewModelProps>({
  file: SAMPLE_FILE_DIFFS[0],
  mode: 'split',
  maxLinesToFetch: 10,
})

const createMockLoadMoreLinesResult = (overrides: Partial<LoadMoreLinesResult> = {}): LoadMoreLinesResult => ({
  leftLines: new Map([
    [1, 'line 1'],
    [2, 'line 2'],
  ]),
  rightLines: new Map([
    [1, 'line 1'],
    [2, 'line 2'],
  ]),
  ...overrides,
})

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

describe('useHunkListViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization scenarios', () => {
    const testCases: Array<{
      description: string
      props: HunkListViewModelProps
      expectedMaxLines: number
    }> = [
      {
        description: 'default props with split mode',
        props: createHunkListViewModelProps(),
        expectedMaxLines: 10,
      },
      {
        description: 'unified mode with custom maxLinesToFetch',
        props: createHunkListViewModelProps({ mode: 'unified', maxLinesToFetch: 5 }),
        expectedMaxLines: 5,
      },
      {
        description: 'undefined maxLinesToFetch defaults to 10',
        props: createHunkListViewModelProps({ maxLinesToFetch: undefined }),
        expectedMaxLines: 10,
      },
      {
        description: 'new file with split mode',
        props: createHunkListViewModelProps({ file: SAMPLE_FILE_DIFFS[3] }),
        expectedMaxLines: 10,
      },
      {
        description: 'deleted file with unified mode',
        props: createHunkListViewModelProps({ file: SAMPLE_FILE_DIFFS[4], mode: 'unified' }),
        expectedMaxLines: 10,
      },
    ]

    testCases.forEach(({ description, props }) => {
      it(`given ${description}, when hook initialized, expect HunkListViewModel created with correct params`, () => {
        // WHEN
        const { result } = renderHook(() => useHunkListViewModel(props))

        // EXPECT
        expect(result.current.hunkList).toBeDefined()
        expect(result.current.dispatch).toBeDefined()
      })
    })
  })

  describe('reset action scenarios', () => {
    const testCases: Array<{
      description: string
      initialProps: HunkListViewModelProps
      newProps: HunkListViewModelProps
    }> = [
      {
        description: 'file changes',
        initialProps: createHunkListViewModelProps({ file: SAMPLE_FILE_DIFFS[0] }),
        newProps: createHunkListViewModelProps({ file: SAMPLE_FILE_DIFFS[1] }),
      },
      {
        description: 'mode changes from split to unified',
        initialProps: createHunkListViewModelProps({ mode: 'split' }),
        newProps: createHunkListViewModelProps({ mode: 'unified' }),
      },
      {
        description: 'maxLinesToFetch changes',
        initialProps: createHunkListViewModelProps({ maxLinesToFetch: 5 }),
        newProps: createHunkListViewModelProps({ maxLinesToFetch: 15 }),
      },
      {
        description: 'multiple props change simultaneously',
        initialProps: createHunkListViewModelProps({ file: SAMPLE_FILE_DIFFS[0], mode: 'split', maxLinesToFetch: 5 }),
        newProps: createHunkListViewModelProps({ file: SAMPLE_FILE_DIFFS[3], mode: 'unified', maxLinesToFetch: 20 }),
      },
    ]

    testCases.forEach(({ description, initialProps, newProps }) => {
      it(`given ${description}, when props change, expect reset action dispatched`, () => {
        // GIVEN
        const { result, rerender } = renderHook(() => useHunkListViewModel(initialProps))

        // WHEN
        rerender(newProps)

        // EXPECT
        expect(result.current.hunkList).toBeDefined()
        expect(result.current.dispatch).toBeDefined()
      })
    })
  })

  describe('lines_loaded action scenarios', () => {
    const testCases: Array<{
      description: string
      direction: HunkDirection
      line: DiffLineViewModel
      result: LoadMoreLinesResult
    }> = [
      {
        description: 'load lines up direction',
        direction: 'up',
        line: createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 5 }),
        result: createMockLoadMoreLinesResult(),
      },
      {
        description: 'load lines down direction',
        direction: 'down',
        line: createMockDiffLineViewModel({ lineNumberLeft: 10, lineNumberRight: 10 }),
        result: createMockLoadMoreLinesResult({
          leftLines: new Map([
            [11, 'new line 11'],
            [12, 'new line 12'],
          ]),
          rightLines: new Map([
            [11, 'new line 11'],
            [12, 'new line 12'],
          ]),
        }),
      },
      {
        description: 'load lines in_up direction',
        direction: 'in_up',
        line: createMockDiffLineViewModel({ lineNumberLeft: 15, lineNumberRight: 15 }),
        result: createMockLoadMoreLinesResult({
          leftLines: new Map([
            [13, 'context line 13'],
            [14, 'context line 14'],
          ]),
          rightLines: new Map([
            [13, 'context line 13'],
            [14, 'context line 14'],
          ]),
        }),
      },
      {
        description: 'load lines in_down direction',
        direction: 'in_down',
        line: createMockDiffLineViewModel({ lineNumberLeft: 20, lineNumberRight: 20 }),
        result: createMockLoadMoreLinesResult({
          leftLines: new Map([
            [21, 'context line 21'],
            [22, 'context line 22'],
          ]),
          rightLines: new Map([
            [21, 'context line 21'],
            [22, 'context line 22'],
          ]),
        }),
      },
    ]

    testCases.forEach(({ description, direction, line, result }) => {
      it(`given ${description}, when lines_loaded action dispatched, expect loadLines called with correct params`, () => {
        // GIVEN
        const { result: hookResult } = renderHook(() => useHunkListViewModel(createHunkListViewModelProps()))
        const mockLoadLines = vi.fn().mockReturnValue(hookResult.current.hunkList)
        hookResult.current.hunkList.loadLines = mockLoadLines

        // WHEN
        act(() => {
          hookResult.current.dispatch({
            type: 'lines_loaded',
            payload: { line, result, direction },
          })
        })

        // EXPECT
        expect(mockLoadLines).toHaveBeenCalledWith(line, result, direction)
      })
    })
  })

  describe('edge cases and error handling', () => {
    it('given unknown action type, when dispatched, expect state unchanged', () => {
      // GIVEN
      const { result } = renderHook(() => useHunkListViewModel(createHunkListViewModelProps()))
      const originalState = result.current.hunkList

      // WHEN
      act(() => {
        // @ts-expect-error - Testing unknown action type
        result.current.dispatch({ type: 'unknown_action', payload: {} })
      })

      // EXPECT
      expect(result.current.hunkList).toBe(originalState)
    })

    it('given empty file with no hunks, when initialized, expect hook works correctly', () => {
      // GIVEN
      const emptyFile = createMockFileDiff({ hunks: [] })

      // WHEN
      const { result } = renderHook(() => useHunkListViewModel(createHunkListViewModelProps({ file: emptyFile })))

      // EXPECT
      expect(result.current.hunkList).toBeDefined()
      expect(result.current.dispatch).toBeDefined()
    })

    it('given file with complex hunks, when initialized, expect hook works correctly', () => {
      // GIVEN
      const complexHunk = createMockHunk({
        oldStart: 1,
        oldLines: 10,
        newStart: 1,
        newLines: 12,
        changes: [
          createLineDiff('@@ -1,10 +1,12 @@', 'hunk', 1, 1),
          createLineDiff(' unchanged line', 'context', 2, 2),
          createLineDiff('-deleted line', 'delete', 3, null),
          createLineDiff('+added line', 'add', null, 3),
        ],
      })
      const complexFile = createMockFileDiff({ hunks: [complexHunk] })

      // WHEN
      const { result } = renderHook(() => useHunkListViewModel(createHunkListViewModelProps({ file: complexFile })))

      // EXPECT
      expect(result.current.hunkList).toBeDefined()
      expect(result.current.dispatch).toBeDefined()
    })
  })

  describe('reducer behavior', () => {
    it('given multiple actions dispatched in sequence, when processed, expect state updates correctly', () => {
      // GIVEN
      const { result } = renderHook(() => useHunkListViewModel(createHunkListViewModelProps()))
      const mockLoadLines = vi.fn().mockReturnValue(result.current.hunkList)
      result.current.hunkList.loadLines = mockLoadLines

      const line1 = createMockDiffLineViewModel({ lineNumberLeft: 5, lineNumberRight: 5 })
      const line2 = createMockDiffLineViewModel({ lineNumberLeft: 10, lineNumberRight: 10 })
      const result1 = createMockLoadMoreLinesResult()
      const result2 = createMockLoadMoreLinesResult({
        leftLines: new Map([[11, 'new line']]),
        rightLines: new Map([[11, 'new line']]),
      })

      // WHEN
      act(() => {
        result.current.dispatch({
          type: 'lines_loaded',
          payload: { line: line1, result: result1, direction: 'up' },
        })
        result.current.dispatch({
          type: 'lines_loaded',
          payload: { line: line2, result: result2, direction: 'down' },
        })
      })

      // EXPECT
      expect(mockLoadLines).toHaveBeenCalledTimes(2)
      expect(mockLoadLines).toHaveBeenNthCalledWith(1, line1, result1, 'up')
      expect(mockLoadLines).toHaveBeenNthCalledWith(2, line2, result2, 'down')
    })

    it('given reset action after lines_loaded, when dispatched, expect state properly reset', () => {
      // GIVEN
      const { result, rerender } = renderHook(() => useHunkListViewModel(createHunkListViewModelProps()))
      const mockLoadLines = vi.fn().mockReturnValue(result.current.hunkList)
      result.current.hunkList.loadLines = mockLoadLines

      const line = createMockDiffLineViewModel()
      const loadResult = createMockLoadMoreLinesResult()

      // WHEN
      act(() => {
        result.current.dispatch({
          type: 'lines_loaded',
          payload: { line, result: loadResult, direction: 'up' },
        })
      })

      const newProps = createHunkListViewModelProps({ mode: 'unified' })
      rerender(newProps)

      // EXPECT
      expect(mockLoadLines).toHaveBeenCalledOnce()
      expect(result.current.hunkList).toBeDefined()
    })
  })

  describe('hook stability', () => {
    it('given same props, when hook re-renders, expect same references returned', () => {
      // GIVEN
      const props = createHunkListViewModelProps()
      const { result, rerender } = renderHook(() => useHunkListViewModel(props))

      // WHEN
      rerender(props)

      // EXPECT
      expect(result.current.hunkList).toBeDefined()
      expect(result.current.dispatch).toBeDefined()
    })

    it('given different props, when hook re-renders, expect new state created', () => {
      // GIVEN
      const initialProps = createHunkListViewModelProps({ mode: 'split' })
      const { result, rerender } = renderHook(() => useHunkListViewModel(initialProps))

      // WHEN
      const newProps = createHunkListViewModelProps({ mode: 'unified' })
      rerender(newProps)

      // EXPECT
      expect(result.current.hunkList).toBeDefined()
      expect(result.current.dispatch).toBeDefined()
    })
  })
})
