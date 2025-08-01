import { ThemeContext } from '@edsilfer/commons'
import { Typography } from 'antd'
import { useContext } from 'react'
import { SlideWrapper } from '../../pages/Welcome'
import { MockedFileViewer } from './mocks/MockedFileViewer'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

export default function CommentSlide() {
  const theme = useContext(ThemeContext)
  const sharedStyles = useSharedStyles(theme)

  return (
    <SlideWrapper>
      <div css={sharedStyles.featureSlide('primary')}>
        <div css={sharedStyles.featureLeft('20%', 'secondary', { topRight: true, bottomRight: true })}>
          <Title css={sharedStyles.title}>Contextual Commenting</Title>
          <Paragraph css={sharedStyles.subtitle}>
            Enable contextual commenting and review workflows right on the diff — <i>just like GitHub</i>. Easily extend
            with your own components using our widget and overlay APIs.
          </Paragraph>
        </div>

        <div css={sharedStyles.featureRight('80%')}>
          <MockedFileViewer mode="unified" withComment />
        </div>
      </div>
    </SlideWrapper>
  )
}
