import { Loader2 } from "lucide-react"

interface LoadMoreProps {
  onClick: () => void
  loading?: boolean
}

export function LoadMore({ onClick, loading }: LoadMoreProps) {
  return (
    <div 
      className="flex items-center justify-center p-2 hover:bg-accent/40 cursor-pointer"
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        "Load more..."
      )}
    </div>
  )
} 