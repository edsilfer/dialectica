import { fireEvent, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  expectClickEventToBePassed,
  expectClickHandlerToBeCalled,
  expectTooltipToAppear,
} from '../../../utils/test/components/ui/buttons/test-utils'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import CopyButton from './CopyButton'
import type { CopyButtonProps } from './types'

// ====================
// LOCAL UTILITIES
// ====================

const createCopyButtonProps = createPropsFactory<CopyButtonProps>({
  onClick: vi.fn<(event: React.MouseEvent<SVGSVGElement>) => void>(),
})

const COPY_BUTTON_RENDERING_TEST_CASES: Array<{
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

const expectSvgIcon = (container: HTMLElement, expectedSize = '16'): SVGSVGElement | null => {
  const icon = container.querySelector('svg')
  expect(icon).toBeInTheDocument()
  if (icon) {
    expect(icon).toHaveAttribute('width', expectedSize)
    expect(icon).toHaveAttribute('height', expectedSize)
  }
  return icon
}

const expectToastToAppear = async (
  screen: typeof import('@testing-library/react').screen,
  toastText: string,
): Promise<void> => {
  expect(await screen.findByText(toastText)).toBeInTheDocument()
}

// ====================
// TEST CASES
// ====================

describe('CopyButton', () => {
  describe('rendering scenarios', () => {
    COPY_BUTTON_RENDERING_TEST_CASES.forEach(({ description, props, expectTooltip }) => {
      it(`given ${description}, when rendered, expect correct structure`, () => {
        // GIVEN
        const buttonProps = createCopyButtonProps(props)

        // WHEN
        const { container } = render(<CopyButton {...buttonProps} />)

        // EXPECT
        const copyIcon = expectSvgIcon(container)

        if (expectTooltip) {
          expect(copyIcon?.closest('[data-testid="tooltip-wrapper"]')).toBeInTheDocument()
        }
      })
    })
  })

  describe('size configuration', () => {
    it('given no size prop, when rendered, expect default size applied', () => {
      // GIVEN
      const props = createCopyButtonProps()

      // WHEN
      const { container } = render(<CopyButton {...props} />)

      // EXPECT
      expectSvgIcon(container, '16')
    })

    it('given custom size prop, when rendered, expect custom size applied', () => {
      // GIVEN
      const props = createCopyButtonProps({ size: 24 })

      // WHEN
      const { container } = render(<CopyButton {...props} />)

      // EXPECT
      expectSvgIcon(container, '24')
    })
  })

  describe('click interactions', () => {
    it('given copy button without tooltip, when clicked, expect onClick called', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createCopyButtonProps({ onClick: mockOnClick })

      // WHEN
      const { container } = render(<CopyButton {...props} />)
      const copyIcon = container.querySelector('svg')!
      fireEvent.click(copyIcon)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
      expectClickEventToBePassed(mockOnClick)
    })

    it('given copy button with tooltip, when clicked, expect onClick called', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createCopyButtonProps({
        onClick: mockOnClick,
        tooltip: 'Copy to clipboard',
      })

      // WHEN
      const { container } = render(<CopyButton {...props} />)
      const copyIcon = container.querySelector('svg')!
      fireEvent.click(copyIcon)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
      expectClickEventToBePassed(mockOnClick)
    })
  })

  describe('tooltip interactions', () => {
    it('given copy button with tooltip, when hovered, expect tooltip to appear', async () => {
      // GIVEN
      const props = createCopyButtonProps({ tooltip: 'Copy to clipboard' })

      // WHEN
      const { container } = render(<CopyButton {...props} />)
      const copyIcon = container.querySelector('svg')!
      fireEvent.mouseOver(copyIcon)

      // EXPECT
      await expectTooltipToAppear(screen, 'Copy to clipboard')
    })

    it('given copy button with toastText, when clicked, expect toast to appear', async () => {
      // GIVEN
      const props = createCopyButtonProps({ toastText: 'Copied!' })

      // WHEN
      const { container } = render(<CopyButton {...props} />)
      const copyIcon = container.querySelector('svg')!
      fireEvent.click(copyIcon)

      // EXPECT
      await expectToastToAppear(screen, 'Copied!')
    })

    it('given copy button with both tooltip and toastText, when hovered then clicked, expect both to work', async () => {
      // GIVEN
      const props = createCopyButtonProps({
        tooltip: 'Copy to clipboard',
        toastText: 'Copied!',
      })

      // WHEN
      const { container } = render(<CopyButton {...props} />)
      const copyIcon = container.querySelector('svg')!

      // Hover to show tooltip
      fireEvent.mouseOver(copyIcon)
      await expectTooltipToAppear(screen, 'Copy to clipboard')

      // Click to show toast
      fireEvent.click(copyIcon)

      // EXPECT
      await expectToastToAppear(screen, 'Copied!')
    })
  })
})
