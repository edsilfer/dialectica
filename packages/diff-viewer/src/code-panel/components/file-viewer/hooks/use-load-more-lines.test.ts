import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SourceCodeViewModel } from '../../source-code/models/SourceCodeViewModel'
import { LoadMoreLinesHandler } from '../../../../main/types'
import { LinePair } from '../types'
import { useLoadMoreLines, LoadMoreDirection } from './use-load-more-lines'

const MockedSourceCodeViewModel = {
  subscribe: vi.fn(),
  lines: [],
  fileKey: 'test-file.ts',
  setLines: vi.fn(),
  hunkStates: new Map(),
  injectLines: vi.fn(),
} as unknown as SourceCodeViewModel

const createMockLinePair = (
  lineNumberLeft: number | null = 1,
  lineNumberRight: number | null = 1,
  contentLeft: string | null = 'line content',
  contentRight: string | null = 'line content',
): LinePair => ({
  typeLeft: 'context',
  contentLeft,
  highlightedContentLeft: contentLeft,
  lineNumberLeft,
  typeRight: 'context',
  contentRight,
  highlightedContentRight: contentRight,
  lineNumberRight,
})

const sampleLines: LinePair[] = [
  createMockLinePair(1, 1, 'first line', 'first line'),
  createMockLinePair(2, 2, 'second line', 'second line'),
  createMockLinePair(3, 3, 'third line', 'third line'),
]

const pivotLine = createMockLinePair(2, 2, 'pivot line', 'pivot line')

describe('useLoadMoreLines', () => {
  let mockHandler: ReturnType<typeof vi.fn<LoadMoreLinesHandler>>
  let sourceCode: SourceCodeViewModel

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandler = vi.fn()

    sourceCode = {
      ...MockedSourceCodeViewModel,
      lines: [...sampleLines],
      subscribe: vi.fn((_fn) => {
        return () => {}
      }),
      setLines: vi.fn(),
      hunkStates: new Map([
        [
          pivotLine,
          {
            start: 2,
            prev: 1,
            next: 3,
            prevRange: { start: 1, end: 5 },
            nextRange: { start: 10, end: 15 },
          },
        ],
      ]),
      injectLines: vi.fn((lines, pivot, position) => {
        // Simple mock implementation that returns updated lines
        const newLinePairs = Object.entries(lines as Record<string, string>).map(([lineNum, content]) =>
          createMockLinePair(+lineNum, +lineNum, content, content),
        )

        if (position === 'before') {
          return [...newLinePairs, ...sampleLines]
        } else {
          return [...sampleLines, ...newLinePairs]
        }
      }),
    } as unknown as SourceCodeViewModel
  })

  describe('initialization', () => {
    it('should return lines from the source code view model', () => {
      const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      expect(result.current.lines).toEqual(sampleLines)
    })

    it('should provide a loadMore function', () => {
      const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      expect(typeof result.current.loadMore).toBe('function')
    })

    it('should subscribe to source code changes', () => {
      const mockSubscribe = vi.fn()
      sourceCode.subscribe = mockSubscribe

      renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  describe('loadMore functionality', () => {
    it('should not call handler when fileKey is missing', async () => {
      const sourceCodeWithoutFileKey = {
        ...sourceCode,
        fileKey: undefined,
      } as unknown as SourceCodeViewModel

      const { result } = renderHook(() => useLoadMoreLines(sourceCodeWithoutFileKey, mockHandler))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'up')
      })

      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('should not call handler when onLoadMoreLines is not provided', async () => {
      const { result } = renderHook(() => useLoadMoreLines(sourceCode))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'up')
      })

      expect(mockHandler).not.toHaveBeenCalled()
    })

    const directionalCases: Array<{
      direction: LoadMoreDirection
      mockRange: { startLine: number; endLine: number }
      mockNewLines: Record<number, string>
      injectPosition: 'before' | 'after'
    }> = [
      {
        direction: 'up',
        mockRange: { startLine: 1, endLine: 5 },
        mockNewLines: { 1: 'new line 1', 2: 'new line 2' },
        injectPosition: 'before',
      },
      {
        direction: 'down',
        mockRange: { startLine: 10, endLine: 15 },
        mockNewLines: { 10: 'new line 10', 11: 'new line 11' },
        injectPosition: 'after',
      },
    ]

    it.each(directionalCases)(
      'should handle $direction direction correctly',
      async ({ direction, mockRange, mockNewLines, injectPosition }) => {
        const mockInjectLines = vi.fn()
        const mockSetLines = vi.fn()

        const mockHunkStates = new Map([
          [
            pivotLine,
            {
              start: 2,
              prev: 1,
              next: 3,
              prevRange:
                direction === 'up' ? { start: mockRange.startLine, end: mockRange.endLine } : { start: 1, end: 5 },
              nextRange:
                direction === 'down' ? { start: mockRange.startLine, end: mockRange.endLine } : { start: 10, end: 15 },
            },
          ],
        ])

        Object.defineProperty(sourceCode, 'hunkStates', {
          get: () => mockHunkStates,
          configurable: true,
        })
        sourceCode.injectLines = mockInjectLines
        sourceCode.setLines = mockSetLines
        mockHandler.mockResolvedValue(mockNewLines)

        const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

        await act(async () => {
          await result.current.loadMore(pivotLine, direction)
        })

        expect(mockHandler).toHaveBeenCalledWith({
          fileKey: 'test-file.ts',
          startLine: mockRange.startLine,
          endLine: mockRange.endLine,
        })
        expect(mockInjectLines).toHaveBeenCalledWith(mockNewLines, pivotLine, injectPosition)
        expect(mockSetLines).toHaveBeenCalled()
      },
    )

    it('should handle "out" direction correctly', async () => {
      const mockUpRange = { start: 1, end: 5 }
      const mockDownRange = { start: 10, end: 15 }
      const mockUpLines = { 1: 'up line 1', 2: 'up line 2' }
      const mockDownLines = { 10: 'down line 10', 11: 'down line 11' }

      const mockHunkStates = new Map([
        [
          pivotLine,
          {
            start: 2,
            prev: 1,
            next: 3,
            prevRange: mockUpRange,
            nextRange: mockDownRange,
          },
        ],
      ])

      const mockSetLines = vi.fn()

      Object.defineProperty(sourceCode, 'hunkStates', {
        get: () => mockHunkStates,
        configurable: true,
      })
      sourceCode.setLines = mockSetLines

      mockHandler
        .mockResolvedValueOnce(mockUpLines) // First call for 'up'
        .mockResolvedValueOnce(mockDownLines) // Second call for 'down'

      const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'out')
      })

      // Should call handler twice (up and down)
      expect(mockHandler).toHaveBeenCalledTimes(2)
      expect(mockHandler).toHaveBeenNthCalledWith(1, {
        fileKey: 'test-file.ts',
        startLine: 1,
        endLine: 5,
      })
      expect(mockHandler).toHaveBeenNthCalledWith(2, {
        fileKey: 'test-file.ts',
        startLine: 10,
        endLine: 15,
      })

      // Should call setLines once with the final result
      expect(mockSetLines).toHaveBeenCalledTimes(1)
    })

    it('should handle partial results in "out" direction when up fetch fails', async () => {
      const mockUpRange = { start: 1, end: 5 }
      const mockDownRange = { start: 10, end: 15 }
      const mockDownLines = { 10: 'down line 10', 11: 'down line 11' }

      const mockHunkStates = new Map([
        [
          pivotLine,
          {
            start: 2,
            prev: 1,
            next: 3,
            prevRange: mockUpRange,
            nextRange: mockDownRange,
          },
        ],
      ])

      const mockSetLines = vi.fn()
      const mockInjectLines = vi.fn()

      Object.defineProperty(sourceCode, 'hunkStates', {
        get: () => mockHunkStates,
        configurable: true,
      })
      sourceCode.setLines = mockSetLines
      sourceCode.injectLines = mockInjectLines

      mockHandler
        .mockResolvedValueOnce({}) // Up fetch returns empty object
        .mockResolvedValueOnce(mockDownLines) // Down fetch succeeds

      const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'out')
      })

      expect(mockSetLines).toHaveBeenCalledTimes(1)
      // Should inject both up (empty) and down lines since both are truthy objects
      expect(mockInjectLines).toHaveBeenCalledTimes(2)
      expect(mockInjectLines).toHaveBeenNthCalledWith(1, {}, pivotLine, 'before')
      expect(mockInjectLines).toHaveBeenNthCalledWith(2, mockDownLines, pivotLine, 'after')
    })

    it('should handle empty response from handler gracefully', async () => {
      const mockInjectLines = vi.fn()
      const mockSetLines = vi.fn()

      sourceCode.injectLines = mockInjectLines
      sourceCode.setLines = mockSetLines

      mockHandler.mockResolvedValue({})

      const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'up')
      })

      // Should call injectLines even when handler returns empty object (since {} is truthy)
      expect(mockInjectLines).toHaveBeenCalledWith({}, pivotLine, 'before')
      // Should still call setLines with the result from injectLines
      expect(mockSetLines).toHaveBeenCalled()
    })

    it('should handle errors gracefully and log them', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const testError = new Error('Network error')
      const mockSetLines = vi.fn()

      sourceCode.setLines = mockSetLines

      mockHandler.mockRejectedValue(testError)

      const { result } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'up')
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(testError)
      expect(mockSetLines).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should work with synchronous handler', async () => {
      const mockNewLines = { 1: 'sync line 1', 2: 'sync line 2' }
      const syncHandler = vi.fn(() => mockNewLines) // Return directly, not Promise
      const mockInjectLines = vi.fn()
      const mockSetLines = vi.fn()

      sourceCode.injectLines = mockInjectLines
      sourceCode.setLines = mockSetLines

      const { result } = renderHook(() => useLoadMoreLines(sourceCode, syncHandler))

      await act(async () => {
        await result.current.loadMore(pivotLine, 'up')
      })

      expect(syncHandler).toHaveBeenCalled()
      expect(mockInjectLines).toHaveBeenCalledWith(mockNewLines, pivotLine, 'before')
      expect(mockSetLines).toHaveBeenCalled()
    })
  })

  describe('memoization and stability', () => {
    it('should maintain stable loadMore reference when dependencies do not change', () => {
      const { result, rerender } = renderHook(() => useLoadMoreLines(sourceCode, mockHandler))

      const firstLoadMore = result.current.loadMore

      rerender()

      const secondLoadMore = result.current.loadMore

      expect(firstLoadMore).toBe(secondLoadMore)
    })

    it('should update loadMore reference when sourceCode changes', () => {
      const { result, rerender } = renderHook(({ sc }) => useLoadMoreLines(sc, mockHandler), {
        initialProps: { sc: sourceCode },
      })

      const firstLoadMore = result.current.loadMore

      const newSourceCode = { ...sourceCode, fileKey: 'different-file.ts' } as SourceCodeViewModel

      rerender({ sc: newSourceCode })

      const secondLoadMore = result.current.loadMore

      expect(firstLoadMore).not.toBe(secondLoadMore)
    })

    it('should update loadMore reference when handler changes', () => {
      const { result, rerender } = renderHook(({ handler }) => useLoadMoreLines(sourceCode, handler), {
        initialProps: { handler: mockHandler },
      })

      const firstLoadMore = result.current.loadMore

      const newHandler = vi.fn()

      rerender({ handler: newHandler })

      const secondLoadMore = result.current.loadMore

      expect(firstLoadMore).not.toBe(secondLoadMore)
    })
  })

  describe('edge cases', () => {
    it('should handle empty lines array', () => {
      const emptySourceCode = {
        ...sourceCode,
        lines: [],
      } as unknown as SourceCodeViewModel

      const { result } = renderHook(() => useLoadMoreLines(emptySourceCode, mockHandler))

      expect(result.current.lines).toEqual([])
    })
  })
})
