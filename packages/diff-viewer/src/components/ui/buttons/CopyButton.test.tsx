import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  COPY_BUTTON_RENDERING_TEST_CASES,
  createCopyButtonProps,
  expectClickEventToBePassed,
  expectClickHandlerToBeCalled,
  expectSvgIcon,
  expectToastToAppear,
  expectTooltipToAppear,
} from '../../../utils/test/components/ui/buttons/test-utils'
import { render } from '../../../utils/test/render'
import CopyButton from './CopyButton'

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
          expect(copyIcon?.closest('[aria-describedby]')).toBeInTheDocument()
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
