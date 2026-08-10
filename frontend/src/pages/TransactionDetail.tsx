import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Circle
} from 'lucide-react'
import api from '../services/api'
import { Transaction, AuditLog } from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function statusTone(status: string) {
  if (status === 'COMPLETED') return { variant: 'success' as const, icon: CheckCircle2 }
  if (status === 'PENDING') return { variant: 'warning' as const, icon: Clock }
  return { variant: 'destructive' as const, icon: XCircle }
}

export default function TransactionDetail() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const navigate = useNavigate()

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const res = await api.get(`/transactions/${transactionId}`)
      return res.data as Transaction
    },
    enabled: !!transactionId
  })

  const { data: logs } = useQuery({
    queryKey: ['transactionAuditLogs', transactionId],
    queryFn: async () => {
      const res = await api.get(`/audit/logs/transaction/${transactionId}`)
      return res.data as AuditLog[]
    },
    enabled: !!transactionId
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/transactions')}>
          <ArrowLeft className="size-4" />
          Back to Transactions
        </Button>
        <p className="text-muted-foreground">Transaction not found</p>
      </div>
    )
  }

  const tone = statusTone(tx.status)
  const StatusIcon = tone.icon
  const isHighRisk = tx.fraudLevel === 'HIGH' || tx.fraudLevel === 'CRITICAL'
  const timeline = (logs ?? []).slice().sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/transactions')} className="-ml-2">
        <ArrowLeft className="size-4" />
        Back to Transactions
      </Button>

      <Card className={isHighRisk ? 'border-destructive/50' : undefined}>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-mono text-sm text-muted-foreground">{tx.transactionId}</p>
          {isHighRisk && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3.5" />
              {tx.fraudLevel} RISK
            </Badge>
          )}
          <p className="text-4xl font-semibold tabular-nums">
            ฿{tx.amount.toLocaleString()} <span className="text-lg text-muted-foreground">{tx.currency}</span>
          </p>
          <Badge variant={tone.variant} className="px-3 py-1.5 text-sm">
            <StatusIcon className="size-3.5" />
            {tx.status}
          </Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{tx.transactionType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{tx.fromAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium">{tx.toAccount}</span>
            </div>
            {tx.merchant && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant</span>
                <span className="font-medium">{tx.merchant}</span>
              </div>
            )}
            {tx.description && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium">{tx.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{new Date(tx.createdAt).toLocaleString()}</span>
            </div>
            {tx.fraudScore != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fraud Score</span>
                <span className="font-medium">{(tx.fraudScore * 100).toFixed(0)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events recorded yet</p>
            ) : (
              <ol className="space-y-0">
                {timeline.map((log, i) => (
                  <li key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <Circle className="size-3 shrink-0 fill-primary text-primary" />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm font-medium">{log.eventType.split('_').join(' ')}</p>
                      {log.status && (
                        <p className="text-xs text-muted-foreground">Status: {log.status}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
