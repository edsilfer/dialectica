import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
  render,
} from '@test-lib'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CommentAuthor } from '../../models/CommentMetadata'
import type { CommentReplyProps } from './Reply'
import { Reply } from './Reply'

// MOCK
vi.mock('../../../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: () => ({
    theme: {
      spacing: {
        sm: '0.5rem',
        xs: '0.25rem',
      },
      colors: {
        backgroundContainer: '#f6f8fa',
        border: '#d0d7de',
        backgroundPrimary: '#ffffff',
      },
    },
  }),
}))

// Helpers --------------------------------------------------------------
const createCommentAuthor = createPropsFactory<CommentAuthor>({
  login: 'tester',
  avatar_url: 'https://example.com/avatar.png',
  html_url: 'https://github.com/tester',
})

const createReplyProps = createPropsFactory<CommentReplyProps>({
  currentUser: createCommentAuthor(),
  placeholder: 'Write a reply...',
  isVisible: true,
  onEventTrigger: vi.fn(),
})

// Tests ----------------------------------------------------------------

describe('Reply component', () => {
  it('given isVisible true, when rendered, expect container avatar textarea displayed', () => {
    // GIVEN
    const props = createReplyProps()

    // WHEN
    render(<Reply {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('comment-reply')
    expectElementToBeInTheDocument('reply-author-avatar')
    expectElementToBeInTheDocument('reply-textarea')
  })

  it('given isVisible false, when rendered, expect component not rendered', () => {
    // GIVEN
    const props = createReplyProps({ isVisible: false })

    // WHEN
    render(<Reply {...props} />)

    // EXPECT
    expectElementNotToBeInTheDocument('comment-reply')
  })

  it('given onEventTrigger provided, when container clicked, expect callback called once', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const props = createReplyProps({ onEventTrigger: mockTrigger })
    render(<Reply {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('comment-reply'))

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })

  it('given custom placeholder, when rendered, expect textarea placeholder used', () => {
    // GIVEN
    const customPlaceholder = 'Add your thoughts...'
    const props = createReplyProps({ placeholder: customPlaceholder })

    // WHEN
    render(<Reply {...props} />)

    // EXPECT
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
  })

  it('given textarea clicked, when clicked, expect callback triggered once', () => {
    // GIVEN
    const mockTrigger = vi.fn()
    const props = createReplyProps({ onEventTrigger: mockTrigger })
    render(<Reply {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('reply-textarea'))

    // EXPECT
    expect(mockTrigger).toHaveBeenCalledTimes(1)
  })

  it('given rendered textarea, when inspected, expect readonly attribute true', () => {
    // GIVEN
    const props = createReplyProps()
    render(<Reply {...props} />)

    // WHEN
    const textarea = screen.getByTestId('reply-textarea')

    // EXPECT
    expect(textarea.readOnly).toBe(true)
  })
})
