import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-black">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}