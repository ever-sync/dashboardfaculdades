interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'secondary' | 'destructive'
  className?: string
  style?: React.CSSProperties
}

export function Badge({ children, variant = 'info', className = '', style }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    success: 'bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-500/20 dark:bg-red-500/30 text-red-700 dark:text-red-400',
    info: 'bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800',
    default: 'bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800',
    secondary: 'bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-800',
    destructive: 'bg-red-100 dark:bg-red-200 text-red-700 dark:text-red-800',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[variant]} ${className}`} style={style}>
      {children}
    </span>
  )
}