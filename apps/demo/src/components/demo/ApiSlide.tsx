import { ThemeContext } from '@commons'
import { Typography } from 'antd'
import { useContext } from 'react'
import { SlideWrapper } from '../../pages/Landing'
import MockedApiDemo from './mocks/MockedApi'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

export default function ApiSlide() {
  const theme = useContext(ThemeContext)
  const sharedStyles = useSharedStyles(theme)

  return (
    <SlideWrapper>
      <div css={sharedStyles.feature}>
        <div css={sharedStyles.featureComponent()}>
          <MockedApiDemo />
        </div>

        <div css={sharedStyles.featureText(undefined, true)}>
          <Title css={sharedStyles.title}>Easy API</Title>
          <Paragraph css={sharedStyles.subtitle}>
            Designed for integration. Use your own diff parser or PR data — all components are composable and headless
            by design.
          </Paragraph>
        </div>
      </div>
    </SlideWrapper>
  )
}
