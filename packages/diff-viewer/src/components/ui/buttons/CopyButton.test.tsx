import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '../../../test/render'
import CopyButton from './CopyButton'
import type { CopyButtonProps } from './types'

// Test utilities
const createCopyButtonProps = (overrides: Partial<CopyButtonProps> = {}): CopyButtonProps => ({
  onClick: vi.fn(),
  ...overrides,
})

describe('CopyButton', () => {
  describe('rendering scenarios', () => {
    const testCases: Array<{
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

    testCases.forEach(({ description, props, expectTooltip }) => {
      it(`given ${description}, when rendered, expect correct structure`, () => {
        // GIVEN
        const buttonProps = createCopyButtonProps(props)

        // WHEN
        const { container } = render(<CopyButton {...buttonProps} />)

        // EXPECT
        const copyIcon = container.querySelector('svg')
        expect(copyIcon).toBeInTheDocument()

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
      const copyIcon = container.querySelector('svg')
      expect(copyIcon).toHaveAttribute('width', '16')
      expect(copyIcon).toHaveAttribute('height', '16')
    })

    it('given custom size prop, when rendered, expect custom size applied', () => {
      // GIVEN
      const props = createCopyButtonProps({ size: 24 })

      // WHEN
      const { container } = render(<CopyButton {...props} />)

      // EXPECT
      const copyIcon = container.querySelector('svg')
      expect(copyIcon).toHaveAttribute('width', '24')
      expect(copyIcon).toHaveAttribute('height', '24')
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
      expect(mockOnClick).toHaveBeenCalledOnce()
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
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
      expect(mockOnClick).toHaveBeenCalledOnce()
      expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
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
      expect(await screen.findByText('Copy to clipboard')).toBeInTheDocument()
    })

    it('given copy button with toastText, when clicked, expect toast to appear', async () => {
      // GIVEN
      const props = createCopyButtonProps({ toastText: 'Copied!' })

      // WHEN
      const { container } = render(<CopyButton {...props} />)
      const copyIcon = container.querySelector('svg')!
      fireEvent.click(copyIcon)

      // EXPECT
      expect(await screen.findByText('Copied!')).toBeInTheDocument()
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
      expect(await screen.findByText('Copy to clipboard')).toBeInTheDocument()

      // Click to show toast
      fireEvent.click(copyIcon)

      // EXPECT
      expect(await screen.findByText('Copied!')).toBeInTheDocument()
    })
  })
})
