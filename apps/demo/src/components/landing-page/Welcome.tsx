import { ArrowRightOutlined, CodeOutlined, SettingOutlined } from '@ant-design/icons'
import { ThemeContext, Themes } from '@commons'
import { LineRange, useDiffViewerConfig } from '@diff-viewer'
import { css, Global } from '@emotion/react'
import { Button, Select, Typography } from 'antd'
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSettings } from '../../hooks/use-settings'
import { useUrl } from '../../hooks/use-url'
import SettingsModal from '../settings/modals/SettingsModal'
import MockedApiDemo from './mocks/MockedApiDemo'
import MockedDiffViewer from './mocks/MockedDiffViewer'
import MockedFileExplorer from './mocks/MockedFileExplorer'
import { MockedFileViewer } from './mocks/MockedFileViewer'

const { Title, Paragraph, Text } = Typography

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
    secondColorOverlay: (position: 'top' | 'bottom') => css`
      position: absolute;
      ${position}: 0;
      left: 0;
      height: 45%;
      width: 100%;
      background-color: ${theme.colors.backgroundContainer};
      pointer-events: none;
      z-index: 0;
    `,

    // TYPOGRAPHY ----------------------------------------------------------------------------
    title: css`
      margin: 0 0 ${theme.spacing.md};
      font-size: 80px;
      font-weight: 700;
      color: ${theme.colors.textPrimary};
    `,

    subtitle: css`
      font-size: 22px;
      max-width: 700px;
      color: ${theme.colors.textContainerPlaceholder};
    `,

    // HERO ----------------------------------------------------------------------------
    hero: css`
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      justify-content: center;
      flex-direction: column;
      position: relative;
    `,

    heroActions: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing.sm};
      margin-bottom: ${theme.spacing.md};
    `,

    // FEATURE ----------------------------------------------------------------------------
    feature: css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      flex-direction: row;
      gap: ${theme.spacing.lg};
    `,

    featureText: (width: string = '30%', paint: boolean = true) => css`
      display: flex;
      flex-direction: column;
      width: ${width};
      height: 100%;
      justify-content: center;
      gap: ${theme.spacing.sm};
      padding: ${theme.spacing.xl};
      ${paint && `background-color: ${theme.colors.backgroundContainer};`}
      z-index: 1;
    `,

    featureComponent: (width: string = '70%') => css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.sm};
      align-items: center;
      justify-content: center;
      padding: ${theme.spacing.xl};
      width: ${width};
      height: 80%;
      overflow: hidden;
    `,

    // FILE VIEWER ----------------------------------------------------------------------------
    primaryViewer: css`
      overflow: hidden;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.sm};
    `,

    viewerStyle: (isFront: boolean, isPrimaryFront: boolean, theme: typeof Themes.light) => css`
      position: absolute;
      top: 10%;
      left: 0;
      transition:
        transform 0.8s cubic-bezier(0.65, 0, 0.35, 1),
        z-index 0.8s,
        width 0.8s,
        height 0.8s,
        filter 0.8s;
      transform: ${isPrimaryFront === isFront ? 'translate(0, 0)' : 'translate(20%, 100px)'};
      z-index: ${isPrimaryFront === isFront ? 2 : 1};
      height: ${isPrimaryFront === isFront ? '70%' : '70%'};
      width: ${isPrimaryFront === isFront ? '80%' : '80%'};
      filter: ${isPrimaryFront === isFront ? 'blur(0px)' : 'blur(2px)'};
      overflow: hidden;
      border: 1px solid ${theme.colors.border};
      border-radius: ${theme.spacing.sm};
    `,

    // ACTIONS ----------------------------------------------------------------------------
    actions: css`
      display: flex;
      margin-top: ${theme.spacing.md};
    `,

    pillButton: css`
      border-radius: 999px;
      padding: 0 24px;
      height: 40px;
    `,

    button: css`
      height: 40px;
      margin-bottom: ${theme.spacing.sm};
    `,
  }
}

export default function Welcome() {
  const styles = useStyles()
  const { setEnableTutorial, setUseMocks } = useSettings()
  const { theme, setTheme } = useDiffViewerConfig()
  const { setPrUrl } = useUrl([])
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
        <HeroSlide styles={styles} onContinue={scrollToGetStarted} />
        <ViewModeSlide styles={styles} />
        <ExplorerSlide styles={styles} />
        <CommentingSlide styles={styles} />
        <ApiSlide styles={styles} />
        <GetStartedSlide
          styles={styles}
          proceed={proceedWithMocks}
          openSettings={() => setSettingsOpen(true)}
          innerRef={getStartedRef}
        />
      </main>

      <Select
        css={styles.themeSwitcher}
        value={theme.name}
        onChange={(value: string) => setTheme(Themes[value])}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'dracula', label: 'Dracula' },
          { value: 'solarizedDark', label: 'Solarized Dark' },
          { value: 'solarizedLight', label: 'Solarized Light' },
          { value: 'vscodeDark', label: 'VSCode Dark' },
        ]}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

interface SlideWrapperProps {
  /** The styles to apply to the slide */
  styles: ReturnType<typeof useStyles>
  /** The children to render inside the slide */
  children: React.ReactNode
}

const SlideWrapper: React.FC<SlideWrapperProps> = (props) => {
  const { styles, children } = props
  return <section css={styles.slide}>{children}</section>
}

const HeroSlide: React.FC<{ styles: ReturnType<typeof useStyles>; onContinue: () => void }> = (props) => {
  const { styles, onContinue } = props

  return (
    <SlideWrapper styles={styles}>
      <div css={styles.hero}>
        <div css={styles.secondColorOverlay('bottom')} />
        <Title css={styles.title}>Diff Viewer React Library</Title>
        <Paragraph css={styles.subtitle}>A powerful React library with advanced features for code review.</Paragraph>

        <div css={styles.heroActions}>
          <Button type="primary" css={styles.pillButton} icon={<ArrowRightOutlined />} onClick={onContinue}>
            Continue with mocks
          </Button>
          <Button
            css={styles.pillButton}
            icon={<CodeOutlined />}
            onClick={() => window.open('https://github.com/edsilfer/diff-viewer', '_blank')}
          >
            View Source Code
          </Button>
        </div>

        <MockedDiffViewer />
      </div>
    </SlideWrapper>
  )
}

const ViewModeSlide: React.FC<{ styles: ReturnType<typeof useStyles> }> = (props) => {
  const { styles } = props
  const theme = useContext(ThemeContext)

  const [isPrimaryFront, setIsPrimaryFront] = useState(true)
  const backRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)
  const [backHoverEnabled, setBackHoverEnabled] = useState(true)
  const [frontHoverEnabled, setFrontHoverEnabled] = useState(true)

  const handleFrontHover = () => {
    if (!isPrimaryFront && frontHoverEnabled) {
      setIsPrimaryFront(true)
      setFrontHoverEnabled(false)
    }
  }

  const handleBackHover = () => {
    if (!isPrimaryFront && backHoverEnabled) return
    setIsPrimaryFront(false)
    setBackHoverEnabled(false)
  }

  useEffect(() => {
    const backEl = backRef.current
    const frontEl = frontRef.current

    const setListeners = (remove: boolean = false) => {
      if (remove) {
        backEl?.removeEventListener('transitionend', handleTransitionEnd)
        frontEl?.removeEventListener('transitionend', handleTransitionEnd)
      } else {
        backEl?.addEventListener('transitionend', handleTransitionEnd)
        frontEl?.addEventListener('transitionend', handleTransitionEnd)
      }
    }

    const handleTransitionEnd = () => {
      if (isPrimaryFront && !backHoverEnabled) setBackHoverEnabled(true)
      if (!isPrimaryFront && !frontHoverEnabled) setFrontHoverEnabled(true)
    }

    setListeners()
    return () => {
      setListeners(true)
    }
  }, [isPrimaryFront, backHoverEnabled, frontHoverEnabled])

  const frontStyle = styles.viewerStyle(true, isPrimaryFront, theme)
  const backStyle = styles.viewerStyle(false, isPrimaryFront, theme)
  const highlightedLines: LineRange = {
    start: 4,
    end: 6,
    side: 'left',
    filepath: 'packages/react-server/src/ReactFlightServer.js',
  }

  return (
    <SlideWrapper styles={styles}>
      <div css={styles.feature}>
        <div css={styles.featureText()}>
          <Title css={styles.title}>Versatile View Modes</Title>
          <Paragraph css={styles.subtitle}>
            Switch seamlessly between unified and split views to match your workflow.
          </Paragraph>
        </div>

        <div css={styles.featureComponent()} style={{ position: 'relative' }}>
          <div ref={frontRef} css={frontStyle} onMouseEnter={frontHoverEnabled ? handleFrontHover : undefined}>
            <MockedFileViewer mode="unified" />
          </div>

          <div ref={backRef} css={backStyle} onMouseEnter={backHoverEnabled ? handleBackHover : undefined}>
            <MockedFileViewer mode="split" highlightedLines={highlightedLines} />
          </div>
        </div>
      </div>
    </SlideWrapper>
  )
}

const ExplorerSlide: React.FC<{ styles: ReturnType<typeof useStyles> }> = (props) => {
  const { styles } = props

  return (
    <SlideWrapper styles={styles}>
      <div css={styles.feature}>
        <div css={styles.featureComponent('50%')}>
          <MockedFileExplorer />
        </div>

        <div css={styles.featureText('50%')}>
          <Title css={styles.title}>Powerful File Explorer</Title>
          <Paragraph css={styles.subtitle}>
            Dive into file structures with intelligent metadata and instant file filtering.
          </Paragraph>
        </div>
      </div>
    </SlideWrapper>
  )
}

const CommentingSlide: React.FC<{ styles: ReturnType<typeof useStyles> }> = (props) => {
  const { styles } = props

  return (
    <SlideWrapper styles={styles}>
      <div css={styles.feature}>
        <div css={styles.featureText('35%')}>
          <Title css={styles.title}>Contextual Commenting</Title>
          <Paragraph css={styles.subtitle}>
            Support for inline feedback with contextual overlays directly on the diff.
          </Paragraph>
        </div>

        <div css={styles.featureComponent('65%')}>
          <MockedFileViewer mode="unified" withComment />
        </div>
      </div>
    </SlideWrapper>
  )
}

const ApiSlide: React.FC<{ styles: ReturnType<typeof useStyles> }> = (props) => {
  const { styles } = props

  return (
    <SlideWrapper styles={styles}>
      <div css={styles.feature}>
        <div css={styles.featureComponent()}>
          <MockedApiDemo />
        </div>

        <div css={styles.featureText(undefined, true)}>
          <Title css={styles.title}>Easy API</Title>
          <Paragraph css={styles.subtitle}>Easy to use with your own data.</Paragraph>
        </div>
      </div>
    </SlideWrapper>
  )
}

interface GetStartedSlideProps {
  /** The styles to apply to the slide */
  styles: ReturnType<typeof useStyles>
  /** The function to call when the user clicks the proceed button */
  proceed: () => void
  /** The function to call when the user clicks the settings button */
  openSettings: () => void
  innerRef: React.RefObject<HTMLElement | null>
}

const GetStartedSlide: React.FC<GetStartedSlideProps> = ({ styles, proceed, openSettings, innerRef }) => {
  return (
    <SlideWrapper styles={styles}>
      <section ref={innerRef}>
        <div css={styles.secondColorOverlay('top')} />

        <div css={styles.feature}>
          <div css={styles.featureText('75%', false)} style={{ alignItems: 'flex-start' }}>
            <Title css={styles.title}>Instructions...</Title>
            <Paragraph css={styles.subtitle}>
              Exploring with mocks
              <Paragraph>You can proceed to the app and explore the features using mocked data.</Paragraph>
            </Paragraph>

            <Paragraph css={styles.subtitle}>
              Exploring with real data
              <Paragraph>
                Setup your own GitHub token in the settings and use the demo app to perform real code reviews.
              </Paragraph>
            </Paragraph>

            <Paragraph css={styles.subtitle}>
              Loading a PR
              <Paragraph>
                You can load a PR by using the URL parameter{' '}
                <Text code>/?owner=&lt;user&gt;&amp;repo=&lt;repo&gt;&amp;pull=&lt;number&gt;</Text>
              </Paragraph>
            </Paragraph>
          </div>

          <div css={styles.featureComponent('25%')}>
            <Button css={styles.button} type="primary" icon={<ArrowRightOutlined />} onClick={proceed}>
              Proceed with mocked data
            </Button>
            <Button css={styles.button} icon={<SettingOutlined />} onClick={openSettings}>
              Settings
            </Button>
          </div>
        </div>
      </section>
    </SlideWrapper>
  )
}
