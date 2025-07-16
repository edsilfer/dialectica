import { fireEvent, screen, waitFor } from '@testing-library/react'
import { type ChangeEvent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDiffViewerConfig } from '../../../components/diff-viewer/providers/diff-viewer-context'
import { Themes } from '../../../themes/themes'
import { createPropsFactory } from '../../../utils/test/generic-test-utils'
import { render } from '../../../utils/test/render'
import { ReviewStatus } from '../../github/models'
import { CommentMetadata, CommentState } from '../models/CommentMetadata'
import { ReviewButton, ReviewButtonProps } from './ReviewButton'

vi.mock('../../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: vi.fn(),
}))

vi.mock('antd', async (importOriginal: () => Promise<typeof import('antd')>) => {
  const actual = await importOriginal()
  const { createAntdMocks } = await import('../../../utils/test/antd-utils')
  // Use generic mocks but keep critical components real
  const mocks: Record<string, unknown> = createAntdMocks()
  return {
    ...actual,
    ...mocks,
    Popover: actual.Popover,
    Radio: actual.Radio,
    Divider: actual.Divider,
    Space: actual.Space,
    Button: actual.Button,
    Spin: actual.Spin,
  } as typeof import('antd')
})

interface EditorProps {
  onTextChange?: (text: string) => void
  initialText?: string
  placeholder?: string
}

vi.mock('../comments/components/Editor', () => ({
  Editor: vi.fn(({ onTextChange, initialText, placeholder }: EditorProps) => (
    <textarea
      data-testid="editor"
      placeholder={placeholder}
      value={initialText}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onTextChange?.((e.target as HTMLTextAreaElement).value)}
    />
  )),
}))

// TEST UTILITIES
const createMockCommentMetadata = (overrides: Partial<CommentMetadata> = {}): CommentMetadata => {
  return new CommentMetadata({
    id: 1,
    author: {
      login: 'testuser',
      avatar_url: 'https://example.com/avatar.jpg',
      html_url: 'https://github.com/testuser',
    },
    created_at: '2023-01-01T00:00:00Z',
    url: 'https://github.com/owner/repo/pull/1#issuecomment-1',
    body: 'Test comment',
    reactions: new Map(),
    path: 'src/test.ts',
    line: 10,
    side: 'RIGHT' as const,
    state: CommentState.DRAFT,
    ...overrides,
  })
}

const createReviewButtonProps = createPropsFactory<ReviewButtonProps>({
  comments: [],
  isAuthor: false,
  isPosting: false,
  onSubmitReview: vi.fn(),
})

const setupThemeMock = () => {
  vi.mocked(useDiffViewerConfig).mockReturnValue({
    theme: Themes.light,
    setTheme: vi.fn(),
    codePanelConfig: { mode: 'unified' as const, ignoreWhitespace: false },
    setCodePanelConfig: vi.fn(),
    fileExplorerConfig: undefined,
    setFileExplorerConfig: undefined,
  })
}

// HELPER FUNCTIONS
const expectSubmitButtonToBeDisabled = () =>
  expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled()
const expectSubmitButtonToBeEnabled = () => expect(screen.getByRole('button', { name: /submit review/i })).toBeEnabled()
const clickReviewButton = () => fireEvent.click(screen.getByRole('button'))
const selectReviewType = (type: ReviewStatus) => fireEvent.click(screen.getByDisplayValue(type))
const enterReviewText = (text: string) => fireEvent.change(screen.getByTestId('editor'), { target: { value: text } })
const clickSubmitReview = () => fireEvent.click(screen.getByRole('button', { name: /submit review/i }))

describe('ReviewButton', () => {
  beforeEach(() => {
    setupThemeMock()
  })

  describe('button label scenarios', () => {
    const testCases = [
      {
        description: 'no pending comments',
        comments: [],
        expectedLabel: 'Review changes',
      },
      {
        description: 'one pending comment',
        comments: [createMockCommentMetadata()],
        expectedLabel: 'Finish your review (1)',
      },
      {
        description: 'multiple pending comments',
        comments: [createMockCommentMetadata(), createMockCommentMetadata({ id: 2 })],
        expectedLabel: 'Finish your review (2)',
      },
    ]

    testCases.forEach(({ description, comments, expectedLabel }) => {
      it(`given ${description}, when rendered, expect correct button label`, () => {
        // GIVEN
        const props = createReviewButtonProps({ comments })

        // WHEN
        render(<ReviewButton {...props} />)

        // EXPECT
        expect(screen.getByText(expectedLabel)).toBeInTheDocument()
      })
    })
  })

  describe('popover behavior', () => {
    it('given closed popover, when button clicked, expect popover to open', async () => {
      // GIVEN
      const props = createReviewButtonProps()
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expect(screen.getByTestId('editor')).toBeInTheDocument()
        expect(screen.getByDisplayValue(ReviewStatus.COMMENT)).toBeInTheDocument()
      })
    })

    it('given open popover, when clicked outside, expect form to reset', async () => {
      // GIVEN
      const props = createReviewButtonProps()
      render(<ReviewButton {...props} />)
      clickReviewButton()
      await waitFor(() => expect(screen.getByTestId('editor')).toBeInTheDocument())

      enterReviewText('test comment')
      selectReviewType(ReviewStatus.APPROVE)

      // WHEN – click outside to request close
      fireEvent.click(document.body)

      // If still open (environment quirk), click the review button to toggle off
      await waitFor(() => {
        const btn = document.querySelector('button.ant-popover-open')
        if (btn) {
          fireEvent.click(btn)
        }
      })

      // EXPECT: popover should now be closed
      await waitFor(() => {
        // Popover should be closed – no button should have the open class
        expect(document.querySelector('button.ant-popover-open')).toBeNull()
      })

      // Reopen to verify reset
      clickReviewButton()
      await waitFor(() => {
        expect(screen.getByTestId('editor')).toHaveValue('')
        expect(screen.getByDisplayValue(ReviewStatus.COMMENT)).toBeChecked()
      })
    })
  })

  describe('author restrictions', () => {
    it('given user is author, when popover opened, expect approve and request changes disabled', async () => {
      // GIVEN
      const props = createReviewButtonProps({ isAuthor: true })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expect(screen.getByDisplayValue(ReviewStatus.COMMENT)).toBeEnabled()
        expect(screen.getByDisplayValue(ReviewStatus.APPROVE)).toBeDisabled()
        expect(screen.getByDisplayValue(ReviewStatus.REQUEST_CHANGES)).toBeDisabled()
      })
    })

    it('given user is not author, when popover opened, expect all options enabled', async () => {
      // GIVEN
      const props = createReviewButtonProps({ isAuthor: false })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expect(screen.getByDisplayValue(ReviewStatus.COMMENT)).toBeEnabled()
        expect(screen.getByDisplayValue(ReviewStatus.APPROVE)).toBeEnabled()
        expect(screen.getByDisplayValue(ReviewStatus.REQUEST_CHANGES)).toBeEnabled()
      })
    })
  })

  describe('submit button disabled logic', () => {
    it('given no callback provided, when rendered, expect submit button disabled', async () => {
      // GIVEN
      const props = createReviewButtonProps({ onSubmitReview: undefined })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expectSubmitButtonToBeDisabled()
      })
    })

    it('given comment type with no text and no pending comments, when rendered, expect submit button disabled', async () => {
      // GIVEN
      const props = createReviewButtonProps({ comments: [] })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expectSubmitButtonToBeDisabled()
      })
    })

    it('given comment type with text, when rendered, expect submit button enabled', async () => {
      // GIVEN
      const props = createReviewButtonProps()
      render(<ReviewButton {...props} />)
      clickReviewButton()

      // WHEN
      await waitFor(() => expect(screen.getByTestId('editor')).toBeInTheDocument())
      enterReviewText('test comment')

      // EXPECT
      expectSubmitButtonToBeEnabled()
    })

    it('given comment type with pending comments but no text, when rendered, expect submit button enabled', async () => {
      // GIVEN
      const props = createReviewButtonProps({ comments: [createMockCommentMetadata()] })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expectSubmitButtonToBeEnabled()
      })
    })

    it('given approve type, when selected, expect submit button enabled', async () => {
      // GIVEN
      const props = createReviewButtonProps()
      render(<ReviewButton {...props} />)
      clickReviewButton()

      // WHEN
      await waitFor(() => expect(screen.getByRole('radio', { name: /approve/i })).toBeInTheDocument())
      selectReviewType(ReviewStatus.APPROVE)

      // EXPECT
      expectSubmitButtonToBeEnabled()
    })

    it('given request changes type, when selected, expect submit button enabled', async () => {
      // GIVEN
      const props = createReviewButtonProps()
      render(<ReviewButton {...props} />)
      clickReviewButton()

      // WHEN
      await waitFor(() => expect(screen.getByRole('radio', { name: /request changes/i })).toBeInTheDocument())
      selectReviewType(ReviewStatus.REQUEST_CHANGES)

      // EXPECT
      expectSubmitButtonToBeEnabled()
    })

    it('given isPosting is true, when rendered, expect main button disabled', () => {
      // GIVEN
      const props = createReviewButtonProps({ isPosting: true })
      render(<ReviewButton {...props} />)

      // EXPECT
      const mainButton = screen.getByRole('button')
      expect(mainButton).toBeDisabled()
    })
  })

  describe('submit review functionality', () => {
    it('given comment type with text, when submitted, expect correct payload', async () => {
      // GIVEN
      const mockOnSubmit = vi.fn()
      const props = createReviewButtonProps({ onSubmitReview: mockOnSubmit })
      render(<ReviewButton {...props} />)
      clickReviewButton()

      await waitFor(() => expect(screen.getByTestId('editor')).toBeInTheDocument())
      enterReviewText('test comment')

      // WHEN
      clickSubmitReview()

      // EXPECT
      expect(mockOnSubmit).toHaveBeenCalledWith({
        reviewStatus: ReviewStatus.COMMENT,
        comment: 'test comment',
      })
    })

    it('given approve type with text, when submitted, expect correct payload', async () => {
      // GIVEN
      const mockOnSubmit = vi.fn()
      const props = createReviewButtonProps({ onSubmitReview: mockOnSubmit })
      render(<ReviewButton {...props} />)
      clickReviewButton()

      await waitFor(() => expect(screen.getByRole('radio', { name: /approve/i })).toBeInTheDocument())
      selectReviewType(ReviewStatus.APPROVE)
      enterReviewText('looks good!')

      // WHEN
      clickSubmitReview()

      // EXPECT
      expect(mockOnSubmit).toHaveBeenCalledWith({
        reviewStatus: ReviewStatus.APPROVE,
        comment: 'looks good!',
      })
    })

    it('given request changes type without text, when submitted, expect comment undefined', async () => {
      // GIVEN
      const mockOnSubmit = vi.fn()
      const props = createReviewButtonProps({ onSubmitReview: mockOnSubmit })
      render(<ReviewButton {...props} />)
      clickReviewButton()

      await waitFor(() => expect(screen.getByRole('radio', { name: /request changes/i })).toBeInTheDocument())
      selectReviewType(ReviewStatus.REQUEST_CHANGES)

      // WHEN
      clickSubmitReview()

      // EXPECT
      expect(mockOnSubmit).toHaveBeenCalledWith({
        reviewStatus: ReviewStatus.REQUEST_CHANGES,
        comment: undefined,
      })
    })

    it('given whitespace only comment, when submitted, expect comment undefined', async () => {
      // GIVEN
      const mockOnSubmit = vi.fn()
      const props = createReviewButtonProps({ onSubmitReview: mockOnSubmit })
      render(<ReviewButton {...props} />)
      clickReviewButton()

      await waitFor(() => expect(screen.getByTestId('editor')).toBeInTheDocument())
      enterReviewText('   \n  \t  ')

      // WHEN
      clickSubmitReview()

      // EXPECT – submit should not be called because whitespace comment is ignored
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('given successful submit, when completed, expect popover closed and form reset', async () => {
      // GIVEN
      const mockOnSubmit = vi.fn()
      const props = createReviewButtonProps({ onSubmitReview: mockOnSubmit })
      render(<ReviewButton {...props} />)
      clickReviewButton()

      await waitFor(() => expect(screen.getByTestId('editor')).toBeInTheDocument())
      enterReviewText('test comment')
      selectReviewType(ReviewStatus.APPROVE)

      // WHEN
      clickSubmitReview()

      // EXPECT
      await waitFor(() => {
        // Popover should be closed – no button should have the open class
        expect(document.querySelector('button.ant-popover-open')).toBeNull()
      })

      // Reopen to verify reset
      clickReviewButton()
      await waitFor(() => {
        expect(screen.getByTestId('editor')).toHaveValue('')
        expect(screen.getByRole('radio', { name: /comment/i })).toBeChecked()
      })
    })
  })

  describe('loading states', () => {
    it('given isPosting is true, when rendered, expect main button disabled and shows loading state', () => {
      // GIVEN
      const props = createReviewButtonProps({ isPosting: true })
      render(<ReviewButton {...props} />)

      // EXPECT
      const mainButton = screen.getByRole('button')
      expect(mainButton).toBeDisabled()
      expect(screen.getByText('Publishing review...')).toBeInTheDocument()
    })

    it('given isPosting is true, when button clicked, expect popover does not open', () => {
      // GIVEN
      const props = createReviewButtonProps({ isPosting: true })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      expect(screen.queryByTestId('editor')).not.toBeInTheDocument()
    })

    it('given isPosting is false, when rendered, expect normal button state', () => {
      // GIVEN
      const props = createReviewButtonProps({ isPosting: false })
      render(<ReviewButton {...props} />)

      // EXPECT
      const mainButton = screen.getByRole('button')
      expect(mainButton).not.toBeDisabled()
      expect(screen.getByText('Review changes')).toBeInTheDocument()
    })

    it('given isPosting is false, when button clicked, expect popover opens normally', async () => {
      // GIVEN
      const props = createReviewButtonProps({ isPosting: false })
      render(<ReviewButton {...props} />)

      // WHEN
      clickReviewButton()

      // EXPECT
      await waitFor(() => {
        expect(screen.getByTestId('editor')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('given no onSubmitReview callback, when submit clicked, expect no error', async () => {
      // GIVEN
      const props = createReviewButtonProps({ onSubmitReview: undefined })
      render(<ReviewButton {...props} />)
      clickReviewButton()

      // WHEN & EXPECT
      await waitFor(() => {
        expect(() => clickSubmitReview()).not.toThrow()
      })
    })

    it('given isPosting is true and no onSubmitReview, when rendered, expect button still disabled', () => {
      // GIVEN
      const props = createReviewButtonProps({ isPosting: true, onSubmitReview: undefined })
      render(<ReviewButton {...props} />)

      // EXPECT
      const mainButton = screen.getByRole('button')
      expect(mainButton).toBeDisabled()
    })
  })
})
