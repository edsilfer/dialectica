import React, { useEffect, useRef } from 'react'

/**
 * A controller for the demo loop.
 *
 * @param container - The container element
 */
export class DemoController {
  private controller: AbortController
  private signal: AbortSignal
  private container: React.RefObject<HTMLElement | null>

  constructor(container: React.RefObject<HTMLElement | null>) {
    this.controller = new AbortController()
    this.signal = this.controller.signal
    this.container = container
  }

  public abort() {
    this.controller.abort()
  }

  public sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))

      const id = setTimeout(resolve, ms)

      this.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(id)
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    })
  }

  public clickElement(selector: string, index: number = 0) {
    const elements = this.container.current?.querySelectorAll<HTMLElement>(selector)
    if (elements && elements[index]) {
      elements[index].click()
    } else {
      console.warn(`No element found at index ${index} matching selector: ${selector}`)
    }
  }

  public findElement<T extends Element = Element>(selector: string): T | null {
    return this.container.current?.querySelector<T>(selector) ?? null
  }

  public async typeInInput(input: HTMLInputElement | HTMLTextAreaElement, text: string) {
    for (let i = 0; i <= text.length; i += 1) {
      if (this.signal.aborted) throw new DOMException('Aborted', 'AbortError')
      this.setNativeInputValue(input, text.slice(0, i))
      await this.sleep(100)
    }
  }

  public clearInput(input: HTMLInputElement | HTMLTextAreaElement) {
    this.setNativeInputValue(input, '')
  }

  private setNativeInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

/**
 * Starts an infinite demo loop to display the component's capabilities.
 *
 * @param ref          - The ref to the container element
 * @param enabled      - Whether the demo is enabled
 * @param delay        - The delay in milliseconds before starting the demo
 * @param script       - The callback that defines the demo steps
 */
export const useDemo = (
  ref: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  delay: number,
  script: (demo: DemoController) => Promise<void>,
) => {
  const demoRef = useRef<DemoController | null>(null)
  const scriptRef = useRef(script)

  // always keep the latest script
  useEffect(() => {
    scriptRef.current = script
  }, [script])

  useEffect(() => {
    if (!enabled) return

    const startDemo = async (withDelay: boolean) => {
      demoRef.current?.abort()
      const demo = new DemoController(ref)
      demoRef.current = demo

      try {
        if (withDelay) await demo.sleep(delay)
        await scriptRef.current(demo)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // expected cancellation
        } else {
          console.error('Demo script error:', err)
        }
      }
    }

    void startDemo(delay > 0)
    const handleMouseEnter = () => demoRef.current?.abort()
    const handleMouseLeave = () => void startDemo(false)

    const node = ref.current
    node?.addEventListener('mouseenter', handleMouseEnter)
    node?.addEventListener('mouseleave', handleMouseLeave)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.5) {
          demoRef.current?.abort()
        }
      },
      { threshold: 0.5 },
    )
    if (node) observer.observe(node)

    return () => {
      demoRef.current?.abort()
      node?.removeEventListener('mouseenter', handleMouseEnter)
      node?.removeEventListener('mouseleave', handleMouseLeave)
      observer.disconnect()
    }
  }, [ref, enabled, delay])
}

/**
 * Observes when an element becomes visible (≥50% intersection) and triggers a one-shot callback.
 *
 * @param ref          - The ref to the element to observe
 * @param cb           - Whether the element has been triggered
 * @param setTriggered - A function to set the triggered state
 */
export const useIntersectionTrigger = (
  ref: React.RefObject<Element | null>,
  cb: boolean,
  setTriggered: (v: boolean) => void,
) => {
  useEffect(() => {
    if (cb || !ref.current) return

    const handler: IntersectionObserverCallback = ([entry], observer) => {
      if (entry.isIntersecting) {
        setTriggered(true)
        observer.disconnect()
      }
    }

    const observer = new IntersectionObserver(handler, { threshold: 0.5 })
    observer.observe(ref.current)

    // We intentionally include `ref.current` so the effect runs again once the ref gets its element
  }, [cb, ref.current, setTriggered])
}
