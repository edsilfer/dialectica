import { ThemeProvider, Themes } from '@edsilfer/commons'
import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
  render,
} from '@edsilfer/test-lib'
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CommentEditorProps } from './Editor'
import { Editor } from './Editor'

vi.mock('antd', async () => {
  const { createAntdMocks } = await import('@edsilfer/test-lib')
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
})

const typeInTextarea = (value: string) => {
  const textarea = screen.getByTestId('editor-textarea')
  fireEvent.change(textarea, { target: { value } })
}

const clickSaveButton = () => {
  fireEvent.click(screen.getByTestId('editor-button-save'))
}

const clickCancelButton = () => {
  fireEvent.click(screen.getByTestId('editor-button-cancel'))
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
    const props = createEditorProps({
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementToBeInTheDocument('editor-textarea')
  })

  it('given isVisible false when rendered expect component not rendered', () => {
    // GIVEN
    const props = createEditorProps({ isVisible: false })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementNotToBeInTheDocument('editor-textarea')
  })

  it('given initialText provided when rendered expect textarea value equals initialText', () => {
    // GIVEN
    const initialText = 'initial comment'
    const props = createEditorProps({
      initialText,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    const textarea = screen.getByTestId('editor-textarea')
    expect(textarea.value).toBe(initialText)
  })

  it('given user types new text when change event fired expect textarea value updated', () => {
    // GIVEN
    const props = createEditorProps({
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // WHEN
    typeInTextarea('updated')

    // EXPECT
    const textarea = screen.getByTestId('editor-textarea')
    expect(textarea.value).toBe('updated')
  })

  it('given new text and onSave callback when save button clicked expect onSave called with trimmed text', () => {
    // GIVEN
    const onSave = vi.fn()
    const props = createEditorProps({
      onSave,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )
    typeInTextarea('  updated comment  ')

    // WHEN
    clickSaveButton()

    // EXPECT
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('updated comment')
  })

  it('given unchanged text when save button clicked expect onSave called with trimmed text', () => {
    // GIVEN
    const onSave = vi.fn()
    const props = createEditorProps({
      onSave,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // WHEN
    clickSaveButton()

    // EXPECT
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('hello')
  })

  it('given cancel clicked after changes when clicked expect onCancel called and textarea reset', async () => {
    // GIVEN
    const onCancel = vi.fn()
    const props = createEditorProps({
      onCancel,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )
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
    const props = createEditorProps({
      onSave,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )
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
    const props = createEditorProps({
      onCancel,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // WHEN
    pressKey('Escape')

    // EXPECT
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('given text updated when preview tab clicked expect preview displays updated text', () => {
    // GIVEN
    const props = createEditorProps({
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )
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
    const props = createEditorProps({
      onTabHeaderAction,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // WHEN
    fireEvent.click(screen.getByTestId('tab-action-help'))

    // EXPECT
    expect(onTabHeaderAction).toHaveBeenCalledTimes(1)
    expect(onTabHeaderAction).toHaveBeenCalledWith('help')
  })

  it('given no buttons provided when rendered expect no footer buttons displayed', () => {
    // GIVEN
    const props = createEditorProps({ buttons: undefined })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Editor {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expect(screen.queryByTestId('editor-button-save')).not.toBeInTheDocument()
  })

  it('given custom button provided when custom button clicked expect onClick called', () => {
    // GIVEN
    const customOnClick = vi.fn()
    const props = createEditorProps({
      buttons: [{ key: 'custom', label: 'Custom Action', onClick: customOnClick }],
    })
    render(<Editor {...props} />)

    // WHEN
    fireEvent.click(screen.getByTestId('editor-button-custom-action'))

    // EXPECT
    expect(customOnClick).toHaveBeenCalledTimes(1)
  })

  it('given onTextChange provided when text changes expect onTextChange called', () => {
    // GIVEN
    const onTextChange = vi.fn()
    const props = createEditorProps({
      onTextChange,
      buttons: [
        { key: 'save', label: 'Save', type: 'primary' },
        { key: 'cancel', label: 'Cancel' },
      ],
    })
    render(<Editor {...props} />)

    // WHEN
    typeInTextarea('new text')

    // EXPECT
    expect(onTextChange).toHaveBeenCalledWith('new text')
  })
})
