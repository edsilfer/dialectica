import { describe, it, expect } from 'vitest'
import { SourceCodeViewModel } from './SourceCodeViewModel'
import { DiffParserAdapter } from '../../../../shared/parsers/DiffParserAdapter'
import { REACT_FLIGHT_SERVER_DIFF, REACT_FLIGHT_CLIENT_DIFF } from '../../../../__fixtures__/raw-diffs-fixtures'

describe('SourceCodeViewModel', () => {
  it('given diff with multiple hunks, when build view model, expect correct hunk states', () => {
    // GIVEN
    const parser = new DiffParserAdapter()
    const parsedDiff = parser.parse(REACT_FLIGHT_SERVER_DIFF)
    const fileDiff = parsedDiff.files[0]

    // WHEN
    const viewModel = new SourceCodeViewModel(fileDiff, 'unified')
    const hunkStates = viewModel.hunkStates
    const hunkLines = viewModel.lines.filter((line) => line.typeLeft === 'hunk' || line.typeRight === 'hunk')

    // EXPECT
    expect(hunkStates.size).toBe(2)
    // The parser added a synthetic expander for the last hunk
    expect(hunkLines.length).toBe(3)

    // 1st hunk assertions
    const firstHunkLine = hunkLines[0]
    const firstHunkState = hunkStates.get(firstHunkLine)
    expect(firstHunkState).toBeDefined()
    expect(firstHunkState!.start).toBe(58) // First hunk starts at line 58
    expect(firstHunkState!.prev).toBeUndefined() // No previous line before first hunk
    expect(firstHunkState!.next).toBe(3869) // Next hunk starts at line 3869
    expect(firstHunkState!.prevRange).toEqual({ start: 48, end: 57 }) // From max(58-10, 1) to 57
    expect(firstHunkState!.nextRange).toEqual({ start: 69, end: 78 }) // From 69 to min(68+10, 3869-1)

    // 2nd hunk assertions
    const secondHunkLine = hunkLines[1]
    const secondHunkState = hunkStates.get(secondHunkLine)
    expect(secondHunkState).toBeDefined()
    expect(secondHunkState!.start).toBe(3869) // Second hunk starts at line 3869
    expect(secondHunkState!.prev).toBe(68) // Last visible line before this hunk (end of previous hunk)
    expect(secondHunkState!.next).toBeUndefined() // No next line after last hunk
    expect(secondHunkState!.prevRange).toEqual({ start: 69, end: 78 }) // 10 lines after previous visible line
    expect(secondHunkState!.nextRange).toEqual({ start: 3880, end: 3889 }) // From 3880 to 3879+10 (last hunk)

    // 3rd hunk assertions
    const thirdHunkLine = hunkLines[2]
    const thirdHunkState = hunkStates.get(thirdHunkLine)
    expect(thirdHunkState).toBeUndefined() // Synthetic expander has no hunk state
  })

  it('given client diff with multiple hunks, when build view model, expect correct hunk states', () => {
    // GIVEN
    const parser = new DiffParserAdapter()
    const parsedDiff = parser.parse(REACT_FLIGHT_CLIENT_DIFF)
    const fileDiff = parsedDiff.files[0]

    // WHEN
    const viewModel = new SourceCodeViewModel(fileDiff, 'unified')
    const hunkStates = viewModel.hunkStates
    const hunkLines = viewModel.lines.filter((line) => line.typeLeft === 'hunk' || line.typeRight === 'hunk')

    // EXPECT
    // The client diff has many hunks, so we expect a large number of hunk states
    expect(hunkStates.size).toBeGreaterThan(10)
    expect(hunkLines.length).toBeGreaterThan(10)

    // 1st hunk assertions
    const firstHunkLine = hunkLines[0]
    const firstHunkState = hunkStates.get(firstHunkLine)
    expect(firstHunkState).toBeDefined()
    expect(firstHunkState!.start).toBe(10) // First hunk starts at line 10
    expect(firstHunkState!.prev).toBeUndefined() // No previous line before first hunk
    expect(firstHunkState!.next).toBe(168) // Next hunk starts at line 168
    expect(firstHunkState!.prevRange).toEqual({ start: 1, end: 9 }) // From max(10-10, 1) to 9
    expect(firstHunkState!.nextRange).toEqual({ start: 21, end: 30 }) // From 21 to min(20+10, 168-1)

    // 2nd hunk assertions
    const secondHunkLine = hunkLines[1]
    const secondHunkState = hunkStates.get(secondHunkLine)
    expect(secondHunkState).toBeDefined()
    expect(secondHunkState!.start).toBe(168) // Second hunk starts at line 168
    expect(secondHunkState!.prev).toBe(20) // Last visible line before this hunk (end of previous hunk)
    expect(secondHunkState!.next).toBe(176) // Next hunk starts at line 176
    expect(secondHunkState!.prevRange).toEqual({ start: 21, end: 30 }) // 10 lines after previous visible line
    expect(secondHunkState!.nextRange).toEqual({ start: 174, end: 175 }) // From 174 to min(173+10, 176-1)

    // 3rd hunk assertions
    const thirdHunkLine = hunkLines[2]
    const thirdHunkState = hunkStates.get(thirdHunkLine)
    expect(thirdHunkState).toBeDefined()
    expect(thirdHunkState!.start).toBe(176) // Third hunk starts at line 176
    expect(thirdHunkState!.prev).toBe(173) // Last visible line before this hunk (end of previous hunk)
    expect(thirdHunkState!.next).toBe(184) // Next hunk starts at line 184
    expect(thirdHunkState!.prevRange).toEqual({ start: 174, end: 175 }) // 10 lines after previous visible line
    expect(thirdHunkState!.nextRange).toEqual({ start: 182, end: 183 }) // From 182 to min(181+10, 184-1)
  })
})
