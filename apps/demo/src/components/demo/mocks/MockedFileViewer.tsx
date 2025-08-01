import { ThemeContext, useIsMobile } from '@commons'
import { DiffSearchProvider, FileDiff, FileViewer, LineRange, ParsedDiff } from '@diff-viewer'
import { css, SerializedStyles } from '@emotion/react'
import { CommentMetadata, CommentState, useCommentController, usePullRequestStore } from '@github'
import { Tag } from 'antd'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useWidgetDatastore } from '../../../hooks/data/use-widget-datastore'
import { useDemo, useIntersectionTrigger } from '../../../hooks/use-demo'
import { MOCKED_PR, MOCKED_USER_1, MOCKED_USER_2 } from './constants'

const useStyles = (mode: 'unified' | 'split') => {
  const theme = useContext(ThemeContext)
  return {
    container: css`
      width: 100%;
      box-sizing: border-box;

      overflow: hidden;
      border-bottom: 1px solid ${theme.colors.border};
      border-bottom-left-radius: ${theme.spacing.sm};
      border-bottom-right-radius: ${theme.spacing.sm};

      * {
        font-size: 0.8rem !important;
      }

      @media (max-width: 768px) {
        margin: 0 ${theme.spacing.md};
        * {
          font-size: ${mode === 'unified' ? '0.8rem' : '0.5rem'} !important;
        }
      }
    `,
  }
}

const USE_MOCKS = true
const MOCKED_TOKEN = 'mocked-token'
const MOCKED_COMMENT = new CommentMetadata({
  author: MOCKED_USER_2,
  createdAt: new Date().toISOString(),
  url: 'https://github.com/mocked-user/mocked-repo/issues/1',
  body: 'We should not depend on this component! It is deprecated!',
  reactions: new Map([['+1', 1]]),
  wasPublished: true,
  serverId: 1,
  path: 'packages/react-server/src/ReactFlightServer.js',
  line: 61,
  side: 'RIGHT',
  state: CommentState.PUBLISHED,
})

interface MockedFileViewerProps {
  /** Custom CSS styles to apply to the container */
  css?: SerializedStyles
  /** Custom class name to apply to the container */
  className?: string
  /** The mode to use for the file viewer */
  mode: 'unified' | 'split'
  /** Called when the file is force rendered. */
  withComment?: boolean
  /** The lines to highlight */
  highlightedLines?: LineRange
}

export const MockedFileViewer: React.FC<MockedFileViewerProps> = (props) => {
  const styles = useStyles(props.mode)

  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const isMobile = useIsMobile()
  useIntersectionTrigger(containerRef, hasAnimated, setHasAnimated)

  const pr = usePullRequestStore(MOCKED_PR, MOCKED_TOKEN, USE_MOCKS, false)
  const diff = useMemo(() => (pr.diff ? ParsedDiff.build(pr.diff) : undefined), [pr.diff])
  const [file, setFile] = useState<FileDiff | undefined>(undefined)

  const { commentDs, onCommentEvent } = useCommentController(MOCKED_USER_1, MOCKED_PR, MOCKED_TOKEN, USE_MOCKS)
  const widgetDatastore = useWidgetDatastore(commentDs, onCommentEvent)
  const widgets = useMemo(() => {
    return props.withComment ? widgetDatastore.handle.list() : []
  }, [widgetDatastore, props.withComment])

  const inputSelector = '[data-testid="editor-textarea"]'

  /** Whenever the animation state flips, (de)activate the keyboard */
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLTextAreaElement>(inputSelector)
    if (!el) return

    el.readOnly = true
    el.setAttribute('inputmode', 'none')

    const killFocus = () => el.blur()
    el.addEventListener('focus', killFocus)

    return () => el.removeEventListener('focus', killFocus)
  }, [props.withComment])

  useDemo(containerRef, hasAnimated, 500, async (demo) => {
    // Reset the editor
    const cancel = demo.findElement<HTMLTextAreaElement>(inputSelector)
    if (cancel) demo.clickElement('[data-testid="editor-button-cancel"]')

    // Make sure we can find the comment reply button
    const commentReply = demo.findElement('[data-testid="comment-reply"]')
    if (!commentReply) return

    // Start a reply
    await demo.sleep(500)
    demo.clickElement('[data-testid="comment-reply"]')

    let input = demo.findElement<HTMLTextAreaElement>(inputSelector)
    const maxRetries = 20
    const delay = 100

    for (let i = 0; i < maxRetries; i++) {
      input = demo.findElement<HTMLTextAreaElement>(inputSelector)
      if (input) break
      await demo.sleep(delay)
    }

    if (!input) return

    input.focus()
    await demo.typeInInput(input, '> (...) )It is deprecated!\n\nOh, I see. Makes sense, thanks!')
    await demo.sleep(1000)

    demo.clickElement('[data-testid="tab-header-Preview"]')
    await demo.sleep(3000)

    demo.clickElement('[data-testid="editor-button-start-a-review"]')
  })

  // EFFECTS ----------------------------------------------------------------------------
  useEffect(() => {
    if (
      !commentDs
        .list()
        .values()
        .some((comment) => comment.serverId === MOCKED_COMMENT.serverId)
    ) {
      commentDs.clear()
      commentDs.save(MOCKED_COMMENT)
    }
  }, [commentDs])

  useEffect(() => {
    if (diff?.files[1]) {
      setFile(diff?.files[1])
    }
  }, [diff?.files])

  // RENDER ----------------------------------------------------------------------------
  const classes = [isMobile ? 'mobile-blocker' : '', props.className].join(' ')

  if (!file) return null

  return (
    <DiffSearchProvider files={[file]}>
      <div css={[styles.container, props.css]} className={classes} ref={containerRef}>
        {props.withComment && (
          <div style={{ marginBottom: '8px', display: 'inline-block' }}>
            <Tag color={'green'}>Animation playing (interactions disabled)</Tag>
          </div>
        )}
        <FileViewer
          file={diff!.files[1]}
          overrideMode={props.mode}
          highlightedLines={props.highlightedLines}
          widgets={widgets}
        />
      </div>
    </DiffSearchProvider>
  )
}
