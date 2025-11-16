import { Sidebar } from '@/components/dashboard/Sidebar'
import { FaculdadeProvider } from '@/contexts/FaculdadeContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FaculdadeProvider>
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 bg-gray-50 lg:pl-0">
          {/* Mobile header spacer */}
          <div className="lg:hidden h-16" />
          {children}
        </div>
      </div>
    </FaculdadeProvider>
  )
}