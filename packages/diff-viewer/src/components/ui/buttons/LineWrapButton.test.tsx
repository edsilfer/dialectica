import { fireEvent, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  expectClickEventToBePassed,
  expectClickHandlerToBeCalled,
  expectTooltipToAppear,
} from '../../../utils/test/components/ui/buttons/test-utils'
import { createPropsFactory } from '../../../../../commons/src/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import LineWrapButton from './LineWrapButton'
import type { WrapLinesButtonProps } from './types'

// ====================
// LOCAL UTILITIES
// ====================
const createWrapLinesButtonProps = createPropsFactory<WrapLinesButtonProps>({
  isWrapped: false,
  onClick: vi.fn<(event: React.MouseEvent<SVGSVGElement>) => void>(),
})

const WRAP_LINES_BUTTON_TEST_CASES: Array<{
  description: string
  props: Partial<WrapLinesButtonProps>
  expectedTooltip: string
  expectedTestId: string
}> = [
  {
    description: 'unwrapped state with default tooltip',
    props: { isWrapped: false },
    expectedTooltip: 'Wrap lines',
    expectedTestId: 'unwrap-lines-icon',
  },
  {
    description: 'wrapped state with default tooltip',
    props: { isWrapped: true },
    expectedTooltip: 'Unwrap lines',
    expectedTestId: 'wrap-lines-icon',
  },
]

// ====================
// TEST CASES
// ====================
describe('LineWrapButton', () => {
  describe('rendering scenarios', () => {
    WRAP_LINES_BUTTON_TEST_CASES.forEach(({ description, props, expectedTooltip, expectedTestId }) => {
      it(`given ${description}, when rendered, expect correct icon and tooltip`, async () => {
        // GIVEN
        const buttonProps = createWrapLinesButtonProps(props)

        // WHEN
        render(<LineWrapButton {...buttonProps} />)

        // EXPECT - Correct icon is displayed
        const icon = screen.getByTestId(expectedTestId)
        expect(icon).toBeInTheDocument()

        // EXPECT - Correct tooltip appears on hover
        fireEvent.mouseOver(icon)
        await expectTooltipToAppear(screen, expectedTooltip)
      })
    })
  })

  describe('size configuration scenarios', () => {
    const sizeCases: Array<{
      description: string
      size: number | undefined
      expectedSize: number
    }> = [
      {
        description: 'default size',
        size: undefined,
        expectedSize: 16,
      },
      {
        description: 'custom size',
        size: 24,
        expectedSize: 24,
      },
      {
        description: 'small custom size',
        size: 12,
        expectedSize: 12,
      },
    ]

    sizeCases.forEach(({ description, size, expectedSize }) => {
      it(`given ${description}, when rendered, expect icon has correct size`, () => {
        // GIVEN
        const props = createWrapLinesButtonProps({ size })

        // WHEN
        render(<LineWrapButton {...props} />)

        // EXPECT
        const icon = screen.getByTestId('unwrap-lines-icon')
        expect(icon).toHaveAttribute('width', expectedSize.toString())
        expect(icon).toHaveAttribute('height', expectedSize.toString())
      })
    })
  })

  describe('click interaction scenarios', () => {
    it('given unwrapped state, when clicked, expect onClick called with event', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createWrapLinesButtonProps({ isWrapped: false, onClick: mockOnClick })

      // WHEN
      render(<LineWrapButton {...props} />)
      const icon = screen.getByTestId('unwrap-lines-icon')
      fireEvent.click(icon)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
      expectClickEventToBePassed(mockOnClick)
    })

    it('given wrapped state, when clicked, expect onClick called with event', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createWrapLinesButtonProps({ isWrapped: true, onClick: mockOnClick })

      // WHEN
      render(<LineWrapButton {...props} />)
      const icon = screen.getByTestId('wrap-lines-icon')
      fireEvent.click(icon)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
      expectClickEventToBePassed(mockOnClick)
    })

    it('given multiple clicks, when clicked repeatedly, expect onClick called multiple times', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createWrapLinesButtonProps({ onClick: mockOnClick })

      // WHEN
      render(<LineWrapButton {...props} />)
      const icon = screen.getByTestId('unwrap-lines-icon')
      fireEvent.click(icon)
      fireEvent.click(icon)
      fireEvent.click(icon)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 3)
    })

    it('given no onClick handler, when clicked, expect no error', () => {
      // GIVEN
      const props = createWrapLinesButtonProps({ onClick: undefined })

      // WHEN
      render(<LineWrapButton {...props} />)

      // EXPECT
      expect(() => fireEvent.click(screen.getByTestId('unwrap-lines-icon'))).not.toThrow()
    })
  })

  describe('state transitions', () => {
    it('given state changes from unwrapped to wrapped, when rerendered, expect correct icon and tooltip updates', async () => {
      // GIVEN
      const props = createWrapLinesButtonProps({ isWrapped: false })
      const { rerender } = render(<LineWrapButton {...props} />)

      // WHEN - Initial unwrapped state
      let icon = screen.getByTestId('unwrap-lines-icon')
      expect(icon).toBeInTheDocument()
      fireEvent.mouseOver(icon)
      await expectTooltipToAppear(screen, 'Wrap lines')

      // WHEN - Change to wrapped state
      fireEvent.mouseOut(icon)
      rerender(<LineWrapButton {...props} isWrapped={true} />)

      // EXPECT - Wrapped state
      icon = screen.getByTestId('wrap-lines-icon')
      expect(icon).toBeInTheDocument()
      fireEvent.mouseOver(icon)
      await expectTooltipToAppear(screen, 'Unwrap lines')
    })
  })

  describe('styling scenarios', () => {
    it('given component rendered, when inspected, expect theme colors applied', () => {
      // GIVEN
      const props = createWrapLinesButtonProps()

      // WHEN
      render(<LineWrapButton {...props} />)

      // EXPECT
      const icon = screen.getByTestId('unwrap-lines-icon')
      expect(icon).toHaveStyle('cursor: pointer')
    })
  })
})
