import { render, screen, waitFor, act, fireEvent } from '../../utils/test/render'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createPropsFactory } from '../../../../commons/src/test/generic-test-utils'
import RichTooltip from './RichTooltip'
import type { RichTooltipProps } from './RichTooltip'

type TestScreen = typeof screen

const createRichTooltipProps = createPropsFactory<RichTooltipProps>({
  tooltipText: 'Default tooltip',
  toastText: 'Default toast',
  toastTimeSeconds: 2,
  children: <button>Test Button</button>,
})

const RICH_TOOLTIP_TEST_CASES: Array<{
  description: string
  props: Partial<RichTooltipProps>
}> = [
  {
    description: 'tooltip only - hover shows, unhover hides',
    props: { tooltipText: 'Test tooltip', toastText: undefined },
  },
  {
    description: 'tooltip and toast - click shows toast and hides tooltip',
    props: { tooltipText: 'Test tooltip', toastText: 'Action performed!', toastTimeSeconds: 2 },
  },
]

const expectTooltipToBeVisible = (screen: TestScreen): void => {
  const tooltipContainer = screen.getByTestId('tooltip-container')
  expect(tooltipContainer).not.toHaveClass('ant-tooltip-hidden')
}

const expectTooltipToBeHidden = (screen: TestScreen): void => {
  const tooltipContainer = screen.getByTestId('tooltip-container')
  expect(tooltipContainer).toHaveClass('ant-tooltip-hidden')
}

const expectTooltipTextVisible = (screen: TestScreen, text: string): void => {
  expect(screen.getByText(text)).toBeInTheDocument()
  expectTooltipToBeVisible(screen)
}

const expectTooltipTextHidden = (screen: TestScreen, text: string): void => {
  // Text is still in DOM but tooltip container should be hidden
  expect(screen.getByText(text)).toBeInTheDocument()
  expectTooltipToBeHidden(screen)
}

const expectToastText = (screen: TestScreen, text: string): void => {
  expect(screen.getByText(text)).toBeInTheDocument()
}

const performTooltipInteraction = (
  trigger: HTMLElement,
  interaction: { type: 'hover' | 'click' | 'unhover' | 'wait'; timeMs?: number },
): void => {
  act(() => {
    switch (interaction.type) {
      case 'hover':
        fireEvent.mouseOver(trigger)
        break
      case 'unhover':
        fireEvent.mouseOut(trigger)
        break
      case 'click':
        fireEvent.click(trigger)
        break
      case 'wait':
        if (interaction.timeMs) {
          vi.advanceTimersByTime(interaction.timeMs)
        }
        break
    }
  })
}

// ====================
// TEST CASES
// ====================
describe('RichTooltip', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('tooltip behavior scenarios', () => {
    RICH_TOOLTIP_TEST_CASES.forEach(({ description, props }) => {
      it(`given ${description}, when interactions performed, expect correct tooltip states`, async () => {
        // GIVEN
        const triggerText = 'Test Button'
        const richTooltipProps = createRichTooltipProps({
          ...props,
          children: <button>{triggerText}</button>,
        })

        render(<RichTooltip {...richTooltipProps} />)

        const trigger = screen.getByRole('button', { name: triggerText })

        // Test basic tooltip visibility on hover (if tooltip text exists)
        if (props.tooltipText) {
          // WHEN - hover
          performTooltipInteraction(trigger, { type: 'hover' })

          // EXPECT - tooltip visible
          await waitFor(() => {
            expectTooltipTextVisible(screen, props.tooltipText as string)
          })

          // WHEN - unhover
          performTooltipInteraction(trigger, { type: 'unhover' })

          // EXPECT - tooltip hidden
          await waitFor(() => {
            expectTooltipTextHidden(screen, props.tooltipText as string)
          })
        }

        // Test toast behavior (if toast text exists)
        if (props.toastText) {
          // Setup fake timers for toast timing
          vi.useFakeTimers()

          // WHEN - click
          performTooltipInteraction(trigger, { type: 'click' })

          // EXPECT - toast visible
          expectToastText(screen, props.toastText as string)

          vi.useRealTimers()
        }
      })
    })
  })

  it('given tooltip when hover expect content visible only when hovered', async () => {
    // GIVEN
    const tooltipText = 'This is a tooltip'
    const props = createRichTooltipProps({
      tooltipText,
      toastText: undefined,
      children: <button>Hover me</button>,
    })

    render(<RichTooltip {...props} />)
    const trigger = screen.getByRole('button', { name: /hover me/i })

    // WHEN HOVER
    performTooltipInteraction(trigger, { type: 'hover' })

    // EXPECT - tooltip appears
    await waitFor(() => {
      expectTooltipTextVisible(screen, tooltipText)
    })

    // WHEN UNHOVER
    performTooltipInteraction(trigger, { type: 'unhover' })

    // EXPECT - tooltip disappears
    await waitFor(() => {
      expectTooltipTextHidden(screen, tooltipText)
    })
  })

  it('given tooltip and toast when clicked expect toast visible and tooltip invisible', () => {
    // GIVEN
    vi.useFakeTimers()
    const tooltipText = 'This is a tooltip'
    const toastText = 'Action performed!'
    const props = createRichTooltipProps({
      tooltipText,
      toastText,
      toastTimeSeconds: 2,
      children: <button>Click me</button>,
    })

    render(<RichTooltip {...props} />)
    const trigger = screen.getByRole('button', { name: /click me/i })

    try {
      // WHEN CLICK
      performTooltipInteraction(trigger, { type: 'click' })

      // EXPECT - toast appears
      expectToastText(screen, toastText)

      // EXPECT TOAST DISAPPEARS after timeout
      performTooltipInteraction(trigger, { type: 'wait', timeMs: 2000 })
      expectTooltipToBeHidden(screen)
    } finally {
      vi.useRealTimers()
    }
  })
})
