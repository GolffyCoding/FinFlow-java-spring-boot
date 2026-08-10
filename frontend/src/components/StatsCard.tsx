import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  tone?: 'primary' | 'success' | 'warning' | 'destructive'
}

const toneClasses: Record<NonNullable<StatsCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive'
}

export default function StatsCard({ title, value, subtitle, icon: Icon, tone = 'primary' }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {title}
          </p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}
