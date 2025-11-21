import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  containerClassName?: string
  startIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      error,
      className = '',
      containerClassName = 'mb-4',
      startIcon,
      ...props
    },
    ref
  ) {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-sm font-medium text-black dark:text-black mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-300 !bg-white dark:!bg-white !text-black dark:!text-black rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-400 ${startIcon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    )
  }
)