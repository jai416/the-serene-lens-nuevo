import { CardSkeleton } from "@/components/ui/skeleton"

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="space-y-4 w-full max-w-md">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
