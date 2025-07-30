# @test-lib

Internal testing utilities for the Diff Viewer monorepo. Provides shared helpers, mocks, and test harnesses to streamline writing and maintaining tests across packages. Not for external use.

## Package Overview

- Utilities for React component and hook testing
- Mock implementations for Ant Design (antd) components
- Context and provider test helpers
- Common assertion and DOM utilities
- Used by other monorepo packages to ensure consistent, reliable tests

## Example usage

```tsx
import { render, createPropsFactory, setupAntdMocks } from '@test-lib'

// Setup Ant Design mocks for isolated component tests
test('renders with antd mocks', () => {
  setupAntdMocks()
  const { getByTestId } = render(<MyComponent />)
  expect(getByTestId('progress-bar')).toBeInTheDocument()
})

// Create props factory for DRY test setup
const createButtonProps = createPropsFactory({ label: 'Click me', disabled: false })
const props = createButtonProps({ disabled: true })
```

## Exports / API

- **antd-utils**: Mocks and helpers for Ant Design components
  - `setupAntdMocks()`: Globally mocks antd components for tests
  - `createAntdMocks()`: Returns mock implementations for antd
  - `createProgressProps()`: Utility for progress bar props
- **context-test-utils**: Helpers for testing React context
  - `ContextSpy`: Component to observe context values in tests
  - `renderWithContext`: Renders a provider and exposes its context value
- **generic-test-utils**: General-purpose test helpers
  - `createPropsFactory`: Factory for generating props with overrides
  - `expectElementToBeInTheDocument`, `expectElementToHaveClass`, etc.: Common assertions
  - `createHookTestHarness`: Test harness for custom hooks
  - `mockElementProperty`: Mock DOM properties
- **render**: Themed render function for React Testing Library
  - `render`: Renders UI with default theme
  - All exports from `@testing-library/react`

## Testing

Run unit tests with [Vitest](https://vitest.dev/):

```sh
pnpm test -F @test-lib
```

or:

```sh
cd packages/test-lib
pnpm test
```
