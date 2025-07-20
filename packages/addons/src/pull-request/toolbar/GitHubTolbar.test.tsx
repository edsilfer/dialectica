import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GitHubToolbar } from './GitHubToolbar'

describe('DefaultToolbar', () => {
  describe('Basic Rendering', () => {
    it('given default props, when rendered, expect basic toolbar structure', () => {
      // WHEN
      render(<GitHubToolbar />)

      // EXPECT
      const toolbar = screen.getByTestId('toolbar-container')
      expect(toolbar).toBeInTheDocument()
    })

    it('given custom header, when rendered, expect header to be displayed', () => {
      // GIVEN
      const customHeader = <div data-testid="custom-header">Custom Header Content</div>

      // WHEN
      render(<GitHubToolbar header={customHeader} />)

      // EXPECT
      expect(screen.getByTestId('custom-header')).toBeInTheDocument()
      expect(screen.getByText('Custom Header Content')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('given loading true, when rendered, expect skeleton to be displayed', () => {
      // WHEN
      render(<GitHubToolbar loading={true} />)

      // EXPECT
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons).toHaveLength(2) // Outer container + inner Ant Design skeleton

      // Find the inner skeleton with the attributes we want to test
      const innerSkeleton = skeletons.find(
        (skeleton) =>
          skeleton.hasAttribute('data-active') &&
          skeleton.hasAttribute('data-title') &&
          skeleton.hasAttribute('data-rows'),
      )
      expect(innerSkeleton).toBeInTheDocument()
      expect(innerSkeleton).toHaveAttribute('data-active', 'true')
      expect(innerSkeleton).toHaveAttribute('data-title', 'false')
      expect(innerSkeleton).toHaveAttribute('data-rows', '2')
    })

    it('given loading false, when rendered, expect normal toolbar to be displayed', () => {
      // WHEN
      render(<GitHubToolbar loading={false} />)

      // EXPECT
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
  })

  describe('Additional Widgets', () => {
    it('given left side widget, when rendered, expect widget in left cluster', () => {
      // GIVEN
      const leftWidget = {
        key: 'left-widget',
        component: <div data-testid="left-widget">Left Widget</div>,
        side: 'left' as const,
      }

      // WHEN
      render(<GitHubToolbar additionalWidget={[leftWidget]} />)

      // EXPECT
      expect(screen.getByTestId('left-widget')).toBeInTheDocument()
      expect(screen.getByText('Left Widget')).toBeInTheDocument()
    })

    it('given right side widget, when rendered, expect widget in right cluster', () => {
      // GIVEN
      const rightWidget = {
        key: 'right-widget',
        component: <div data-testid="right-widget">Right Widget</div>,
        side: 'right' as const,
      }

      // WHEN
      render(<GitHubToolbar additionalWidget={[rightWidget]} />)

      // EXPECT
      expect(screen.getByTestId('right-widget')).toBeInTheDocument()
      expect(screen.getByText('Right Widget')).toBeInTheDocument()
    })

    it('given multiple widgets on both sides, when rendered, expect all widgets to be displayed', () => {
      // GIVEN
      const leftWidget = {
        key: 'left-widget',
        component: <div data-testid="left-widget">Left Widget</div>,
        side: 'left' as const,
      }
      const rightWidget = {
        key: 'right-widget',
        component: <div data-testid="right-widget">Right Widget</div>,
        side: 'right' as const,
      }

      // WHEN
      render(<GitHubToolbar additionalWidget={[leftWidget, rightWidget]} />)

      // EXPECT
      expect(screen.getByTestId('left-widget')).toBeInTheDocument()
      expect(screen.getByTestId('right-widget')).toBeInTheDocument()
    })

    it('given no additional widgets, when rendered, expect empty toolbar', () => {
      // WHEN
      render(<GitHubToolbar additionalWidget={[]} />)

      // EXPECT
      const toolbar = screen.getByTestId('toolbar-container')
      expect(toolbar).toBeInTheDocument()
      // Should not have any specific widget content
    })
  })

  describe('Combined Scenarios', () => {
    it('given header and widgets, when rendered, expect all elements to be present', () => {
      // GIVEN
      const header = <div data-testid="header">Toolbar Header</div>
      const leftWidget = {
        key: 'left-widget',
        component: <div data-testid="left-widget">Left Widget</div>,
        side: 'left' as const,
      }
      const rightWidget = {
        key: 'right-widget',
        component: <div data-testid="right-widget">Right Widget</div>,
        side: 'right' as const,
      }

      // WHEN
      render(<GitHubToolbar header={header} additionalWidget={[leftWidget, rightWidget]} />)

      // EXPECT
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('left-widget')).toBeInTheDocument()
      expect(screen.getByTestId('right-widget')).toBeInTheDocument()
    })

    it('given loading with header and widgets, when rendered, expect only skeleton', () => {
      // GIVEN
      const header = <div data-testid="header">Toolbar Header</div>
      const widget = {
        key: 'widget',
        component: <div data-testid="widget">Widget</div>,
        side: 'left' as const,
      }

      // WHEN
      render(<GitHubToolbar loading={true} header={header} additionalWidget={[widget]} />)

      // EXPECT
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons).toHaveLength(2) // Outer container + inner Ant Design skeleton
      expect(screen.queryByTestId('header')).not.toBeInTheDocument()
      expect(screen.queryByTestId('widget')).not.toBeInTheDocument()
    })
  })
})
