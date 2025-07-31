import React, { useEffect, useState } from 'react'

/**
 * A hook that checks if the container has enough horizontal space to display the children.
 *
 * @param ref  - The ref to the container.
 * @param deps - The dependencies to watch.
 * @returns      True if the container has enough horizontal space, false otherwise.
 */
export function useHasHorizontalSpace(ref: React.RefObject<HTMLElement | null>, deps: React.DependencyList = []) {
  const [hasSpace, setHasSpace] = useState(true)

  useEffect(() => {
    const checkFit = () => {
      const container = ref.current
      if (!container) return

      let totalWidth = 0
      for (const child of Array.from(container.children)) {
        const currentWidth = (child as HTMLElement).getBoundingClientRect().width
        totalWidth += currentWidth
      }

      const containerWidth = container.getBoundingClientRect().width
      setHasSpace(totalWidth <= containerWidth)
    }

    checkFit()
    window.addEventListener('resize', checkFit)
    return () => window.removeEventListener('resize', checkFit)
  }, [ref, ...deps])

  return hasSpace
}
