import type { TextAreaRef } from 'antd/es/input/TextArea'
import React, { useEffect, useRef, useState } from 'react'

export interface UseEditorViewModelProps {
  /** The current comment text to edit */
  initialText: string
  /** Optional callback when edit is saved */
  onSave?: (newText: string) => void
  /** Optional callback when edit is cancelled */
  onCancel?: () => void
  /** Optional callback for tab header button actions */
  onTabHeaderAction?: (action: string) => void
}

export const useEditorViewModel = ({ initialText, onSave, onCancel, onTabHeaderAction }: UseEditorViewModelProps) => {
  const [editText, setEditText] = useState(initialText)
  const [previewText, setPreviewText] = useState(initialText)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('write')
  const textAreaRef = useRef<TextAreaRef>(null)

  useEffect(() => {
    setEditText(initialText)
    setPreviewText(initialText)
  }, [initialText])

  /**
   * Handles the header action for the editor.
   *
   * @param action - The action to perform.
   */
  const handleHeaderAction = (action: string) => {
    onTabHeaderAction?.(action)
  }

  /**
   * Handles the save operation for the editor.
   */
  const handleSave = () => {
    if (editText.trim() && onSave) {
      setIsSubmitting(true)
      try {
        onSave(editText.trim())
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  /**
   * Handles the cancel operation for the editor.
   */
  const handleCancel = () => {
    setEditText(initialText)
    setPreviewText(initialText)
    onCancel?.()
  }

  /**
   * Handles the key down event for the editor.
   * @param e - The keyboard event.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  /**
   * Handles the tab click event for the editor.
   *
   * @param tabKey - The key of the tab to activate.
   */
  const handleTabClick = (tabKey: string) => {
    setActiveTab(tabKey)
    if (tabKey === 'preview') {
      setPreviewText(editText)
    }
  }

  /**
   * Handles the wrap operation for the editor.
   *
   * @param prefix      - The prefix to wrap the selected text with.
   * @param suffix      - The suffix to wrap the selected text with.
   * @param placeholder - The placeholder text to insert if no text is selected.
   * @returns             The new text with the wrap operation applied.
   */
  const handleWrap = (prefix: string, suffix: string = prefix, placeholder = 'text') => {
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editText.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newText = `${editText.substring(0, start)}${prefix}${textToInsert}${suffix}${editText.substring(end)}`

    setEditText(newText)
    textarea.focus()

    setTimeout(() => {
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length)
      }
    }, 0)
  }

  /**
   * Handles the line prefix operation for the editor.
   *
   * @param prefix - The prefix to add to the selected text.
   * @returns        The new text with the line prefix applied.
   */
  const handleLinePrefix = (prefix: string) => {
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    if (!textarea) return

    const start = textarea.selectionStart
    const value = editText
    const lineStart = value.lastIndexOf('\n', start - 1) + 1

    const newText = `${value.substring(0, lineStart)}${prefix}${value.substring(lineStart)}`

    setEditText(newText)

    textarea.focus()

    setTimeout(() => {
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  const hasChanges = editText.trim() !== initialText.trim()
  const isValid = editText.trim().length > 0

  return {
    editText,
    setEditText,
    previewText,
    isSubmitting,
    activeTab,
    textAreaRef,
    handleSave,
    handleCancel,
    handleKeyDown,
    handleWrap,
    handleLinePrefix,
    handleTabClick,
    handleHeaderAction,
    hasChanges,
    isValid,
  }
}
