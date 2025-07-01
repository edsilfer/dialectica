import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import useRowHeightSync from './use-row-height-sync'

/**
 * - JSDOM lacks ResizeObserver and returns zeroed geometry
 * - This stub provides just enough behaviour for the hook to work
 */
class FakeResizeObserver {
  constructor(private cb: () => void) {}
  observe() {
    this.cb()
  }
  unobserve() {}
  disconnect() {}
}

// `ResizeObserver` is not available in JSDOM so we replace it with our stub.
vi.stubGlobal('ResizeObserver', FakeResizeObserver)

const withHeight =
  (register: (el: HTMLTableRowElement | null) => void, height: number) => (el: HTMLTableRowElement | null) => {
    if (el) {
      /*
       * Stub `getBoundingClientRect` so it returns an object whose `height`
       * equals the provided `height` argument. Constructing a `DOMRect` gives
       * us a correctly-typed object without resorting to `any` casts.
       */
      const rect = new DOMRect(0, 0, 0, height)
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect)
    }
    register(el)
  }

function Harness({ left, right }: { left: number[]; right: number[] }) {
  const register = useRowHeightSync(left.length)
  return (
    <>
      <table>
        <tbody>
          {left.map((h, i) => (
            <tr key={`l${i}`} data-testid={`l${i}`} ref={withHeight(register('left', i), h)}>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
      <table>
        <tbody>
          {right.map((h, i) => (
            <tr key={`r${i}`} data-testid={`r${i}`} ref={withHeight(register('right', i), h)}>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

describe('useRowHeightSync', () => {
  it('applies the max height to each row pair', async () => {
    const left = [10, 30, 25]
    const right = [20, 15, 30]

    render(<Harness left={left} right={right} />)

    await waitFor(() => {
      left.forEach((_, i) => {
        const expected = `${Math.max(left[i], right[i])}px`
        expect(screen.getByTestId(`l${i}`)).toHaveStyle(`height: ${expected}`)
        expect(screen.getByTestId(`r${i}`)).toHaveStyle(`height: ${expected}`)
      })
    })
  })
})
