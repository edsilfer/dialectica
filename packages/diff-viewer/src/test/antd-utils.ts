import React from 'react'
import { vi } from 'vitest'
import type { CustomButton, ToolbarWidget } from '../optional/toolbar/types'

// ====================
// ANTD COMPONENT MOCKS
// ====================

export const createAntdMocks = () => ({
  Progress: ({ percent, size, showInfo }: { percent: number; size: string; showInfo: boolean }) =>
    React.createElement('div', {
      'data-testid': 'progress-bar',
      'data-percent': percent,
      'data-size': size,
      'data-show-info': showInfo,
    }),
  Typography: {
    Text: ({ children, _css, ...props }: { children: React.ReactNode; _css?: unknown; [key: string]: unknown }) =>
      React.createElement('span', { 'data-testid': 'progress-text', ...props }, children),
    Title: ({ children, level, ...props }: { children: React.ReactNode; level?: number; [key: string]: unknown }) =>
      React.createElement(`h${level || 1}`, { 'data-testid': 'typography-title', ...props }, children),
    Link: ({ children, href, ...props }: { children: React.ReactNode; href?: string; [key: string]: unknown }) =>
      React.createElement('a', { href, 'data-testid': 'typography-link', ...props }, children),
  },
  Tag: ({ children, color, ...props }: { children: React.ReactNode; color?: string; [key: string]: unknown }) =>
    React.createElement('span', { 'data-testid': 'tag', 'data-color': color, ...props }, children),
  Avatar: ({ src, size, alt, ...props }: { src?: string; size?: number; alt?: string; [key: string]: unknown }) =>
    React.createElement('img', { src, width: size, height: size, alt, 'data-testid': 'avatar', ...props }),
  Skeleton: ({ active, title, paragraph }: { active: boolean; title: boolean; paragraph: { rows: number } }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'skeleton',
        'data-active': active,
        'data-title': title,
        'data-rows': paragraph.rows,
      },
      'Loading...',
    ),
  Button: ({
    children,
    onClick,
    size,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    size?: string
    [key: string]: unknown
  }) => React.createElement('button', { onClick, 'data-size': size, ...props }, children),
  Space: {
    Compact: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'space-compact' }, children),
  },
  Tooltip: ({ children, title }: { children: React.ReactNode; title?: string }) => {
    const [showTooltip, setShowTooltip] = React.useState(false)

    return React.createElement(
      'div',
      {
        'data-testid': 'tooltip',
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
      },
      [
        children,
        showTooltip &&
          title &&
          React.createElement(
            'div',
            {
              key: 'tooltip-content',
              'data-testid': 'tooltip-content',
            },
            title,
          ),
      ],
    )
  },
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
  theme: {
    darkAlgorithm: 'dark-algorithm',
    defaultAlgorithm: 'default-algorithm',
  },
})

// ====================
// ENVIRONMENT MOCKS
// ====================

export const createEnvUtilsMock = () => ({
  isProduction: () => false, // Default to development for testing
})

// ====================
// TOOLBAR COMPONENT MOCKS
// ====================

export const createToolbarComponentMocks = () => ({
  ActionButtons: ({ buttons }: { buttons: CustomButton[] }) =>
    React.createElement(
      'div',
      { 'data-testid': 'action-buttons' },
      buttons.map((button) =>
        React.createElement(
          'button',
          {
            key: button.key,
            onClick: button.onClick,
            'data-testid': `action-button-${button.key}`,
          },
          button.label,
        ),
      ),
    ),
  ProgressIndicator: ({ current, total, suffix }: { current: number; total: number; suffix: string }) =>
    React.createElement('div', { 'data-testid': 'progress-indicator' }, `${current} / ${total} ${suffix}`),
})

// ====================
// FACTORY FUNCTIONS
// ====================

export const createMockButton = (overrides: Partial<CustomButton> = {}): CustomButton => ({
  key: 'default-key',
  label: 'Default Button',
  tooltipText: 'Default tooltip',
  side: 'left',
  onClick: vi.fn(),
  ...overrides,
})

export const createCustomButton = (overrides: Partial<CustomButton> = {}): CustomButton => ({
  key: 'test-button',
  label: 'Test Button',
  tooltipText: 'Test tooltip',
  side: 'left',
  onClick: vi.fn(),
  ...overrides,
})

export const createToolbarWidget = (overrides: Partial<ToolbarWidget> = {}): ToolbarWidget => ({
  key: 'test-widget',
  component: React.createElement('div', { 'data-testid': 'test-widget' }, 'Widget'),
  side: 'left',
  ...overrides,
})

export const createMockCodePanelConfig = (overrides = {}) => ({
  config: { mode: 'unified' as const, ignoreWhitespace: false },
  fileStateMap: new Map(),
  allFileKeys: [],
  getFileState: vi.fn(),
  setViewed: vi.fn(),
  setCollapsed: vi.fn(),
  setAllFileKeys: vi.fn(),
  setConfig: vi.fn(),
  ...overrides,
})

// ====================
// PROGRESS INDICATOR UTILITIES
// ====================

export const createProgressProps = (current: number, total: number, suffix?: string) => ({
  current,
  total,
  suffix,
})

// ====================
// COMMON MOCK SETUPS
// ====================

export const setupAntdMocks = () => {
  vi.mock('antd', () => createAntdMocks())
}

export const setupEnvMocks = () => {
  vi.mock('../../utils/env-utils', () => createEnvUtilsMock())
}

export const setupToolbarMocks = () => {
  vi.mock('./ActionButtons', () => ({
    ActionButtons: createToolbarComponentMocks().ActionButtons,
  }))

  vi.mock('./ProgressIndicator', () => ({
    ProgressIndicator: createToolbarComponentMocks().ProgressIndicator,
  }))
}

// ====================
// BUTTON MATRIX UTILITIES
// ====================

export const createButtonMatrix = () => [
  createMockButton({ key: 'left-1', label: 'Left 1', side: 'left' }),
  createMockButton({ key: 'left-2', label: 'Left 2', side: 'left' }),
  createMockButton({ key: 'right-1', label: 'Right 1', side: 'right' }),
  createMockButton({ key: 'right-2', label: 'Right 2', side: 'right' }),
]
