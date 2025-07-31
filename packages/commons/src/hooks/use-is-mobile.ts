import { useEffect, useState } from 'react'

/**
 * Hook to determine if the current device is mobile.
 *
 * @param breakpoint - The breakpoint to use for determining if the device is mobile.
 * @returns          - Whether the current device is mobile.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handleChange = () => setIsMobile(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [breakpoint])

  return isMobile
}
