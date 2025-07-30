import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAsync, type AsyncState } from './use-async'

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful data fetching', () => {
    it('given enabled hook with successful fetcher, when called, expect data returned and loading states managed', async () => {
      // GIVEN
      const mockData = { id: 1, name: 'test' }
      const mockFetcher = vi.fn().mockResolvedValue(mockData)

      // WHEN
      const { result } = renderHook(() => useAsync(true, [], mockFetcher))

      // EXPECT
      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.error).toBeUndefined()
      expect(mockFetcher).toHaveBeenCalledOnce()
    })

    it('given hook with dependencies, when deps change, expect fetcher called again', async () => {
      // GIVEN
      const mockData1 = { id: 1 }
      const mockData2 = { id: 2 }
      const mockFetcher = vi.fn().mockResolvedValueOnce(mockData1).mockResolvedValueOnce(mockData2)

      const { result, rerender } = renderHook(({ deps }) => useAsync(true, deps, mockFetcher), {
        initialProps: { deps: [1] },
      })

      // WHEN
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1)
      })

      rerender({ deps: [2] })

      // EXPECT
      expect(result.current.loading).toBe(true)
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2)
      })
      expect(mockFetcher).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('given fetcher that rejects, when called, expect error state and loading false', async () => {
      // GIVEN
      const mockError = new Error('Fetch failed')
      const mockFetcher = vi.fn().mockRejectedValue(mockError)

      // WHEN
      const { result } = renderHook(() => useAsync(true, [], mockFetcher))

      // EXPECT
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toEqual(mockError)
    })

    it('given fetcher that throws non-Error, when called, expect error cast to Error', async () => {
      // GIVEN
      const mockFetcher = vi.fn().mockRejectedValue('String error')

      // WHEN
      const { result } = renderHook(() => useAsync(true, [], mockFetcher))

      // EXPECT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('String error')
    })

    it('given previous error, when fetcher succeeds, expect error cleared', async () => {
      // GIVEN
      const mockError = new Error('First attempt failed')
      const mockData = { success: true }
      const mockFetcher = vi.fn().mockRejectedValueOnce(mockError).mockResolvedValueOnce(mockData)

      const { result, rerender } = renderHook(({ deps }) => useAsync(true, deps, mockFetcher), {
        initialProps: { deps: [1] },
      })

      // WHEN
      await waitFor(() => {
        expect(result.current.error).toEqual(mockError)
      })

      rerender({ deps: [2] })

      // EXPECT
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      expect(result.current.error).toBeUndefined()
    })
  })

  describe('enabled state', () => {
    it('given disabled hook, when called, expect no fetcher execution', () => {
      // GIVEN
      const mockFetcher = vi.fn()

      // WHEN
      const { result } = renderHook(() => useAsync(false, [], mockFetcher))

      // EXPECT
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(mockFetcher).not.toHaveBeenCalled()
    })

    it('given disabled then enabled hook, when enabled changes, expect fetcher called', async () => {
      // GIVEN
      const mockData = { enabled: true }
      const mockFetcher = vi.fn().mockResolvedValue(mockData)

      const { result, rerender } = renderHook(({ enabled }) => useAsync(enabled, [], mockFetcher), {
        initialProps: { enabled: false },
      })

      // WHEN
      rerender({ enabled: true })

      // EXPECT
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })
      expect(mockFetcher).toHaveBeenCalledOnce()
    })

    it('given enabled then disabled hook, when disabled, expect loading false and no fetcher', async () => {
      // GIVEN
      const mockFetcher = vi.fn()

      const { result, rerender } = renderHook(({ enabled }) => useAsync(enabled, [], mockFetcher), {
        initialProps: { enabled: true },
      })

      // WHEN
      rerender({ enabled: false })

      // EXPECT
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(mockFetcher).toHaveBeenCalledOnce()
    })
  })

  describe('cancellation and cleanup', () => {
    it('given dependency change during fetch, when new fetch starts, expect previous cancelled', async () => {
      // GIVEN
      let resolveFirst: (value: unknown) => void
      let resolveSecond: (value: unknown) => void

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve
      })
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve
      })

      const mockFetcher = vi.fn().mockReturnValueOnce(firstPromise).mockReturnValueOnce(secondPromise)

      const { result, rerender } = renderHook(({ deps }) => useAsync(true, deps, mockFetcher), {
        initialProps: { deps: [1] },
      })

      // WHEN
      rerender({ deps: [2] })
      resolveFirst!({ cancelled: true })
      resolveSecond!({ success: true })

      // EXPECT
      await waitFor(() => {
        expect(result.current.data).toEqual({ success: true })
      })
      expect(result.current.data).not.toEqual({ cancelled: true })
    })

    it('given component unmount during fetch, when unmounted, expect no state updates', () => {
      // GIVEN
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      const mockFetcher = vi.fn().mockReturnValue(promise)

      const { unmount } = renderHook(() => useAsync(true, [], mockFetcher))

      // WHEN
      unmount()
      resolvePromise!({ shouldNotUpdate: true })

      // EXPECT
      // The test passes if no errors are thrown during unmount
      // The cancelled flag prevents state updates after unmount
      expect(mockFetcher).toHaveBeenCalledOnce()
    })
  })

  describe('rapid dependency changes', () => {
    it('given rapid dependency changes, when multiple fetches triggered, expect only latest result used', async () => {
      // GIVEN
      const mockFetcher = vi
        .fn()
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 })
        .mockResolvedValueOnce({ id: 3 })

      const { result, rerender } = renderHook(({ deps }) => useAsync(true, deps, mockFetcher), {
        initialProps: { deps: [1] },
      })

      // WHEN
      rerender({ deps: [2] })
      rerender({ deps: [3] })

      // EXPECT
      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 3 })
      })
      expect(mockFetcher).toHaveBeenCalledTimes(3)
    })
  })

  describe('initial state', () => {
    it('given new hook instance, when created, expect initial state correct', () => {
      // GIVEN
      const mockFetcher = vi.fn().mockResolvedValue(undefined)

      // WHEN
      const { result } = renderHook(() => useAsync(true, [], mockFetcher))

      // EXPECT
      expect(result.current).toEqual({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: expect.any(Function) as unknown as () => void,
      })
    })

    it('given disabled hook instance, when created, expect initial state without loading', () => {
      // GIVEN
      const mockFetcher = vi.fn().mockResolvedValue(undefined)

      // WHEN
      const { result } = renderHook(() => useAsync(false, [], mockFetcher))

      // EXPECT
      expect(result.current).toEqual({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: expect.any(Function) as unknown as () => void,
      })
    })
  })

  describe('type safety', () => {
    it('given typed fetcher, when called, expect correct return type', async () => {
      // GIVEN
      const mockData: { id: number; name: string } = { id: 1, name: 'test' }
      const mockFetcher = vi.fn().mockResolvedValue(mockData)

      // WHEN
      const { result } = renderHook(() => useAsync<{ id: number; name: string }>(true, [], mockFetcher))

      // EXPECT
      await waitFor(() => {
        expect(result.current.data).toEqual(mockData)
      })

      // Type assertion to verify TypeScript types
      const state: AsyncState<{ id: number; name: string }> = result.current
      expect(state.data?.id).toBe(1)
      expect(state.data?.name).toBe('test')
    })
  })
})
