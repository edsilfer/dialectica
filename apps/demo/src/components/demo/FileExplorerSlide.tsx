import { ThemeContext } from '@edsilfer/diff-viewer'
import { useIsMobile } from '@edsilfer/commons'
import { Typography } from 'antd'
import { useContext } from 'react'
import { SlideWrapper } from '../../pages/Welcome'
import MockedFileExplorer from './mocks/MockedFileExplorer'
import useSharedStyles from './shared-styles'

const { Title, Paragraph } = Typography

export default function FileExplorerSlide() {
  const theme = useContext(ThemeContext)
  const sharedStyles = useSharedStyles(theme)
  const isMobile = useIsMobile()

  const left = (
    <div css={[sharedStyles.featureLeft(isMobile ? '70%' : '50%')]}>
      <MockedFileExplorer />
    </div>
  )

  const right = (
    <div
      css={sharedStyles.featureRight(isMobile ? '30%' : '50%', 'secondary', {
        topLeft: !isMobile,
        topRight: !isMobile,
        bottomLeft: true,
        bottomRight: isMobile,
      })}
    >
      <Title css={sharedStyles.title}>Powerful File Explorer</Title>
      <Paragraph css={sharedStyles.subtitle}>
        Navigate complex file trees with instant search, scroll-to-file, metadata, and SVG-based package guides.
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
