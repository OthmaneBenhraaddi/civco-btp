export default function PrintCopyBadge({ label }) {
  if (!label) {
    return null
  }

  return (
    <div
      className="print-copy-badge print-copy-badge-copy inline-flex items-center justify-center rounded-md border-2 border-rose-600 px-4 py-1.5 text-sm font-black uppercase tracking-[0.35em] text-rose-700"
      aria-label={label}
    >
      {label}
    </div>
  )
}
