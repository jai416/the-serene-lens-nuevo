export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-[20px] border border-[#E8E8E8] p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-[#E8E8E8] rounded w-1/3" />
        <div className="h-3 bg-[#E8E8E8] rounded w-2/3" />
        <div className="h-20 bg-[#E8E8E8] rounded-xl" />
        <div className="h-3 bg-[#E8E8E8] rounded w-1/2" />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-[20px] border border-[#E8E8E8] p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E8E8E8] rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#E8E8E8] rounded w-1/3" />
            <div className="h-2.5 bg-[#E8E8E8] rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse space-y-6">
      <div className="h-8 bg-[#E8E8E8] rounded w-1/3 mb-8" />
      <div className="bg-white rounded-[20px] border border-[#E8E8E8] p-6 space-y-5">
        <div className="h-4 bg-[#E8E8E8] rounded w-1/4" />
        <div className="h-10 bg-[#E8E8E8] rounded-xl" />
        <div className="h-4 bg-[#E8E8E8] rounded w-1/4" />
        <div className="h-10 bg-[#E8E8E8] rounded-xl" />
        <div className="h-10 bg-[#E8E8E8] rounded-xl w-1/3" />
      </div>
    </div>
  )
}
