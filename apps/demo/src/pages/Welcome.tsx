import { css, Global } from '@emotion/react'
import React, { useContext, useRef } from 'react'
import CommentSlide from '../components/demo/CommentSlide'
import FileViewerSlide from '../components/demo/FileViewerSlide'
import IntroSlide from '../components/demo/IntroSlide'

import {
  DEFAULT_DIFF_VIEWER_CONFIG,
  DEFAULT_FILE_EXPLORER_CONFIG,
  DEFAULT_FILE_LIST_CONFIG,
  DiffViewerConfigProvider,
  ThemeContext,
} from '@edsilfer/diff-viewer'
import ApiSlide from '../components/demo/ApiSlide'
import FileExplorerSlide from '../components/demo/FileExplorerSlide'
import GetStartedSlide from '../components/demo/GetStartedSlide'
import useSharedStyles from '../components/demo/shared-styles'
import { usePreferedTheme } from '../hooks/use-prefered-theme'
import { SettingsProvider } from '../hooks/use-settings'

/**
 * Creates Emotion style objects for this module.
 *
 * @returns Object mapping semantic keys to Emotion `css` declarations.
 */
const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    root: css`
      height: 100%;
      width: 100vw;
      overflow-y: auto;
      scroll-snap-type: y mandatory;
      font-family: 'Segoe UI', sans-serif;
      background-color: ${theme.colors.backgroundPrimary} !important;
    `,
  }
}

const GLOBAL_STYLE = (
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

      .interaction-blocker {
        pointer-events: none !important;
        overflow: hidden !important;
        touch-action: none !important;
        user-select: none !important;
      }

      .interaction-blocker * {
        pointer-events: none !important;
        overflow: hidden !important;
        touch-action: none !important;
        user-select: none !important;
      }
    `}
  />
)

export default function Welcome() {
  const preferredTheme = usePreferedTheme()

  return (
    <SettingsProvider>
      <DiffViewerConfigProvider
        config={{ ...DEFAULT_DIFF_VIEWER_CONFIG, theme: preferredTheme, explorerInitialWidth: 35 }}
        scope="welcome"
        fileExplorerConfig={DEFAULT_FILE_EXPLORER_CONFIG}
        fileListConfig={DEFAULT_FILE_LIST_CONFIG}
        storage="local"
      >
        <Content />
      </DiffViewerConfigProvider>
    </SettingsProvider>
  )
}

function Content() {
  const styles = useStyles()
  const getStartedRef = useRef<HTMLElement | null>(null)
  const scrollToGetStarted = () => {
    getStartedRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {GLOBAL_STYLE}
      <main css={styles.root}>
        <IntroSlide onContinue={scrollToGetStarted} />
        <FileViewerSlide />
        <FileExplorerSlide />
        <CommentSlide />
        <ApiSlide />
        <GetStartedSlide innerRef={getStartedRef} />
      </main>
    </>
  )
}

export const SlideWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useContext(ThemeContext)
  const sharedStyles = useSharedStyles(theme)
  return <section css={sharedStyles.slide}>{children}</section>
}
