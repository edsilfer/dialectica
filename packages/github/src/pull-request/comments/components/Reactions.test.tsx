import { ThemeProvider, Themes } from '@commons'
import {
  createPropsFactory,
  expectElementNotToBeInTheDocument,
  expectElementToBeInTheDocument,
  render,
} from '@test-lib'
import { fireEvent, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { CommentReactionsProps } from './Reactions'
import { Reactions } from './Reactions'

const createReactionsProps = createPropsFactory<CommentReactionsProps>({
  reactions: new Map([
    ['+1', 5],
    ['heart', 2],
  ]),
  onReactionClick: vi.fn(),
})

const createReactionsMap = (entries: Array<[string, number]>): Map<string, number> => {
  return new Map(entries)
}

// Test Data
const validReactionTypes = ['+1', '-1', 'laugh', 'hooray', 'confused', 'heart', 'rocket', 'eyes']
const reactionEmojis = {
  '+1': '👍',
  '-1': '👎',
  laugh: '😄',
  hooray: '🎉',
  confused: '😕',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
}

// Tests ----------------------------------------------------------------
describe('Reactions component', () => {
  it('given reactions with positive counts, when rendered, expect container and reaction buttons displayed', () => {
    // GIVEN
    const reactions = createReactionsMap([
      ['+1', 3],
      ['heart', 1],
    ])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementToBeInTheDocument('comment-reactions')
    expectElementToBeInTheDocument('reaction-+1')
    expectElementToBeInTheDocument('reaction-heart')
  })

  it('given empty reactions map, when rendered, expect component not rendered', () => {
    // GIVEN
    const reactions = createReactionsMap([])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementNotToBeInTheDocument('comment-reactions')
  })

  it('given reactions with zero counts, when rendered, expect those reactions filtered out', () => {
    // GIVEN
    const reactions = createReactionsMap([
      ['+1', 5],
      ['heart', 0],
      ['laugh', 3],
    ])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementToBeInTheDocument('reaction-+1')
    expectElementNotToBeInTheDocument('reaction-heart')
    expectElementToBeInTheDocument('reaction-laugh')
  })

  it('given unknown reaction types, when rendered, expect those reactions filtered out', () => {
    // GIVEN
    const reactions = createReactionsMap([
      ['+1', 2],
      ['unknown', 5],
      ['invalid', 1],
    ])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementToBeInTheDocument('reaction-+1')
    expectElementNotToBeInTheDocument('reaction-unknown')
    expectElementNotToBeInTheDocument('reaction-invalid')
  })

  it('given all reactions have zero counts, when rendered, expect component not rendered', () => {
    // GIVEN
    const reactions = createReactionsMap([
      ['+1', 0],
      ['heart', 0],
    ])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    expectElementNotToBeInTheDocument('comment-reactions')
  })

  it('given onReactionClick provided, when reaction clicked, expect callback called with reaction type', () => {
    // GIVEN
    const mockClick = vi.fn()
    const reactions = createReactionsMap([['+1', 3]])
    const props = createReactionsProps({ reactions, onReactionClick: mockClick })
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // WHEN
    fireEvent.click(screen.getByTestId('reaction-+1'))

    // EXPECT
    expect(mockClick).toHaveBeenCalledTimes(1)
    expect(mockClick).toHaveBeenCalledWith('+1')
  })

  it('given no onReactionClick provided, when reaction clicked, expect no error thrown', () => {
    // GIVEN
    const reactions = createReactionsMap([['+1', 3]])
    const props = createReactionsProps({ reactions, onReactionClick: undefined })
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // WHEN & EXPECT
    expect(() => {
      fireEvent.click(screen.getByTestId('reaction-+1'))
    }).not.toThrow()
  })

  it('given multiple reactions, when rendered, expect correct emoji and count displayed', () => {
    // GIVEN
    const reactions = createReactionsMap([
      ['+1', 5],
      ['heart', 12],
    ])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    const thumbsUpButton = screen.getByTestId('reaction-+1')
    const heartButton = screen.getByTestId('reaction-heart')
    expect(thumbsUpButton).toHaveTextContent('👍5')
    expect(heartButton).toHaveTextContent('❤️12')
  })

  it('given reaction with large count, when rendered, expect count displayed correctly', () => {
    // GIVEN
    const reactions = createReactionsMap([['rocket', 999]])
    const props = createReactionsProps({ reactions })

    // WHEN
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )

    // EXPECT
    const rocketButton = screen.getByTestId('reaction-rocket')
    expect(rocketButton).toHaveTextContent('🚀999')
  })

  describe.each(validReactionTypes)('reaction type %s', (reactionType) => {
    it('given valid reaction type, when rendered, expect correct emoji displayed', () => {
      // GIVEN
      const reactions = createReactionsMap([[reactionType, 1]])
      const props = createReactionsProps({ reactions })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Reactions {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      const button = screen.getByTestId(`reaction-${reactionType}`)
      expect(button).toHaveTextContent(reactionEmojis[reactionType as keyof typeof reactionEmojis])
    })
  })

  it('given multiple different reactions, when clicked separately, expect each callback called with correct type', () => {
    // GIVEN
    const mockClick = vi.fn()
    const reactions = createReactionsMap([
      ['+1', 2],
      ['heart', 1],
      ['rocket', 3],
    ])
    const props = createReactionsProps({ reactions, onReactionClick: mockClick })
    render(
      <ThemeProvider theme={Themes.light}>
        <Reactions {...props} />
      </ThemeProvider>,
    )
    // WHEN
    fireEvent.click(screen.getByTestId('reaction-+1'))
    fireEvent.click(screen.getByTestId('reaction-heart'))
    fireEvent.click(screen.getByTestId('reaction-rocket'))

    // EXPECT
    expect(mockClick).toHaveBeenCalledTimes(3)
    expect(mockClick).toHaveBeenNthCalledWith(1, '+1')
    expect(mockClick).toHaveBeenNthCalledWith(2, 'heart')
    expect(mockClick).toHaveBeenNthCalledWith(3, 'rocket')
  })
})
