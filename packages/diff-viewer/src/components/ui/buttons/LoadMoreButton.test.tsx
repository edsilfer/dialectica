import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '../../../utils/test/render'
import LoadMoreButton from './LoadMoreButton'
import type { LoadMoreButtonProps } from './types'
import type { HunkDirection } from '../../code-panel/components/types'

// MOCK
vi.mock('../icons/LoadMoreLines', () => ({
  default: ({ direction, width, height }: { direction: string; width: number; height: number }) => (
    <div data-testid="load-more-icon" data-direction={direction} data-width={width} data-height={height}>
      LoadMoreLines-{direction}
    </div>
  ),
}))

const createLoadMoreButtonProps = (overrides: Partial<LoadMoreButtonProps> = {}): LoadMoreButtonProps => ({
  direction: 'up',
  ...overrides,
})

describe('LoadMoreButton', () => {
  describe('single direction rendering', () => {
    const singleDirectionCases: Array<{
      direction: HunkDirection
      expectedTooltip: string
      expectedClickDirection: HunkDirection
    }> = [
      { direction: 'up', expectedTooltip: 'Expand up', expectedClickDirection: 'up' },
      { direction: 'down', expectedTooltip: 'Expand down', expectedClickDirection: 'down' },
      { direction: 'out', expectedTooltip: 'Expand up all', expectedClickDirection: 'out' },
    ]

    singleDirectionCases.forEach(({ direction, expectedTooltip, expectedClickDirection }) => {
      it(`given direction ${direction}, when rendered, expect single icon with correct tooltip`, async () => {
        // GIVEN
        const props = createLoadMoreButtonProps({ direction })

        // WHEN
        render(<LoadMoreButton {...props} />)

        // EXPECT
        const icon = screen.getByTestId('load-more-icon')
        expect(icon).toBeInTheDocument()
        expect(icon).toHaveAttribute('data-direction', direction)

        fireEvent.mouseOver(icon.parentElement!)
        expect(await screen.findByText(expectedTooltip)).toBeInTheDocument()
      })

      it(`given direction ${direction}, when clicked, expect onClick called with correct direction`, () => {
        // GIVEN
        const mockOnClick = vi.fn()
        const props = createLoadMoreButtonProps({ direction, onClick: mockOnClick })

        // WHEN
        render(<LoadMoreButton {...props} />)
        fireEvent.click(screen.getByTestId('load-more-icon').parentElement!)

        // EXPECT
        expect(mockOnClick).toHaveBeenCalledOnce()
        expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object), expectedClickDirection)
      })
    })
  })

  describe('multi-direction rendering', () => {
    const multiDirectionCases: HunkDirection[] = ['in', 'in_up', 'in_down']

    multiDirectionCases.forEach((direction) => {
      it(`given direction ${direction}, when rendered, expect two icons with correct tooltips`, async () => {
        // GIVEN
        const props = createLoadMoreButtonProps({ direction })

        // WHEN
        render(<LoadMoreButton {...props} />)

        // EXPECT
        const icons = screen.getAllByTestId('load-more-icon')
        expect(icons).toHaveLength(2)

        expect(icons[0]).toHaveAttribute('data-direction', 'down')
        expect(icons[1]).toHaveAttribute('data-direction', 'up')

        fireEvent.mouseOver(icons[0].parentElement!)
        expect(await screen.findByText('Expand down')).toBeInTheDocument()

        fireEvent.mouseOver(icons[1].parentElement!)
        expect(await screen.findByText('Expand up')).toBeInTheDocument()
      })

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
        expect(mockOnClick).toHaveBeenCalledTimes(2)
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
      const props = createLoadMoreButtonProps({ direction: 'up' })

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
      const tooltip = await screen.findByText('Expand up')
      expect(tooltip).toBeInTheDocument()
    })

    it('given multi-direction, when rendered, expect both tooltips to be accessible', async () => {
      // GIVEN
      const props = createLoadMoreButtonProps({ direction: 'in' })

      // WHEN
      render(<LoadMoreButton {...props} />)
      const icons = screen.getAllByTestId('load-more-icon')

      // EXPECT
      fireEvent.mouseOver(icons[0].parentElement!)
      expect(await screen.findByText('Expand down')).toBeInTheDocument()

      fireEvent.mouseOver(icons[1].parentElement!)
      expect(await screen.findByText('Expand up')).toBeInTheDocument()
    })
  })
})
