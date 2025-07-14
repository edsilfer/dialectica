import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
} from '../../../../utils/test/generic-test-utils'
import { render } from '../../../../utils/test/render'
import type { CommentEditorProps } from './Editor'
import { Editor } from './Editor'

// MOCK
vi.mock('../../../../components/diff-viewer/providers/diff-viewer-context', () => ({
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
        textPrimary: '#24292f',
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
  return createAntdMocks()
})

// Helpers --------------------------------------------------------------
const createEditorProps = createPropsFactory<CommentEditorProps>({
  initialText: 'hello',
  placeholder: 'Edit comment...',
  isVisible: true,
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onTabHeaderAction: vi.fn(),
  isReviewing: false,
})

const typeInTextarea = (value: string) => {
  const textarea = screen.getByTestId('editor-textarea')
  fireEvent.change(textarea, { target: { value } })
}

const clickSaveButton = (isReviewing = false) => {
  const buttonText = isReviewing ? /add review comment/i : /start a review/i
  fireEvent.click(screen.getByRole('button', { name: buttonText }))
}

const clickCancelButton = () => {
  fireEvent.click(screen.getByTestId('cancel-button'))
}

const clickPreviewTab = () => {
  fireEvent.click(screen.getByText('Preview'))
}

const pressKey = (key: string, options: Partial<KeyboardEvent> = {}) => {
  const textarea = screen.getByTestId('editor-textarea')
  fireEvent.keyDown(textarea, { key, ...options })
}

// Tests ----------------------------------------------------------------

describe('Editor component', () => {
  it('given isVisible true when rendered expect textarea displayed', () => {
    // GIVEN
    const props = createEditorProps()

    // WHEN
    render(<Editor {...props} />)

    // EXPECT
    expectElementToBeInTheDocument('editor-textarea')
  })

  it('given isVisible false when rendered expect component not rendered', () => {
    // GIVEN
    const props = createEditorProps({ isVisible: false })

    // WHEN
    render(<Editor {...props} />)

    // EXPECT
    expectElementNotToBeInTheDocument('editor-textarea')
  })

  it('given initialText provided when rendered expect textarea value equals initialText', () => {
    // GIVEN
    const initialText = 'initial comment'
    const props = createEditorProps({ initialText })

    // WHEN
    render(<Editor {...props} />)

    // EXPECT
    const textarea = screen.getByTestId('editor-textarea')
    expect(textarea.value).toBe(initialText)
  })

  it('given user types new text when change event fired expect textarea value updated', () => {
    // GIVEN
    const props = createEditorProps()
    render(<Editor {...props} />)

    // WHEN
    typeInTextarea('updated')

    // EXPECT
    const textarea = screen.getByTestId('editor-textarea')
    expect(textarea.value).toBe('updated')
  })

  it('given new text and onSave callback when save button clicked expect onSave called with trimmed text', () => {
    // GIVEN
    const onSave = vi.fn()
    const props = createEditorProps({ onSave })
    render(<Editor {...props} />)
    typeInTextarea('  updated comment  ')

    // WHEN
    clickSaveButton()

    // EXPECT
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('updated comment')
  })

  it('given unchanged text when save button clicked expect onSave not called', () => {
    // GIVEN
    const onSave = vi.fn()
    const props = createEditorProps({ onSave })
    render(<Editor {...props} />)

    // WHEN
    clickSaveButton()

    // EXPECT
    expect(onSave).not.toHaveBeenCalled()
  })

  it('given cancel clicked after changes when clicked expect onCancel called and textarea reset', async () => {
    // GIVEN
    const onCancel = vi.fn()
    const props = createEditorProps({ onCancel })
    render(<Editor {...props} />)
    typeInTextarea('modified')

    // WHEN
    clickCancelButton()

    // EXPECT
    expect(onCancel).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => {
      const textarea = screen.getByTestId('editor-textarea')
      expect(textarea.value).toBe(props.initialText)
    })
  })

  it('given meta Enter pressed when keydown event fired expect onSave called', () => {
    // GIVEN
    const onSave = vi.fn()
    const props = createEditorProps({ onSave })
    render(<Editor {...props} />)
    typeInTextarea('hotkey save')

    // WHEN
    pressKey('Enter', { metaKey: true })

    // EXPECT
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('hotkey save')
  })

  it('given escape pressed when keydown event fired expect onCancel called', () => {
    // GIVEN
    const onCancel = vi.fn()
    const props = createEditorProps({ onCancel })
    render(<Editor {...props} />)

    // WHEN
    pressKey('Escape')

    // EXPECT
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('given text updated when preview tab clicked expect preview displays updated text', () => {
    // GIVEN
    const props = createEditorProps()
    render(<Editor {...props} />)
    typeInTextarea('preview text')

    // WHEN
    clickPreviewTab()

    // EXPECT
    const preview = screen.getByTestId('editor-preview')
    expect(preview).toHaveTextContent('preview text')
  })

  it('given help action clicked when header button clicked expect onTabHeaderAction called with help', () => {
    // GIVEN
    const onTabHeaderAction = vi.fn()
    const props = createEditorProps({ onTabHeaderAction })
    render(<Editor {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('tab-action-help'))

    // EXPECT
    expect(onTabHeaderAction).toHaveBeenCalledTimes(1)
    expect(onTabHeaderAction).toHaveBeenCalledWith('help')
  })

  it('given isReviewing false when rendered expect save button shows "Start a review"', () => {
    // GIVEN
    const props = createEditorProps({ isReviewing: false })

    // WHEN
    render(<Editor {...props} />)

    // EXPECT
    expect(screen.getByRole('button', { name: /start a review/i })).toBeInTheDocument()
  })

  it('given isReviewing true when rendered expect save button shows "Add review comment"', () => {
    // GIVEN
    const props = createEditorProps({ isReviewing: true })

    // WHEN
    render(<Editor {...props} />)

    // EXPECT
    expect(screen.getByRole('button', { name: /add review comment/i })).toBeInTheDocument()
  })

  it('given isReviewing true and new text when save button clicked expect onSave called', () => {
    // GIVEN
    const onSave = vi.fn()
    const props = createEditorProps({ onSave, isReviewing: true })
    render(<Editor {...props} />)
    typeInTextarea('review comment')

    // WHEN
    clickSaveButton(true)

    // EXPECT
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('review comment')
  })
})
