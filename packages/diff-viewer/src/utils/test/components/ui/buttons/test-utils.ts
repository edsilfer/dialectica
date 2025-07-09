import { expect, vi } from 'vitest'

/**
 * Expects the mock onClick function to be called the given number of times
 *
 * @param mockOnClick - The mock onClick function
 * @param times       - The number of times the mock onClick function should be called
 */
export const expectClickHandlerToBeCalled = (mockOnClick: ReturnType<typeof vi.fn>, times = 1): void => {
  expect(mockOnClick).toHaveBeenCalledTimes(times)
}

/**
 * Expects the mock onClick function to be called with an event object containing a click type
 *
 * @param mockOnClick - The mock onClick function
 */
export const expectClickEventToBePassed = (mockOnClick: ReturnType<typeof vi.fn>): void => {
  expect(mockOnClick).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'click',
    }),
  )
}

/**
 * Expects the tooltip to appear in the document
 *
 * @param screen        - The screen object
 * @param tooltipText   - The text of the tooltip to expect
 */
export const expectTooltipToAppear = async (
  screen: { findByText: (text: string) => Promise<HTMLElement> },
  tooltipText: string,
): Promise<void> => {
  expect(await screen.findByText(tooltipText)).toBeInTheDocument()
}
