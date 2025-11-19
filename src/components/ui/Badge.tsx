interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const variants = {
    success: 'bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-400',
    info: 'bg-gray-100 dark:bg-gray-100 text-gray-700 dark:text-gray-700',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}