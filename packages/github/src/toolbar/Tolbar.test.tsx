import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toolbar } from './Toolbar'

describe('DefaultToolbar', () => {
  describe('Basic Rendering', () => {
    it('given default props, when rendered, expect basic toolbar structure', () => {
      // WHEN
      render(<Toolbar />)

      // EXPECT
      const toolbar = screen.getByTestId('toolbar-container')
      expect(toolbar).toBeInTheDocument()
    })

    it('given custom header, when rendered, expect header to be displayed', () => {
      // GIVEN
      const customHeader = <div data-testid="custom-header">Custom Header Content</div>

      // WHEN
      render(<Toolbar header={customHeader} />)

      // EXPECT
      expect(screen.getByTestId('custom-header')).toBeInTheDocument()
      expect(screen.getByText('Custom Header Content')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('given loading true, when rendered, expect skeleton to be displayed', () => {
      // WHEN
      render(<Toolbar loading={true} />)

      // EXPECT
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons).toHaveLength(1) // Only one skeleton should be present
      expect(skeletons[0]).toBeInTheDocument()
    })

    it('given loading false, when rendered, expect normal toolbar to be displayed', () => {
      // WHEN
      render(<Toolbar loading={false} />)

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
      render(<Toolbar additionalWidget={[leftWidget]} />)

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
      render(<Toolbar additionalWidget={[rightWidget]} />)

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
      render(<Toolbar additionalWidget={[leftWidget, rightWidget]} />)

      // EXPECT
      expect(screen.getByTestId('left-widget')).toBeInTheDocument()
      expect(screen.getByTestId('right-widget')).toBeInTheDocument()
    })

    it('given no additional widgets, when rendered, expect empty toolbar', () => {
      // WHEN
      render(<Toolbar additionalWidget={[]} />)

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
      render(<Toolbar header={header} additionalWidget={[leftWidget, rightWidget]} />)

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
      render(<Toolbar loading={true} header={header} additionalWidget={[widget]} />)

      // EXPECT
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons).toHaveLength(1) // Only one skeleton should be present
      expect(screen.queryByTestId('header')).not.toBeInTheDocument()
      expect(screen.queryByTestId('widget')).not.toBeInTheDocument()
    })
  })
})
