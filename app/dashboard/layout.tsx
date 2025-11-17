import { Sidebar } from '@/components/dashboard/Sidebar'
import { FaculdadeProvider } from '@/contexts/FaculdadeContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FaculdadeProvider>
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar />
        <div className="flex-1 bg-white lg:pl-0 overflow-y-auto">
          {/* Mobile header spacer */}
          <div className="lg:hidden h-16 flex-shrink-0" />
          {children}
        </div>
      </div>
    </FaculdadeProvider>
  )
}