import React from 'react'
import { vi } from 'vitest'
import type { CustomButton, ToolbarWidget } from '../../optional/toolbar/types'

/* ==============================
 * PUBLIC API - MOCK CREATORS
 * ============================== */

export const createAntdMocks = () => ({
  Progress: createProgressMock(),
  Typography: createTypographyMocks(),
  Tag: createTagMock(),
  Avatar: createAvatarMock(),
  Skeleton: createSkeletonMock(),
  Button: createButtonMock(),
  Space: createSpaceMocks(),
  Tooltip: createTooltipMock(),
  ConfigProvider: createConfigProviderMock(),
  theme: createThemeMock(),
})

export const createEnvUtilsMock = () => ({
  isProduction: () => false,
})

export const createToolbarComponentMocks = () => ({
  ActionButtons: createActionButtonsMock(),
  ProgressIndicator: createProgressIndicatorMock(),
})

/* ==============================
 * PUBLIC API - FACTORY FUNCTIONS
 * ============================== */

/**
 * Creates a mock CustomButton with default values and optional overrides
 */
export const createCustomButton = (overrides: Partial<CustomButton> = {}): CustomButton => {
  const defaults: CustomButton = {
    key: 'test-button',
    label: 'Test Button',
    tooltipText: 'Test tooltip',
    side: 'left',
    onClick: vi.fn(),
  }

  return { ...defaults, ...overrides }
}

/**
 * Creates a mock ToolbarWidget with default values and optional overrides
 */
export const createToolbarWidget = (overrides: Partial<ToolbarWidget> = {}): ToolbarWidget => {
  const defaults: ToolbarWidget = {
    key: 'test-widget',
    component: React.createElement('div', { 'data-testid': 'test-widget' }, 'Widget'),
    side: 'left',
  }

  return { ...defaults, ...overrides }
}

/**
 * Creates a mock code panel configuration
 */
export const createMockCodePanelConfig = (overrides = {}) => {
  const defaults = {
    config: { mode: 'unified' as const, ignoreWhitespace: false },
    fileStateMap: new Map(),
    allFileKeys: [],
    getFileState: vi.fn(),
    setViewed: vi.fn(),
    setCollapsed: vi.fn(),
    setAllFileKeys: vi.fn(),
    setConfig: vi.fn(),
  }

  return { ...defaults, ...overrides }
}

/**
 * Creates a matrix of test buttons for different sides
 */
export const createButtonMatrix = () => [
  createCustomButton({ key: 'left-1', label: 'Left 1', side: 'left' }),
  createCustomButton({ key: 'left-2', label: 'Left 2', side: 'left' }),
  createCustomButton({ key: 'right-1', label: 'Right 1', side: 'right' }),
  createCustomButton({ key: 'right-2', label: 'Right 2', side: 'right' }),
]

/**
 * Creates progress component props
 */
export const createProgressProps = (current: number, total: number, suffix?: string) => ({
  current,
  total,
  suffix,
})

/* ==============================
 * PUBLIC API - SETUP FUNCTIONS
 * ============================== */

export const setupAntdMocks = () => {
  vi.mock('antd', () => createAntdMocks())
}

export const setupEnvMocks = () => {
  vi.mock('../../utils/env-utils', () => createEnvUtilsMock())
}

export const setupToolbarMocks = () => {
  const mocks = createToolbarComponentMocks()

  vi.mock('./ActionButtons', () => ({
    ActionButtons: mocks.ActionButtons,
  }))

  vi.mock('./ProgressIndicator', () => ({
    ProgressIndicator: mocks.ProgressIndicator,
  }))
}

/* ==============================
 * PRIVATE IMPLEMENTATION - COMPONENT MOCKS
 * ============================== */

const createProgressMock = () => (props: { percent: number; size: string; showInfo: boolean }) =>
  createTestElement('div', {
    'data-testid': 'progress-bar',
    'data-percent': props.percent,
    'data-size': props.size,
    'data-show-info': props.showInfo,
  })

const createTypographyMocks = () => ({
  Text: (props: { children: React.ReactNode; [key: string]: unknown }) => {
    const { children, ...restProps } = props
    return createTestElement('span', { 'data-testid': 'progress-text', ...restProps }, children)
  },

  Title: (props: { children: React.ReactNode; level?: number; [key: string]: unknown }) => {
    const { children, level = 1, ...restProps } = props
    return createTestElement(`h${level}`, { 'data-testid': 'typography-title', ...restProps }, children)
  },

  Link: (props: { children: React.ReactNode; href?: string; [key: string]: unknown }) => {
    const { children, href, ...restProps } = props
    return createTestElement('a', { href, 'data-testid': 'typography-link', ...restProps }, children)
  },
})

const createTagMock = () => (props: { children: React.ReactNode; color?: string; [key: string]: unknown }) => {
  const { children, color, ...restProps } = props
  return createTestElement('span', { 'data-testid': 'tag', 'data-color': color, ...restProps }, children)
}

const createAvatarMock = () => (props: { src?: string; size?: number; alt?: string; [key: string]: unknown }) => {
  const { src, size, alt, ...restProps } = props
  return createTestElement('img', { src, width: size, height: size, alt, 'data-testid': 'avatar', ...restProps })
}

const createSkeletonMock = () => (props: { active: boolean; title: boolean; paragraph: { rows: number } }) =>
  createTestElement(
    'div',
    {
      'data-testid': 'skeleton',
      'data-active': props.active,
      'data-title': props.title,
      'data-rows': props.paragraph.rows,
    },
    'Loading...',
  )

const createButtonMock =
  () => (props: { children: React.ReactNode; onClick?: () => void; size?: string; [key: string]: unknown }) => {
    const { children, onClick, size, ...restProps } = props
    return createTestElement('button', { onClick, 'data-size': size, ...restProps }, children)
  }

const createSpaceMocks = () => ({
  Compact: (props: { children: React.ReactNode }) =>
    createTestElement('div', { 'data-testid': 'space-compact' }, props.children),
})

const createTooltipMock = () => {
  return (props: { children: React.ReactNode; title?: React.ReactNode; open?: boolean; placement?: string }) => {
    const [showTooltip, setShowTooltip] = React.useState(false)
    const shouldShowTooltip = showTooltip || props.open

    return createTestElement(
      'div',
      {
        'data-testid': 'tooltip-wrapper',
        'data-placement': props.placement,
        'data-open': props.open,
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
      },
      [
        props.children,
        shouldShowTooltip &&
          props.title &&
          createTestElement(
            'div',
            {
              key: 'tooltip-content',
              'data-testid': 'tooltip-content',
            },
            props.title,
          ),
      ],
    )
  }
}

const createConfigProviderMock = () => (props: { children: React.ReactNode }) => props.children

const createThemeMock = () => ({
  darkAlgorithm: 'dark-algorithm',
  defaultAlgorithm: 'default-algorithm',
})

const createActionButtonsMock = () => (props: { buttons: CustomButton[] }) =>
  createTestElement(
    'div',
    { 'data-testid': 'action-buttons' },
    props.buttons.map((button) =>
      createTestElement(
        'button',
        {
          key: button.key,
          onClick: button.onClick,
          'data-testid': `action-button-${button.key}`,
        },
        button.label,
      ),
    ),
  )

const createProgressIndicatorMock = () => (props: { current: number; total: number; suffix: string }) =>
  createTestElement('div', { 'data-testid': 'progress-indicator' }, `${props.current} / ${props.total} ${props.suffix}`)

const createTestElement = (type: string, props?: Record<string, unknown>, children?: React.ReactNode) =>
  React.createElement(type, props, children)
