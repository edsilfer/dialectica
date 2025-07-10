import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createButtonMatrix, createCustomButton } from '../../utils/test/antd-utils'
import { render } from '../../utils/test/render'
import { ActionButtons } from './ActionButtons'
import type { CustomButton } from './types'

describe('ActionButtons', () => {
  describe('button configuration scenarios', () => {
    const testCases: Array<{
      description: string
      buttons: CustomButton[] | undefined
      expectedButtonNames: string[]
    }> = [
      {
        description: 'no buttons provided',
        buttons: undefined,
        expectedButtonNames: [],
      },
      {
        description: 'empty buttons array',
        buttons: [],
        expectedButtonNames: [],
      },
      {
        description: 'only left buttons',
        buttons: [
          createCustomButton({ key: 'left-1', label: 'Left 1', side: 'left' }),
          createCustomButton({ key: 'left-2', label: 'Left 2', side: 'left' }),
        ],
        expectedButtonNames: ['Left 1', 'Left 2'],
      },
      {
        description: 'only right buttons',
        buttons: [
          createCustomButton({ key: 'right-1', label: 'Right 1', side: 'right' }),
          createCustomButton({ key: 'right-2', label: 'Right 2', side: 'right' }),
        ],
        expectedButtonNames: ['Right 1', 'Right 2'],
      },
      {
        description: 'mixed left and right buttons',
        buttons: createButtonMatrix(),
        expectedButtonNames: ['Left 1', 'Left 2', 'Right 1', 'Right 2'],
      },
    ]

    testCases.forEach(({ description, buttons, expectedButtonNames }) => {
      it(`given ${description}, when rendered, expect correct buttons displayed`, () => {
        // WHEN
        render(<ActionButtons buttons={buttons} />)

        // EXPECT
        if (expectedButtonNames.length === 0) {
          expect(screen.queryByRole('button')).not.toBeInTheDocument()
        } else {
          expectedButtonNames.forEach((buttonName) => {
            expect(screen.getByRole('button', { name: buttonName })).toBeInTheDocument()
          })
        }
      })
    })
  })

  describe('button interactions', () => {
    it('given buttons with tooltips, when hovered, expect tooltips to appear', async () => {
      // GIVEN
      const button = createCustomButton({
        key: 'tooltip-button',
        label: 'Test Button',
        tooltipText: 'Test tooltip text',
      })

      // WHEN
      render(<ActionButtons buttons={[button]} />)
      fireEvent.mouseOver(screen.getByRole('button', { name: 'Test Button' }))

      // EXPECT
      expect(await screen.findByText('Test tooltip text')).toBeInTheDocument()
    })

    it('given button with onClick, when clicked, expect onClick to be called', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const button = createCustomButton({
        key: 'clickable-button',
        label: 'Clickable Button',
        onClick: mockOnClick,
      })

      // WHEN
      render(<ActionButtons buttons={[button]} />)
      fireEvent.click(screen.getByRole('button', { name: 'Clickable Button' }))

      // EXPECT
      expect(mockOnClick).toHaveBeenCalledOnce()
    })

    it('given multiple buttons with different onClick handlers, when clicked, expect correct handlers called', () => {
      // GIVEN
      const mockOnClick1 = vi.fn()
      const mockOnClick2 = vi.fn()
      const buttons = [
        createCustomButton({ key: 'button-1', label: 'Button 1', onClick: mockOnClick1 }),
        createCustomButton({ key: 'button-2', label: 'Button 2', onClick: mockOnClick2 }),
      ]

      // WHEN
      render(<ActionButtons buttons={buttons} />)
      fireEvent.click(screen.getByRole('button', { name: 'Button 1' }))
      fireEvent.click(screen.getByRole('button', { name: 'Button 2' }))

      // EXPECT
      expect(mockOnClick1).toHaveBeenCalledOnce()
      expect(mockOnClick2).toHaveBeenCalledOnce()
    })
  })
})
