function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" strokeLinecap="round" />
    </svg>
  )
}

const INPUT_CLASSES = [
  'search-input w-full min-w-[200px] rounded-xl border border-slate-800 bg-[#1c1d22] py-2.5 pl-11 pr-4',
  'text-sm text-white placeholder:text-slate-500',
  'transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500/40',
].join(' ')

export default function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`search-input-wrap ${className}`.trim()}>
      <SearchIcon className="search-icon h-4 w-4 shrink-0" />
      <input
        type="search"
        className={INPUT_CLASSES}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
