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
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          
          {subtitle && (
            <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-600 ml-2">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${
          iconColor === 'blue' ? 'bg-blue-100' :
          iconColor === 'green' ? 'bg-green-100' :
          iconColor === 'purple' ? 'bg-purple-100' :
          iconColor === 'orange' ? 'bg-orange-100' :
          iconColor === 'red' ? 'bg-red-100' :
          iconColor === 'pink' ? 'bg-pink-100' :
          iconColor === 'indigo' ? 'bg-indigo-100' :
          'bg-yellow-100'
        }`}>
          <Icon className={`w-6 h-6 ${
            iconColor === 'blue' ? 'text-blue-600' :
            iconColor === 'green' ? 'text-green-600' :
            iconColor === 'purple' ? 'text-purple-600' :
            iconColor === 'orange' ? 'text-orange-600' :
            iconColor === 'red' ? 'text-red-600' :
            iconColor === 'pink' ? 'text-pink-600' :
            iconColor === 'indigo' ? 'text-indigo-600' :
            'text-yellow-600'
          }`} />
        </div>
      </div>
    </div>
  )
}