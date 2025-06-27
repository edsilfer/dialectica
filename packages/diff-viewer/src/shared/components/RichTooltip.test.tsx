import { vi } from 'vitest'

import { afterEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '../test-utils/render'
import RichTooltip from './RichTooltip'

describe('RichTooltip', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('given tooltip when hover expect content visible only when hovered', async () => {
    // GIVEN
    vi.useFakeTimers()
    const tooltipText = 'This is a tooltip'
    render(
      <RichTooltip tooltipText={tooltipText}>
        <button>Hover me</button>
      </RichTooltip>,
    )

    // WHEN HOVER EXPECT
    const trigger = screen.getByRole('button', { name: /hover me/i })
    act(() => fireEvent.mouseOver(trigger))
    act(vi.runAllTimers)
    expect(screen.getByText(tooltipText)).toBeInTheDocument()

    // WHEN UNHOVER EXPECT
    act(() => fireEvent.mouseOut(trigger))
    act(vi.runAllTimers)
    expect(screen.getByText(tooltipText).closest('.ant-tooltip')).toHaveClass('ant-tooltip-hidden')
  })

  it('given tooltip and toast when clicd expect toast visible and tooltip invisble', async () => {
    // GIVEN
    vi.useFakeTimers()
    const tooltipText = 'This is a tooltip'
    const toastText = 'Action performed!'
    render(
      <RichTooltip tooltipText={tooltipText} toastText={toastText} toastTimeSeconds={2}>
        <button>Click me</button>
      </RichTooltip>,
    )

    // WHEN CLICK EXPECT
    const trigger = screen.getByRole('button', { name: /click me/i })
    act(() => fireEvent.click(trigger))
    act(vi.runAllTimers)
    expect(screen.getByText(toastText)).toBeInTheDocument()
    expect(screen.queryByText(tooltipText)).not.toBeInTheDocument()

    // EXPECT TOAST DISAPPEARS
    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText(toastText).closest('.ant-tooltip')).toHaveClass('ant-tooltip-hidden')

    // WHEN HOVER EXPECT TOOLTIP TO SHOW
    act(() => fireEvent.mouseOver(trigger))
    act(vi.runAllTimers)
    expect(screen.getByText(tooltipText)).toBeInTheDocument()
  }, 5000)
})
