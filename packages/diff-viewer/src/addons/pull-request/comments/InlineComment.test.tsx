import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
} from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { CommentAuthor, CommentEvent, CommentMetadata, CommentState } from '../models/CommentMetadata'
import { InlineComment, type InlineCommentProps } from './InlineComment'
import type { StaticCommentProps } from './DisplayComment'
import type { DraftCommentProps } from './DraftComment'
import type { CommentReplyProps } from './components/Reply'

// MOCK ---------------------------------------------------------------
vi.mock('../../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: () => ({
    theme: {
      spacing: {
        sm: '0.5rem',
        xs: '0.25rem',
        xxs: '0.125rem',
        md: '1rem',
      },
      colors: {
        backgroundPrimary: '#ffffff',
        backgroundContainer: '#f6f8fa',
        border: '#d0d7de',
        textPrimary: '#24292f',
        accent: '#0969da',
      },
      typography: {
        regularFontFamily: '-apple-system, BlinkMacSystemFont',
        regularFontSize: 14,
      },
    },
  }),
}))

vi.mock('antd', async () => {
  const { createAntdMocks } = await import('../../../utils/test/antd-utils')
  return createAntdMocks()
})

// Create mock functions that we can track
const mockDisplayComment = vi.fn()
const mockDraftComment = vi.fn()

vi.mock('./DisplayComment', () => ({
  DisplayComment: (props: StaticCommentProps) => {
    mockDisplayComment(props)
    return (
      <div data-testid="mock-display-comment">
        {props.thread.map((comment: CommentMetadata) => (
          <button
            key={comment.id}
            data-testid={`mock-display-reaction-${comment.id}`}
            onClick={() => props.onEventTrigger?.(comment, CommentEvent.REACT, 'heart')}
          >
            react
          </button>
        ))}
      </div>
    )
  },
}))

vi.mock('./DraftComment', () => ({
  DraftComment: (props: DraftCommentProps) => {
    mockDraftComment(props)
    return (
      <div data-testid={`mock-draft-comment-${props.comment.id}`}>
        <button
          data-testid={`mock-draft-save-${props.comment.id}`}
          onClick={() => props.onEventTrigger?.(props.comment, CommentEvent.SAVE, 'new-body')}
        >
          save
        </button>
        <button
          data-testid={`mock-draft-cancel-${props.comment.id}`}
          onClick={() => props.onEventTrigger?.(props.comment, CommentEvent.CANCEL)}
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
const createCommentAuthor = createPropsFactory<CommentAuthor>({
  login: 'author',
  avatar_url: 'https://example.com/avatar.png',
  html_url: 'https://github.com/author',
})

const baseCommentData = {
  id: 1,
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
    render(<InlineComment {...props} />)

    // EXPECT
    expectElementNotToBeInTheDocument('inline-comments')
  })

  it('given single published comment when rendered expect display comment and reply shown', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const props = createInlineProps({ thread: [published] })
    render(<InlineComment {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expectElementToBeInTheDocument('mock-display-comment')
    expectElementToBeInTheDocument('mock-reply')
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
    render(<InlineComment {...props} />)

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
    const published = createComment({ id: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ id: 2, state: CommentState.DRAFT })
    const props = createInlineProps({ thread: [published, draft] })
    render(<InlineComment {...props} />)

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
    const published1 = createComment({ id: 1, state: CommentState.PUBLISHED })
    const published2 = createComment({ id: 2, state: CommentState.PUBLISHED })
    const props = createInlineProps({ thread: [published1, published2] })
    render(<InlineComment {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expectElementToBeInTheDocument('mock-display-comment')
    expectElementToBeInTheDocument('mock-reply')
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
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-save-1'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(draft, CommentEvent.SAVE, 'new-body')
  })

  it('given draft comment when cancel clicked expect CANCEL event triggered', () => {
    // GIVEN
    const draft = createComment({ state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-cancel-1'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(draft, CommentEvent.CANCEL)
  })

  it('given published comment when reply clicked expect REPLY event triggered', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-reply'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(published, CommentEvent.REPLY, '')
  })

  it('given published comment when reaction clicked expect REACT event triggered', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-display-reaction-1'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(published, CommentEvent.REACT, 'heart')
  })

  it('given published and draft comments when draft save clicked expect SAVE event triggered', () => {
    // GIVEN
    const published = createComment({ id: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ id: 2, state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published, draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-save-2'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(draft, CommentEvent.SAVE, 'new-body')
  })

  it('given published and draft comments when draft cancel clicked expect CANCEL event triggered', () => {
    // GIVEN
    const published = createComment({ id: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ id: 2, state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published, draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-draft-cancel-2'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(draft, CommentEvent.CANCEL)
  })
})
