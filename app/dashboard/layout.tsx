import { Sidebar } from '@/components/dashboard/Sidebar'
import { FaculdadeProvider } from '@/contexts/FaculdadeContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FaculdadeProvider>
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 bg-white lg:pl-0">
          {/* Mobile header spacer */}
          <div className="lg:hidden h-16" />
          {children}
        </div>
      </div>
    </FaculdadeProvider>
  )
}