import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
} from '@edsilfer/test-lib'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '../../../../test-lib/src/render'
import { Drawer, DrawerContent, DrawerProps } from './Drawer'

/**
 * # Drawer Testing Strategy
 *
 * ## Mocked Boundaries
 *
 * - **Event handlers**: onStateChange and onSelectContent mocked to verify callback behavior without side effects
 * - **Content functions**: Function-based content mocked to test dynamic content rendering
 * - **IconRail integration**: IconRail behavior mocked through icon rendering tests
 * - **Antd components**: MenuFoldOutlined/MenuUnfoldOutlined icons mocked for toggle functionality
 *
 * ## Happy Path
 * - Single content with default key → Content displayed and selected automatically
 * - Multiple contents without default → First content selected by default
 * - Open drawer state → Content area visible with proper rendering
 * - Content selection → onSelectContent called with correct key, drawer opens if closed
 * - Toggle functionality → State changes properly when toggle button clicked
 *
 * ## Edge Cases
 * - **Edge Case 01:** Default key doesn't exist in contents → No content displayed, verified by expectElementNotToBeInTheDocument
 * - **Edge Case 02:** Empty contents array → No content displayed, verified by expectElementNotToBeInTheDocument
 * - **Edge Case 03:** Selected content not found → No content displayed, verified by expectElementNotToBeInTheDocument
 * - **Edge Case 04:** Null content → No content displayed, verified by expectElementNotToBeInTheDocument
 * - **Edge Case 05:** Non-closeable drawer → No toggle button present, verified by queryByRole assertions
 * - **Edge Case 06:** Loading state → Skeleton displayed instead of content, verified by expectElementToBeInTheDocument
 * - **Edge Case 07:** Closed drawer state → Content area hidden, verified by expectElementNotToBeInTheDocument
 * - **Edge Case 08:** Function-based content → Function called and result displayed, verified by mock function assertions
 *
 * ## Assertions
 * - Verify content visibility, icon rendering, callback invocations, state changes, and styling application
 * - Test both positive (element present) and negative (element absent) assertions
 * - Validate DOM structure, event handling, and component integration
 */

// MOCK

const createDrawerContent = (overrides: Partial<DrawerContent> = {}): DrawerContent => ({
  key: 'test-content',
  icon: <span data-testid="test-icon">📄</span>,
  title: 'Test Content',
  content: <div data-testid="test-content">Test content</div>,
  ...overrides,
})

const createDrawerProps = createPropsFactory<DrawerProps>({
  contents: [createDrawerContent()],
  state: 'open',
  default: 'test-content',
  onStateChange: vi.fn(),
  onSelectContent: vi.fn(),
})

describe('Drawer', () => {
  describe('initialization scenarios', () => {
    it('given single content with default key, when rendered, expect content displayed and selected', () => {
      // GIVEN
      const content = createDrawerContent({ key: 'default-content' })
      const props = createDrawerProps({
        contents: [content],
        default: 'default-content',
      })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('test-content')
      expectElementToBeInTheDocument('test-icon')
    })

    it('given multiple contents without default, when rendered, expect first content selected', () => {
      // GIVEN
      const contents = [
        createDrawerContent({ key: 'first', title: 'First' }),
        createDrawerContent({ key: 'second', title: 'Second' }),
      ]
      const props = createDrawerProps({
        contents,
        default: undefined,
      })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('test-content')
      expect(screen.getAllByText('📄')).toHaveLength(2)
    })

    it('given default key that does not exist in contents, when rendered, expect no content displayed', () => {
      // GIVEN
      const contents = [
        createDrawerContent({ key: 'first', title: 'First' }),
        createDrawerContent({ key: 'second', title: 'Second' }),
      ]
      const props = createDrawerProps({
        contents,
        default: 'non-existent',
      })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementNotToBeInTheDocument('test-content')
    })
  })

  describe('state management scenarios', () => {
    it('given drawer in open state, when rendered, expect content area visible', () => {
      // GIVEN
      const props = createDrawerProps({ state: 'open' })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('test-content')
    })

    it('given drawer in closed state, when rendered, expect content area hidden', () => {
      // GIVEN
      const props = createDrawerProps({ state: 'closed' })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementNotToBeInTheDocument('test-content')
    })

    it('given drawer state changes, when default prop updates, expect selected content updates', () => {
      // GIVEN
      const contents = [
        createDrawerContent({ key: 'first', title: 'First' }),
        createDrawerContent({ key: 'second', title: 'Second' }),
      ]
      const props = createDrawerProps({ contents })

      // WHEN
      const { rerender } = render(<Drawer {...props} />)
      rerender(<Drawer {...props} default="second" />)

      // EXPECT
      expectElementToBeInTheDocument('test-content')
    })
  })

  describe('content selection scenarios', () => {
    it('given multiple contents, when content selected, expect onSelectContent called with correct key', () => {
      // GIVEN
      const mockOnSelectContent = vi.fn()
      const contents = [
        createDrawerContent({ key: 'first', title: 'First' }),
        createDrawerContent({ key: 'second', title: 'Second' }),
      ]
      const props = createDrawerProps({
        contents,
        onSelectContent: mockOnSelectContent,
      })

      // WHEN
      render(<Drawer {...props} />)
      // Click on the icon to select the second content
      const icons = screen.getAllByText('📄')
      fireEvent.click(icons[1])

      // EXPECT
      expect(mockOnSelectContent).toHaveBeenCalledWith('second')
    })

    it('given drawer closed, when content selected, expect drawer opens and content selected', () => {
      // GIVEN
      const mockOnStateChange = vi.fn()
      const mockOnSelectContent = vi.fn()
      const contents = [
        createDrawerContent({ key: 'first', title: 'First' }),
        createDrawerContent({ key: 'second', title: 'Second' }),
      ]
      const props = createDrawerProps({
        contents,
        state: 'closed',
        onStateChange: mockOnStateChange,
        onSelectContent: mockOnSelectContent,
      })

      // WHEN
      render(<Drawer {...props} />)
      // Click on the icon to select the second content
      const icons = screen.getAllByText('📄')
      fireEvent.click(icons[1])

      // EXPECT
      expect(mockOnSelectContent).toHaveBeenCalledWith('second')
      expect(mockOnStateChange).toHaveBeenCalledWith('open')
    })

    it('given content with function content, when rendered, expect function result displayed', () => {
      // GIVEN
      const mockContent = vi.fn(() => <div data-testid="function-content">Function content</div>)
      const content = createDrawerContent({
        key: 'function-content',
        content: mockContent,
      })
      const props = createDrawerProps({
        contents: [content],
        default: 'function-content', // Explicitly set the default to match the content key
      })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementToBeInTheDocument('function-content')
      expect(mockContent).toHaveBeenCalledOnce()
    })
  })

  describe('drawer toggle scenarios', () => {
    it('given closeable drawer open, when toggle clicked, expect onStateChange called with closed', () => {
      // GIVEN
      const mockOnStateChange = vi.fn()
      const props = createDrawerProps({
        state: 'open',
        onStateChange: mockOnStateChange,
      })

      // WHEN
      render(<Drawer {...props} />)
      // Find and click the toggle button (MenuFoldOutlined when open)
      const toggleButton = screen.getByRole('img', { name: 'menu-fold' })
      fireEvent.click(toggleButton)

      // EXPECT
      expect(mockOnStateChange).toHaveBeenCalledWith('closed')
    })

    it('given closeable drawer closed, when toggle clicked, expect onStateChange called with open', () => {
      // GIVEN
      const mockOnStateChange = vi.fn()
      const props = createDrawerProps({
        state: 'closed',
        onStateChange: mockOnStateChange,
      })

      // WHEN
      render(<Drawer {...props} />)
      // Find and click the toggle button (MenuUnfoldOutlined when closed)
      const toggleButton = screen.getByRole('img', { name: 'menu-unfold' })
      fireEvent.click(toggleButton)

      // EXPECT
      expect(mockOnStateChange).toHaveBeenCalledWith('open')
    })

    it('given non-closeable drawer, when rendered, expect no toggle button present', () => {
      // GIVEN
      const props = createDrawerProps({ isCloseable: false })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expect(screen.queryByRole('img', { name: 'menu-fold' })).not.toBeInTheDocument()
      expect(screen.queryByRole('img', { name: 'menu-unfold' })).not.toBeInTheDocument()
    })
  })

  describe('loading state scenarios', () => {
    it('given loading true, when rendered, expect skeleton displayed instead of content', () => {
      // GIVEN
      const props = createDrawerProps({ loading: true })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expect(document.querySelector('.ant-skeleton')).toBeInTheDocument()
      expectElementNotToBeInTheDocument('test-content')
    })

    it('given loading false, when rendered, expect content displayed instead of skeleton', () => {
      // GIVEN
      const props = createDrawerProps({ loading: false })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expect(document.querySelector('.ant-skeleton')).not.toBeInTheDocument()
      expectElementToBeInTheDocument('test-content')
    })
  })

  describe('styling and props scenarios', () => {
    it('given className provided, when rendered, expect className applied to container', () => {
      // GIVEN
      const props = createDrawerProps({ className: 'custom-drawer' })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      // The className should be applied to the root container
      const rootContainer = screen.getByTestId('drawer-container')
      expect(rootContainer).toHaveClass('custom-drawer')
    })

    it('given style provided, when rendered, expect style applied to container', () => {
      // GIVEN
      const customStyle = { backgroundColor: 'red' }
      const props = createDrawerProps({ style: customStyle })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      // The style should be applied to the root container
      const rootContainer = screen.getByTestId('drawer-container')
      expect(rootContainer).toHaveStyle('background-color: rgb(255, 0, 0)')
    })
  })

  describe('edge cases and error handling', () => {
    it('given empty contents array, when rendered, expect no content displayed', () => {
      // GIVEN
      const props = createDrawerProps({ contents: [] })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementNotToBeInTheDocument('test-content')
    })

    it('given selected content not found, when rendered, expect no content displayed', () => {
      // GIVEN
      const content = createDrawerContent({ key: 'existing' })
      const props = createDrawerProps({
        contents: [content],
        default: 'non-existing',
      })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementNotToBeInTheDocument('test-content')
    })

    it('given null content, when rendered, expect no content displayed', () => {
      // GIVEN
      const content = createDrawerContent({ content: null })
      const props = createDrawerProps({ contents: [content] })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expectElementNotToBeInTheDocument('test-content')
    })
  })

  describe('integration with IconRail', () => {
    it('given drawer props, when rendered, expect IconRail displays content correctly', () => {
      // GIVEN
      const contents = [
        createDrawerContent({ key: 'first', title: 'First' }),
        createDrawerContent({ key: 'second', title: 'Second' }),
      ]
      const props = createDrawerProps({
        contents,
        state: 'open',
        isCloseable: true,
      })

      // WHEN
      render(<Drawer {...props} />)

      // EXPECT
      expect(screen.getAllByText('📄')).toHaveLength(2)
      expect(screen.getByRole('img', { name: 'menu-fold' })).toBeInTheDocument()
    })
  })
})
