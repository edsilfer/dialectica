import { ArrowRightOutlined, CodeOutlined } from '@ant-design/icons'
import { ThemeContext, ThemeTokens } from '@commons'
import { css } from '@emotion/react'
import { Button, Typography } from 'antd'
import { useContext } from 'react'
import MockedDiffViewer from './mocks/MockedDiffViewer'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

const useStyles = (theme: ThemeTokens) => {
  return {
    container: css`
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 100%;
      height: 100%;
      justify-content: center;
      position: relative;
      background: linear-gradient(to bottom, transparent 0%, transparent 55%, ${theme.colors.backgroundContainer} 100%);

      @media (max-width: 768px) {
        flex-direction: column-reverse !important;
        padding: 24px;
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
      width: 70%;
      transition: filter 0.3s;

      @media (min-width: 1920px) {
        width: 50%;
      }

      @media (max-width: 768px) {
        width: 100%;
        filter: blur(3px) brightness(0.8); /* Darkens the background slightly */
      }
    `,

    button: css`
      border-radius: 999px;
      padding: 0 24px;
      height: 30px;
    `,
  }
}

export default function IntroSlide({ onContinue }: { onContinue: () => void }) {
  const theme = useContext(ThemeContext)
  const styles = useStyles(theme)
  const sharedStyles = useSharedStyles(theme)

  const repoURL = 'https://github.com/edsilfer/diff-viewer'

  return (
    <section css={sharedStyles.slide}>
      <div css={styles.container}>
        <MockedDiffViewer css={styles.diffViewer} />

        <div css={styles.textContainer}>
          <Title css={sharedStyles.title}>Diff Viewer React Library</Title>

          <Paragraph css={sharedStyles.subtitle} style={{ textAlign: 'center' }}>
            A powerful, composable diff viewer for React
          </Paragraph>

          <div css={styles.buttonsContainer}>
            <Button type="primary" css={styles.button} icon={<ArrowRightOutlined />} onClick={onContinue}>
              Continue with mocks
            </Button>
            <Button css={styles.button} icon={<CodeOutlined />} onClick={() => window.open(repoURL, '_blank')}>
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
