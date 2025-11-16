import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'indigo' | 'yellow'
}

export function StatsCard({ title, value, icon: Icon, trend, subtitle, iconColor = 'blue' }: StatsCardProps) {
  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    pink: 'text-pink-500',
    indigo: 'text-indigo-500',
    yellow: 'text-yellow-500',
  }
  
  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-black dark:text-white">{title}</p>
          <p className="text-2xl font-bold text-black dark:text-white mt-2">{value}</p>
          
          {subtitle && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900">
          <Icon className={`w-6 h-6 ${iconColors[iconColor]}`} />
        </div>
      </div>
    </div>
  )
}