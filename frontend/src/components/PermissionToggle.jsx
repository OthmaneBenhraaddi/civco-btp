export default function PermissionToggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        'permission-toggle relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5',
        'border-0 shadow-none transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,197,94,0.35)]',
        checked ? 'bg-[rgba(34,197,94,0.45)]' : 'bg-slate-800',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full shadow-sm transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-4 bg-white' : 'translate-x-0 bg-slate-300',
        ].join(' ')}
        aria-hidden
      />
    </button>
  )
}
