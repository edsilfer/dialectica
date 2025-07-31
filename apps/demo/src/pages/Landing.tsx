import { css, Global } from '@emotion/react'
import React, { useCallback, useRef, useState } from 'react'
import CommentSlide from '../components/demo/CommentSlide'
import FileExplorerSlide from '../components/demo/FileExplorerSlide'
import FileViewerSlide from '../components/demo/FileViewerSlide'
import IntroSlide from '../components/demo/IntroSlide'

import ApiSlide from '../components/demo/ApiSlide'
import GetStartedSlide from '../components/demo/GetStartedSlide'
import ThemeSelector from '../components/demo/ThemeSelector'
import SettingsModal from '../components/settings/modals/SettingsModal'
import { useSettings } from '../hooks/use-settings'
import { useUrl } from '../hooks/use-url'

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
    slide: css`
      scroll-snap-align: start;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `,
    themeSwitcher: css`
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      width: 200px;
    `,
  }
}

export default function Welcome() {
  const styles = useStyles()

  const { setPrUrl } = useUrl([])
  const { setEnableTutorial, setUseMocks } = useSettings()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const getStartedRef = useRef<HTMLElement | null>(null)

  const scrollToGetStarted = () => {
    getStartedRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const proceedWithMocks = useCallback(() => {
    setPrUrl({ owner: 'facebook', repo: 'react', pullNumber: 33665 })
    setUseMocks(true)
    setEnableTutorial(false)
  }, [setEnableTutorial, setPrUrl, setUseMocks])

  return (
    <>
      <Global
        styles={css`
          html,
          body,
          #root {
            margin: 0;
            height: 100%;
            overflow: hidden;
          }
        `}
      />

      <main css={styles.root}>
        <IntroSlide onContinue={scrollToGetStarted} />
        <FileViewerSlide />
        <FileExplorerSlide />
        <CommentSlide />
        <ApiSlide />
        <GetStartedSlide
          proceed={proceedWithMocks}
          openSettings={() => setSettingsOpen(true)}
          innerRef={getStartedRef}
        />
      </main>

      <ThemeSelector />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export const SlideWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles()
  return <section css={styles.slide}>{children}</section>
}
