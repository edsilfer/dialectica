import React, { useEffect, PropsWithChildren } from 'react'
import { render, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

/**
 * A spy component that allows tests to access the latest value of a React context.
 * It calls the provided callback with the context value whenever it changes.
 *
 * @param cb The callback function to be called with the context value.
 * @param useCtx The context hook to be spied on.
 */
export function ContextSpy<T>({ cb, useCtx }: { cb: (ctx: T) => void; useCtx: () => T }): null {
  const ctx = useCtx()
  useEffect(() => {
    cb(ctx)
  }, [ctx, cb])
  return null
}

/**
 * Renders a component that spies on a context and returns a function to get the latest context value.
 *
 * @param Provider The context provider component.
 * @param useCtx The context hook to be spied on.
 * @param providerProps The props to be passed to the provider component.
 * @returns A function that returns the latest context value.
 */
export async function renderWithContext<T, P extends Record<string, unknown>>(
  Provider: React.ComponentType<PropsWithChildren<P>>,
  useCtx: () => T,
  providerProps: P,
): Promise<() => T> {
  let latest: T | undefined
  const propsWithChildren = { ...providerProps, children: <ContextSpy cb={(c: T) => (latest = c)} useCtx={useCtx} /> }
  render(React.createElement(Provider, propsWithChildren))
  await waitFor(() => expect(latest).toBeDefined())
  return () => latest as T
}
