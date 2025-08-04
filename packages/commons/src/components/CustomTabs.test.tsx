import { createPropsFactory, expectElementToBeInTheDocument, render } from '@dialectica-org/test-lib'
import '@testing-library/jest-dom/vitest'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider, Themes } from '../themes'
import type { CustomTabsProps, TabActionButton, TabItem } from './CustomTabs'
import { CustomTabs } from './CustomTabs'

// HELPERS
const renderWithContext = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={Themes.light}>{ui}</ThemeProvider>)
}

const createTabItem = createPropsFactory<TabItem>({
  key: 'tab-1',
  title: 'Tab 1',
  content: <div data-testid="tab-content-1">Content 1</div>,
})

const createTabActionButton = createPropsFactory<TabActionButton>({
  key: 'action-1',
  icon: <span data-testid="action-icon-1">Icon 1</span>,
  tooltip: 'Action 1 tooltip',
  onClick: vi.fn(),
})

const createCustomTabsProps = createPropsFactory<CustomTabsProps>({
  tabs: [
    createTabItem({ key: 'tab-1', title: 'Tab 1', content: <div data-testid="tab-content-1">Content 1</div> }),
    createTabItem({ key: 'tab-2', title: 'Tab 2', content: <div data-testid="tab-content-2">Content 2</div> }),
  ],
  activeTab: 'tab-1',
  onTabChange: vi.fn(),
  actions: [],
  className: undefined,
})

describe('CustomTabs', () => {
  describe('basic rendering scenarios', () => {
    it('given tabs with content, when rendered, expect tabs and active content displayed', () => {
      // GIVEN
      const props = createCustomTabsProps()

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByTestId('tab-content-1')).toBeInTheDocument()
      expect(screen.queryByTestId('tab-content-2')).not.toBeInTheDocument()
    })

    it('given single tab, when rendered, expect only one tab displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({
        tabs: [createTabItem()],
      })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.queryByText('Tab 2')).not.toBeInTheDocument()
    })

    it('given tab with footer, when rendered, expect footer displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({
        tabs: [
          createTabItem({
            key: 'tab-1',
            title: 'Tab 1',
            content: <div>Content</div>,
            footer: <div data-testid="tab-footer">Footer content</div>,
          }),
        ],
      })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('tab-footer')).toBeInTheDocument()
    })

    it('given tab without footer, when rendered, expect no footer displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({
        tabs: [createTabItem()],
      })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.queryByTestId('tab-footer')).not.toBeInTheDocument()
    })
  })

  describe('tab switching scenarios', () => {
    it('given inactive tab, when clicked, expect onTabChange called with correct key', () => {
      // GIVEN
      const mockOnTabChange = vi.fn()
      const props = createCustomTabsProps({ onTabChange: mockOnTabChange })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)
      fireEvent.click(screen.getByText('Tab 2'))

      // EXPECT
      expect(mockOnTabChange).toHaveBeenCalledWith('tab-2')
    })

    it('given active tab, when clicked, expect onTabChange still called', () => {
      // GIVEN
      const mockOnTabChange = vi.fn()
      const props = createCustomTabsProps({ onTabChange: mockOnTabChange })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)
      fireEvent.click(screen.getByText('Tab 1'))

      // EXPECT
      expect(mockOnTabChange).toHaveBeenCalledWith('tab-1')
    })

    it('given different active tab, when rendered, expect correct content displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({ activeTab: 'tab-2' })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('tab-content-2')).toBeInTheDocument()
      expect(screen.queryByTestId('tab-content-1')).not.toBeInTheDocument()
    })
  })

  describe('action buttons scenarios', () => {
    it('given no actions, when rendered, expect no action buttons displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({ actions: [] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.queryByTestId('action-icon-1')).not.toBeInTheDocument()
    })

    it('given single action, when rendered, expect action button displayed', () => {
      // GIVEN
      const action = createTabActionButton()
      const props = createCustomTabsProps({ actions: [action] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('action-icon-1')).toBeInTheDocument()
    })

    it('given action with tooltip, when hovered, expect tooltip displayed', async () => {
      // GIVEN
      const action = createTabActionButton({ tooltip: 'Test tooltip' })
      const props = createCustomTabsProps({ actions: [action] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)
      fireEvent.mouseOver(screen.getByTestId('action-icon-1'))

      // EXPECT
      expect(await screen.findByText('Test tooltip')).toBeInTheDocument()
    })

    it('given action without tooltip, when hovered, expect no tooltip displayed', () => {
      // GIVEN
      const action = createTabActionButton({ tooltip: undefined })
      const props = createCustomTabsProps({ actions: [action] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)
      fireEvent.mouseOver(screen.getByTestId('action-icon-1'))

      // EXPECT
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
    })

    it('given action button, when clicked, expect onClick called', () => {
      // GIVEN
      const mockOnClick = vi.fn()
      const action = createTabActionButton({ onClick: mockOnClick })
      const props = createCustomTabsProps({ actions: [action] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)
      fireEvent.click(screen.getByTestId('action-icon-1'))

      // EXPECT
      expect(mockOnClick).toHaveBeenCalledOnce()
    })

    it('given multiple actions in same group, when rendered, expect no divider between them', () => {
      // GIVEN
      const action1 = createTabActionButton({
        key: 'action-1',
        group: 1,
        icon: <span data-testid="action-icon-1">Icon 1</span>,
      })
      const action2 = createTabActionButton({
        key: 'action-2',
        group: 1,
        icon: <span data-testid="action-icon-2">Icon 2</span>,
      })
      const props = createCustomTabsProps({ actions: [action1, action2] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('action-icon-1')).toBeInTheDocument()
      expect(screen.getByTestId('action-icon-2')).toBeInTheDocument()
      // No divider should be present between same group actions
    })

    it('given actions in different groups, when rendered, expect divider between groups', () => {
      // GIVEN
      const action1 = createTabActionButton({
        key: 'action-1',
        group: 1,
        icon: <span data-testid="action-icon-1">Icon 1</span>,
      })
      const action2 = createTabActionButton({
        key: 'action-2',
        group: 2,
        icon: <span data-testid="action-icon-2">Icon 2</span>,
      })
      const props = createCustomTabsProps({ actions: [action1, action2] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('action-icon-1')).toBeInTheDocument()
      expect(screen.getByTestId('action-icon-2')).toBeInTheDocument()
      // Divider should be present between different group actions
    })

    it('given actions with undefined groups, when rendered, expect actions treated as group 0', () => {
      // GIVEN
      const action1 = createTabActionButton({
        key: 'action-1',
        group: undefined,
        icon: <span data-testid="action-icon-1">Icon 1</span>,
      })
      const action2 = createTabActionButton({
        key: 'action-2',
        group: 1,
        icon: <span data-testid="action-icon-2">Icon 2</span>,
      })
      const props = createCustomTabsProps({ actions: [action1, action2] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('action-icon-1')).toBeInTheDocument()
      expect(screen.getByTestId('action-icon-2')).toBeInTheDocument()
      // Divider should be present between group 0 and group 1
    })
  })

  describe('edge cases and error scenarios', () => {
    it('given empty tabs array, when rendered, expect no tabs displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({ tabs: [] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.queryByText('Tab 1')).not.toBeInTheDocument()
      expect(screen.queryByText('Tab 2')).not.toBeInTheDocument()
    })

    it('given activeTab not in tabs, when rendered, expect no content displayed', () => {
      // GIVEN
      const props = createCustomTabsProps({ activeTab: 'non-existent-tab' })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.queryByTestId('tab-content-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('tab-content-2')).not.toBeInTheDocument()
    })

    it('given tab with complex content, when rendered, expect content preserved', () => {
      // GIVEN
      const complexContent = (
        <div data-testid="complex-content">
          <h1>Title</h1>
          <p>Paragraph</p>
          <button data-testid="content-button">Click me</button>
        </div>
      )
      const props = createCustomTabsProps({
        tabs: [createTabItem({ content: complexContent })],
      })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expect(screen.getByTestId('complex-content')).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Paragraph')).toBeInTheDocument()
      expect(screen.getByTestId('content-button')).toBeInTheDocument()
    })

    it('given className provided, when rendered, expect className applied to container', () => {
      // GIVEN
      const props = createCustomTabsProps({ className: 'custom-class' })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      const rootContainer = screen.getByText('Tab 1').closest('[class*="custom-class"]')
      expect(rootContainer).toHaveClass('custom-class')
    })
  })

  describe('accessibility and interaction scenarios', () => {
    it('given tab headers, when rendered, expect them to be clickable', () => {
      // GIVEN
      const props = createCustomTabsProps()

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      const tab1 = screen.getByText('Tab 1')
      const tab2 = screen.getByText('Tab 2')
      expect(tab1).toBeInTheDocument()
      expect(tab2).toBeInTheDocument()
      // Both should be clickable (no disabled state)
    })

    it('given action buttons, when rendered, expect them to have correct test IDs', () => {
      // GIVEN
      const action = createTabActionButton({ key: 'test-action' })
      const props = createCustomTabsProps({ actions: [action] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('tab-action-test-action')
    })

    it('given multiple actions, when clicked in sequence, expect all onClick handlers called', () => {
      // GIVEN
      const mockOnClick1 = vi.fn()
      const mockOnClick2 = vi.fn()
      const action1 = createTabActionButton({
        key: 'action-1',
        onClick: mockOnClick1,
        icon: <span data-testid="action-icon-1">Icon 1</span>,
      })
      const action2 = createTabActionButton({
        key: 'action-2',
        onClick: mockOnClick2,
        icon: <span data-testid="action-icon-2">Icon 2</span>,
      })
      const props = createCustomTabsProps({ actions: [action1, action2] })

      // WHEN
      renderWithContext(<CustomTabs {...props} />)
      fireEvent.click(screen.getByTestId('tab-action-action-1'))
      fireEvent.click(screen.getByTestId('tab-action-action-2'))

      // EXPECT
      expect(mockOnClick1).toHaveBeenCalledOnce()
      expect(mockOnClick2).toHaveBeenCalledOnce()
    })
  })
})
