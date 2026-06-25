import { useEffect } from 'react'

const SCROLL_CONTAINER_SELECTOR = '.main-content-scroll'
const EDGE_THRESHOLD = 80
const SCROLL_STEP = 16

/**
 * Scrolls the main content area while dragging near the top or bottom edge.
 * HTML5 drag blocks native scroll — this keeps long dashboards reachable during reorder.
 */
export function useDragAutoScroll(isActive) {
  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    let rafId = null
    let lastClientY = null

    function tick() {
      const scrollEl = document.querySelector(SCROLL_CONTAINER_SELECTOR)

      if (scrollEl && lastClientY != null) {
        const rect = scrollEl.getBoundingClientRect()

        if (lastClientY - rect.top < EDGE_THRESHOLD) {
          scrollEl.scrollTop -= SCROLL_STEP
        } else if (rect.bottom - lastClientY < EDGE_THRESHOLD) {
          scrollEl.scrollTop += SCROLL_STEP
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    function onDragOver(event) {
      event.preventDefault()
      lastClientY = event.clientY
    }

    rafId = requestAnimationFrame(tick)
    document.addEventListener('dragover', onDragOver)

    return () => {
      document.removeEventListener('dragover', onDragOver)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isActive])
}
