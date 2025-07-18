import { fireEvent, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  expectClickHandlerToBeCalled,
  expectTooltipToAppear,
} from '../../../utils/test/components/ui/buttons/test-utils'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import type { HunkDirection } from '../../code-panel/components/viewers/types'
import LoadMoreButton from './LoadMoreButton'
import type { LoadMoreButtonProps } from './types'

// ====================
// MOCKS
// ====================
vi.mock('../icons/LoadMoreLines', () => ({
  default: ({ direction, width, height }: { direction: string; width: number; height: number }) => (
    <div data-testid="load-more-icon" data-direction={direction} data-width={width} data-height={height}>
      LoadMoreLines-{direction}
    </div>
  ),
}))

// ====================
// LOCAL UTILITIES
// ====================
const createLoadMoreButtonProps = createPropsFactory<LoadMoreButtonProps>({
  direction: 'up' as const,
  onClick: vi.fn<(event: React.MouseEvent, direction: HunkDirection) => void>(),
})

const LOAD_MORE_BUTTON_TEST_CASES: Array<{
  description: string
  props: Partial<LoadMoreButtonProps>
  expectedTooltip: string
  expectedIconCount: number
  expectedDirections: string[]
}> = [
  {
    description: 'up direction',
    props: { direction: 'up' },
    expectedTooltip: 'Expand up',
    expectedIconCount: 1,
    expectedDirections: ['up'],
  },
  {
    description: 'down direction',
    props: { direction: 'down' },
    expectedTooltip: 'Expand down',
    expectedIconCount: 1,
    expectedDirections: ['down'],
  },
  {
    description: 'out direction',
    props: { direction: 'out' },
    expectedTooltip: 'Expand up all',
    expectedIconCount: 1,
    expectedDirections: ['out'],
  },
  {
    description: 'in direction - multiple icons',
    props: { direction: 'in' },
    expectedTooltip: 'Multiple tooltips',
    expectedIconCount: 2,
    expectedDirections: ['down', 'up'],
  },
  {
    description: 'in_up direction - multiple icons',
    props: { direction: 'in_up' },
    expectedTooltip: 'Multiple tooltips',
    expectedIconCount: 2,
    expectedDirections: ['down', 'up'],
  },
  {
    description: 'in_down direction - multiple icons',
    props: { direction: 'in_down' },
    expectedTooltip: 'Multiple tooltips',
    expectedIconCount: 2,
    expectedDirections: ['down', 'up'],
  },
]

// ====================
// TEST CASES
// ====================
describe('LoadMoreButton', () => {
  describe('rendering scenarios', () => {
    LOAD_MORE_BUTTON_TEST_CASES.forEach(({ description, props, expectedIconCount, expectedDirections }) => {
      if (expectedIconCount === 1) {
        // Single direction cases
        it(`given ${description}, when rendered, expect single icon with correct properties`, async () => {
          // GIVEN
          const buttonProps = createLoadMoreButtonProps(props)

          // WHEN
          render(<LoadMoreButton {...buttonProps} />)

          // EXPECT
          const icons = screen.getAllByTestId('load-more-icon')
          expect(icons).toHaveLength(expectedIconCount)
          expect(icons[0]).toHaveAttribute('data-direction', expectedDirections[0])

          // Test tooltip based on direction
          const expectedTooltip =
            props.direction === 'up'
              ? 'Expand up'
              : props.direction === 'down'
                ? 'Expand down'
                : props.direction === 'out'
                  ? 'Expand up all'
                  : 'Unknown'

          fireEvent.mouseOver(icons[0].parentElement!)
          await expectTooltipToAppear(screen, expectedTooltip)
        })
      } else {
        // Multi-direction cases
        it(`given ${description}, when rendered, expect multiple icons with correct tooltips`, async () => {
          // GIVEN
          const buttonProps = createLoadMoreButtonProps(props)

          // WHEN
          render(<LoadMoreButton {...buttonProps} />)

          // EXPECT
          const icons = screen.getAllByTestId('load-more-icon')
          expect(icons).toHaveLength(expectedIconCount)

          expect(icons[0]).toHaveAttribute('data-direction', expectedDirections[0])
          expect(icons[1]).toHaveAttribute('data-direction', expectedDirections[1])

          fireEvent.mouseOver(icons[0].parentElement!)
          await expectTooltipToAppear(screen, 'Expand down')

          fireEvent.mouseOver(icons[1].parentElement!)
          await expectTooltipToAppear(screen, 'Expand up')
        })
      }
    })
  })

  describe('click interactions', () => {
    const singleDirectionCases: Array<{
      direction: HunkDirection
      expectedClickDirection: HunkDirection
    }> = [
      { direction: 'up', expectedClickDirection: 'up' },
      { direction: 'down', expectedClickDirection: 'down' },
      { direction: 'out', expectedClickDirection: 'out' },
    ]

    singleDirectionCases.forEach(({ direction, expectedClickDirection }) => {
      it(`given direction ${direction}, when clicked, expect onClick called with correct direction`, () => {
        // GIVEN
        const mockOnClick = vi.fn()
        const props = createLoadMoreButtonProps({ direction, onClick: mockOnClick })

        // WHEN
        render(<LoadMoreButton {...props} />)
        fireEvent.click(screen.getByTestId('load-more-icon').parentElement!)

        // EXPECT
        expectClickHandlerToBeCalled(mockOnClick, 1)
        expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object), expectedClickDirection)
      })
    })

    const multiDirectionCases: HunkDirection[] = ['in', 'in_up', 'in_down']

    multiDirectionCases.forEach((direction) => {
      it(`given direction ${direction}, when icons clicked, expect onClick called with in_down and in_up`, () => {
        // GIVEN
        const mockOnClick = vi.fn()
        const props = createLoadMoreButtonProps({ direction, onClick: mockOnClick })

        // WHEN
        render(<LoadMoreButton {...props} />)
        const icons = screen.getAllByTestId('load-more-icon')

        fireEvent.click(icons[0].parentElement!)
        fireEvent.click(icons[1].parentElement!)

        // EXPECT
        expectClickHandlerToBeCalled(mockOnClick, 2)
        expect(mockOnClick).toHaveBeenNthCalledWith(1, expect.any(Object), 'in_down')
        expect(mockOnClick).toHaveBeenNthCalledWith(2, expect.any(Object), 'in_up')
      })
    })
  })

  describe('icon properties', () => {
    it('given custom width and height, when rendered, expect icons to have correct dimensions', () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'up', width: 32, height: 24 })

      // WHEN
      render(<LoadMoreButton {...props} />)

      // EXPECT
      const icon = screen.getByTestId('load-more-icon')
      expect(icon).toHaveAttribute('data-width', '32')
      expect(icon).toHaveAttribute('data-height', '24')
    })

    it('given no width and height, when rendered, expect default dimensions', () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'down' })

      // WHEN
      render(<LoadMoreButton {...props} />)

      // EXPECT
      const icon = screen.getByTestId('load-more-icon')
      expect(icon).toHaveAttribute('data-width', '24')
      expect(icon).toHaveAttribute('data-height', '16')
    })

    it('given multi-direction with custom dimensions, when rendered, expect all icons to have correct dimensions', () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'in', width: 20, height: 12 })

      // WHEN
      render(<LoadMoreButton {...props} />)

      // EXPECT
      const icons = screen.getAllByTestId('load-more-icon')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('data-width', '20')
        expect(icon).toHaveAttribute('data-height', '12')
      })
    })
  })

  describe('event handling', () => {
    it('given no onClick handler, when clicked, expect no errors', () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'up', onClick: undefined })

      // WHEN
      render(<LoadMoreButton {...props} />)

      // EXPECT
      expect(() => {
        fireEvent.click(screen.getByTestId('load-more-icon').parentElement!)
      }).not.toThrow()
    })

    it('given single direction with onClick, when clicked, expect handler called with event and direction', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createLoadMoreButtonProps({ direction: 'out', onClick: mockOnClick })

      // WHEN
      render(<LoadMoreButton {...props} />)
      fireEvent.click(screen.getByTestId('load-more-icon').parentElement!)

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
      expect(mockOnClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }), 'out')
    })
  })

  describe('accessibility', () => {
    it('given any direction, when rendered, expect tooltips to be accessible', async () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'up' })

      // WHEN
      render(<LoadMoreButton {...props} />)
      const icon = screen.getByTestId('load-more-icon')

      // EXPECT
      fireEvent.mouseOver(icon.parentElement!)
      await expectTooltipToAppear(screen, 'Expand up')
    })

    it('given multi-direction, when rendered, expect both tooltips to be accessible', async () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'in' })

      // WHEN
      render(<LoadMoreButton {...props} />)
      const icons = screen.getAllByTestId('load-more-icon')

      // EXPECT
      fireEvent.mouseOver(icons[0].parentElement!)
      await expectTooltipToAppear(screen, 'Expand down')

      fireEvent.mouseOver(icons[1].parentElement!)
      await expectTooltipToAppear(screen, 'Expand up')
    })
  })
})
