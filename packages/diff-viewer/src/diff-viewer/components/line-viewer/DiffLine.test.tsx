import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent } from '../../../shared/test-utils/render'

import { render, screen } from '../../../shared/test-utils/render'
import DiffLine from './DiffLine'
import type { DiffLineProps } from './types'

// Helper that renders a DiffLine wrapped in a minimal table structure
function renderDiffLine(props: Partial<DiffLineProps> = {}) {
  const defaultProps: DiffLineProps = {
    leftNumber: 1,
    rightNumber: 1,
    content: 'console.log("foo")',
    showNumber: true,
    type: 'context',
    onAddButtonClick: vi.fn(),
  }

  return render(
    <table>
      <tbody>
        {}
        <DiffLine {...defaultProps} {...props} />
      </tbody>
    </table>,
  )
}

describe('DiffLine', () => {
  it('renders provided left and right line numbers', () => {
    renderDiffLine({ leftNumber: 10, rightNumber: 20 })
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('hides the left number column when hideLeftNumber is true', () => {
    renderDiffLine({ hideLeftNumber: true, leftNumber: 11 })
    expect(screen.queryByText('11')).not.toBeInTheDocument()
  })

  it('hides the right number column when hideRightNumber is true', () => {
    renderDiffLine({ hideRightNumber: true, rightNumber: 22 })
    expect(screen.queryByText('22')).not.toBeInTheDocument()
  })

  it('shows a "+" prefix for added lines', () => {
    renderDiffLine({ type: 'add' })
    expect(screen.getByText('+')).toBeInTheDocument()
  })

  it('shows a "-" prefix for deleted lines', () => {
    renderDiffLine({ type: 'delete' })
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('does not render an AddButton for hunk lines', () => {
    renderDiffLine({ type: 'hunk' })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('invokes onAddButtonClick when the AddButton is clicked', () => {
    const handleClick = vi.fn()
    renderDiffLine({ onAddButtonClick: handleClick })

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
