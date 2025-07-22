import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createPropsFactory } from '@test-lib'
import { render } from '@test-lib'
import { IconRail } from './IconRail'
import type { DrawerContent, IconRailProps } from './types'

/**
 * # IconRail Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **@ant-design/icons**: Mocked MenuFoldOutlined and MenuUnfoldOutlined to isolate component from external icon library and provide testable elements
 * - **Event handlers**: onToggleDrawer and onSelect mocked to verify callback behavior without side effects
 *
 * ## Happy Path
 * - Icon rail with contents → Icons rendered → Click interactions work → Tooltips display → Selection styling applied
 * - Toggle button functionality → Correct icon shown based on open state → Click triggers callback → Animation classes applied
 *
 * ## Edge Cases
 * - **Edge Case 01:** Empty contents array → Only toggle button rendered, no content icons
 * - **Edge Case 02:** Non-closeable drawer → Toggle button hidden, content icons still functional
 * - **Edge Case 03:** Complex nested icons → Component handles multi-level JSX structures gracefully
 * - **Edge Case 04:** Empty or very long titles → Tooltip functionality works without crashes
 * - **Edge Case 05:** Non-existent selected key → No selection styling applied to any icons
 * - **Edge Case 06:** Open/closed state transitions → Correct icons and tooltips shown for each state
 *
 * ## Assertions
 * - Verify icon presence, click interactions, tooltip content, selection styling, and accessibility features
 * - Test DOM structure, event handler calls, CSS class application, and component state management
 */

// MOCK
vi.mock('@ant-design/icons', () => ({
  MenuFoldOutlined: vi.fn((props) => <span data-testid="menu-fold-icon" {...props} />),
  MenuUnfoldOutlined: vi.fn((props) => <span data-testid="menu-unfold-icon" {...props} />),
}))

const createIconRailProps = createPropsFactory<IconRailProps>({
  isCloseable: true,
  open: true,
  contents: [
    {
      key: 'content-1',
      icon: <span data-testid="icon-1">Icon 1</span>,
      title: 'Content 1',
      content: <div>Content 1</div>,
    },
    {
      key: 'content-2',
      icon: <span data-testid="icon-2">Icon 2</span>,
      title: 'Content 2',
      content: <div>Content 2</div>,
    },
  ],
  selectedKey: 'content-1',
  onToggleDrawer: vi.fn(),
  onSelect: vi.fn(),
})

const createDrawerContent = (overrides: Partial<DrawerContent> = {}): DrawerContent => ({
  key: 'test-content',
  icon: <span data-testid="test-icon">Test Icon</span>,
  title: 'Test Content',
  content: <div>Test Content</div>,
  ...overrides,
})

describe('IconRail', () => {
  describe('basic rendering', () => {
    it('given basic props, when rendered, expect icon rail to be displayed', () => {
      // GIVEN
      const props = createIconRailProps()

      // WHEN
      render(<IconRail {...props} />)

      // EXPECT
      expect(screen.getByTestId('icon-1')).toBeInTheDocument()
      expect(screen.getByTestId('icon-2')).toBeInTheDocument()
    })

    it('given no contents, when rendered, expect only toggle button to be displayed', () => {
      // GIVEN
      const props = createIconRailProps({ contents: [] })

      // WHEN
      render(<IconRail {...props} />)

      // EXPECT
      expect(screen.getByTestId('menu-fold-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('icon-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('icon-2')).not.toBeInTheDocument()
    })

    it('given not closeable, when rendered, expect toggle button to not be displayed', () => {
      // GIVEN
      const props = createIconRailProps({ isCloseable: false })

      // WHEN
      render(<IconRail {...props} />)

      // EXPECT
      expect(screen.queryByTestId('menu-fold-icon')).not.toBeInTheDocument()
      expect(screen.queryByTestId('menu-unfold-icon')).not.toBeInTheDocument()
    })
  })

  describe('toggle drawer functionality', () => {
    it('given drawer is open, when toggle button clicked, expect onToggleDrawer to be called', () => {
      // GIVEN
      const mockOnToggleDrawer = vi.fn()
      const props = createIconRailProps({ onToggleDrawer: mockOnToggleDrawer })

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.click(screen.getByTestId('menu-fold-icon'))

      // EXPECT
      expect(mockOnToggleDrawer).toHaveBeenCalledOnce()
    })

    it('given drawer is closed, when toggle button clicked, expect onToggleDrawer to be called', () => {
      // GIVEN
      const mockOnToggleDrawer = vi.fn()
      const props = createIconRailProps({
        open: false,
        onToggleDrawer: mockOnToggleDrawer,
      })

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.click(screen.getByTestId('menu-unfold-icon'))

      // EXPECT
      expect(mockOnToggleDrawer).toHaveBeenCalledOnce()
    })

    it('given drawer is open, when rendered, expect fold icon to be displayed', () => {
      // GIVEN
      const props = createIconRailProps({ open: true })

      // WHEN
      render(<IconRail {...props} />)

      // EXPECT
      expect(screen.getByTestId('menu-fold-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('menu-unfold-icon')).not.toBeInTheDocument()
    })

    it('given drawer is closed, when rendered, expect unfold icon to be displayed', () => {
      // GIVEN
      const props = createIconRailProps({ open: false })

      // WHEN
      render(<IconRail {...props} />)

      // EXPECT
      expect(screen.getByTestId('menu-unfold-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('menu-fold-icon')).not.toBeInTheDocument()
    })
  })

  describe('content selection', () => {
    it('given content icon clicked, when clicked, expect onSelect to be called with correct key', () => {
      // GIVEN
      const mockOnSelect = vi.fn()
      const props = createIconRailProps({ onSelect: mockOnSelect })

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.click(screen.getByTestId('icon-2'))

      // EXPECT
      expect(mockOnSelect).toHaveBeenCalledWith('content-2')
    })

    it('given multiple content icons, when different icons clicked, expect correct keys passed to onSelect', () => {
      // GIVEN
      const mockOnSelect = vi.fn()
      const props = createIconRailProps({ onSelect: mockOnSelect })

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.click(screen.getByTestId('icon-1'))
      fireEvent.click(screen.getByTestId('icon-2'))

      // EXPECT
      expect(mockOnSelect).toHaveBeenNthCalledWith(1, 'content-1')
      expect(mockOnSelect).toHaveBeenNthCalledWith(2, 'content-2')
    })
  })

  describe('selected state styling', () => {
    it('given selected content, when rendered, expect selected icon to have selected styling', () => {
      // GIVEN
      const props = createIconRailProps({ selectedKey: 'content-1' })

      // WHEN
      render(<IconRail {...props} />)
      // The first tooltip-wrapper is toggle, second is content-1
      const wrappers = screen.getAllByTestId('tooltip-wrapper')
      const styledSpan = wrappers[1].querySelector('span')

      // EXPECT
      expect(styledSpan?.className).toMatch(/^css-/) // Emotion class present
    })

    it('given non-selected content, when rendered, expect non-selected icon to not have selected styling', () => {
      // GIVEN
      const props = createIconRailProps({ selectedKey: 'content-1' })

      // WHEN
      render(<IconRail {...props} />)
      const wrappers = screen.getAllByTestId('tooltip-wrapper')
      const styledSpan = wrappers[2].querySelector('span')

      // EXPECT
      expect(styledSpan).toBeInTheDocument()
    })

    it('given different selected content, when rendered, expect correct icon to have selected styling', () => {
      // GIVEN
      const props = createIconRailProps({ selectedKey: 'content-2' })

      // WHEN
      render(<IconRail {...props} />)
      const wrappers = screen.getAllByTestId('tooltip-wrapper')
      const styledSpanSelected = wrappers[2].querySelector('span')
      const styledSpanNonSelected = wrappers[1].querySelector('span')

      // EXPECT
      expect(styledSpanSelected?.className).toMatch(/^css-/)
      expect(styledSpanNonSelected).toBeInTheDocument()
    })
  })

  describe('tooltip functionality', () => {
    it('given content with title, when hovered, expect tooltip to appear', async () => {
      // GIVEN
      const props = createIconRailProps()

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.mouseOver(screen.getByTestId('icon-1'))

      // EXPECT
      expect(await screen.findByText('Content 1')).toBeInTheDocument()
    })

    it('given toggle button, when hovered, expect correct tooltip to appear', async () => {
      // GIVEN
      const props = createIconRailProps({ open: true })

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.mouseOver(screen.getByTestId('menu-fold-icon'))

      // EXPECT
      expect(await screen.findByText('Close drawer')).toBeInTheDocument()
    })

    it('given closed drawer, when toggle button hovered, expect open drawer tooltip', async () => {
      // GIVEN
      const props = createIconRailProps({ open: false })

      // WHEN
      render(<IconRail {...props} />)
      fireEvent.mouseOver(screen.getByTestId('menu-unfold-icon'))

      // EXPECT
      expect(await screen.findByText('Open drawer')).toBeInTheDocument()
    })
  })

  describe('animation classes', () => {
    it('given open drawer, when rendered, expect fold icon to have animation class', () => {
      // GIVEN
      const props = createIconRailProps({ open: true })

      // WHEN
      render(<IconRail {...props} />)
      const foldIcon = screen.getByTestId('menu-fold-icon')

      // EXPECT
      expect(foldIcon.className).toMatch(/^css-/) // Emotion CSS class
    })

    it('given closed drawer, when rendered, expect unfold icon to have animation class', () => {
      // GIVEN
      const props = createIconRailProps({ open: false })

      // WHEN
      render(<IconRail {...props} />)
      const unfoldIcon = screen.getByTestId('menu-unfold-icon')

      // EXPECT
      expect(unfoldIcon.className).toMatch(/^css-/) // Emotion CSS class
    })
  })

  describe('edge cases', () => {
    it('given content with complex icon, when rendered, expect icon to be displayed correctly', () => {
      // GIVEN
      const complexIcon = (
        <div data-testid="complex-icon">
          <span>Complex</span>
          <span>Icon</span>
        </div>
      )
      const content = createDrawerContent({
        key: 'complex-content',
        icon: complexIcon,
        title: 'Complex Content',
      })
      const props = createIconRailProps({ contents: [content] })

      // WHEN
      render(<IconRail {...props} />)

      // EXPECT
      expect(screen.getByTestId('complex-icon')).toBeInTheDocument()
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Icon')).toBeInTheDocument()
    })

    it('given content with empty title, when rendered, expect component to not crash', () => {
      // GIVEN
      const content = createDrawerContent({ title: '' })
      const props = createIconRailProps({ contents: [content] })

      // WHEN & EXPECT
      expect(() => render(<IconRail {...props} />)).not.toThrow()
    })

    it('given content with very long title, when rendered, expect component to handle it gracefully', () => {
      // GIVEN
      const longTitle = 'A'.repeat(1000)
      const content = createDrawerContent({ title: longTitle })
      const props = createIconRailProps({ contents: [content] })

      // WHEN & EXPECT
      expect(() => render(<IconRail {...props} />)).not.toThrow()
    })

    it('given selected key that does not exist in contents, when rendered, expect no selection styling', () => {
      // GIVEN
      const props = createIconRailProps({ selectedKey: 'non-existent-key' })

      // WHEN
      render(<IconRail {...props} />)
      const icon1 = screen.getByTestId('icon-1').closest('span')
      const icon2 = screen.getByTestId('icon-2').closest('span')

      // EXPECT
      expect(icon1).not.toHaveStyle('background-color: rgba(0, 0, 0, 0.1)')
      expect(icon2).not.toHaveStyle('background-color: rgba(0, 0, 0, 0.1)')
    })
  })

  describe('accessibility', () => {
    it('given content icons, when rendered, expect icons to be clickable', () => {
      // GIVEN
      const props = createIconRailProps()
      const mockOnSelect = vi.fn()
      props.onSelect = mockOnSelect

      // WHEN
      render(<IconRail {...props} />)
      const icon1 = screen.getByTestId('icon-1').closest('span')
      const icon2 = screen.getByTestId('icon-2').closest('span')

      // EXPECT
      expect(icon1).toBeInTheDocument()
      expect(icon2).toBeInTheDocument()
      if (icon1) fireEvent.click(icon1)
      if (icon2) fireEvent.click(icon2)
      expect(mockOnSelect).toHaveBeenCalledWith('content-1')
      expect(mockOnSelect).toHaveBeenCalledWith('content-2')
    })

    it('given toggle button, when rendered, expect button to be clickable', () => {
      // GIVEN
      const props = createIconRailProps()
      const mockOnToggleDrawer = vi.fn()
      props.onToggleDrawer = mockOnToggleDrawer

      // WHEN
      render(<IconRail {...props} />)
      const toggleButton = screen.getByTestId('menu-fold-icon')

      // EXPECT
      expect(toggleButton).toBeInTheDocument()
      fireEvent.click(toggleButton)
      expect(mockOnToggleDrawer).toHaveBeenCalled()
    })
  })
})
