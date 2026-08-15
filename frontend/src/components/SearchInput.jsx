function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" strokeLinecap="round" />
    </svg>
  )
}

export default function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`search-input-wrap pg-field-shell relative flex flex-1 items-center ${className}`.trim()}>
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-slate-300" />
      <input
        type="search"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
