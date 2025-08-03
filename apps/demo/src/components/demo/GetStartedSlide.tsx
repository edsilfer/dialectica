import { ArrowRightOutlined, SettingOutlined } from '@ant-design/icons'
import { ThemeContext, ThemeTokens } from '@edsilfer/diff-viewer'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import React, { useCallback, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../hooks/use-settings'
import { useUrl } from '../../hooks/use-url'
import { SlideWrapper } from '../../pages/Welcome'
import SettingsModal from '../settings/modals/SettingsModal'
import useSharedStyles from './shared-styles'

const { Title, Paragraph, Text } = Typography

const useStyles = (theme: ThemeTokens) => {
  return {
    container: css`
      text-align: right;

      * {
        font-size: 1.2rem;
      }

      @media (max-width: 768px) {
        padding: ${theme.spacing.lg};
        * {
          font-size: 1rem;
        }
      }
    `,

    button: css`
      height: 40px;
      min-width: 350px;
      margin-bottom: ${theme.spacing.md};

      @media (max-width: 768px) {
        min-width: 250px;
      }
    `,
  }
}

export default function GetStartedSlide({ innerRef }: { innerRef: React.RefObject<HTMLElement | null> }) {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { setPrUrl } = useUrl([])
  const { setEnableTutorial, setUseMocks } = useSettings()
  const navigate = useNavigate()

  const handleProceed = useCallback(() => {
    const owner = 'facebook'
    const repo = 'react'
    const pullNumber = 33665

    setPrUrl({ owner, repo, pullNumber })
    setUseMocks(true)
    setEnableTutorial(false)

    const searchParams = new URLSearchParams({
      owner,
      repo,
      pull: pullNumber.toString(),
    })

    void navigate(`/?${searchParams.toString()}`)
  }, [setEnableTutorial, setPrUrl, setUseMocks, navigate])

  const handleSettings = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  return (
    <SlideWrapper>
      <section ref={innerRef} style={{ height: '100%', width: '100%' }}>
        <div css={[sharedStyles.featureSlide('primary'), styles.container]}>
          <div css={sharedStyles.featureLeft('70%', 'secondary', { topRight: true, bottomRight: true })}>
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
                You can deep-link into a PR using: <br />
                <Text code>/?owner=&lt;user&gt;&amp;repo=&lt;repo&gt;&amp;pull=&lt;number&gt;</Text>
              </Paragraph>
            </Paragraph>
          </div>

          <div css={sharedStyles.featureRight('30%')}>
            <Button css={styles.button} type="primary" icon={<ArrowRightOutlined />} onClick={handleProceed}>
              Proceed with mocked data
            </Button>
            <Button css={styles.button} icon={<SettingOutlined />} onClick={handleSettings}>
              Settings
            </Button>
          </div>
        </div>

        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </section>
    </SlideWrapper>
  )
}
