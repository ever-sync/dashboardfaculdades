import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  containerClassName?: string
}

export function Input({
  label,
  error,
  className = '',
  containerClassName = 'mb-4',
  ...props
}: InputProps) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-black dark:text-black mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-300 !bg-white dark:!bg-white !text-black dark:!text-black rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-400 ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}