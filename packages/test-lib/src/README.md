# Test Utilities Package

This package provides generic, reusable testing utilities. It is designed to make testing easier while maintaining consistency across the codebase.

## Directory Structure

```
src/
├── README.md                # This file
├── antd-utils.ts            # Ant Design mocking utilities
├── context-test-utils.tsx   # React context testing utilities
├── generic-test-utils.ts    # Generic testing utilities
├── index.ts                 # Exports all utilities
```

## Core APIs

### 1. Ant Design Mocking (`antd-utils.ts`)

Comprehensive mocking for Ant Design components and helpers for creating test data.

**API:**

- `setupAntdMocks()` - Sets up all Ant Design component mocks (for use with Vitest)
- `createProgressProps(current, total, suffix?)` - Creates props for progress components
- (See file for additional helpers and mock types)

**Usage Example:**

```typescript
import { setupAntdMocks, createProgressProps } from 'test-lib'

setupAntdMocks()
const progressProps = createProgressProps(3, 10, '%')
```

---

### 2. Context Testing (`context-test-utils.tsx`)

Utilities for testing React contexts.

**API:**

- `ContextSpy<T>({ cb, useCtx })` - Component that spies on context values
- `renderWithContext<T, P>(Provider, useCtx, providerProps): Promise<() => T>` - Renders with context and returns getter

**Usage Example:**

```typescript
import { ContextSpy, renderWithContext } from 'test-lib'

// Spy on context values
const getLatestContext = await renderWithContext(MyProvider, useMyContext, { initialValue: 'test' })
const contextValue = getLatestContext()
```

---

### 3. Generic Test Utilities (`generic-test-utils.ts`)

Common testing patterns and helpers.

**API:**

- `createPropsFactory<T>(defaults): (overrides?) => T` - Creates prop factory functions
- `expectElementToBeInTheDocument(testId)` - Asserts element presence
- `expectElementToHaveClass(testId, className)` - Asserts element class
- `expectElementToHaveTextContent(testId, text)` - Asserts element text
- `createHookTestHarness<T, P>(useHook, renderComponent)` - Creates a test harness for hooks
- `mockElementProperty(element, property, value)` - Mocks a property on an HTML element
- `expectElementNotToBeInTheDocument(testId)` - Asserts element absence
- `expectElementNotToHaveClass(testId, className)` - Asserts element does not have a class

**Usage Example:**

```typescript
import {
  createPropsFactory,
  expectElementToBeInTheDocument,
  expectElementToHaveClass,
  expectElementToHaveTextContent,
  createHookTestHarness,
  mockElementProperty,
  expectElementNotToBeInTheDocument,
  expectElementNotToHaveClass,
} from 'test-lib'

const createButtonProps = createPropsFactory({ label: 'Click me', onClick: vi.fn() })
const props = createButtonProps({ label: 'Custom label' })
expectElementToBeInTheDocument('my-test-id')
expectElementToHaveClass('button', 'active')
expectElementToHaveTextContent('status', 'Loading...')
```

---

## Guidelines

- Only add utilities that are generic and reusable across multiple test files.
- Do not include business logic or test data specific to a single test.
- All utilities should be fully typed with proper interfaces.
- Use descriptive naming: `create*` for factories, `expect*` for assertions, `setup*` for setup helpers.

---

This package shapes how tests are written across the library. Keep it focused, generic, and well-documented.
