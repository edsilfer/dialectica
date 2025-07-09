import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '../../../utils/test/render'
import LineWrapButton from './LineWrapButton'
import type { WrapLinesButtonProps } from './types'

// UTILS
const createProps = (overrides: Partial<WrapLinesButtonProps> = {}): WrapLinesButtonProps => ({
  isWrapped: false,
  onClick: vi.fn(),
  ...overrides,
})

describe('LineWrapButton', () => {
  describe('icon rendering scenarios', () => {
    const testCases: Array<{
      description: string
      isWrapped: boolean
      expectedTestId: string
    }> = [
      {
        description: 'unwrapped state',
        isWrapped: false,
        expectedTestId: 'unwrap-lines-icon',
      },
      {
        description: 'wrapped state',
        isWrapped: true,
        expectedTestId: 'wrap-lines-icon',
      },
    ]

    testCases.forEach(({ description, isWrapped, expectedTestId }) => {
      it(`given ${description}, when rendered, expect correct icon displayed`, () => {
        // GIVEN
        const props = createProps({ isWrapped })

        // WHEN
        render(<LineWrapButton {...props} />)

        // EXPECT
        const icon = screen.getByTestId(expectedTestId)
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('tooltip text scenarios', () => {
    const testCases: Array<{
      description: string
      isWrapped: boolean
      expectedTooltip: string
    }> = [
      {
        description: 'unwrapped state',
        isWrapped: false,
        expectedTooltip: 'Wrap lines',
      },
      {
        description: 'wrapped state',
        isWrapped: true,
        expectedTooltip: 'Unwrap lines',
      },
    ]

    testCases.forEach(({ description, isWrapped, expectedTooltip }) => {
      it(`given ${description}, when hovered, expect correct tooltip text`, async () => {
        // GIVEN
        const props = createProps({ isWrapped })

        // WHEN
        render(<LineWrapButton {...props} />)
        const icon = screen.getByTestId(isWrapped ? 'wrap-lines-icon' : 'unwrap-lines-icon')
        fireEvent.mouseOver(icon)

        // EXPECT
        expect(await screen.findByText(expectedTooltip)).toBeInTheDocument()
      })
    })
  })

  describe('size prop scenarios', () => {
    const testCases: Array<{
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

    testCases.forEach(({ description, size, expectedSize }) => {
      it(`given ${description}, when rendered, expect icon has correct size`, () => {
        // GIVEN
        const props = createProps({ size })

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
      const props = createProps({ isWrapped: false, onClick: mockOnClick })

      // WHEN
      render(<LineWrapButton {...props} />)
      const icon = screen.getByTestId('unwrap-lines-icon')
      fireEvent.click(icon)

      // EXPECT
      expect(mockOnClick).toHaveBeenCalledOnce()
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
    })

    it('given wrapped state, when clicked, expect onClick called with event', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createProps({ isWrapped: true, onClick: mockOnClick })

      // WHEN
      render(<LineWrapButton {...props} />)
      const icon = screen.getByTestId('wrap-lines-icon')
      fireEvent.click(icon)

      // EXPECT
      expect(mockOnClick).toHaveBeenCalledOnce()
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
    })

    it('given multiple clicks, when clicked repeatedly, expect onClick called multiple times', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createProps({ onClick: mockOnClick })

      // WHEN
      render(<LineWrapButton {...props} />)
      const icon = screen.getByTestId('unwrap-lines-icon')
      fireEvent.click(icon)
      fireEvent.click(icon)
      fireEvent.click(icon)

      // EXPECT
      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('styling scenarios', () => {
    it('given component rendered, when inspected, expect theme colors applied', () => {
      // GIVEN
      const props = createProps()

      // WHEN
      render(<LineWrapButton {...props} />)

      // EXPECT
      const icon = screen.getByTestId('unwrap-lines-icon')
      expect(icon).toHaveStyle('cursor: pointer')
    })
  })
})
