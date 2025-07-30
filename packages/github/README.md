# @github

Internal utilities and React components for integrating GitHub data and workflows into the Diff Viewer monorepo. Provides typed API clients, models, and UI for working with GitHub pull requests, diffs, comments, and user data. Not for external use.

## Package Overview

- Typed REST API clients for GitHub pull requests, diffs, file contents, comments, and user data
- Models and types for PRs, users, comments, and review metadata
- React components for displaying and interacting with GitHub PRs and comments
- Mock/fixture support for local development and testing
- Used by other internal packages (e.g., `@diff-viewer`) to power GitHub-specific features

## Example usage

```ts
import { getPrMetadata, getPrDiff, getInlineComments, publishReview } from '@github'

// Fetch PR metadata
const metadata = await getPrMetadata({
  prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
  token: 'ghp_your_token_here',
})

// Fetch PR diff
const diffText = await getPrDiff({
  prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
  token: 'ghp_your_token_here',
})

// Fetch inline comments
const comments = await getInlineComments({
  prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
  token: 'ghp_your_token_here',
})

// Publish a review
await publishReview({
  prKey: { owner: 'facebook', repo: 'react', pullNumber: 1 },
  body: 'LGTM!',
  event: 'APPROVE',
  comments: [],
  token: 'ghp_your_token_here',
})
```

## Exports / API

- **REST API clients:**
  - `getPrMetadata`, `getPrDiff`, `getFileContent`, `getInlineComments`, `publishReview`, `editInlineComment`, `deleteInlineComment`, `getUserData`
- **Models & Types:**
  - `GitHubPullRequest`, `GitHubUser`, `GitHubInlineComment`, `PrKey`, `BaseRequest`, `CommentMetadata`, etc.
- **React components:**
  - `GitHubToolbar`, `InlineComment`, and related types for PR UI
- **Test/fixture utilities:**
  - Mock data registry for local/dev/test use via `useMocks` param

## Configuration

- **Authentication:** Most API clients require a GitHub personal access token (`token` param) for authenticated requests.
- **Mocking:** Pass `useMocks: true` to any API client to use local fixtures instead of real API calls (for development/testing).
- **Artificial delay:** Pass `forceDelayMs` to simulate network latency (useful for UI demos).

## Testing

Run unit tests with [Vitest](https://vitest.dev/):

```sh
pnpm test -F @github
```

or:

```sh
cd packages/github
pnpm test
```
