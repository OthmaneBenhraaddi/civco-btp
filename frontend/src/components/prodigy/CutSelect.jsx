import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Chamfered select — trigger + menu match the Prodigy “More” dropdown.
 * Menu portals to document.body so it isn't clipped by modal overflow.
 */
export default function CutSelect({
  value,
  onChange,
  options = [],
  className = '',
  placeholder = 'Select',
  disabled = false,
  align = 'left',
  size = 'md',
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const listId = useId()

  const items = useMemo(
    () =>
      options.map((option) =>
        typeof option === 'string'
          ? { value: option, label: option }
          : { value: String(option.value), label: option.label },
      ),
    [options],
  )

  const selected = items.find((item) => item.value === String(value ?? ''))
  const label = selected?.label ?? placeholder

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuStyle(null)
      return
    }

    function place() {
      const rect = triggerRef.current.getBoundingClientRect()
      const maxWidth = Math.min(Math.max(rect.width, 160), 360)
      const spaceBelow = window.innerHeight - rect.bottom - 12
      const openUp = spaceBelow < 220 && rect.top > spaceBelow

      setMenuStyle({
        position: 'fixed',
        top: openUp ? undefined : rect.bottom + 8,
        bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
        left: align === 'right' ? undefined : rect.left,
        right: align === 'right' ? window.innerWidth - rect.right : undefined,
        minWidth: rect.width,
        maxWidth,
        maxHeight: Math.min(280, openUp ? rect.top - 16 : spaceBelow),
        zIndex: 80,
      })
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align])

  useEffect(() => {
    function onPointerDown(event) {
      const inTrigger = rootRef.current?.contains(event.target)
      const inMenu = menuRef.current?.contains(event.target)
      if (!inTrigger && !inMenu) setOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  function choose(next) {
    onChange?.(next)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={[
        'pg-cut-select',
        size === 'sm' ? 'is-compact' : '',
        open ? 'is-open' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        ref={triggerRef}
        type="button"
        className="pg-cut-select__trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!disabled) setOpen((current) => !current)
        }}
      >
        <span className="pg-cut-select__label">{label}</span>
        <IconChevron className={`pg-cut-select__chevron ${open ? 'is-open' : ''}`} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              className="pg-cut-shell pg-cut-shell--sm pg-cut-select__menu"
              style={menuStyle}
            >
              <div className="pg-cut-shell__inner max-h-[inherit] overflow-y-auto py-1.5">
                {items.map((item) => {
                  const active = item.value === String(value ?? '')
                  return (
                    <button
                      key={item.value || '__empty'}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`pg-cut-select__option ${active ? 'is-active' : ''}`}
                      onClick={() => choose(item.value)}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function IconChevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" />
    </svg>
  )
}
