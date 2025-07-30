import { ThemeProvider, Themes } from '@commons'
import { createPropsFactory, render } from '@test-lib'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PullRequestMetadata } from '../models/pull-request-metadata'
import { Header } from './Header'

vi.mock('../../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: vi.fn(),
}))

vi.mock('antd', async () => {
  const { createAntdMocks } = await import('@test-lib')
  return createAntdMocks()
})

// TEST UTILITIES
const createMockPullRequestMetadata = (overrides: Partial<PullRequestMetadata> = {}): PullRequestMetadata => ({
  number: 123,
  title: 'Add new feature',
  body: null,
  user: {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
    html_url: 'https://github.com/testuser',
  },
  state: 'open',
  merged: false,
  merged_at: null,
  commits: 5,
  changed_files: 3,
  additions: 0,
  deletions: 0,
  html_url: 'https://github.com/owner/repo/pull/123',
  head_ref: 'feature-branch',
  base_ref: 'main',
  head_sha: '',
  base_sha: '',
  ...overrides,
})

const createPullRequestHeaderProps = createPropsFactory<{ pr: PullRequestMetadata }>({
  pr: createMockPullRequestMetadata(),
})

// HELPER FUNCTIONS
const expectStateTagToBePresent = (state: string, color: string) => {
  const tag = screen.getByText(state)
  expect(tag).toBeInTheDocument()
  expect(tag.closest('[data-testid="tag"]')).toHaveAttribute('data-color', color)
}

const expectLinkToBePresent = (text: string, href: string) => {
  const link = screen.getByText(text).closest('[data-testid="typography-link"]')
  expect(link).toHaveAttribute('href', href)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noreferrer')
}

const expectStatTagToBePresent = (value: number, label: string, color: string) => {
  const tag = screen.getByText(`${value} ${label}`)
  expect(tag).toBeInTheDocument()
  expect(tag.closest('[data-testid="tag"]')).toHaveAttribute('data-color', color)
}

const expectBranchTagToBePresent = (value: string, label: string, color: string) => {
  const tag = screen.getByText(`${value} ${label}`)
  expect(tag).toBeInTheDocument()
  expect(tag.closest('[data-testid="tag"]')).toHaveAttribute('data-color', color)
}

describe('PullRequestHeader', () => {
  describe('state tag scenarios', () => {
    const stateTestCases = [
      {
        description: 'open state',
        state: 'open' as const,
        expectedColor: 'green',
        expectedText: 'open',
      },
      {
        description: 'closed state',
        state: 'closed' as const,
        expectedColor: 'red',
        expectedText: 'closed',
      },
      {
        description: 'merged state',
        state: 'merged' as const,
        expectedColor: 'purple',
        expectedText: 'merged',
      },
    ]

    stateTestCases.forEach(({ description, state, expectedColor, expectedText }) => {
      it(`given ${description}, when rendered, expect correct state tag`, () => {
        // GIVEN
        const props = createPullRequestHeaderProps({
          pr: createMockPullRequestMetadata({ state }),
        })

        // WHEN
        render(
          <ThemeProvider theme={Themes.light}>
            <Header {...props} />
          </ThemeProvider>,
        )

        // EXPECT
        expectStateTagToBePresent(expectedText, expectedColor)
      })
    })
  })

  describe('title and links', () => {
    it('given pull request with title, when rendered, expect title to be displayed as link', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        title: 'Fix critical bug',
        html_url: 'https://github.com/owner/repo/pull/456',
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectLinkToBePresent('Fix critical bug', 'https://github.com/owner/repo/pull/456')
    })

    it('given pull request with user, when rendered, expect user link to be present', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        user: {
          login: 'developer123',
          avatar_url: 'https://example.com/dev-avatar.jpg',
          html_url: 'https://github.com/developer123',
        },
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectLinkToBePresent('developer123', 'https://github.com/developer123')
    })
  })

  describe('statistics display', () => {
    it('given pull request with commits and files, when rendered, expect stat tags to be present', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        commits: 12,
        changed_files: 8,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectStatTagToBePresent(12, 'commits', 'blue')
      expectStatTagToBePresent(8, 'files', 'geekblue')
    })

    it('given pull request with zero commits, when rendered, expect zero commits tag', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        commits: 0,
        changed_files: 1,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectStatTagToBePresent(0, 'commits', 'blue')
    })

    it('given pull request with zero files, when rendered, expect zero files tag', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        commits: 1,
        changed_files: 0,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectStatTagToBePresent(0, 'files', 'geekblue')
    })
  })

  describe('branch information', () => {
    it('given pull request with branch names, when rendered, expect branch tags to be present', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        head_ref: 'feature/new-ui',
        base_ref: 'develop',
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectBranchTagToBePresent('feature/new-ui', 'head', 'gold')
      expectBranchTagToBePresent('develop', 'base', 'gold')
    })

    it('given pull request with long branch names, when rendered, expect branch names to be displayed', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        head_ref: 'very-long-feature-branch-name-that-might-wrap',
        base_ref: 'main',
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expectBranchTagToBePresent('very-long-feature-branch-name-that-might-wrap', 'head', 'gold')
      expectBranchTagToBePresent('main', 'base', 'gold')
    })
  })

  describe('pull request number', () => {
    it('given pull request with number, when rendered, expect number to be displayed', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        number: 789,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expect(screen.getByText('#789')).toBeInTheDocument()
    })

    it('given pull request with single digit number, when rendered, expect number to be displayed', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        number: 1,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expect(screen.getByText('#1')).toBeInTheDocument()
    })
  })

  describe('avatar display', () => {
    it('given pull request with user avatar, when rendered, expect avatar to be present', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        user: {
          login: 'testuser',
          avatar_url: 'https://example.com/custom-avatar.jpg',
          html_url: 'https://github.com/testuser',
        },
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/custom-avatar.jpg')
      expect(avatar).toHaveAttribute('alt', 'testuser')
      expect(avatar).toHaveAttribute('width', '24')
      expect(avatar).toHaveAttribute('height', '24')
    })

    it('given pull request without avatar url, when rendered, expect avatar to be present with null src', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        user: {
          login: 'testuser',
          avatar_url: null,
          html_url: 'https://github.com/testuser',
        },
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar.getAttribute('src')).toBeNull()
      expect(avatar).toHaveAttribute('alt', 'testuser')
    })
  })

  describe('narrative text', () => {
    it('given pull request, when rendered, expect narrative text to be present', () => {
      // GIVEN
      const props = createPullRequestHeaderProps()

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expect(screen.getByText('opened')).toBeInTheDocument()
      expect(screen.getByText('to merge')).toBeInTheDocument()
      expect(screen.getByText('with')).toBeInTheDocument()
      expect(screen.getByText('from')).toBeInTheDocument()
      expect(screen.getByText('into')).toBeInTheDocument()
    })
  })

  describe('complete integration', () => {
    it('given complete pull request data, when rendered, expect all elements to be present in correct order', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        number: 42,
        title: 'Implement dark mode',
        state: 'open',
        user: {
          login: 'designer',
          avatar_url: 'https://example.com/designer.jpg',
          html_url: 'https://github.com/designer',
        },
        commits: 15,
        changed_files: 7,
        head_ref: 'feature/dark-mode',
        base_ref: 'main',
        html_url: 'https://github.com/company/app/pull/42',
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      // State tag
      expectStateTagToBePresent('open', 'green')

      // Title link
      expectLinkToBePresent('Implement dark mode', 'https://github.com/company/app/pull/42')

      // User avatar and link
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveAttribute('src', 'https://example.com/designer.jpg')
      expect(avatar).toHaveAttribute('alt', 'designer')
      expectLinkToBePresent('designer', 'https://github.com/designer')

      // Narrative text
      expect(screen.getByText('opened')).toBeInTheDocument()
      expect(screen.getByText('#42')).toBeInTheDocument()
      expect(screen.getByText('to merge')).toBeInTheDocument()

      // Statistics
      expectStatTagToBePresent(15, 'commits', 'blue')
      expect(screen.getByText('with')).toBeInTheDocument()
      expectStatTagToBePresent(7, 'files', 'geekblue')

      // Branch information
      expect(screen.getByText('from')).toBeInTheDocument()
      expectBranchTagToBePresent('feature/dark-mode', 'head', 'gold')
      expect(screen.getByText('into')).toBeInTheDocument()
      expectBranchTagToBePresent('main', 'base', 'gold')
    })
  })

  describe('edge cases', () => {
    it('given pull request with very long title, when rendered, expect title to be displayed', () => {
      // GIVEN
      const longTitle =
        'This is a very long pull request title that might cause layout issues and should be handled gracefully by the component'
      const pr = createMockPullRequestMetadata({
        title: longTitle,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('given pull request with special characters in title, when rendered, expect title to be displayed correctly', () => {
      // GIVEN
      const specialTitle = 'Fix 🐛 bug with <script> tags & "quotes"'
      const pr = createMockPullRequestMetadata({
        title: specialTitle,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })

    it('given pull request with large numbers, when rendered, expect numbers to be displayed correctly', () => {
      // GIVEN
      const pr = createMockPullRequestMetadata({
        number: 999999,
        commits: 1000000,
        changed_files: 50000,
      })
      const props = createPullRequestHeaderProps({ pr })

      // WHEN
      render(
        <ThemeProvider theme={Themes.light}>
          <Header {...props} />
        </ThemeProvider>,
      )

      // EXPECT
      expect(screen.getByText('#999999')).toBeInTheDocument()
      expectStatTagToBePresent(1000000, 'commits', 'blue')
      expectStatTagToBePresent(50000, 'files', 'geekblue')
    })
  })
})
