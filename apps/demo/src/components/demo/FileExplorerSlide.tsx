import { ThemeContext } from '@commons'
import { Typography } from 'antd'
import { useContext } from 'react'
import { SlideWrapper } from '../../pages/Welcome'
import MockedFileExplorer from './mocks/MockedFileExplorer'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

export default function FileExplorerSlide() {
  const theme = useContext(ThemeContext)
  const sharedStyles = useSharedStyles(theme)

  return (
    <SlideWrapper>
      <div css={sharedStyles.featureSlide}>
        <div css={sharedStyles.featureComponent('50%')}>
          <MockedFileExplorer />
        </div>

        <div css={sharedStyles.featureText('50%')}>
          <Title css={sharedStyles.title}>Powerful File Explorer</Title>
          <Paragraph css={sharedStyles.subtitle}>
            Navigate complex file trees with instant search, scroll-to-file, metadata, and SVG-based package guides.
          </Paragraph>
        </div>
      </div>
    </SlideWrapper>
  )
}
