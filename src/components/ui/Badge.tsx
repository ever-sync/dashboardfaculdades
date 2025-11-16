interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info'
}

export function Badge({ children, variant = 'info' }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[variant]}`}>
      {children}
    </span>
  )
}