interface PageHeaderProps {
  heading: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ heading, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <h2 className="text-2xl font-bold">{heading}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
} 