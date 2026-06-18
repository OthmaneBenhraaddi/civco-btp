function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L17 17" strokeLinecap="round" />
    </svg>
  )
}

const INPUT_CLASSES = [
  'search-input w-full min-w-[200px] rounded-lg border-0 bg-[#1A1B20] py-2.5 pr-4',
  'text-sm text-slate-200 placeholder:text-slate-500',
  'transition-shadow duration-200',
  'focus:outline-none focus:ring-1 focus:ring-blue-500/50',
].join(' ')

export default function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`search-input-wrap relative flex flex-1 items-center ${className}`}>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
