import { ThemeContext, useIsMobile } from '@edsilfer/commons'
import { DiffSearchProvider, FileDiff, FileViewer, LineMetadata, LineRange, ParsedDiff } from '@edsilfer/diff-viewer'
import { css, SerializedStyles } from '@emotion/react'
import {
  CommentEventProcessorImpl,
  CommentLocalStore,
  CommentMetadata,
  CommentState,
  usePullRequestStore,
} from '@github'
import { Tag } from 'antd'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useDemo, useVisibility } from '../../../hooks/use-demo'
import { WidgetFactory } from '../../../models/WidgetFactory'
import { MOCKED_PR, MOCKED_USER_1, MOCKED_USER_2 } from './constants'

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

/**
 * Extension of CommentLocalStore that implements the create method for demo purposes
 */
class CommentLocalStoreExtension extends CommentLocalStore {
  create(line: LineMetadata, state: CommentState = CommentState.DRAFT): CommentMetadata | null {
    if (!line.filepath || line.lineNumber === undefined || line.side === undefined) {
      return null
    }

    const now = new Date().toISOString()
    const comment = new CommentMetadata({
      author: {
        login: 'demo-user',
        avatar_url: 'https://avatars.githubusercontent.com/u/1',
        html_url: 'https://github.com/demo-user',
      },
      createdAt: now,
      updatedAt: now,
      url: `https://github.com/demo/repo/pull/1#discussion_${Date.now()}`,
      body: '',
      reactions: new Map(),
      path: line.filepath,
      line: line.lineNumber,
      side: line.side.toUpperCase() as 'LEFT' | 'RIGHT',
      state,
      wasPublished: false,
    })

    // Save the comment to the local store
    this.save(comment)
    return comment
  }
}

// ------------------------------------------------------------------------------------------------

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
  const isMobile = useIsMobile()
  const isVisible = useVisibility(containerRef)

  const pr = usePullRequestStore(MOCKED_PR, MOCKED_TOKEN, USE_MOCKS, false)
  const diff = useMemo(() => (pr.diff ? ParsedDiff.build(pr.diff) : undefined), [pr.diff])
  const [file, setFile] = useState<FileDiff | undefined>(undefined)

  const inputSelector = '[data-testid="editor-textarea"]'

  // FAKE COMMENT EVENT HANDLING -------------------------------------------------------------------
  const [comments, setComments] = useState<Map<number, CommentMetadata>>(
    props.withComment ? new Map([[MOCKED_COMMENT.localId, MOCKED_COMMENT]]) : new Map(),
  )
  const commentStore = useMemo(() => new CommentLocalStoreExtension(comments, setComments), [comments])
  const eventProcessor = useMemo(() => new CommentEventProcessorImpl(commentStore, () => undefined), [commentStore])

  const widgets = useMemo(() => {
    const groupedComments = commentStore.getThreads()
    const draftComments = commentStore.list(CommentState.DRAFT)
    const pendingComments = commentStore.list(CommentState.PENDING)
    const isReviewing = draftComments.size + pendingComments.size > 1
    return WidgetFactory.build(
      groupedComments,
      MOCKED_USER_1,
      (event, metadata, content) => {
        eventProcessor.process(event, metadata, content)
      },
      isReviewing,
    )
  }, [commentStore, eventProcessor])

  // ------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (diff?.files[1]) {
      setFile(diff?.files[1])
    }
  }, [diff?.files])

  useDemo(containerRef, isVisible, 500, async (demo) => {
    while (true) {
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

      await demo.typeInInput(input, '> (...) )It is deprecated!\n\nOh, I see. Makes sense, thanks!')
      await demo.sleep(1000)

      demo.clickElement('[data-testid="tab-header-Preview"]')
      await demo.sleep(3000)
      demo.clickElement('[data-testid="editor-button-start-a-review"]')

      // Restart the loop
      await demo.sleep(3000)
      setComments(new Map<number, CommentMetadata>([[MOCKED_COMMENT.localId, MOCKED_COMMENT]]))
    }
  })

  // RENDER ----------------------------------------------------------------------------
  const classes = [isMobile ? 'mobile-blocker' : '', props.className].join(' ')

  if (!file) return null

  return (
    <DiffSearchProvider files={[file]}>
      <div css={[styles.container, props.css]} className={classes} ref={containerRef}>
        <div className="interaction-blocker" />
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
