import { ThemeContext, useIsMobile } from '@dialectica-org/commons'
import { css } from '@emotion/react'
import { Typography } from 'antd'
import { useContext } from 'react'
import { SlideWrapper } from '../../pages/Welcome'
import MockedApiDemo from './mocks/MockedApi'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

const useStyles = () => {
  return {
    editorContainer: css`
      display: flex;
      height: 90%;
      margin: 0 10%;

      @media (max-width: 768px) {
        width: 100% !important;
      }
    `,
  }
}

export default function ApiSlide() {
  const theme = useContext(ThemeContext)
  const styles = useStyles()
  const sharedStyles = useSharedStyles(theme)
  const isMobile = useIsMobile()

  const left = (
    <div css={[sharedStyles.featureLeft(isMobile ? '65%' : '65%', 'primary'), styles.editorContainer]}>
      <MockedApiDemo />
    </div>
  )

  const right = (
    <div css={sharedStyles.featureRight(isMobile ? '35%' : '35%', 'secondary', { topLeft: true, bottomLeft: true })}>
      <Title css={sharedStyles.title}>Easy API</Title>
      <Paragraph css={sharedStyles.subtitle}>
        Designed for integration. Use your own diff parser or PR data — all components are composable and headless by
        design.
      </Paragraph>
    </div>
  )

  return (
    <SlideWrapper>
      <div css={sharedStyles.featureSlide('primary')}>
        {isMobile ? (
          <>
            {right}
            {left}
          </>
        ) : (
          <>
            {left}
            {right}
          </>
        )}
      </div>
    </SlideWrapper>
  )
}
