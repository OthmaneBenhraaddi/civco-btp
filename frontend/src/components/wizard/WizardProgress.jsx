export default function WizardProgress({ currentStep, stepCount, labels }) {
  const total = stepCount ?? labels.length
  const progress = ((currentStep + 1) / total) * 100

  return (
    <div className="mb-8 space-y-4">
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {labels.map((label, index) => {
          const isActive = index === currentStep
          const isComplete = index < currentStep

          return (
            <li
              key={label}
              className={[
                'flex items-center gap-2 text-xs font-medium transition-colors duration-200',
                isActive ? 'text-white' : isComplete ? 'text-slate-400' : 'text-slate-500',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                  isActive
                    ? 'bg-white text-[#0b0c0e]'
                    : isComplete
                      ? 'bg-white/10 text-slate-300'
                      : 'bg-white/[0.04] text-slate-500',
                ].join(' ')}
              >
                {index + 1}
              </span>
              {label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
