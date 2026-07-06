export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#1A1A1A]">
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}
