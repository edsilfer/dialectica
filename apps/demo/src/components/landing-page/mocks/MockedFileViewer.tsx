import { DiffSearchProvider, FileDiff, FileViewer, LineRange, ParsedDiff } from '@diff-viewer'
import { css, SerializedStyles } from '@emotion/react'
import { CommentMetadata, CommentState, useCommentController, usePullRequestStore } from '@github'
import { Tag } from 'antd'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWidgetDatastore } from '../../../hooks/data/use-widget-datastore'
import { MOCKED_PR, MOCKED_USER_1, MOCKED_USER_2 } from './constants'
import { useDemo, useIntersectionTrigger } from './use-demo'

const useStyles = () => {
  return {
    container: css`
      height: 100%;
      overflow: auto;
      * {
        font-size: 0.7rem !important;
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
  const styles = useStyles()

  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)
  useIntersectionTrigger(containerRef, hasAnimated, setHasAnimated)

  const pr = usePullRequestStore(MOCKED_PR, MOCKED_TOKEN, USE_MOCKS)
  const diff = useMemo(() => (pr.diff ? ParsedDiff.build(pr.diff) : undefined), [pr.diff])
  const [file, setFile] = useState<FileDiff | undefined>(undefined)

  const { commentDs, onCommentEvent } = useCommentController(MOCKED_USER_1, MOCKED_PR, MOCKED_TOKEN, USE_MOCKS)
  const widgetDatastore = useWidgetDatastore(commentDs, onCommentEvent)
  const widgets = useMemo(() => {
    return props.withComment ? widgetDatastore.handle.list() : []
  }, [widgetDatastore, props.withComment])

  useDemo(containerRef, isPlaying && hasAnimated, 500, async (demo) => {
    // Reset the editor
    const cancel = demo.findElement<HTMLTextAreaElement>('[data-testid="editor-textarea"]')
    if (cancel) demo.clickElement('[data-testid="editor-button-cancel"]')

    // Make sure we can find the comment reply button
    const commentReply = demo.findElement('[data-testid="comment-reply"]')
    if (!commentReply) return

    // Start a reply
    await demo.sleep(500)
    demo.clickElement('[data-testid="comment-reply"]')

    let input = demo.findElement<HTMLTextAreaElement>('[data-testid="editor-textarea"]')
    const maxRetries = 20
    const delay = 100

    for (let i = 0; i < maxRetries; i++) {
      input = demo.findElement<HTMLTextAreaElement>('[data-testid="editor-textarea"]')
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
  if (!file) return null

  return (
    <DiffSearchProvider files={[file]}>
      <div
        css={[styles.container, props.css]}
        className={props.className}
        ref={containerRef}
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        {props.withComment && (
          <div style={{ marginBottom: '8px', display: 'inline-block' }}>
            <Tag color={isPlaying ? 'green' : 'red'}>Animation {isPlaying ? 'Playing' : 'Paused'}</Tag>
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
