import { ArrowRightOutlined } from '@ant-design/icons'
import { ThemeContext, ThemeTokens } from '@edsilfer/diff-viewer'
import { GitHubIcon } from '@edsilfer/commons'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import { useContext } from 'react'
import MockedDiffViewer from './mocks/MockedDiffViewer'
import useSharedStyles from './shared-styles'
import ThemeSelector from './ThemeSelector'

const { Title, Paragraph } = Typography

const useStyles = (theme: ThemeTokens) => {
  return {
    container: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing.md};
      align-items: center;
      width: 100%;
      height: 100%;
      justify-content: center;
      position: relative;
      background: linear-gradient(to bottom, transparent 45%, ${theme.colors.backgroundContainer} 55%);

      @media (max-width: 768px) {
        flex-direction: column-reverse !important;
      }
    `,

    textContainer: css`
      display: flex;
      flex-direction: column;
      padding: ${theme.spacing.sm};
      align-items: center;
      justify-content: center;

      @media (max-width: 768px) {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        text-align: center;
      }
    `,

    buttonsContainer: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing.sm};
      margin-top: ${theme.spacing.md};
    `,

    diffViewer: css`
      margin: ${theme.spacing.md} 0;
      height: 75%;
      width: 60%;
      transition: filter 0.3s;

      @media (min-width: 1920px) {
        width: 50%;
      }

      @media (max-width: 768px) {
        width: 100%;
        height: 100%;
        pointer-events: none;
        filter: blur(3px) brightness(0.8); /* Darkens the background slightly */
      }
    `,
  }
}

export default function IntroSlide({ onContinue }: { onContinue: () => void }) {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)

  const repoURL = 'https://github.com/edsilfer/dialectica/tree/main/packages/diff-viewer'

  return (
    <section css={sharedStyles.slide}>
      <div css={styles.container}>
        <MockedDiffViewer css={styles.diffViewer} />

        <div css={styles.textContainer}>
          <Title css={sharedStyles.title}>Dialetica Diff Viewer</Title>

          <Paragraph css={sharedStyles.subtitle} style={{ textAlign: 'center' }}>
            A powerful, composable diff viewer React libary
          </Paragraph>

          <div css={styles.buttonsContainer}>
            <Button type="primary" css={sharedStyles.pillButton} icon={<ArrowRightOutlined />} onClick={onContinue}>
              Continue with mocks
            </Button>
            <Button
              css={sharedStyles.pillButton}
              icon={<GitHubIcon style={{ fontSize: 18 }} />}
              onClick={() => window.open(repoURL, '_blank')}
            >
              View on GitHub
            </Button>
          </div>
        </div>

        <ThemeSelector />
      </div>
    </section>
  )
}
