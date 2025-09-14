export interface EmptyStateProps {
  currentTenant?: any
  activeTopLevelTab?: string
}

export function EmptyState({ currentTenant, activeTopLevelTab }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Welcome to O-UI</h3>
        <p className="text-muted-foreground mb-4">
          Select a node from the navigation tree to view its content
        </p>
        {currentTenant && (
          <div className="text-sm text-muted-foreground">
            <span>Workspace: </span>
            <span className="font-medium">{currentTenant.name}</span>
          </div>
        )}
        {activeTopLevelTab && (
          <div className="text-sm text-muted-foreground mt-2">
            <span>Active Section: </span>
            <span className="font-medium">{activeTopLevelTab}</span>
          </div>
        )}
      </div>
    </div>
  )
} 