import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDiffViewerConfig } from '../../components/diff-viewer/providers/diff-viewer-context'
import { Themes } from '../../themes/themes'
import { createAntdMocks } from '../../utils/test/antd-utils'
import { render } from '../../utils/test/render'
import type { InlineCommentData } from './types'
import { InlineComment } from './InlineComment'

// MOCKS
vi.mock('../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: vi.fn(),
}))

vi.mock('antd', () => createAntdMocks())

vi.mocked(useDiffViewerConfig).mockReturnValue({
  theme: Themes.light,
  setTheme: vi.fn(),
  codePanelConfig: undefined,
  setCodePanelConfig: undefined,
  fileExplorerConfig: undefined,
  setFileExplorerConfig: undefined,
})

const createMockComment = (overrides: Partial<InlineCommentData> = {}): InlineCommentData => ({
  id: '123',
  body: 'This is a test comment about the code changes.',
  author: {
    login: 'testuser',
    avatar_url: 'https://avatars.githubusercontent.com/u/123',
    html_url: 'https://github.com/testuser',
  },
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  resolved: false,
  html_url: 'https://github.com/owner/repo/pull/123#discussion_r123',
  ...overrides,
})

const createMockCallbacks = () => ({
  onReply: vi.fn(),
  onResolve: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
})

const renderComponent = (
  commentOverrides: Partial<InlineCommentData> = {},
  callbacks: Partial<ReturnType<typeof createMockCallbacks>> = {},
) => {
  const comment = createMockComment(commentOverrides)
  return render(<InlineComment comment={comment} {...callbacks} />)
}

describe('InlineComment', () => {
  describe('basic rendering', () => {
    it('given standard comment data, when rendered, expect comment content displayed', () => {
      // GIVEN
      const comment = createMockComment({
        body: 'This is an important comment about the implementation.',
        author: {
          login: 'johndoe',
          avatar_url: 'https://avatars.example.com/johndoe',
          html_url: 'https://github.com/johndoe',
        },
      })

      // WHEN
      render(<InlineComment comment={comment} />)

      // EXPECT
      expect(screen.getByText('This is an important comment about the implementation.')).toBeInTheDocument()
      expect(screen.getByText('johndoe')).toBeInTheDocument()
      expect(screen.getByAltText('johndoe')).toHaveAttribute('src', 'https://avatars.example.com/johndoe')
    })

    it('given comment with author info, when rendered, expect author link and avatar displayed', () => {
      // GIVEN
      const comment = createMockComment({
        author: {
          login: 'alice',
          avatar_url: 'https://avatars.example.com/alice',
          html_url: 'https://github.com/alice',
        },
      })

      // WHEN
      render(<InlineComment comment={comment} />)

      // EXPECT
      const authorLink = screen.getByText('alice')
      expect(authorLink).toBeInTheDocument()
      expect(authorLink.closest('a')).toHaveAttribute('href', 'https://github.com/alice')
      expect(authorLink.closest('a')).toHaveAttribute('target', '_blank')
      expect(authorLink.closest('a')).toHaveAttribute('rel', 'noreferrer')
    })
  })

  describe('timestamp formatting', () => {
    const cases: Array<[string, number]> = [
      ['just now', 0],
      ['1 hour ago', 60],
      ['2 hours ago', 2 * 60],
      ['3 days ago', 3 * 24 * 60],
    ]

    it.each(cases)('given comment from %s, when rendered, expect that text displayed', (expected, minutesAgo) => {
      const created_at = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
      renderComponent({ created_at })
      expect(screen.getByText(expected)).toBeInTheDocument()
    })
  })

  describe('resolved state', () => {
    it('given unresolved comment, when rendered, expect no resolved badge', () => {
      // GIVEN
      const comment = createMockComment({ resolved: false })

      // WHEN
      render(<InlineComment comment={comment} />)

      // EXPECT
      expect(screen.queryByText('Resolved')).not.toBeInTheDocument()
    })

    it('given resolved comment, when rendered, expect resolved badge displayed', () => {
      // GIVEN
      const comment = createMockComment({ resolved: true })

      // WHEN
      render(<InlineComment comment={comment} />)

      // EXPECT
      expect(screen.getByText('Resolved')).toBeInTheDocument()
    })
  })

  describe('action buttons', () => {
    it('given no callbacks provided, when rendered, expect no action buttons', () => {
      renderComponent()
      ;['Reply', 'Resolve', 'Edit', 'Delete'].forEach((label) => {
        expect(screen.queryByText(label)).not.toBeInTheDocument()
      })
    })

    it('given all callbacks provided, when rendered, expect all action buttons displayed', () => {
      const callbacks = createMockCallbacks()
      renderComponent({}, callbacks)
      ;['Reply', 'Resolve', 'Edit', 'Delete'].forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it('given resolved comment with resolve callback, when rendered, expect resolve button hidden', () => {
      const callbacks = createMockCallbacks()
      renderComponent({ resolved: true }, callbacks)
      expect(screen.queryByText('Resolve')).not.toBeInTheDocument()
    })
  })

  describe('callback interactions', () => {
    const cases: Array<[string, keyof ReturnType<typeof createMockCallbacks>]> = [
      ['Reply', 'onReply'],
      ['Resolve', 'onResolve'],
      ['Edit', 'onEdit'],
      ['Delete', 'onDelete'],
    ]

    it.each(cases)('given %s callback, when %s button clicked, expect callback called', (label, cbKey) => {
      const callbacks = createMockCallbacks()
      const callbackOverrides = { [cbKey]: callbacks[cbKey] } as Partial<ReturnType<typeof createMockCallbacks>>

      renderComponent({}, callbackOverrides)

      fireEvent.click(screen.getByText(label))
      expect(callbacks[cbKey]).toHaveBeenCalledTimes(1)
    })
  })

  describe('styling and structure', () => {
    it('given component rendered, when inspected, expect correct data-testid attributes', () => {
      // GIVEN
      const comment = createMockComment()

      // WHEN
      render(<InlineComment comment={comment} />)

      // EXPECT
      expect(screen.getByTestId('inline-comment')).toBeInTheDocument()
      expect(screen.getByTestId('comment-author-avatar')).toBeInTheDocument()
      expect(screen.getByTestId('comment-author-link')).toBeInTheDocument()
      expect(screen.getByTestId('comment-timestamp')).toBeInTheDocument()
      expect(screen.getByTestId('comment-body')).toBeInTheDocument()
    })

    it('given comment with long body, when rendered, expect text wrapped properly', () => {
      // GIVEN
      const longBody = 'This is a very long comment that should wrap properly when displayed in the component. '.repeat(
        10,
      )
      const comment = createMockComment({ body: longBody })

      // WHEN
      render(<InlineComment comment={comment} />)

      // EXPECT
      const bodyElement = screen.getByTestId('comment-body')
      expect(bodyElement).toHaveStyle('white-space: pre-wrap')
      expect(bodyElement).toHaveStyle('word-break: break-word')
    })
  })
})
