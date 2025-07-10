import React from 'react'
import { vi } from 'vitest'
import type { CodePanelConfigContextState } from '../../components/code-panel/providers/types'
import type { CustomButton, ToolbarWidget } from '../../addons/toolbar/types'

export const createAntdMocks = () => ({
  Progress: _mockProgress(),
  Typography: _mockTypography(),
  Tag: _mockTag(),
  Avatar: _mockAvatar(),
  Skeleton: _mockSkeleton(),
  Button: _mockButton(),
  Input: _mockInput(),
  Space: _mockSpace(),
  Tooltip: _mockTooltip(),
  Checkbox: _mockCheckbox(),
  ConfigProvider: _mockConfigProvider(),
  theme: _mockTheme(),
})

/**
 * Creates a mock CustomButton with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock CustomButton with default values and optional overrides
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
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock ToolbarWidget with default values and optional overrides
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
 * Creates a mock code panel configuration with default values and optional overrides
 *
 * @param overrides - Optional overrides for the default values
 * @returns           A mock code panel configuration with default values and optional overrides
 */
export const createMockCodePanelConfig = (
  overrides: Partial<CodePanelConfigContextState> = {},
): CodePanelConfigContextState => {
  const defaults: CodePanelConfigContextState = {
    config: { mode: 'unified' as const, ignoreWhitespace: false },
    fileStateMap: new Map(),
    allFileKeys: [],
    getFileState: vi.fn().mockReturnValue({ isCollapsed: false, isViewed: false }),
    setViewed: vi.fn(),
    setCollapsed: vi.fn(),
    setAllFileKeys: vi.fn(),
    setConfig: vi.fn(),
  }

  return { ...defaults, ...overrides }
}

/**
 * Creates a test set of buttons for both left and right sides
 * Useful for testing layouts that handle multiple buttons
 *
 * @returns A matrix of test buttons for both left and right sides
 */
export const createButtonMatrix = (): CustomButton[] => [
  createCustomButton({ key: 'left-1', label: 'Left 1', side: 'left' }),
  createCustomButton({ key: 'left-2', label: 'Left 2', side: 'left' }),
  createCustomButton({ key: 'right-1', label: 'Right 1', side: 'right' }),
  createCustomButton({ key: 'right-2', label: 'Right 2', side: 'right' }),
]

/**
 * Creates props for progress components with current/total pattern
 *
 * @param current - The current value
 * @param total - The total value
 * @param suffix - Optional suffix for the progress bar
 * @returns       A progress component props with current/total pattern
 */
export const createProgressProps = (current: number, total: number, suffix?: string) => ({
  current,
  total,
  suffix,
})

/**
 * Sets up the Ant Design mocks
 */
export const setupAntdMocks = () => {
  vi.mock('antd', () => createAntdMocks())
}

/* ====================== */
/* PRIVATE IMPLEMENTATION */
/* ====================== */

const _createTestElement = (type: string, props?: Record<string, unknown>, children?: React.ReactNode) =>
  React.createElement(type, props, children)

const _mockProgress = () => (props: { percent: number; size: string; showInfo: boolean }) =>
  _createTestElement('div', {
    'data-testid': 'progress-bar',
    'data-percent': props.percent,
    'data-size': props.size,
    'data-show-info': props.showInfo,
  })

const _mockTypography = () => ({
  Text: (props: { children: React.ReactNode; [key: string]: unknown }) => {
    const { children, ...restProps } = props
    return _createTestElement('span', { 'data-testid': 'progress-text', ...restProps }, children)
  },

  Title: (props: { children: React.ReactNode; level?: number; [key: string]: unknown }) => {
    const { children, level = 1, ...restProps } = props
    return _createTestElement(`h${level}`, { 'data-testid': 'typography-title', ...restProps }, children)
  },

  Link: (props: { children: React.ReactNode; href?: string; [key: string]: unknown }) => {
    const { children, href, ...restProps } = props
    return _createTestElement('a', { href, 'data-testid': 'typography-link', ...restProps }, children)
  },
})

const _mockTag = () => (props: { children: React.ReactNode; color?: string; [key: string]: unknown }) => {
  const { children, color, ...restProps } = props
  return _createTestElement('span', { 'data-testid': 'tag', 'data-color': color, ...restProps }, children)
}

const _mockAvatar = () => (props: { src?: string; size?: number; alt?: string; [key: string]: unknown }) => {
  const { src, size, alt, ...restProps } = props
  return _createTestElement('img', { src, width: size, height: size, alt, 'data-testid': 'avatar', ...restProps })
}

const _mockSkeleton = () => (props: { active: boolean; title: boolean; paragraph: { rows: number } }) =>
  _createTestElement(
    'div',
    {
      'data-testid': 'skeleton',
      'data-active': props.active,
      'data-title': props.title,
      'data-rows': props.paragraph.rows,
    },
    'Loading...',
  )

const _mockButton =
  () =>
  (props: {
    children: React.ReactNode
    onClick?: () => void
    size?: string
    type?: string
    [key: string]: unknown
  }) => {
    const { children, onClick, size, type, ...restProps } = props

    // Generate Ant Design-like CSS classes
    const classes = ['ant-btn']
    if (type) classes.push(`ant-btn-${type}`)
    if (size === 'small') classes.push('ant-btn-sm')
    if (size === 'large') classes.push('ant-btn-lg')

    return _createTestElement(
      'button',
      {
        onClick,
        className: classes.join(' '),
        'data-size': size,
        'data-type': type,
        ...restProps,
      },
      children,
    )
  }

const _mockInput = () => {
  const InputComponent = (props: {
    value?: string
    onChange?: (e: { target: { value: string } }) => void
    placeholder?: string
    [key: string]: unknown
  }) => {
    const { value, onChange, placeholder, ...restProps } = props
    return _createTestElement('input', {
      type: 'text',
      value,
      onChange,
      placeholder,
      'data-testid': 'input',
      ...restProps,
    })
  }

  const SearchComponent = (props: {
    value?: string
    onChange?: (e: { target: { value: string } }) => void
    placeholder?: string
    allowClear?: boolean
    [key: string]: unknown
  }) => {
    const { value, onChange, placeholder, allowClear, ...restProps } = props

    return _createTestElement('div', { 'data-testid': 'search-wrapper' }, [
      _createTestElement('input', {
        key: 'search-input',
        type: 'text',
        value,
        onChange,
        placeholder,
        'data-testid': 'search-input',
        ...restProps,
      }),
      allowClear &&
        _createTestElement(
          'button',
          {
            key: 'clear-button',
            'aria-label': 'Clear',
            'data-testid': 'clear-button',
            onClick: () => onChange?.({ target: { value: '' } }),
          },
          '×',
        ),
    ])
  }

  InputComponent.Search = SearchComponent
  return InputComponent
}

const _mockSpace = () => ({
  Compact: (props: { children: React.ReactNode }) =>
    _createTestElement('div', { 'data-testid': 'space-compact' }, props.children),
})

const _mockCheckbox =
  () =>
  (props: {
    children?: React.ReactNode
    checked?: boolean
    onChange?: (e: { target: { checked: boolean } }) => void
    [key: string]: unknown
  }) => {
    const { children, checked, onChange, ...restProps } = props
    return _createTestElement('label', { 'data-testid': 'checkbox-wrapper', ...restProps }, [
      _createTestElement('input', {
        type: 'checkbox',
        checked,
        onChange,
        'data-testid': 'checkbox-input',
      }),
      children && _createTestElement('span', { 'data-testid': 'checkbox-label' }, children),
    ])
  }

const _mockTooltip = () => {
  return (props: { children: React.ReactNode; title?: React.ReactNode; open?: boolean; placement?: string }) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const isVisible = isHovered || props.open

    // Mimic antd's DOM structure and visibility classes
    const tooltipClasses = `ant-tooltip ${isVisible ? '' : 'ant-tooltip-hidden'}`.trim()

    return _createTestElement(
      'div',
      {
        'data-testid': 'tooltip-wrapper',
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      },
      [
        props.children,
        _createTestElement(
          'div',
          {
            key: 'tooltip',
            className: tooltipClasses,
            'data-testid': 'tooltip-container',
          },
          _createTestElement(
            'div',
            {
              className: 'ant-tooltip-inner',
              'data-testid': 'tooltip-content',
            },
            props.title,
          ),
        ),
      ],
    )
  }
}

const _mockConfigProvider = () => (props: { children: React.ReactNode }) => props.children

const _mockTheme = () => ({
  darkAlgorithm: 'dark-algorithm',
  defaultAlgorithm: 'default-algorithm',
})
