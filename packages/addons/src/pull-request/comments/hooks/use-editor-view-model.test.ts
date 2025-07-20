import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { useEditorViewModel } from './use-editor-view-model'

// MOCK

// Helper to create a fake textarea element with selection APIs
const createFakeTextarea = (selectionStart = 0, selectionEnd = 0) => {
  return {
    selectionStart,
    selectionEnd,
    focus: vi.fn(),
    setSelectionRange: vi.fn(),
  } as unknown as HTMLTextAreaElement
}

describe('useEditorViewModel', () => {
  const initialText = 'hello world'
  let onSave: ReturnType<typeof vi.fn>
  let onCancel: ReturnType<typeof vi.fn>
  let onHeaderAction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSave = vi.fn()
    onCancel = vi.fn()
    onHeaderAction = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('given initialText, when hook initializes, expect editText and previewText to equal initialText', () => {
    // WHEN
    const { result } = renderHook(() =>
      useEditorViewModel({ initialText, onSave, onCancel, onTabHeaderAction: onHeaderAction }),
    )

    // EXPECT
    expect(result.current.editText).toBe(initialText)
    expect(result.current.previewText).toBe(initialText)
  })

  it('given new initialText, when prop changes, expect editText and previewText to update', () => {
    // GIVEN
    const { result, rerender } = renderHook(({ text }) => useEditorViewModel({ initialText: text, onSave }), {
      initialProps: { text: 'old' },
    })

    // WHEN
    rerender({ text: 'new' })

    // EXPECT
    expect(result.current.editText).toBe('new')
    expect(result.current.previewText).toBe('new')
  })

  it('given valid text and onSave, when handleSave called, expect onSave invoked with trimmed text', () => {
    // GIVEN
    const { result } = renderHook(() => useEditorViewModel({ initialText, onSave }))

    // WHEN
    act(() => {
      result.current.setEditText('  updated  ')
    })
    act(() => {
      result.current.handleSave()
    })

    // EXPECT
    expect(onSave).toHaveBeenCalledWith('updated')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('given empty text, when handleSave called, expect onSave not invoked', () => {
    // GIVEN
    const { result } = renderHook(() => useEditorViewModel({ initialText: '', onSave }))

    // WHEN
    act(() => {
      result.current.setEditText('   ')
      result.current.handleSave()
    })

    // EXPECT
    expect(onSave).not.toHaveBeenCalled()
  })

  it('given handleCancel called, expect editText reset and onCancel invoked', () => {
    // GIVEN
    const { result } = renderHook(() => useEditorViewModel({ initialText, onCancel }))

    act(() => {
      result.current.setEditText('changed')
    })

    // WHEN
    act(() => {
      result.current.handleCancel()
    })

    // EXPECT
    expect(result.current.editText).toBe(initialText)
    expect(onCancel).toHaveBeenCalled()
  })

  it('given ctrl+Enter pressed, when handleKeyDown called, expect save triggered', () => {
    // GIVEN
    const { result } = renderHook(() => useEditorViewModel({ initialText, onSave }))

    act(() => {
      result.current.setEditText('new')
    })

    const preventDefault = vi.fn()
    const event = {
      key: 'Enter',
      ctrlKey: true,
      metaKey: false,
      preventDefault,
    } as unknown as React.KeyboardEvent

    // WHEN
    act(() => {
      result.current.handleKeyDown(event)
    })

    // EXPECT
    expect(preventDefault).toHaveBeenCalled()
    expect(onSave).toHaveBeenCalledWith('new')
  })

  it('given escape pressed, when handleKeyDown called, expect cancel triggered', () => {
    // GIVEN
    const { result } = renderHook(() => useEditorViewModel({ initialText, onCancel }))

    const event = {
      key: 'Escape',
    } as unknown as React.KeyboardEvent

    // WHEN
    act(() => {
      result.current.handleKeyDown(event)
    })

    // EXPECT
    expect(onCancel).toHaveBeenCalled()
  })

  it('given editText changed and preview tab activated, when handleTabClick called, expect previewText updated', () => {
    // GIVEN
    const { result } = renderHook(() => useEditorViewModel({ initialText }))

    // WHEN
    act(() => {
      result.current.setEditText('preview this')
    })
    act(() => {
      result.current.handleTabClick('preview')
    })

    // EXPECT
    expect(result.current.activeTab).toBe('preview')
    expect(result.current.previewText).toBe('preview this')
  })

  describe('text manipulation helpers', () => {
    it('given selection, when handleWrap called, expect text wrapped with prefix/suffix', () => {
      // GIVEN
      const { result } = renderHook(() => useEditorViewModel({ initialText: 'abcde' }))

      const textarea = createFakeTextarea(1, 4) // select "bcd"
      // @ts-expect-error mocking private field
      result.current.textAreaRef.current = { resizableTextArea: { textArea: textarea } }

      // WHEN
      act(() => {
        result.current.handleWrap('*', '*')
      })

      // EXPECT
      expect(result.current.editText).toBe('a*bcd*e')
    })

    it('given no selection, when handleLinePrefix called, expect prefix added to current line', () => {
      // GIVEN
      const { result } = renderHook(() => useEditorViewModel({ initialText: 'line1\nline2' }))

      const textarea = createFakeTextarea(7, 7) // cursor in line2
      // @ts-expect-error mocking private field
      result.current.textAreaRef.current = { resizableTextArea: { textArea: textarea } }

      // WHEN
      act(() => {
        result.current.handleLinePrefix('> ')
      })

      // EXPECT
      expect(result.current.editText).toBe('line1\n> line2')
    })
  })
})
