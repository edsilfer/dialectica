import { vi, expect } from 'vitest'
import type React from 'react'
import type { AddButtonProps, CopyButtonProps } from '../../../../../components/ui/buttons/types'

// Type for React Testing Library screen object
type TestingLibraryScreen = {
  findByText: (text: string) => Promise<HTMLElement>
}

// ====================
// BUTTON PROP FACTORIES
// ====================

export const createAddButtonProps = (overrides: Partial<AddButtonProps> = {}): AddButtonProps => ({
  onClick: vi.fn<(event: React.MouseEvent<HTMLButtonElement>) => void>(),
  ...overrides,
})

export const createCopyButtonProps = (overrides: Partial<CopyButtonProps> = {}): CopyButtonProps => ({
  onClick: vi.fn<(event: React.MouseEvent<SVGSVGElement>) => void>(),
  ...overrides,
})

// ====================
// COMMON TEST CASES
// ====================

export const BASIC_RENDERING_TEST_CASES: Array<{ description: string; props: Partial<AddButtonProps> }> = [
  {
    description: 'no props provided',
    props: {},
  },
  {
    description: 'className provided',
    props: { className: 'custom-class' },
  },
  {
    description: 'onClick handler provided',
    props: { onClick: vi.fn<(event: React.MouseEvent<HTMLButtonElement>) => void>() },
  },
  {
    description: 'all props provided',
    props: {
      className: 'custom-class',
      onClick: vi.fn<(event: React.MouseEvent<HTMLButtonElement>) => void>(),
    },
  },
]

export const COPY_BUTTON_RENDERING_TEST_CASES: Array<{
  description: string
  props: Partial<CopyButtonProps>
  expectTooltip: boolean
}> = [
  {
    description: 'basic copy button without tooltip',
    props: {},
    expectTooltip: false,
  },
  {
    description: 'copy button with tooltip only',
    props: { tooltip: 'Copy to clipboard' },
    expectTooltip: true,
  },
  {
    description: 'copy button with toastText only',
    props: { toastText: 'Copied!' },
    expectTooltip: true,
  },
  {
    description: 'copy button with both tooltip and toastText',
    props: { tooltip: 'Copy to clipboard', toastText: 'Copied!' },
    expectTooltip: true,
  },
]

// ====================
// TEST UTILITY FUNCTIONS
// ====================

export const expectButtonToBeAccessible = (button: HTMLElement) => {
  expect(button).toBeInTheDocument()
  expect(button.tagName).toBe('BUTTON')
}

export const expectButtonToBeFocusable = (button: HTMLElement) => {
  button.focus()
  expect(button).toHaveFocus()
}

export const expectClickHandlerToBeCalled = (mockOnClick: ReturnType<typeof vi.fn>, times = 1) => {
  expect(mockOnClick).toHaveBeenCalledTimes(times)
}

export const expectClickEventToBePassed = (mockOnClick: ReturnType<typeof vi.fn>) => {
  expect(mockOnClick).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'click',
    }),
  )
}

// ====================
// ICON TESTING UTILITIES
// ====================

export const expectIconToBePresent = (container: HTMLElement, testId: string) => {
  const icon = container.querySelector(`[data-testid="${testId}"]`)
  expect(icon).toBeInTheDocument()
  return icon
}

export const expectSvgIcon = (container: HTMLElement, expectedSize = '16') => {
  const icon = container.querySelector('svg')
  expect(icon).toBeInTheDocument()
  expect(icon).toHaveAttribute('width', expectedSize)
  expect(icon).toHaveAttribute('height', expectedSize)
  return icon
}

// ====================
// TOOLTIP TESTING UTILITIES
// ====================

export const expectTooltipToAppear = async (screen: TestingLibraryScreen, tooltipText: string) => {
  expect(await screen.findByText(tooltipText)).toBeInTheDocument()
}

export const expectToastToAppear = async (screen: TestingLibraryScreen, toastText: string) => {
  expect(await screen.findByText(toastText)).toBeInTheDocument()
}

export const expectTooltipWrapper = (container: HTMLElement) => {
  const wrapper = container.querySelector('[aria-describedby]')
  expect(wrapper).toBeInTheDocument()
  return wrapper
}
