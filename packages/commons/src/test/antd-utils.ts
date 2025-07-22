import React from 'react'
import { vi } from 'vitest'
import { CustomButton } from '../components/buttons/ActionButtons'

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
  Dropdown: _mockDropdown(),
  Radio: _mockRadio(),
  Popover: _mockPopover(),
  Divider: _mockDivider(),
  theme: _mockTheme(),
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

  Paragraph: (props: { children: React.ReactNode; [key: string]: unknown }) => {
    const { children, ...restProps } = props
    return _createTestElement('p', { 'data-testid': 'typography-paragraph', ...restProps }, children)
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
  const TextAreaComponent = (
    props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ['data-testid']?: string },
  ) => {
    const { children, ['data-testid']: dataTestId = 'textarea', ...rest } = props
    return _createTestElement('textarea', { 'data-testid': dataTestId, ...rest }, children)
  }

  ;(InputComponent as unknown as { TextArea: typeof TextAreaComponent }).TextArea = TextAreaComponent
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

interface MockMenuItem {
  key?: string
  label?: React.ReactNode
  onClick?: () => void
  type?: 'divider'
}

interface MockMenuProps {
  items?: MockMenuItem[]
  onClick?: (info: { key: string }) => void
}

interface MockDropdownProps {
  children: React.ReactNode
  menu?: MockMenuProps
  trigger?: string[]
  placement?: string
  [key: string]: unknown
}

const _mockDropdown = () => (props: MockDropdownProps) => {
  const { children, menu, trigger, ...restProps } = props
  return _createTestElement(
    'div',
    {
      'data-testid': 'dropdown',
      'data-trigger': trigger?.join(',') || '',
      ...restProps,
    },
    [
      children,
      _createTestElement(
        'div',
        {
          key: 'dropdown-menu',
          'data-testid': 'dropdown-menu',
          // For legacy support: if dropdown-menu is clicked directly, trigger the first menu item's onClick
          onClick: () => {
            const firstItem = menu?.items?.find((item) => item?.type !== 'divider')
            if (firstItem?.onClick) {
              firstItem.onClick()
            } else if (menu?.onClick) {
              // Handle MenuProps onClick pattern (like in FSNode)
              menu.onClick({ key: firstItem?.key || 'copy' })
            }
          },
        },
        menu?.items
          ?.filter((item) => item?.type !== 'divider')
          .map((item) =>
            _createTestElement(
              'div',
              {
                key: item.key ?? (typeof item.label === 'string' ? item.label : 'menu-item'),
                onClick: () => {
                  if (item.onClick) {
                    item.onClick()
                  } else if (menu?.onClick && item.key) {
                    menu.onClick({ key: item.key })
                  }
                },
                'data-testid': 'dropdown-menu-item',
              },
              item.label,
            ),
          ),
      ),
    ],
  )
}

const _mockRadio = () => {
  const RadioComponent = (props: {
    children?: React.ReactNode
    value?: string
    checked?: boolean
    disabled?: boolean
    onChange?: (e: { target: { checked: boolean; value: string } }) => void
    [key: string]: unknown
  }) => {
    const { children, value, checked, disabled, onChange, ...restProps } = props
    return _createTestElement('label', { 'data-testid': 'radio-wrapper', role: 'radio', ...restProps }, [
      _createTestElement('input', {
        key: 'radio-input',
        type: 'radio',
        value,
        checked,
        disabled,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
          onChange?.({ target: { checked: e.target.checked, value: e.target.value || value || '' } }),
        'data-testid': 'radio-input',
        'aria-disabled': disabled,
      }),
      children && _createTestElement('span', { key: 'radio-label', 'data-testid': 'radio-label' }, children),
    ])
  }

  const RadioGroupComponent = (props: {
    children?: React.ReactNode
    value?: string
    onChange?: (e: { target: { value: string } }) => void
    [key: string]: unknown
  }) => {
    const { children, value, onChange, ...restProps } = props

    const handleChange = (childValue: string) => {
      if (onChange) {
        onChange({ target: { value: childValue } })
      }
    }

    const processChild = (child: React.ReactElement, index: number) => {
      if (React.isValidElement(child)) {
        // Check if it's a Radio component by checking the value prop with proper type safety
        const childProps = child.props as Record<string, unknown>
        if (childProps && typeof childProps === 'object' && 'value' in childProps) {
          const radioValue = typeof childProps.value === 'string' ? childProps.value : ''
          const newProps: React.Attributes & Record<string, unknown> = {
            key: child.key || `radio-${index}`,
            ...childProps,
            checked: radioValue === value,
            onChange: () => handleChange(radioValue),
          }

          // Clone the element with the newly constructed props, explicitly typing the props to avoid `any`
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, newProps)
        }
      }
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        key: child.key || `child-${index}`,
      })
    }

    const childArray = React.Children.toArray(children).filter((child): child is React.ReactElement =>
      React.isValidElement(child),
    )

    return _createTestElement(
      'div',
      { 'data-testid': 'radio-group', role: 'radiogroup', ...restProps },
      childArray.map(processChild),
    )
  }

  RadioComponent.Group = RadioGroupComponent
  return RadioComponent
}

const _mockPopover = () => {
  return (props: {
    children: React.ReactNode
    content?: React.ReactNode
    title?: React.ReactNode
    trigger?: string[]
    open?: boolean
    onOpenChange?: (open: boolean) => void
    placement?: string
    [key: string]: unknown
  }) => {
    const { children, content, title, trigger = ['click'], open, onOpenChange, placement, ...restProps } = props
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open)
      }
    }, [open])

    const handleToggle = () => {
      const newOpen = !isOpen
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    }

    const clonedChildren = React.isValidElement(children)
      ? (() => {
          // Safely extract the original onClick handler (if any) in a typed manner
          type ChildProps = { onClick?: React.MouseEventHandler<Element> }

          const originalOnClick = (children.props as ChildProps | undefined)?.onClick

          const newProps: React.Attributes & ChildProps = {
            onClick: trigger.includes('click') ? handleToggle : originalOnClick,
          }

          return React.cloneElement(children as React.ReactElement<ChildProps>, newProps)
        })()
      : children

    return _createTestElement('div', { 'data-testid': 'popover-wrapper', ...restProps }, [
      clonedChildren,
      isOpen &&
        _createTestElement(
          'div',
          {
            key: 'popover-content',
            'data-testid': 'popover-content',
            'data-placement': placement,
          },
          [
            title && _createTestElement('div', { key: 'popover-title', 'data-testid': 'popover-title' }, title),
            _createTestElement('div', { key: 'popover-inner', 'data-testid': 'popover-inner' }, content),
          ],
        ),
    ])
  }
}

const _mockDivider = () => {
  return (props: {
    children?: React.ReactNode
    orientation?: 'left' | 'right' | 'center'
    orientationMargin?: string | number
    [key: string]: unknown
  }) => {
    const { children, orientation, orientationMargin, ...restProps } = props
    return _createTestElement(
      'div',
      {
        'data-testid': 'divider',
        'data-orientation': orientation,
        'data-orientation-margin': orientationMargin,
        role: 'separator',
        ...restProps,
      },
      children,
    )
  }
}

const _mockTheme = () => ({
  darkAlgorithm: 'dark-algorithm',
  defaultAlgorithm: 'default-algorithm',
  useToken: vi.fn().mockReturnValue({
    token: {
      colorBgContainer: '#ffffff',
      colorText: '#000000',
      borderRadius: 6,
    },
  }),
})
