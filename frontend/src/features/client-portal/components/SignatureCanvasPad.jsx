import { useCallback, useEffect, useRef } from 'react'
import { BTN_GHOST, BTN_PRIMARY } from '../../../theme/designTokens'

export default function SignatureCanvasPad({
  disabled = false,
  onChange,
  clearLabel = 'Effacer',
  heightClass = 'h-56',
}) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)

  const exportSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }

    return canvas.toDataURL('image/png')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const context = canvas.getContext('2d')
    const ratio = window.devicePixelRatio || 1
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    canvas.width = width * ratio
    canvas.height = height * ratio
    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 2.5
    context.strokeStyle = '#111827'

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect()
      const clientX = event.touches ? event.touches[0].clientX : event.clientX
      const clientY = event.touches ? event.touches[0].clientY : event.clientY

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
    }

    function startDraw(event) {
      if (disabled) {
        return
      }

      event.preventDefault()
      drawingRef.current = true
      const point = getPoint(event)
      context.beginPath()
      context.moveTo(point.x, point.y)
    }

    function draw(event) {
      if (!drawingRef.current || disabled) {
        return
      }

      event.preventDefault()
      const point = getPoint(event)
      context.lineTo(point.x, point.y)
      context.stroke()
      onChange?.(exportSignature())
    }

    function endDraw(event) {
      if (!drawingRef.current) {
        return
      }

      event.preventDefault()
      drawingRef.current = false
      onChange?.(exportSignature())
    }

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('mouseleave', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', endDraw)
      canvas.removeEventListener('mouseleave', endDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', endDraw)
    }
  }, [disabled, exportSignature, onChange])

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    onChange?.(null)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-dashed border-white/15 bg-white">
        <canvas
          ref={canvasRef}
          className={`${heightClass} w-full touch-none`}
          aria-label="Signature pad"
        />
      </div>
      <button type="button" onClick={clearCanvas} disabled={disabled} className={BTN_GHOST}>
        {clearLabel}
      </button>
    </div>
  )
}

export function SignatureCanvasPadSubmit({
  disabled,
  onChange,
  clearLabel,
  submitLabel,
  submitting,
  onSubmit,
  heightClass,
}) {
  return (
    <div className="space-y-4">
      <SignatureCanvasPad
        disabled={disabled}
        onChange={onChange}
        clearLabel={clearLabel}
        heightClass={heightClass}
      />
      <button type="button" disabled={disabled || submitting} onClick={onSubmit} className={BTN_PRIMARY}>
        {submitting ? '...' : submitLabel}
      </button>
    </div>
  )
}
