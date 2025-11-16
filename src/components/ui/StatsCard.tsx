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
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-black">{title}</p>
          <p className="text-2xl font-bold text-black mt-2">{value}</p>
          
          {subtitle && (
            <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-600 ml-2">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-gray-100">
          <Icon className={`w-6 h-6 ${iconColors[iconColor]}`} />
        </div>
      </div>
    </div>
  )
}