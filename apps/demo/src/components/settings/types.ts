import type React from 'react'

export type SettingType = 'switch' | 'checkbox' | 'input' | 'select'

/**
 * Base interface that extracts the common fields shared by all setting configurations.
 *
 * @template T The concrete `type` literal for the specific setting (e.g. "switch").
 * @template V The value type handled by the setting.
 */
interface BaseSettingProps<T extends SettingType, V> {
  /** The concrete type discriminator for the setting implementation */
  type: T
  /** The label to display alongside the setting */
  label: string
  /** Optional description that gives more context to the user */
  description?: string
  /** Optional classname forwarded to the outermost element of the rendered setting */
  className?: string
  /** Optional emotion CSS applied to the outermost element of the rendered setting */
  css?: ReturnType<typeof import('@emotion/react').css>
  /** Callback fired whenever the setting value changes */
  onChange: (value: V) => void
}

export interface SettingsModalProps {
  /** Whether the modal is open */
  open: boolean
  /** The function to call when the modal is closed */
  onClose: () => void
}

export interface SettingsSectionProps {
  /** The title of the section */
  title: string
  /** The description of the section */
  description?: string
  /** The settings to display in the section */
  settings: SettingConfig[]
}

export interface SwitchSettingProps extends BaseSettingProps<'switch', boolean> {
  /** The current state of the switch */
  checked: boolean
}

export interface CheckboxSettingProps extends BaseSettingProps<'checkbox', boolean> {
  /** The current state of the checkbox */
  checked: boolean
}

export interface InputSettingProps extends BaseSettingProps<'input', string> {
  /** The current value inside the input */
  value: string
  /** The HTML input type (e.g., text, number, password). Defaults to "text" */
  inputType?: React.HTMLInputTypeAttribute
  /** The placeholder text to display inside the input */
  placeholder?: string
}

export interface SelectSettingProps extends BaseSettingProps<'select', string> {
  /** The currently selected value */
  value: string
  /** Available options for the select component */
  options: { value: string; label: string }[]
  /** Custom CSS-in-JS styles (emotion) */
  selectCss?: ReturnType<typeof import('@emotion/react').css>
}

export type SettingConfig = SwitchSettingProps | CheckboxSettingProps | InputSettingProps | SelectSettingProps
