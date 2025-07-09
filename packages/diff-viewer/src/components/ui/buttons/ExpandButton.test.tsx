import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { render } from '../../../test/render'
import ExpandButton from './ExpandButton'
import type { ExpandButtonProps } from './types'

// MOCKS
vi.mock('antd', () => ({
  Tooltip: ({
    children,
    title,
    open,
    placement,
  }: {
    children: React.ReactNode
    title?: React.ReactNode
    open?: boolean
    placement?: string
  }) => {
    const [showTooltip, setShowTooltip] = React.useState(false)

    return React.createElement(
      'div',
      {
        'data-testid': 'tooltip-wrapper',
        'data-placement': placement,
        'data-open': open,
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
      },
      [
        children,
        (showTooltip || open) &&
          title &&
          React.createElement(
            'div',
            {
              key: 'tooltip-content',
              'data-testid': 'tooltip-content',
            },
            title,
          ),
      ],
    )
  },
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
  theme: {
    darkAlgorithm: 'dark-algorithm',
    defaultAlgorithm: 'default-algorithm',
  },
}))

vi.mock('../icons/ChevronDown', () => ({
  default: ({ size, onClick, className }: { size: number; onClick: () => void; className: string }) => (
    <svg data-testid="chevron-down" width={size} height={size} onClick={onClick} className={className}>
      <path d="chevron" />
    </svg>
  ),
}))

// TEST UTILITIES
const createExpandButtonProps = (overrides: Partial<ExpandButtonProps> = {}): ExpandButtonProps => ({
  collapsed: false,
  onClick: vi.fn(),
  ...overrides,
})

describe('ExpandButton', () => {
  describe('rendering scenarios', () => {
    const testCases: Array<{
      description: string
      props: Partial<ExpandButtonProps>
      expectedTooltip: string
    }> = [
      {
        description: 'collapsed state with default props',
        props: { collapsed: true },
        expectedTooltip: 'Show file content',
      },
      {
        description: 'expanded state with default props',
        props: { collapsed: false },
        expectedTooltip: 'Hide file content',
      },
      {
        description: 'collapsed state with custom tooltip',
        props: { collapsed: true, tooltipTextExpand: 'Expand content' },
        expectedTooltip: 'Expand content',
      },
      {
        description: 'expanded state with custom tooltip',
        props: { collapsed: false, tooltipTextCollapse: 'Collapse content' },
        expectedTooltip: 'Collapse content',
      },
    ]

    testCases.forEach(({ description, props, expectedTooltip }) => {
      it(`given ${description}, when rendered, expect correct state`, async () => {
        // GIVEN
        const buttonProps = createExpandButtonProps(props)

        // WHEN
        render(<ExpandButton {...buttonProps} />)

        // EXPECT
        const chevron = screen.getByTestId('chevron-down')
        expect(chevron).toBeInTheDocument()
        expect(chevron).toHaveClass('expand-button')

        // Verify tooltip appears on hover
        const tooltipWrapper = screen.getByTestId('tooltip-wrapper')
        fireEvent.mouseEnter(tooltipWrapper)
        expect(await screen.findByText(expectedTooltip)).toBeInTheDocument()
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
      expect(mockOnClick).toHaveBeenCalledOnce()
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
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
      expect(mockOnClick).toHaveBeenCalledTimes(3)
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
          expect(await screen.findByText(expectedInitialTooltip)).toBeInTheDocument()

          fireEvent.mouseLeave(tooltipWrapper)

          // WHEN - State change
          rerender(<ExpandButton {...props} collapsed={newState} />)
          fireEvent.mouseEnter(tooltipWrapper)

          // EXPECT
          expect(await screen.findByText(expectedNewTooltip)).toBeInTheDocument()
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

      // WHEN - Collapsed state
      const { rerender } = render(<ExpandButton {...props} />)
      const tooltipWrapper = screen.getByTestId('tooltip-wrapper')
      fireEvent.mouseEnter(tooltipWrapper)

      // EXPECT - Custom expand tooltip
      expect(await screen.findByText(customExpandText)).toBeInTheDocument()

      fireEvent.mouseLeave(tooltipWrapper)

      // WHEN - Expanded state
      rerender(<ExpandButton {...props} collapsed={false} />)
      fireEvent.mouseEnter(tooltipWrapper)

      // EXPECT - Custom collapse tooltip
      expect(await screen.findByText(customCollapseText)).toBeInTheDocument()
    })

    it('given partial custom tooltip texts, when rendered, expect custom and default tooltips', async () => {
      // GIVEN
      const customExpandText = 'Custom expand only'
      const props = createExpandButtonProps({
        collapsed: true,
        tooltipTextExpand: customExpandText,
      })

      // WHEN - Collapsed state with custom expand text
      const { rerender } = render(<ExpandButton {...props} />)
      const tooltipWrapper = screen.getByTestId('tooltip-wrapper')
      fireEvent.mouseEnter(tooltipWrapper)

      // EXPECT - Custom expand tooltip
      expect(await screen.findByText(customExpandText)).toBeInTheDocument()

      fireEvent.mouseLeave(tooltipWrapper)

      // WHEN - Expanded state with default collapse text
      rerender(<ExpandButton {...props} collapsed={false} />)
      fireEvent.mouseEnter(tooltipWrapper)

      // EXPECT - Default collapse tooltip
      expect(await screen.findByText('Hide file content')).toBeInTheDocument()
    })
  })

  describe('visual styling behavior', () => {
    it('given collapsed state, when rendered, expect expand-button class applied', () => {
      // GIVEN
      const props = createExpandButtonProps({ collapsed: true })

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      const chevron = screen.getByTestId('chevron-down')
      expect(chevron).toHaveClass('expand-button')
    })

    it('given expanded state, when rendered, expect expand-button class applied', () => {
      // GIVEN
      const props = createExpandButtonProps({ collapsed: false })

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      const chevron = screen.getByTestId('chevron-down')
      expect(chevron).toHaveClass('expand-button')
    })
  })

  describe('tooltip wrapping', () => {
    it('given button with tooltip, when rendered, expect tooltip wrapper present', () => {
      // GIVEN
      const props = createExpandButtonProps()

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument()
    })

    it('given button without tooltips, when rendered, expect tooltip wrapper still present', () => {
      // GIVEN
      const props = createExpandButtonProps({
        tooltipTextExpand: undefined,
        tooltipTextCollapse: undefined,
      })

      // WHEN
      render(<ExpandButton {...props} />)

      // EXPECT
      expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument()
    })
  })
})
