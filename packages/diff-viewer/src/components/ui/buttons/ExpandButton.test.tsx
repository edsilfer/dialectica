import { fireEvent, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createAntdMocks } from '../../../../../commons/src/test/antd-utils'
import {
  expectClickEventToBePassed,
  expectClickHandlerToBeCalled,
  expectTooltipToAppear,
} from '../../../utils/test/components/ui/buttons/test-utils'
import { createPropsFactory } from '../../../../../commons/src/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import ExpandButton from './ExpandButton'
import type { ExpandButtonProps } from './types'

// ====================
// MOCKS
// ====================
vi.mock('antd', () => createAntdMocks())

vi.mock('../icons/ChevronDown', () => ({
  default: ({ size, onClick, className }: { size: number; onClick: () => void; className: string }) => (
    <svg data-testid="chevron-down" width={size} height={size} onClick={onClick} className={className}>
      <path d="chevron" />
    </svg>
  ),
}))

// ====================
// LOCAL UTILITIES
// ====================
const createExpandButtonProps = createPropsFactory<ExpandButtonProps>({
  collapsed: false,
  onClick: vi.fn<(event: React.MouseEvent<SVGSVGElement>) => void>(),
})

const EXPAND_BUTTON_TEST_CASES: Array<{
  description: string
  props: Partial<ExpandButtonProps>
  expectedTooltip: string
  expectedTestId: string
}> = [
  {
    description: 'collapsed state with default tooltip',
    props: { collapsed: true },
    expectedTooltip: 'Show file content',
    expectedTestId: 'chevron-down',
  },
  {
    description: 'expanded state with default tooltip',
    props: { collapsed: false },
    expectedTooltip: 'Hide file content',
    expectedTestId: 'chevron-down',
  },
  {
    description: 'collapsed state with custom tooltip',
    props: { collapsed: true, tooltipTextExpand: 'Expand content' },
    expectedTooltip: 'Expand content',
    expectedTestId: 'chevron-down',
  },
  {
    description: 'expanded state with custom tooltip',
    props: { collapsed: false, tooltipTextCollapse: 'Collapse content' },
    expectedTooltip: 'Collapse content',
    expectedTestId: 'chevron-down',
  },
]

// ====================
// TEST CASES
// ====================
describe('ExpandButton', () => {
  describe('rendering scenarios', () => {
    EXPAND_BUTTON_TEST_CASES.forEach(({ description, props, expectedTooltip, expectedTestId }) => {
      it(`given ${description}, when rendered, expect correct state`, async () => {
        // GIVEN
        const buttonProps = createExpandButtonProps(props)

        // WHEN
        render(<ExpandButton {...buttonProps} />)

        // EXPECT - Chevron is visible and has expand-button class
        const chevron = screen.getByTestId(expectedTestId)
        expect(chevron).toBeInTheDocument()
        expect(chevron).toHaveClass('expand-button')

        // Verify tooltip appears on hover
        const tooltipWrapper = screen.getByTestId('tooltip-wrapper')
        fireEvent.mouseEnter(tooltipWrapper)
        await expectTooltipToAppear(screen, expectedTooltip)
      })
    })
  })

  describe('size configuration', () => {
    it('given no size prop, when rendered, expect default size applied', () => {
      // GIVEN
      const props = createExpandButtonProps()

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      const chevron = screen.getByTestId('chevron-down')
      expect(chevron).toHaveAttribute('width', '16')
      expect(chevron).toHaveAttribute('height', '16')
    })

    it('given custom size prop, when rendered, expect custom size applied', () => {
      // GIVEN
      const props = createExpandButtonProps({ size: 24 })

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      const chevron = screen.getByTestId('chevron-down')
      expect(chevron).toHaveAttribute('width', '24')
      expect(chevron).toHaveAttribute('height', '24')
    })
  })

  describe('click interactions', () => {
    it('given onClick handler, when chevron clicked, expect handler called', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createExpandButtonProps({ onClick: mockOnClick })

      // WHEN
      render(<ExpandButton {...props} />)
      fireEvent.click(screen.getByTestId('chevron-down'))

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
      expectClickEventToBePassed(mockOnClick)
    })

    it('given onClick handler, when clicked multiple times, expect handler called each time', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createExpandButtonProps({ onClick: mockOnClick })

      // WHEN
      render(<ExpandButton {...props} />)
      const chevron = screen.getByTestId('chevron-down')
      fireEvent.click(chevron)
      fireEvent.click(chevron)
      fireEvent.click(chevron)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 3)
    })

    it('given no onClick handler, when clicked, expect no error', () => {
      // GIVEN
      const props = createExpandButtonProps({ onClick: undefined })

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      expect(() => fireEvent.click(screen.getByTestId('chevron-down'))).not.toThrow()
    })
  })

  describe('state transitions', () => {
    const stateTransitionMatrix = [
      {
        description: 'collapsed to expanded',
        initialState: true,
        expectedInitialTooltip: 'Show file content',
        newState: false,
        expectedNewTooltip: 'Hide file content',
      },
      {
        description: 'expanded to collapsed',
        initialState: false,
        expectedInitialTooltip: 'Hide file content',
        newState: true,
        expectedNewTooltip: 'Show file content',
      },
    ]

    stateTransitionMatrix.forEach(
      ({ description, initialState, expectedInitialTooltip, newState, expectedNewTooltip }) => {
        it(`given ${description}, when state changes, expect correct tooltip updates`, async () => {
          // GIVEN
          const props = createExpandButtonProps({ collapsed: initialState })
          const { rerender } = render(<ExpandButton {...props} />)

          // WHEN - Initial state
          const tooltipWrapper = screen.getByTestId('tooltip-wrapper')
          fireEvent.mouseEnter(tooltipWrapper)
          await expectTooltipToAppear(screen, expectedInitialTooltip)

          fireEvent.mouseLeave(tooltipWrapper)

          // WHEN - State change
          rerender(<ExpandButton {...props} collapsed={newState} />)
          fireEvent.mouseEnter(tooltipWrapper)

          // EXPECT
          await expectTooltipToAppear(screen, expectedNewTooltip)
        })
      },
    )
  })

  describe('tooltip customization', () => {
    it('given custom tooltip texts, when state changes, expect custom tooltips displayed', async () => {
      // GIVEN
      const customExpandText = 'Custom expand text'
      const customCollapseText = 'Custom collapse text'
      const props = createExpandButtonProps({
        collapsed: true,
        tooltipTextExpand: customExpandText,
        tooltipTextCollapse: customCollapseText,
      })

      const { rerender } = render(<ExpandButton {...props} />)

      // WHEN - Collapsed state
      const tooltipWrapper = screen.getByTestId('tooltip-wrapper')
      fireEvent.mouseEnter(tooltipWrapper)
      await expectTooltipToAppear(screen, customExpandText)

      fireEvent.mouseLeave(tooltipWrapper)

      // WHEN - Expanded state
      rerender(<ExpandButton {...props} collapsed={false} />)
      fireEvent.mouseEnter(tooltipWrapper)

      // EXPECT
      await expectTooltipToAppear(screen, customCollapseText)
    })
  })
})
