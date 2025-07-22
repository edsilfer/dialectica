import React from 'react'
import { vi } from 'vitest'

export interface MockMenuItem {
  /** the key of the menu item */
  key?: string
  /** the label of the menu item */
  label?: React.ReactNode
  /** the type of the menu item */
  type?: 'divider'

  /** the function to call when the menu item is clicked */
  onClick?: () => void
}

export interface MockMenuProps {
  /** the items of the menu */
  items?: MockMenuItem[]

  /** the function to call when the menu is clicked */
  onClick?: (info: { key: string }) => void
}

export interface MockDropdownProps {
  /** the children of the dropdown */
  children: React.ReactNode
  /** the menu of the dropdown */
  menu?: MockMenuProps
  /** the trigger of the dropdown */
  trigger?: string[]
  /** the placement of the dropdown */
  placement?: string
  /** the rest of the props */
  [key: string]: unknown
}

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

export const createAntdMocks = () => ({
  ..._antdMocks,
})

export const setupAntdMocks = () => {
  vi.mock('antd', () => createAntdMocks())
}

/* ====================== */
/* PRIVATE IMPLEMENTATION */
/* ====================== */

// Abstracted test element creation for all mocks
function _createTestDiv(type: string, props: Record<string, unknown> = {}, children?: React.ReactNode) {
  // Simulated useStyles system (no real styling in test)
  const { ...rest } = props
  return React.createElement(type, { ...rest }, children)
}

// All private helper mock functions grouped together
const _antdMocks = {
  Progress: (
    () => (props: { percent: number; size: string; showInfo: boolean }) =>
      _createTestDiv('div', {
        'data-testid': 'progress-bar',
        'data-percent': props.percent,
        'data-size': props.size,
        'data-show-info': props.showInfo,
      })
  )(),

  Typography: (() => ({
    Text: (props: { children: React.ReactNode; [key: string]: unknown }) =>
      _createTestDiv('span', { 'data-testid': 'progress-text', ...props }, props.children),
    Title: (props: { children: React.ReactNode; level?: number; [key: string]: unknown }) => {
      const { level = 1, ...rest } = props
      return _createTestDiv(`h${level}`, { 'data-testid': 'typography-title', ...rest }, props.children)
    },
    Link: (props: { children: React.ReactNode; href?: string; [key: string]: unknown }) =>
      _createTestDiv('a', { href: props.href, 'data-testid': 'typography-link', ...props }, props.children),
    Paragraph: (props: { children: React.ReactNode; [key: string]: unknown }) =>
      _createTestDiv('p', { 'data-testid': 'typography-paragraph', ...props }, props.children),
  }))(),

  Tag: (
    () => (props: { children: React.ReactNode; color?: string; [key: string]: unknown }) =>
      _createTestDiv('span', { 'data-testid': 'tag', 'data-color': props.color, ...props }, props.children)
  )(),

  Avatar: (
    () => (props: { src?: string; size?: number; alt?: string; [key: string]: unknown }) =>
      _createTestDiv('img', {
        src: props.src,
        width: props.size,
        height: props.size,
        alt: props.alt,
        'data-testid': 'avatar',
        ...props,
      })
  )(),

  Skeleton: (
    () => (props: { active: boolean; title: boolean; paragraph: { rows: number } }) =>
      _createTestDiv(
        'div',
        {
          'data-testid': 'skeleton',
          'data-active': props.active,
          'data-title': props.title,
          'data-rows': props.paragraph.rows,
        },
        'Loading...',
      )
  )(),

  Button: (
    () =>
    (props: {
      children: React.ReactNode
      onClick?: () => void
      size?: string
      type?: string
      [key: string]: unknown
    }) => {
      const { size, type, ...rest } = props
      const classes = ['ant-btn']
      if (type) classes.push(`ant-btn-${type}`)
      if (size === 'small') classes.push('ant-btn-sm')
      if (size === 'large') classes.push('ant-btn-lg')
      return _createTestDiv(
        'button',
        {
          ...rest,
          className: classes.join(' '),
          'data-size': size,
          'data-type': type,
        },
        props.children,
      )
    }
  )(),

  Input: (() => {
    function InputComponent(props: {
      value?: string
      onChange?: (e: { target: { value: string } }) => void
      placeholder?: string
      [key: string]: unknown
    }) {
      const { value, onChange, placeholder, ...rest } = props
      return _createTestDiv('input', {
        type: 'text',
        value,
        onChange,
        placeholder,
        'data-testid': 'input',
        ...rest,
      })
    }
    function SearchComponent(props: {
      value?: string
      onChange?: (e: { target: { value: string } }) => void
      placeholder?: string
      allowClear?: boolean
      [key: string]: unknown
    }) {
      const { value, onChange, placeholder, allowClear, ...rest } = props
      return _createTestDiv('div', { 'data-testid': 'search-wrapper' }, [
        _createTestDiv('input', {
          key: 'search-input',
          type: 'text',
          value,
          onChange,
          placeholder,
          'data-testid': 'search-input',
          ...rest,
        }),
        allowClear &&
          _createTestDiv(
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
    function TextAreaComponent(
      props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ['data-testid']?: string },
    ) {
      const { children, ['data-testid']: dataTestId = 'textarea', ...rest } = props
      return _createTestDiv('textarea', { 'data-testid': dataTestId, ...rest }, children)
    }
    ;(InputComponent as { TextArea?: typeof TextAreaComponent }).TextArea = TextAreaComponent
    return InputComponent
  })(),

  Space: (() => ({
    Compact: (props: { children: React.ReactNode }) =>
      _createTestDiv('div', { 'data-testid': 'space-compact' }, props.children),
  }))(),

  Checkbox: (
    () =>
    (props: {
      children?: React.ReactNode
      checked?: boolean
      onChange?: (e: { target: { checked: boolean } }) => void
      [key: string]: unknown
    }) =>
      _createTestDiv('label', { 'data-testid': 'checkbox-wrapper', ...props }, [
        _createTestDiv('input', {
          key: 'checkbox-input',
          type: 'checkbox',
          checked: props.checked,
          onChange: props.onChange,
          'data-testid': 'checkbox-input',
        }),
        props.children &&
          _createTestDiv('span', { key: 'checkbox-label', 'data-testid': 'checkbox-label' }, props.children),
      ])
  )(),

  Tooltip: (
    () => (props: { children: React.ReactNode; title?: React.ReactNode; open?: boolean; placement?: string }) => {
      const [isHovered, setIsHovered] = React.useState(false)
      const isVisible = isHovered || props.open
      const tooltipClasses = `ant-tooltip ${isVisible ? '' : 'ant-tooltip-hidden'}`.trim()
      return _createTestDiv(
        'div',
        {
          'data-testid': 'tooltip-wrapper',
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        },
        [
          props.children,
          _createTestDiv(
            'div',
            {
              key: 'tooltip',
              className: tooltipClasses,
              'data-testid': 'tooltip-container',
            },
            _createTestDiv(
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
  )(),

  ConfigProvider: (
    () => (props: { children: React.ReactNode }) =>
      props.children
  )(),

  Dropdown: (() => {
    return (props: MockDropdownProps) => {
      const { children, menu, trigger, ...rest } = props
      return _createTestDiv(
        'div',
        {
          'data-testid': 'dropdown',
          'data-trigger': trigger?.join(',') || '',
          ...rest,
        },
        [
          children,
          _createTestDiv(
            'div',
            {
              key: 'dropdown-menu',
              'data-testid': 'dropdown-menu',
              onClick: () => {
                const firstItem = menu?.items?.find((item) => item?.type !== 'divider')
                if (firstItem?.onClick) {
                  firstItem.onClick()
                } else if (menu?.onClick) {
                  menu.onClick({ key: firstItem?.key || 'copy' })
                }
              },
            },
            menu?.items
              ?.filter((item) => item?.type !== 'divider')
              .map((item) =>
                _createTestDiv(
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
  })(),

  Radio: (() => {
    function RadioComponent(props: {
      children?: React.ReactNode
      value?: string
      checked?: boolean
      disabled?: boolean
      onChange?: (e: { target: { checked: boolean; value: string } }) => void
      [key: string]: unknown
    }) {
      const { children, value, checked, disabled, onChange, ...rest } = props
      return _createTestDiv('label', { 'data-testid': 'radio-wrapper', role: 'radio', ...rest }, [
        _createTestDiv('input', {
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
        children && _createTestDiv('span', { key: 'radio-label', 'data-testid': 'radio-label' }, children),
      ])
    }
    function RadioGroupComponent(props: {
      children?: React.ReactNode
      value?: string
      onChange?: (e: { target: { value: string } }) => void
      [key: string]: unknown
    }) {
      const { children, value, onChange, ...rest } = props
      const handleChange = (childValue: string) => {
        if (onChange) {
          onChange({ target: { value: childValue } })
        }
      }
      const childArray = React.Children.toArray(children).filter((child): child is React.ReactElement =>
        React.isValidElement(child),
      )
      return _createTestDiv(
        'div',
        { 'data-testid': 'radio-group', role: 'radiogroup', ...rest },
        childArray.map((child, index) => {
          if (React.isValidElement(child)) {
            const childProps = child.props as Record<string, unknown>
            if (childProps && typeof childProps === 'object' && 'value' in childProps) {
              const radioValue = typeof childProps.value === 'string' ? childProps.value : ''
              const newProps: React.Attributes & Record<string, unknown> = {
                key: child.key || `radio-${index}`,
                ...childProps,
                checked: radioValue === value,
                onChange: () => handleChange(radioValue),
              }
              return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, newProps)
            }
          }
          return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
            key: child.key || `child-${index}`,
          })
        }),
      )
    }
    ;(RadioComponent as { Group?: typeof RadioGroupComponent }).Group = RadioGroupComponent
    return RadioComponent
  })(),

  Popover: (
    () =>
    (props: {
      children: React.ReactNode
      content?: React.ReactNode
      title?: React.ReactNode
      trigger?: string[]
      open?: boolean
      onOpenChange?: (open: boolean) => void
      placement?: string
      [key: string]: unknown
    }) => {
      const { children, content, title, trigger = ['click'], open, onOpenChange, placement, ...rest } = props
      const [isOpen, setIsOpen] = React.useState(open || false)
      React.useEffect(() => {
        if (open !== undefined) setIsOpen(open)
      }, [open])
      const handleToggle = () => {
        const newOpen = !isOpen
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
      }
      const clonedChildren = React.isValidElement(children)
        ? (() => {
            type ChildProps = { onClick?: React.MouseEventHandler<Element> }
            const originalOnClick = (children.props as ChildProps | undefined)?.onClick
            const newProps: React.Attributes & ChildProps = {
              onClick: trigger.includes('click') ? handleToggle : originalOnClick,
            }
            return React.cloneElement(children as React.ReactElement<ChildProps>, newProps)
          })()
        : children
      return _createTestDiv('div', { 'data-testid': 'popover-wrapper', ...rest }, [
        clonedChildren,
        isOpen &&
          _createTestDiv(
            'div',
            {
              key: 'popover-content',
              'data-testid': 'popover-content',
              'data-placement': placement,
            },
            [
              title && _createTestDiv('div', { key: 'popover-title', 'data-testid': 'popover-title' }, title),
              _createTestDiv('div', { key: 'popover-inner', 'data-testid': 'popover-inner' }, content),
            ],
          ),
      ])
    }
  )(),

  Divider: (
    () =>
    (props: {
      children?: React.ReactNode
      orientation?: 'left' | 'right' | 'center'
      orientationMargin?: string | number
      [key: string]: unknown
    }) => {
      const { orientation, orientationMargin, ...rest } = props
      return _createTestDiv(
        'div',
        {
          ...rest,
          'data-testid': 'divider',
          'data-orientation': orientation,
          'data-orientation-margin': orientationMargin,
          role: 'separator',
        },
        props.children,
      )
    }
  )(),

  theme: (() => ({
    darkAlgorithm: 'dark-algorithm',
    defaultAlgorithm: 'default-algorithm',
    useToken: vi.fn().mockReturnValue({
      token: {
        colorBgContainer: '#ffffff',
        colorText: '#000000',
        borderRadius: 6,
      },
    }),
  }))(),

  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}
