import { fireEvent, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPropsFactory, expectElementToBeInTheDocument } from '../../../../utils/test/generic-test-utils'
import { render } from '../../../../utils/test/render'
import type { CommentAuthor } from '../../models/CommentMetadata'
import { CommentState } from '../../models/CommentMetadata'
import { InlineCommentEvent } from '../InlineComment'
import type { CommentHeaderProps } from './Header'
import { Header } from './Header'

// MOCK ---------------------------------------------------------------
const { mockWriteText, mockMessageSuccess, mockMessageError } = vi.hoisted(() => ({
  mockWriteText: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageError: vi.fn(),
}))

vi.mock('../../../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: () => ({
    theme: {
      spacing: {
        xs: '0.25rem',
      },
      colors: {
        textPrimary: '#24292f',
        textContainerPlaceholder: '#656d76',
        accent: '#0969da',
        border: '#d0d7de',
      },
      typography: {
        regularFontFamily: '-apple-system, BlinkMacSystemFont',
        regularFontSize: 14,
      },
    },
  }),
}))

vi.mock('antd', async () => {
  const { createAntdMocks } = await import('../../../../utils/test/antd-utils')
  return {
    ...createAntdMocks(),
    message: {
      success: mockMessageSuccess,
      error: mockMessageError,
    },
  }
})

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
})

// Helpers --------------------------------------------------------------
const createCommentAuthor = createPropsFactory<CommentAuthor>({
  login: 'author',
  avatar_url: 'https://example.com/author.png',
  html_url: 'https://github.com/author',
})

const createHeaderProps = createPropsFactory<CommentHeaderProps>({
  state: CommentState.PUBLISHED,
  author: createCommentAuthor(),
  currentUser: createCommentAuthor({ login: 'viewer' }),
  createdAt: '2024-01-01T12:00:00Z',
  commentUrl: 'https://github.com/repo/pull/1#comment-123',
  onEventTrigger: vi.fn(),
})

const clickMenuButton = () => {
  act(() => {
    fireEvent.click(screen.getByTestId('comment-menu-button'))
  })
}

const clickMenuOption = (optionText: string) => {
  act(() => {
    fireEvent.click(screen.getByText(optionText))
  })
}

const clickCopyLink = () => {
  act(() => {
    fireEvent.click(screen.getByText('Copy link'))
  })
}

// Test Data
const timeTestCases = [
  { hoursAgo: 0.5, expected: 'just now' },
  { hoursAgo: 1, expected: '1 hour ago' },
  { hoursAgo: 2, expected: '2 hours ago' },
  { hoursAgo: 23, expected: '23 hours ago' },
  { hoursAgo: 25, expected: '1 day ago' },
  { hoursAgo: 48, expected: '2 days ago' },
  { hoursAgo: 72, expected: '3 days ago' },
]

// Tests ----------------------------------------------------------------

describe('Header component', () => {
  let mockDate: Date

  beforeEach(() => {
    mockDate = new Date('2024-01-02T12:00:00Z')
    vi.setSystemTime(mockDate)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('given header props, when rendered, expect author link timestamp menu button displayed', () => {
    // GIVEN
    const props = createHeaderProps()

    // WHEN
    render(<Header {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('comment-author-link')
    expectElementToBeInTheDocument('comment-timestamp')
    expectElementToBeInTheDocument('comment-menu-button')
  })

  it('given author info, when rendered, expect author link has correct href and text', () => {
    // GIVEN
    const author = createCommentAuthor({ login: 'testuser', html_url: 'https://github.com/testuser' })
    const props = createHeaderProps({ author })

    // WHEN
    render(<Header {...props} />)

    // EXPECT
    const authorLink = screen.getByTestId('comment-author-link')
    expect(authorLink).toHaveAttribute('href', 'https://github.com/testuser')
    expect(authorLink).toHaveTextContent('testuser')
  })

  describe.each(timeTestCases)('timestamp formatting', ({ hoursAgo, expected }) => {
    it(`given timestamp ${hoursAgo} hours ago, when rendered, expect "${expected}" displayed`, () => {
      // GIVEN
      const createdAt = new Date(mockDate.getTime() - hoursAgo * 60 * 60 * 1000).toISOString()
      const props = createHeaderProps({ createdAt })

      // WHEN
      render(<Header {...props} />)

      // EXPECT
      expect(screen.getByTestId('comment-timestamp')).toHaveTextContent(expected)
    })
  })

  it('given current user is author and state is draft, when menu clicked, expect draft menu options available', () => {
    // GIVEN
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.SAVED_DRAFT,
      author,
      currentUser,
    })
    render(<Header {...props} />)

    // WHEN
    clickMenuButton()

    // EXPECT
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('given current user is not author and state is draft, when menu clicked, expect no menu options available', () => {
    // GIVEN
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'viewer' })
    const props = createHeaderProps({
      state: CommentState.SAVED_DRAFT,
      author,
      currentUser,
    })
    render(<Header {...props} />)

    // WHEN
    clickMenuButton()

    // EXPECT
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('given published comment and current user is author, when menu clicked, expect full menu options available', () => {
    // GIVEN
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.PUBLISHED,
      author,
      currentUser,
    })
    render(<Header {...props} />)

    // WHEN
    clickMenuButton()

    // EXPECT
    expect(screen.getByText('Copy link')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Resolve')).toBeInTheDocument()
  })

  it('given published comment and current user is not author, when menu clicked, expect limited menu options available', () => {
    // GIVEN
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'viewer' })
    const props = createHeaderProps({
      state: CommentState.PUBLISHED,
      author,
      currentUser,
    })
    render(<Header {...props} />)

    // WHEN
    clickMenuButton()

    // EXPECT
    expect(screen.getByText('Copy link')).toBeInTheDocument()
    expect(screen.getByText('Resolve')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('given copy link clicked and clipboard succeeds, when clicked, expect success message shown', async () => {
    // GIVEN
    mockWriteText.mockResolvedValue(undefined)
    const props = createHeaderProps({ state: CommentState.PUBLISHED })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickCopyLink()

    // EXPECT
    expect(mockWriteText).toHaveBeenCalledWith('https://github.com/repo/pull/1#comment-123')
    await vi.waitFor(() => {
      expect(mockMessageSuccess).toHaveBeenCalledWith('Link copied to clipboard')
    })
  })

  it('given copy link clicked and clipboard fails, when clicked, expect error message shown', async () => {
    // GIVEN
    mockWriteText.mockRejectedValue(new Error('Clipboard failed'))
    const props = createHeaderProps({ state: CommentState.PUBLISHED })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickCopyLink()

    // EXPECT
    expect(mockWriteText).toHaveBeenCalledWith('https://github.com/repo/pull/1#comment-123')
    await vi.waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('Failed to copy link')
    })
  })

  it('given draft edit clicked, when clicked, expect onEventTrigger called with EDIT_DRAFT', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.SAVED_DRAFT,
      author,
      currentUser,
      onEventTrigger: mockTrigger,
    })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickMenuOption('Edit')

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledWith(InlineCommentEvent.EDIT_DRAFT)
  })

  it('given draft delete clicked, when clicked, expect onEventTrigger called with DELETE_DRAFT', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.SAVED_DRAFT,
      author,
      currentUser,
      onEventTrigger: mockTrigger,
    })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickMenuOption('Delete')

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledWith(InlineCommentEvent.DELETE_DRAFT)
  })

  it('given published edit clicked, when clicked, expect onEventTrigger called with EDIT_PUBLISHED', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.PUBLISHED,
      author,
      currentUser,
      onEventTrigger: mockTrigger,
    })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickMenuOption('Edit')

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledWith(InlineCommentEvent.EDIT_PUBLISHED)
  })

  it('given published delete clicked, when clicked, expect onEventTrigger called with DELETE_PUBLISHED', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.PUBLISHED,
      author,
      currentUser,
      onEventTrigger: mockTrigger,
    })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickMenuOption('Delete')

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledWith(InlineCommentEvent.DELETE_PUBLISHED)
  })

  it('given resolve clicked, when clicked, expect onEventTrigger called with RESOLVE_PUBLISHED', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const props = createHeaderProps({
      state: CommentState.PUBLISHED,
      onEventTrigger: mockTrigger,
    })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN
    clickMenuOption('Resolve')

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledWith(InlineCommentEvent.RESOLVE_PUBLISHED)
  })

  it('given no onEventTrigger provided, when menu actions clicked, expect no error thrown', () => {
    // GIVEN
    const author = createCommentAuthor({ login: 'author' })
    const currentUser = createCommentAuthor({ login: 'author' })
    const props = createHeaderProps({
      state: CommentState.SAVED_DRAFT,
      author,
      currentUser,
      onEventTrigger: undefined,
    })
    render(<Header {...props} />)
    clickMenuButton()

    // WHEN & EXPECT
    expect(() => {
      clickMenuOption('Edit')
    }).not.toThrow()
  })
})
