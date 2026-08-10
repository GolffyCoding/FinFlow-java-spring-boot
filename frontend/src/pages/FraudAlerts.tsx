import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '../services/api'
import { FraudAlert, FraudLevelBreakdown } from '../types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

function levelVariant(level: string) {
  if (level === 'CRITICAL') return 'destructive' as const
  if (level === 'HIGH') return 'warning' as const
  return 'secondary' as const
}

function statusVariant(status: string) {
  if (status === 'OPEN') return 'destructive' as const
  if (status === 'RESOLVED') return 'success' as const
  return 'warning' as const
}

const SEVERITY_CARDS: { level: string; label: string; icon: typeof AlertTriangle; tone: string }[] = [
  { level: 'CRITICAL', label: 'Critical', icon: AlertTriangle, tone: 'text-destructive' },
  { level: 'HIGH', label: 'High', icon: AlertCircle, tone: 'text-chart-4' },
  { level: 'MEDIUM', label: 'Medium', icon: ShieldAlert, tone: 'text-chart-2' },
  { level: 'LOW', label: 'Low', icon: Info, tone: 'text-chart-3' }
]

export default function FraudAlerts() {
  const navigate = useNavigate()
  const [levelFilter, setLevelFilter] = useState<string | undefined>(undefined)

  const { data: breakdown } = useQuery({
    queryKey: ['fraudLevelBreakdown'],
    queryFn: async () => {
      const res = await api.get('/fraud/stats')
      return (res.data.levelBreakdown ?? []) as FraudLevelBreakdown[]
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['fraudAlerts'],
    queryFn: async () => {
      const res = await api.get('/fraud/alerts?page=0&size=50')
      return res.data as { content: FraudAlert[]; totalElements: number }
    }
  })

  const countFor = (level: string) => breakdown?.find((b) => b.level === level)?.count ?? 0
  const allRows = data?.content ?? []
  const rows = levelFilter ? allRows.filter((a) => a.fraudLevel === levelFilter) : allRows

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Fraud Center</h2>
        <Badge variant="destructive" className="px-3 py-1.5 text-sm">
          <ShieldAlert className="size-3.5" />
          {data?.totalElements ?? 0} Total Alerts
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SEVERITY_CARDS.map((c) => {
          const CardIcon = c.icon
          const active = levelFilter === c.level
          return (
            <Card
              key={c.level}
              className={cn(
                'cursor-pointer transition-colors',
                active ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted/40'
              )}
              onClick={() => setLevelFilter(active ? undefined : c.level)}
            >
              <CardContent className="flex items-center justify-between py-5">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {c.label}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">{countFor(c.level)}</p>
                </div>
                <CardIcon className={cn('size-6', c.tone)} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No fraud alerts found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/fraud-alerts/${alert.id}`)}
                  >
                    <TableCell className="font-medium">{alert.transactionId}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ฿{alert.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{alert.currency}</TableCell>
                    <TableCell className="tabular-nums">{(alert.fraudScore * 100).toFixed(0)}%</TableCell>
                    <TableCell>
                      <Badge variant={levelVariant(alert.fraudLevel)}>{alert.fraudLevel}</Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{alert.reason}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(alert.status)}>{alert.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
