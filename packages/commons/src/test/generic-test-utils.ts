import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import React from 'react'
import { expect } from 'vitest'

/**
 * Creates a factory function for generating props with optional overrides.
 *
 * @param defaultProps - The default props for the component.
 * @returns A function that takes optional overrides and returns a new props object.
 */
export function createPropsFactory<T extends object>(defaultProps: T): (overrides?: Partial<T>) => T {
  return (overrides?: Partial<T>): T => {
    return { ...defaultProps, ...overrides }
  }
}

/**
 * Asserts that an element with the given test ID is present in the document.
 *
 * @param testId - The test ID of the element to find.
 */
export function expectElementToBeInTheDocument(testId: string): void {
  expect(screen.getByTestId(testId)).toBeInTheDocument()
}

/**
 * Asserts that an element with the given test ID has a specific class.
 *
 * @param testId - The test ID of the element to find.
 * @param className - The class name to check for.
 */
export function expectElementToHaveClass(testId: string, className: string): void {
  expect(screen.getByTestId(testId)).toHaveClass(className)
}

/**
 * Asserts that an element with the given test ID has specific text content.
 *
 * @param testId - The test ID of the element to find.
 * @param text - The text content to check for.
 */
export function expectElementToHaveTextContent(testId: string, text: string): void {
  expect(screen.getByTestId(testId)).toHaveTextContent(text)
}

/**
 * Creates a test harness component for testing hooks.
 *
 * @param useHook - The hook to test.
 * @param renderComponent - Function that renders the hook result into a component.
 * @returns A component that can be used in tests.
 */
export function createHookTestHarness<T, P>(
  useHook: (props: P) => T,
  renderComponent: (hookResult: T) => React.ReactElement,
): React.FC<P> {
  return (props: P) => {
    const hookResult = useHook(props)
    return renderComponent(hookResult)
  }
}

/**
 * Mocks a property on an HTML element for testing purposes.
 *
 * @param element - The element to mock the property on.
 * @param property - The property name to mock.
 * @param value - The value to return for the property.
 */
export function mockElementProperty(element: HTMLElement, property: string, value: unknown): void {
  Object.defineProperty(element, property, {
    configurable: true,
    get: () => value,
  })
}

/**
 * Asserts that an element with the given test ID is not in the document.
 *
 * @param testId - The test ID of the element to check.
 */
export function expectElementNotToBeInTheDocument(testId: string): void {
  expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
}

/**
 * Asserts that an element with the given test ID does not have a specific class.
 *
 * @param testId - The test ID of the element to find.
 * @param className - The class name to check for absence.
 */
export function expectElementNotToHaveClass(testId: string, className: string): void {
  expect(screen.getByTestId(testId)).not.toHaveClass(className)
}
