import { describe, expect, it, vi } from 'vitest'
import { useDiffViewerConfig } from '../../components/diff-viewer/providers/diff-viewer-context'
import { createAntdMocks } from '../../test/antd-utils'
import { render, screen } from '../../test/render'
import { Themes } from '../../themes/themes'
import { PullRequestHeader } from './PullRequestHeader'
import type { PullRequestMetadata } from './types'

// MOCKS
vi.mock('../../components/diff-viewer/providers/diff-viewer-context', () => ({
  useDiffViewerConfig: vi.fn(),
}))

vi.mock('antd', () => createAntdMocks())

vi.mocked(useDiffViewerConfig).mockReturnValue({
  theme: Themes.light,
  setTheme: vi.fn(),
  codePanelConfig: undefined,
  setCodePanelConfig: undefined,
  fileExplorerConfig: undefined,
  setFileExplorerConfig: undefined,
})

const createMockPR = (overrides: Partial<PullRequestMetadata> = {}): PullRequestMetadata => ({
  number: 123,
  title: 'Fix user authentication bug',
  body: 'This PR fixes the authentication flow issue',
  user: {
    login: 'johndoe',
    avatar_url: 'https://avatars.githubusercontent.com/u/123',
    html_url: 'https://github.com/johndoe',
  },
  state: 'open',
  merged: false,
  merged_at: null,
  commits: 5,
  changed_files: 3,
  additions: 120,
  deletions: 45,
  html_url: 'https://github.com/owner/repo/pull/123',
  head_ref: 'feature/auth-fix',
  base_ref: 'main',
  head_sha: 'abc123def456',
  base_sha: 'def456abc123',
  ...overrides,
})

type StateTestCase = {
  name: string
  state: PullRequestMetadata['state']
  merged: boolean
  expectedTagColor: string
  expectedTagText: string
}

type StatsTestCase = {
  name: string
  commits: number
  changed_files: number
  expectedCommitsText: string
  expectedFilesText: string
}

const stateMatrix: StateTestCase[] = [
  {
    name: 'open PR',
    state: 'open',
    merged: false,
    expectedTagColor: 'green',
    expectedTagText: 'open',
  },
  {
    name: 'closed PR',
    state: 'closed',
    merged: false,
    expectedTagColor: 'red',
    expectedTagText: 'closed',
  },
  {
    name: 'merged PR',
    state: 'merged',
    merged: true,
    expectedTagColor: 'purple',
    expectedTagText: 'merged',
  },
]

const statsMatrix: StatsTestCase[] = [
  {
    name: 'single commit and file',
    commits: 1,
    changed_files: 1,
    expectedCommitsText: '1 commits',
    expectedFilesText: '1 files',
  },
  {
    name: 'multiple commits and files',
    commits: 10,
    changed_files: 5,
    expectedCommitsText: '10 commits',
    expectedFilesText: '5 files',
  },
  {
    name: 'zero commits and files',
    commits: 0,
    changed_files: 0,
    expectedCommitsText: '0 commits',
    expectedFilesText: '0 files',
  },
  {
    name: 'large numbers',
    commits: 999,
    changed_files: 100,
    expectedCommitsText: '999 commits',
    expectedFilesText: '100 files',
  },
]

describe('PullRequestHeader', () => {
  describe('PR state rendering', () => {
    stateMatrix.forEach(({ name, state, merged, expectedTagColor, expectedTagText }) => {
      it(`given ${name}, when rendered, expect correct state tag displayed`, () => {
        // GIVEN
        const pr = createMockPR({ state, merged })

        // WHEN
        render(<PullRequestHeader pr={pr} />)

        // EXPECT
        expect(screen.getByText(expectedTagText)).toBeInTheDocument()
        const stateTag = screen.getByText(expectedTagText).closest('[data-testid="tag"]')
        expect(stateTag).toHaveAttribute('data-color', expectedTagColor)
      })
    })
  })

  describe('basic information rendering', () => {
    it('given standard PR data, when rendered, expect title and number displayed', () => {
      // GIVEN
      const pr = createMockPR({
        title: 'Implement new feature',
        number: 456,
      })

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      expect(screen.getByText('Implement new feature')).toBeInTheDocument()
      expect(screen.getByText('#456')).toBeInTheDocument()
    })

    it('given PR with user info, when rendered, expect author details displayed', () => {
      // GIVEN
      const pr = createMockPR({
        user: {
          login: 'testuser',
          avatar_url: 'https://avatars.example.com/testuser',
          html_url: 'https://github.com/testuser',
        },
      })

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('testuser').closest('a')).toHaveAttribute('href', 'https://github.com/testuser')
      expect(screen.getByAltText('testuser')).toHaveAttribute('src', 'https://avatars.example.com/testuser')
    })

    it('given PR with branch info, when rendered, expect branch names displayed', () => {
      // GIVEN
      const pr = createMockPR({
        head_ref: 'feature/new-component',
        base_ref: 'develop',
      })

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      expect(screen.getByText('feature/new-component')).toBeInTheDocument()
      expect(screen.getByText('develop')).toBeInTheDocument()
    })
  })

  describe('stats rendering', () => {
    statsMatrix.forEach(({ name, commits, changed_files, expectedCommitsText, expectedFilesText }) => {
      it(`given ${name}, when rendered, expect correct stats displayed`, () => {
        // GIVEN
        const pr = createMockPR({ commits, changed_files })

        // WHEN
        render(<PullRequestHeader pr={pr} />)

        // EXPECT
        expect(screen.getByText(expectedCommitsText)).toBeInTheDocument()
        expect(screen.getByText(expectedFilesText)).toBeInTheDocument()
      })
    })

    it('given PR stats, when rendered, expect correct tag colors for stats', () => {
      // GIVEN
      const pr = createMockPR({ commits: 5, changed_files: 3 })

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      const commitsTag = screen.getByText('5 commits').closest('[data-testid="tag"]')
      const filesTag = screen.getByText('3 files').closest('[data-testid="tag"]')

      expect(commitsTag).toHaveAttribute('data-color', 'blue')
      expect(filesTag).toHaveAttribute('data-color', 'geekblue')
    })
  })

  describe('layout and text elements', () => {
    it('given complete PR data, when rendered, expect all text elements displayed', () => {
      // GIVEN
      const pr = createMockPR()

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      expect(screen.getByText('opened')).toBeInTheDocument()
      expect(screen.getByText('to merge')).toBeInTheDocument()
      expect(screen.getByText('with')).toBeInTheDocument()
      expect(screen.getByText('from')).toBeInTheDocument()
      expect(screen.getByText('into')).toBeInTheDocument()
    })

    it('given PR with long title, when rendered, expect title truncation handled gracefully', () => {
      // GIVEN
      const longTitle = 'A'.repeat(200)
      const pr = createMockPR({ title: longTitle })

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('given PR with special characters in branch names, when rendered, expect proper escaping', () => {
      // GIVEN
      const pr = createMockPR({
        head_ref: 'feature/issue-#123-&-fix',
        base_ref: 'release/v1.0.0',
      })

      // WHEN
      render(<PullRequestHeader pr={pr} />)

      // EXPECT
      expect(screen.getByText('feature/issue-#123-&-fix')).toBeInTheDocument()
      expect(screen.getByText('release/v1.0.0')).toBeInTheDocument()
    })
  })

  describe('component integration', () => {
    it('given minimal PR data, when rendered, expect no errors thrown', () => {
      // GIVEN
      const minimalPR = createMockPR({
        title: '',
        commits: 0,
        changed_files: 0,
        head_ref: '',
        base_ref: '',
      })

      // WHEN & EXPECT
      expect(() => render(<PullRequestHeader pr={minimalPR} />)).not.toThrow()
    })
  })
})
