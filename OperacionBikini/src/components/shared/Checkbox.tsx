interface CheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
  className?: string
}

export default function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-3 text-left w-full group ${className}`}
      aria-checked={checked}
      role="checkbox"
    >
      <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
        checked
          ? 'bg-green-500 border-green-500'
          : 'border-gray-300 dark:border-gray-600 group-hover:border-green-400'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label && (
        <span className={`text-sm transition-all duration-200 ${checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {label}
        </span>
      )}
    </button>
  )
}
