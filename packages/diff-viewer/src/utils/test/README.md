# Test Utilities Package

This package provides generic, reusable testing utilities for the `diff-viewer` library. It is designed to make testing easier while maintaining consistency across the codebase.

## 🎯 Purpose and Scope

This package should contain **ONLY**:

- ✅ Generic utilities used by multiple test files
- ✅ Private code used within the package itself
- ✅ Shared testing patterns that shape how tests are written
- ✅ Component-specific utilities that mirror the actual component directory structure

This package should **NOT** contain:

- ❌ Specific behavior tied to individual components (unless used by 2+ test files)
- ❌ Business logic or domain-specific behavior
- ❌ Test implementations (only utilities to support tests)

## 📁 Directory Structure

```
test/
├── README.md                    # This file
├── render.tsx                   # Custom render with providers
├── setup.ts                     # Global test setup
├── generic-test-utils.ts        # Generic testing utilities
├── context-test-utils.tsx       # React context testing utilities
├── antd-utils.ts               # Ant Design mocking utilities
├── __fixtures__/               # Reusable test data
│   ├── file-diff-fixtures.ts
│   ├── fstree-fixtures.ts
│   ├── parser-fixtures.ts
│   └── raw-diffs-fixtures.ts
├── models/                     # Model testing utilities
│   └── test-utils.ts
└── components/                 # Component-specific utilities
    └── ui/                     # Mirrors src/components/ui structure
        ├── buttons/
        │   └── test-utils.ts
        └── activity-summary/
            └── test-utils.ts
```

## 🔧 Core APIs

### 1. Custom Render (`render.tsx`)

Provides a custom render function with necessary providers pre-configured.

```typescript
import { render, screen } from '../../utils/test/render'

// Usage
render(<MyComponent />)
// Component is automatically wrapped with ThemeProvider (light theme)
```

**API:**

- `render(ui, options?)` - Custom render with theme provider
- Re-exports all `@testing-library/react` utilities

### 2. Test Setup (`setup.ts`)

Global test environment configuration.

```typescript
import { setupGlobalTestMocks, setupBeforeEach } from '../../utils/test/setup'

// In vitest.setup.ts
setupGlobalTestMocks() // Sets up all mocks
setupBeforeEach() // Configures beforeEach behavior
```

**API:**

- `setupGlobalTestMocks()` - Sets up Ant Design and global mocks
- `setupBeforeEach()` - Configures clean-slate environment for each test

### 3. Generic Test Utilities (`generic-test-utils.ts`)

Common testing patterns used across multiple components.

```typescript
import {
  createPropsFactory,
  expectElementToBeInTheDocument,
  expectElementToHaveClass,
  expectElementToHaveTextContent,
} from '../../utils/test/generic-test-utils'

// Create prop factories
const createButtonProps = createPropsFactory({
  label: 'Click me',
  onClick: vi.fn(),
})

// Use with overrides
const props = createButtonProps({ label: 'Custom label' })

// Element assertions
expectElementToBeInTheDocument('my-test-id')
expectElementToHaveClass('button', 'active')
expectElementToHaveTextContent('status', 'Loading...')
```

**API:**

- `createPropsFactory<T>(defaults): (overrides?) => T` - Creates prop factory functions
- `expectElementToBeInTheDocument(testId)` - Asserts element presence
- `expectElementToHaveClass(testId, className)` - Asserts element class
- `expectElementToHaveTextContent(testId, text)` - Asserts element text

### 4. Context Testing (`context-test-utils.tsx`)

Utilities for testing React contexts.

```typescript
import { ContextSpy, renderWithContext } from '../../utils/test/context-test-utils'

// Spy on context values
const getLatestContext = await renderWithContext(MyProvider, useMyContext, { initialValue: 'test' })

// Access latest context value
const contextValue = getLatestContext()
```

**API:**

- `ContextSpy<T>({ cb, useCtx })` - Component that spies on context values
- `renderWithContext<T, P>(Provider, useCtx, props): Promise<() => T>` - Renders with context and returns getter

### 5. Ant Design Mocking (`antd-utils.ts`)

Comprehensive mocking for Ant Design components.

```typescript
import {
  setupAntdMocks,
  createCustomButton,
  createToolbarWidget,
  createMockCodePanelConfig,
} from '../../utils/test/antd-utils'

// Setup (usually in vitest.setup.ts)
setupAntdMocks()

// Create test data
const button = createCustomButton({
  label: 'My Button',
  side: 'left',
})

const widget = createToolbarWidget({
  key: 'test-widget',
})

const config = createMockCodePanelConfig({
  mode: 'split',
})
```

**API:**

- `setupAntdMocks()` - Sets up all Ant Design component mocks
- `createCustomButton(overrides?)` - Creates mock CustomButton with proper typing
- `createToolbarWidget(overrides?)` - Creates mock ToolbarWidget with proper typing
- `createMockCodePanelConfig(overrides?)` - Creates properly typed mock code panel config
- `createButtonMatrix()` - Creates test set of buttons for both left and right sides
- `createProgressProps(current, total, suffix?)` - Creates props for progress components

## 📦 Fixtures (`__fixtures__/`)

Reusable test data organized by domain.

```typescript
import { SAMPLE_FILE_DIFFS } from '../../utils/test/__fixtures__/file-diff-fixtures'
import { MOCKED_NODE_TREE } from '../../utils/test/__fixtures__/fstree-fixtures'

// Use in tests
const fileDiff = SAMPLE_FILE_DIFFS[0] // Regular file edit
const newFile = SAMPLE_FILE_DIFFS[3] // New file
const deletedFile = SAMPLE_FILE_DIFFS[4] // Deleted file
```

**Available Fixtures:**

- `file-diff-fixtures.ts` - `SAMPLE_FILE_DIFFS[]` - Various file diff scenarios
- `fstree-fixtures.ts` - `MOCKED_NODE_TREE` - File system tree structure
- `parser-fixtures.ts` - Various parser test cases and hunks
- `raw-diffs-fixtures.ts` - Raw diff strings for parsing tests

## 🏗️ Model Testing (`models/test-utils.ts`)

Factory functions for creating model instances.

```typescript
import {
  createMockFileDiff,
  createMockHunk,
  createMockLineDiff,
  SIMPLE_CHANGES,
  LINE_TYPE_TEST_CASES,
} from '../../utils/test/models/test-utils'

// Create instances
const fileDiff = createMockFileDiff({
  language: 'typescript',
  isNew: true,
})

const hunk = createMockHunk({
  oldStart: 10,
  changes: SIMPLE_CHANGES,
})

// Use test data sets
LINE_TYPE_TEST_CASES.forEach(({ rawType, expectedType }) => {
  // Test type conversions
})
```

**API:**

- `createMockFileDiff(overrides?)` - Creates FileDiff instances
- `createMockHunk(overrides?)` - Creates Hunk instances
- `createMockLineDiff(...)` - Creates LineDiff instances
- Various test data arrays: `SIMPLE_CHANGES`, `LINE_TYPE_TEST_CASES`, etc.

## 🧩 Component-Specific Utilities

Located in `components/` directory, mirroring the actual component structure.

```typescript
// For UI buttons
import { expectClickHandlerToBeCalled, expectTooltipToAppear } from '../../utils/test/components/ui/buttons/test-utils'

// For activity summaries
import {
  createFileActivitySummaryProps,
  createDirectoryActivitySummaryProps,
} from '../../utils/test/components/ui/activity-summary/test-utils'

// Usage
expectClickHandlerToBeCalled(mockOnClick, 2)
await expectTooltipToAppear(screen, 'Tooltip text')

const props = createFileActivitySummaryProps({
  file: customFileDiff,
})
```

## 📝 Guidelines for LLMs

### When to Add Code to This Package

**✅ ADD when:**

- For any change in this file, assess if you need to update this README.md
- Never use `any` to type args or function, always specify the proper return type
- Only document public method with proper docstrings - unless there is a non-obvious logic going on
- The utility is used by 2+ test files
- It provides a generic testing pattern
- It's a factory function for common test data
- It's a reusable assertion or helper function
- It mirrors existing component structure for component-specific helpers

**❌ DON'T ADD when:**

- It's specific to a single test file
- It contains business logic
- It's a one-off test case or data
- It doesn't follow the established patterns

### How to Add New Utilities

1. **Generic utilities**: Add to root level files (`generic-test-utils.ts`, etc.)
2. **Test data**: Add to appropriate fixture file in `__fixtures__/`
3. **Model utilities**: Add to `models/test-utils.ts`
4. **Component utilities**: Create in `components/` following the actual component directory structure

### Naming Conventions

- **Factory functions**: `create*` (e.g., `createMockFileDiff`)
- **Setup functions**: `setup*` (e.g., `setupAntdMocks`)
- **Assertion functions**: `expect*` (e.g., `expectElementToBeInTheDocument`)
- **Test data**: `UPPER_CASE` constants (e.g., `SAMPLE_FILE_DIFFS`)

### Example: Adding a New Component Utility

```typescript
// If adding utilities for src/components/ui/special-button/SpecialButton.tsx
// Create: components/ui/special-button/test-utils.ts

import { createPropsFactory } from '../../../generic-test-utils'
import type { SpecialButtonProps } from '../../../../../components/ui/special-button/types'

export const createSpecialButtonProps = createPropsFactory<SpecialButtonProps>({
  variant: 'primary',
  size: 'medium',
  onClick: vi.fn(),
})

export const expectSpecialButtonToHaveVariant = (element: HTMLElement, variant: string): void => {
  expect(element).toHaveAttribute('data-variant', variant)
}
```

## 🔒 API Design Principles

1. **Tight API surface**: Only expose what's genuinely reusable across 2+ test files
2. **Generic by default**: Avoid component-specific behavior unless truly shared
3. **Factory pattern**: Use `createPropsFactory` for consistent prop creation
4. **Descriptive naming**: Function names should clearly indicate their purpose
5. **TypeScript first**: All utilities should be fully typed with proper interfaces
6. **Test data separation**: Keep test data in fixtures, utilities in code files
7. **Private functions**: Use `_` prefix for internal helpers not meant for public consumption
8. **Regular cleanup**: Remove unused exports and dead code to keep the API surface tight

This package shapes how tests are written across the library. Keep it focused, generic, and well-documented.
