import { ThemeTokens, useTheme } from '@edsilfer/commons'
import { css } from '@emotion/react'
import { Typography } from 'antd'
import React from 'react'
import Setting from './Setting'
import { SettingsSectionProps } from './types'

const { Title, Text } = Typography

const useStyles = (theme: ThemeTokens) => ({
  sectionTitle: css`
    color: ${theme.colors.textPrimary} !important;
    padding: 0 !important;
    margin: 0 !important;
  `,

  description: css`
    color: ${theme.colors.textPrimary} !important;
  `,

  group: css`
    display: flex;
    flex-direction: column;
  `,

  setting: css`
    margin-top: ${theme.spacing.sm};
  `,
})

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, settings }) => {
  const theme = useTheme()
  const styles = useStyles(theme)

  return (
    <div css={styles.group}>
      <Title level={4} css={styles.sectionTitle}>
        {title}
      </Title>
      {description && <Text css={styles.description}>{description}</Text>}

      {settings.map((setting, idx) => (
        <Setting key={idx} css={styles.setting} {...setting} />
      ))}
    </div>
  )
}

export default SettingsSection
