import { ThemeTokens, useTheme } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import { Input, Select, Switch, Typography } from 'antd'
import React from 'react'
import { SettingConfig } from './types'

const { Text } = Typography

const useStyles = (theme: ThemeTokens) => ({
  container: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.spacing.sm};
  `,
  selectContainer: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.spacing.xs};
  `,
  textContainer: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing.xs};
  `,
  switchContainer: css`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.spacing.sm};
  `,
  label: css`
    font-weight: 500;
  `,
  description: css`
    opacity: 0.8;
    font-size: 0.8em;
    line-height: 1.2;
  `,
  select: css`
    width: 200px;
  `,
})

const Setting: React.FC<SettingConfig> = (config) => {
  const theme = useTheme()
  const styles = useStyles(theme)

  switch (config.type) {
    case 'switch':
      return (
        <div css={[styles.switchContainer, config.css]} className={config.className}>
          <Switch checked={config.checked} onChange={config.onChange} size="small" />
          <div css={styles.textContainer}>
            <Text css={styles.label}>{config.label}</Text>
            {config.description && <Text css={styles.description}>{config.description}</Text>}
          </div>
        </div>
      )
    case 'checkbox':
      return (
        <div css={[styles.switchContainer, config.css]} className={config.className}>
          <Switch
            checked={config.checked}
            onChange={config.onChange}
            size="small"
            checkedChildren="✓"
            unCheckedChildren="✗"
          />
          <div css={styles.textContainer}>
            <Text css={styles.label}>{config.label}</Text>
            {config.description && <Text css={styles.description}>{config.description}</Text>}
          </div>
        </div>
      )
    case 'input':
      return (
        <div css={[styles.container, config.css]} className={config.className}>
          <div css={styles.textContainer}>
            <Text css={styles.label}>{config.label}</Text>
            {config.description && <Text css={styles.description}>{config.description}</Text>}
          </div>
          <Input
            type={config.inputType ?? 'text'}
            value={config.value}
            placeholder={config.placeholder}
            onChange={(e) => config.onChange(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>
      )
    case 'select':
      return (
        <div css={[styles.selectContainer, config.css]} className={config.className}>
          <div css={styles.textContainer}>
            <Text css={styles.label}>{config.label}</Text>
            {config.description && <Text css={styles.description}>{config.description}</Text>}
          </div>
          <Select
            css={config.selectCss ?? styles.select}
            value={config.value}
            onChange={config.onChange}
            options={config.options}
            size="small"
          />
        </div>
      )
    default:
      return null
  }
}

export default Setting
