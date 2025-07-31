import React from 'react'
import { ArrowRightOutlined, SettingOutlined } from '@ant-design/icons'
import { ThemeContext, ThemeTokens } from '@commons'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import { useContext } from 'react'
import { SlideWrapper } from '../../pages/Landing'
import useSharedStyles from './shared-styles'

const { Title, Paragraph, Text } = Typography

const useStyles = (theme: ThemeTokens) => {
  return {
    button: css`
      height: 40px;
      min-width: 230px;
      margin-bottom: ${theme.spacing.md};
    `,
  }
}

interface GetStartedSlideProps {
  /** The ref to the section element */
  innerRef: React.RefObject<HTMLElement | null>
  /** The function to call when the user clicks the proceed button */
  proceed: () => void
  /** The function to call when the user clicks the settings button */
  openSettings: () => void
}

export default function GetStartedSlide({ innerRef, proceed, openSettings }: GetStartedSlideProps) {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)

  return (
    <SlideWrapper>
      <section ref={innerRef}>
        <div css={sharedStyles.feature}>
          <div css={sharedStyles.featureText('75%', false)} style={{ alignItems: 'flex-start' }}>
            <Title css={sharedStyles.title}>Get Started</Title>

            <Paragraph css={sharedStyles.subtitle}>
              Interactive demo (no backend required)
              <Paragraph>
                Run entirely in the browser with mocked data. Use overlays, comments, themes, and file browsing.
              </Paragraph>
            </Paragraph>

            <Paragraph css={sharedStyles.subtitle}>
              Connect your GitHub
              <Paragraph>
                Use your own token to review any public PR on GitHub. Load it instantly via URL or file explorer.
              </Paragraph>
            </Paragraph>

            <Paragraph css={sharedStyles.subtitle}>
              URL-powered loading
              <Paragraph>
                You can deep-link into a PR using:{' '}
                <Text code>/?owner=&lt;user&gt;&amp;repo=&lt;repo&gt;&amp;pull=&lt;number&gt;</Text>
              </Paragraph>
            </Paragraph>
          </div>

          <div css={sharedStyles.featureComponent('25%')}>
            <Button css={styles.button} type="primary" icon={<ArrowRightOutlined />} onClick={proceed}>
              Proceed with mocked data
            </Button>
            <Button css={styles.button} icon={<SettingOutlined />} onClick={openSettings}>
              Settings
            </Button>
          </div>
        </div>
      </section>
    </SlideWrapper>
  )
}
