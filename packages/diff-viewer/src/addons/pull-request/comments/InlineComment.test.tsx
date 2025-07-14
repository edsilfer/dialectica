import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
} from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { CommentAuthor, CommentMetadata, CommentState } from '../models/CommentMetadata'
import { InlineComment, InlineCommentEvent, type InlineCommentProps } from './InlineComment'

// MOCK ---------------------------------------------------------------
vi.mock('../../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: () => ({
    theme: {
      spacing: {
        sm: '0.5rem',
        xs: '0.25rem',
        xxs: '0.125rem',
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

vi.mock('./components/Header', () => ({ Header: () => <div data-testid="mock-header" /> }))

vi.mock('./components/Reply', () => ({
  Reply: (props: { onEventTrigger?: () => void }) => (
    <div data-testid="mock-reply" onClick={() => props.onEventTrigger?.()} />
  ),
}))

vi.mock('./components/Reactions', () => ({
  Reactions: (props: { onReactionClick?: (reaction: string) => void }) => (
    <div data-testid="mock-reactions" onClick={() => props.onReactionClick?.('heart')} />
  ),
}))

vi.mock('./components/Editor', () => ({
  Editor: (props: { onSave?: (text: string) => void; onCancel?: () => void }) => (
    <div data-testid="mock-editor">
      <button data-testid="mock-editor-save" onClick={() => props.onSave?.('new-body')}>
        save
      </button>
      <button data-testid="mock-editor-cancel" onClick={() => props.onCancel?.()}>
        cancel
      </button>
    </div>
  ),
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
  created_at: '2024-01-01T12:00:00Z',
  url: 'https://github.com/repo/pull/1#comment-1',
  body: 'comment',
  reactions: new Map<string, number>(),
  path: 'file.ts',
  line: 10,
  side: 'RIGHT' as const,
  state: CommentState.PUBLISHED,
}

const createComment = (overrides: Partial<CommentMetadata> = {}): CommentMetadata =>
  new CommentMetadata({ ...baseCommentData, ...overrides })

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
  it('given empty thread when rendered expect component not rendered', () => {
    // GIVEN
    const props = createInlineProps({ thread: [] })

    // WHEN
    render(<InlineComment {...props} />)

    // EXPECT
    expectElementNotToBeInTheDocument('inline-comments')
    expectElementNotToBeInTheDocument('draft-only-editor')
  })

  it('given more than one draft comment when rendered expect error thrown', () => {
    // GIVEN
    const draft1 = createComment({ id: 1, state: CommentState.DRAFT })
    const draft2 = createComment({ id: 2, state: CommentState.DRAFT })
    const props = createInlineProps({ thread: [draft1, draft2] })

    // WHEN & EXPECT
    expect(() => render(<InlineComment {...props} />)).toThrow('Thread cannot have more than one DRAFT comment')
  })

  it('given single draft only thread when save clicked expect SAVE_DRAFT triggered', () => {
    // GIVEN
    const draft = createComment({ state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-editor-save'))

    // EXPECT
    expectElementToBeInTheDocument('draft-only-editor')
    expect(onTrigger).toHaveBeenCalledWith(draft, InlineCommentEvent.SAVE_DRAFT, 'new-body')
  })

  it('given single draft only thread when cancel clicked expect CANCEL_DRAFT triggered', () => {
    // GIVEN
    const draft = createComment({ state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-editor-cancel'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(draft, InlineCommentEvent.CANCEL_DRAFT)
  })

  it('given published comments only thread when reply clicked expect ADD_DRAFT triggered', () => {
    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-reply'))

    // EXPECT
    expectElementToBeInTheDocument('inline-comments')
    expect(onTrigger).toHaveBeenCalledWith(published, InlineCommentEvent.ADD_DRAFT, '')
  })

  it('given published and draft comments when save clicked expect SAVE_DRAFT triggered', () => {
    // GIVEN
    const published = createComment({ id: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ id: 2, state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published, draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-editor-save'))

    // EXPECT
    expectElementToBeInTheDocument('inline-comments-with-draft')
    expect(onTrigger).toHaveBeenCalledWith(draft, InlineCommentEvent.SAVE_DRAFT, 'new-body')
  })

  it('given published and draft comments when cancel clicked expect CANCEL_DRAFT triggered', () => {
    // GIVEN
    const published = createComment({ id: 1, state: CommentState.PUBLISHED })
    const draft = createComment({ id: 2, state: CommentState.DRAFT })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published, draft], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-editor-cancel'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(draft, InlineCommentEvent.CANCEL_DRAFT)
  })

  it('given reaction clicked when reaction clicked expect POST_REACTION triggered', () => {
    // MOCK

    // GIVEN
    const published = createComment({ state: CommentState.PUBLISHED })
    const onTrigger = vi.fn()
    const props = createInlineProps({ thread: [published], onEventTrigger: onTrigger })
    render(<InlineComment {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('mock-reactions'))

    // EXPECT
    expect(onTrigger).toHaveBeenCalledWith(published, InlineCommentEvent.POST_REACTION, 'heart')
  })
})
