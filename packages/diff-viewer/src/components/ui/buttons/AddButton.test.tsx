import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type React from 'react'
import type { AddButtonProps } from './types'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import {
  expectClickEventToBePassed,
  expectClickHandlerToBeCalled,
} from '../../../utils/test/components/ui/buttons/test-utils'
import { render } from '../../../utils/test/render'
import AddButton from './AddButton'

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
}))

// ====================
// LOCAL UTILITIES
// ====================

const createAddButtonProps = createPropsFactory<AddButtonProps>({
  onClick: vi.fn<(event: React.MouseEvent<HTMLButtonElement>) => void>(),
})

const BASIC_RENDERING_TEST_CASES: Array<{ description: string; props: Partial<AddButtonProps> }> = [
  {
    description: 'no props provided',
    props: {},
  },
  {
    description: 'className provided',
    props: { className: 'custom-class' },
  },
  {
    description: 'onClick handler provided',
    props: { onClick: vi.fn<(event: React.MouseEvent<HTMLButtonElement>) => void>() },
  },
  {
    description: 'all props provided',
    props: {
      className: 'custom-class',
      onClick: vi.fn<(event: React.MouseEvent<HTMLButtonElement>) => void>(),
    },
  },
]

const expectButtonToBeAccessible = (button: HTMLElement): void => {
  expect(button).toBeInTheDocument()
  expect(button.tagName).toBe('BUTTON')
}

const expectButtonToBeFocusable = (button: HTMLElement): void => {
  button.focus()
  expect(button).toHaveFocus()
}

const expectIconToBePresent = (container: HTMLElement, testId: string): Element | null => {
  const icon = container.querySelector(`[data-testid="${testId}"]`)
  expect(icon).toBeInTheDocument()
  return icon
}

// ====================
// TEST CASES
// ====================

describe('AddButton', () => {
  describe('basic rendering scenarios', () => {
    BASIC_RENDERING_TEST_CASES.forEach(({ description, props }) => {
      it(`given ${description}, when rendered, expect button to display correctly`, () => {
        // WHEN
        render(<AddButton {...props} />)

        // EXPECT
        expect(screen.getByRole('button')).toBeInTheDocument()
        expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
      })
    })
  })

  describe('className application', () => {
    it('given className prop, when rendered, expect className to be applied', () => {
      // GIVEN
      const customClassName = 'test-custom-class'

      // WHEN
      render(<AddButton className={customClassName} />)

      // EXPECT
      expect(screen.getByRole('button')).toHaveClass(customClassName)
    })

    it('given no className prop, when rendered, expect button to render without custom class', () => {
      // WHEN
      render(<AddButton />)

      // EXPECT
      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('test-custom-class')
    })
  })

  describe('click interactions', () => {
    it('given onClick handler, when button clicked, expect handler to be called', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createAddButtonProps({ onClick: mockOnClick })

      // WHEN
      render(<AddButton {...props} />)
      fireEvent.click(screen.getByRole('button'))

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 1)
    })

    it('given onClick handler, when button clicked, expect click event to be passed', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createAddButtonProps({ onClick: mockOnClick })

      // WHEN
      render(<AddButton {...props} />)
      fireEvent.click(screen.getByRole('button'))

      // EXPECT
      expectClickEventToBePassed(mockOnClick)
    })

    it('given no onClick handler, when button clicked, expect no error', () => {
      // WHEN
      render(<AddButton />)

      // EXPECT
      expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow()
    })

    it('given onClick handler, when button clicked multiple times, expect handler called each time', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const props = createAddButtonProps({ onClick: mockOnClick })

      // WHEN
      render(<AddButton {...props} />)
      fireEvent.click(screen.getByRole('button'))
      fireEvent.click(screen.getByRole('button'))
      fireEvent.click(screen.getByRole('button'))

      // EXPECT
      expectClickHandlerToBeCalled(mockOnClick, 3)
    })
  })

  describe('accessibility', () => {
    it('given rendered component, when queried, expect button role to be accessible', () => {
      // WHEN
      render(<AddButton />)

      // EXPECT
      const button = screen.getByRole('button')
      expectButtonToBeAccessible(button)
    })

    it('given rendered component, when focused, expect button to be focusable', () => {
      // WHEN
      render(<AddButton />)
      const button = screen.getByRole('button')

      // EXPECT
      expectButtonToBeFocusable(button)
    })
  })

  describe('icon rendering', () => {
    it('given rendered component, when queried, expect plus icon to be present', () => {
      // WHEN
      const { container } = render(<AddButton />)

      // EXPECT
      expectIconToBePresent(container, 'plus-icon')
    })
  })
})
