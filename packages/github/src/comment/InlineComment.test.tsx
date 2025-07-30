import { ThemeProvider, Themes } from '@commons'
import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
  render,
} from '@test-lib'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StaticCommentProps } from './components/DisplayComment'
import type { DraftCommentProps } from './components/DraftComment'
import type { CommentReplyProps } from './components/Reply'
import { InlineComment, type InlineCommentProps } from './InlineComment'
import { CommentAuthor, CommentEvent, CommentMetadata, CommentState } from './models'

vi.mock('antd', async () => {
  const { createAntdMocks } = await import('@test-lib')
  return createAntdMocks()
})

// Create mock functions that we can track
const mockDisplayComment = vi.fn()
const mockDraftComment = vi.fn()

vi.mock('./components/DisplayComment', () => ({
  DisplayComment: (props: StaticCommentProps) => {
    mockDisplayComment(props)
    return (
      <div data-testid="mock-display-comment">
        {props.thread.map((comment: CommentMetadata) => (
          <button
            key={comment.serverId}
            data-testid={`mock-display-reaction-${comment.serverId}`}
            onClick={() => props.onEventTrigger?.(CommentEvent.REACT, comment, 'heart')}
          >
            react
          </button>
        ))}
      </div>
    )
  },
}))

vi.mock('./components/DraftComment', () => ({
  DraftComment: (props: DraftCommentProps) => {
    mockDraftComment(props)
    return (
      <div data-testid={`mock-draft-comment-${props.comment.serverId}`}>
        <button
          data-testid={`mock-draft-save-${props.comment.serverId}`}
          onClick={() => props.onEventTrigger?.(CommentEvent.SAVE, props.comment, 'new-body')}
        >
          save
        </button>
        <button
          data-testid={`mock-draft-cancel-${props.comment.serverId}`}
          onClick={() => props.onEventTrigger?.(CommentEvent.CANCEL, props.comment)}
        >
          cancel
        </button>
      </div>
    )
  },
}))

vi.mock('./components/Reply', () => ({
  Reply: (props: CommentReplyProps) => <div data-testid="mock-reply" onClick={() => props.onEventTrigger?.()} />,
}))

// Helpers --------------------------------------------------------------
const renderWithContext = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={Themes.light}>{ui}</ThemeProvider>)
}

const createCommentAuthor = createPropsFactory<CommentAuthor>({
  login: 'author',
  avatar_url: 'https://example.com/avatar.png',
  html_url: 'https://github.com/author',
})

const baseCommentData = {
  serverId: 1,
  author: createCommentAuthor(),
  createdAt: '2024-01-01T12:00:00Z',
  updatedAt: undefined,
  url: 'https://github.com/repo/pull/1#comment-1',
  body: 'comment',
  reactions: new Map<string, number>(),
  path: 'file.ts',
  line: 10,
  side: 'RIGHT' as const,
  state: CommentState.PUBLISHED,
  wasPublished: true,
}

const createComment = (overrides: Partial<typeof baseCommentData> = {}): CommentMetadata => {
  const data = { ...baseCommentData, ...overrides }
  return new CommentMetadata(data)
}

const createInlineProps = (overrides: Partial<InlineCommentProps> = {}): InlineCommentProps => {
  const defaultThread = [createComment()]
  const defaults: InlineCommentProps = {
    thread: defaultThread,
    currentUser: createCommentAuthor({ login: 'viewer' }),
    onEventTrigger: vi.fn(),
  }
  return { ...defaults, ...overrides }
}

// Tests ----------------------------------------------------------------
describe('InlineComment component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('given empty thread when rendered expect component not rendered', () => {
    // GIVEN
    const props = createInlineProps({ thread: [] })

    // WHEN
    renderWithContext(<InlineComment {...props} />)

    // EXPECT
    expectElementNotToBeInTheDocument('inline-comments')
  })

  it('given single published comment when rendered expect display comment and reply shown', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const props = createInlineProps({ thread: [published] })
    renderWithContext(<InlineComment {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expectElementToBeInTheDocument('mock-display-comment')
    // Check for either mock or actual reply component
    const mockReply = screen.queryByTestId('mock-reply')
    const actualReply = screen.queryByTestId('comment-reply')
    expect(mockReply || actualReply).toBeInTheDocument()
    expect(mockDisplayComment).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: [published],
        currentUser: props.currentUser,
        onEventTrigger: props.onEventTrigger,
      }),
    )
  })

  it('given single draft comment when rendered expect draft comment shown and no reply', () => {
    // GIVEN
    const draft = createComment({ state: CommentState.DRAFT })
    const props = createInlineProps({ thread: [draft] })
    renderWithContext(<InlineComment {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expectElementToBeInTheDocument('mock-draft-comment-1')
    expectElementNotToBeInTheDocument('mock-reply')
    expect(mockDraftComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment: draft,
        isReviewing: undefined,
        onEventTrigger: props.onEventTrigger,
      }),
    )
  })

  it('given published and draft comments when rendered expect both components shown in order', () => {
    // GIVEN
    const published = createComment({ serverId: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ serverId: 2, state: CommentState.DRAFT })
    const props = createInlineProps({ thread: [published, draft] })
    renderWithContext(<InlineComment {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expectElementToBeInTheDocument('mock-display-comment')
    expectElementToBeInTheDocument('mock-draft-comment-2')
    expectElementNotToBeInTheDocument('mock-reply')
    expect(mockDisplayComment).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: [published],
        currentUser: props.currentUser,
        onEventTrigger: props.onEventTrigger,
      }),
    )
    expect(mockDraftComment).toHaveBeenCalledWith(
      expect.objectContaining({
        comment: draft,
        isReviewing: undefined,
        onEventTrigger: props.onEventTrigger,
      }),
    )
  })

  it('given multiple published comments when rendered expect all shown with reply', () => {
    // GIVEN
    const published1 = createComment({ serverId: 1, state: CommentState.PUBLISHED })
    const published2 = createComment({ serverId: 2, state: CommentState.PUBLISHED })
    const props = createInlineProps({ thread: [published1, published2] })
    renderWithContext(<InlineComment {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expectElementToBeInTheDocument('mock-display-comment')
    // Check for either mock or actual reply component
    const mockReply = screen.queryByTestId('mock-reply')
    const actualReply = screen.queryByTestId('comment-reply')
    expect(mockReply || actualReply).toBeInTheDocument()
    expect(mockDisplayComment).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: [published1, published2],
        currentUser: props.currentUser,
        onEventTrigger: props.onEventTrigger,
      }),
    )
  })

  it('given draft comment when save clicked expect SAVE event triggered', () => {
    // GIVEN
    const draft = createComment({ state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [draft], onEventTrigger: onTrigger })
    renderWithContext(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-save-1'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(CommentEvent.SAVE, draft, 'new-body')
  })

  it('given draft comment when cancel clicked expect CANCEL event triggered', () => {
    // GIVEN
    const draft = createComment({ state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [draft], onEventTrigger: onTrigger })
    renderWithContext(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-cancel-1'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(CommentEvent.CANCEL, draft)
  })

  it('given published comment when reply clicked expect REPLY event triggered', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published], onEventTrigger: onTrigger })
    renderWithContext(<InlineComment {...props} />)

    // WHEN
    // Try to click either mock or actual reply component
    const mockReply = screen.queryByTestId('mock-reply')
    const actualReply = screen.queryByTestId('comment-reply')
    const replyElement = mockReply || actualReply
    expect(replyElement).toBeInTheDocument()
    fireEvent.click(replyElement!)

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(CommentEvent.REPLY, published, '')
  })

  it('given published comment when reaction clicked expect REACT event triggered', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published], onEventTrigger: onTrigger })
    renderWithContext(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-display-reaction-1'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(CommentEvent.REACT, published, 'heart')
  })

  it('given published and draft comments when draft save clicked expect SAVE event triggered', () => {
    // GIVEN
    const published = createComment({ serverId: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ serverId: 2, state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published, draft], onEventTrigger: onTrigger })
    renderWithContext(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-save-2'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(CommentEvent.SAVE, draft, 'new-body')
  })

  it('given published and draft comments when draft cancel clicked expect CANCEL event triggered', () => {
    // GIVEN
    const published = createComment({ serverId: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ serverId: 2, state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published, draft], onEventTrigger: onTrigger })
    renderWithContext(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-cancel-2'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(CommentEvent.CANCEL, draft)
  })
})
