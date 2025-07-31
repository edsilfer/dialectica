import { css, Global } from '@emotion/react'
import React, { useContext, useRef } from 'react'
import CommentSlide from '../components/demo/CommentSlide'
import FileExplorerSlide from '../components/demo/FileExplorerSlide'
import FileViewerSlide from '../components/demo/FileViewerSlide'
import IntroSlide from '../components/demo/IntroSlide'

import { ThemeContext } from '@commons'
import ApiSlide from '../components/demo/ApiSlide'
import GetStartedSlide from '../components/demo/GetStartedSlide'
import ThemeSelector from '../components/demo/ThemeSelector'
import useSharedStyles from '../components/demo/shared-styles'

/**
 * Creates Emotion style objects for this module.
 *
 * @returns Object mapping semantic keys to Emotion `css` declarations.
 */
const useStyles = () => {
  return {
    root: css`
      height: 100%;
      width: 100vw;
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      font-family: 'Segoe UI', sans-serif;
    `,
  }
}

export default function Welcome() {
  const styles = useStyles()
  const getStartedRef = useRef<HTMLElement | null>(null)
  const scrollToGetStarted = () => {
    getStartedRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Global
        styles={css`
          html,
          body,
          #root {
            margin: 0 !important;
            padding: 0 !important;
            height: 100%;
            overflow: hidden;
          }

          body > div > div {
            padding: 0 !important;
          }
        `}
      />

      <main css={styles.root}>
        <IntroSlide onContinue={scrollToGetStarted} />
        <FileViewerSlide />
        <FileExplorerSlide />
        <CommentSlide />
        <ApiSlide />
        <GetStartedSlide innerRef={getStartedRef} />
      </main>

      <ThemeSelector />
    </>
  )
}

export const SlideWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useContext(ThemeContext)
  const sharedStyles = useSharedStyles(theme)
  return <section css={sharedStyles.slide}>{children}</section>
}
