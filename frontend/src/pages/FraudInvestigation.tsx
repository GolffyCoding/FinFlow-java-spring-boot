import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ShieldCheck, ShieldX, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'
import { FraudAlert, Transaction } from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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

export default function FraudInvestigation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: alert, isLoading } = useQuery({
    queryKey: ['fraudAlert', id],
    queryFn: async () => {
      const res = await api.get(`/fraud/alerts/${id}`)
      return res.data as FraudAlert
    },
    enabled: !!id
  })

  const { data: tx } = useQuery({
    queryKey: ['transaction', alert?.transactionId],
    queryFn: async () => {
      const res = await api.get(`/transactions/${alert!.transactionId}`)
      return res.data as Transaction
    },
    enabled: !!alert?.transactionId
  })

  const resolveMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.post(`/fraud/alerts/${id}/resolve?resolvedBy=admin&status=${status}`)
    },
    onSuccess: (_, status) => {
      toast.success(`Alert marked as ${status.replace('_', ' ').toLowerCase()}`)
      queryClient.invalidateQueries({ queryKey: ['fraudAlert', id] })
      queryClient.invalidateQueries({ queryKey: ['fraudAlerts'] })
    },
    onError: () => toast.error('Failed to update alert')
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/fraud-alerts')}>
          <ArrowLeft className="size-4" />
          Back to Fraud Center
        </Button>
        <p className="text-muted-foreground">Alert not found</p>
      </div>
    )
  }

  const signals = alert.reason.split(';').map((s) => s.trim()).filter(Boolean)
  const scorePct = (alert.fraudScore * 100).toFixed(0)
  const isResolved = alert.status === 'RESOLVED' || alert.status === 'CONFIRMED_FRAUD'

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/fraud-alerts')} className="-ml-2">
        <ArrowLeft className="size-4" />
        Back to Fraud Center
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Investigate {alert.transactionId}</h2>
        <Badge variant={statusVariant(alert.status)} className="px-3 py-1.5 text-sm">
          {alert.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-3xl font-semibold tabular-nums">฿{alert.amount.toLocaleString()}</p>
            <Badge variant={tx ? (tx.status === 'COMPLETED' ? 'success' : 'destructive') : 'secondary'}>
              {tx?.status ?? 'UNKNOWN'}
            </Badge>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{tx?.fromAccount ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{tx?.toAccount ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{tx?.transactionType ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{alert.currency}</span>
              </div>
            </div>
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => navigate(`/transactions/${alert.transactionId}`)}
            >
              View full transaction &rarr;
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground">Fraud Score</span>
                <span className="font-semibold">{scorePct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-destructive"
                  style={{ width: `${scorePct}%` }}
                />
              </div>
            </div>
            <Badge variant={levelVariant(alert.fraudLevel)}>{alert.fraudLevel} RISK</Badge>
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Signals
              </p>
              <ul className="space-y-1.5">
                {signals.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account</span>
              <span className="font-medium">{tx?.fromAccount ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alert Created</span>
              <span className="font-medium">{new Date(alert.createdAt).toLocaleString()}</span>
            </div>
            {alert.resolvedAt && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved At</span>
                  <span className="font-medium">{new Date(alert.resolvedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved By</span>
                  <span className="font-medium">{alert.resolvedBy ?? '-'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            disabled={isResolved || resolveMutation.isPending}
            onClick={() => resolveMutation.mutate('RESOLVED')}
          >
            <ShieldCheck className="size-4" />
            Approve (False Positive)
          </Button>
          <Button
            variant="destructive"
            disabled={isResolved || resolveMutation.isPending}
            onClick={() => resolveMutation.mutate('CONFIRMED_FRAUD')}
          >
            <ShieldX className="size-4" />
            Keep Blocked / Confirm Fraud
          </Button>
          <Button
            variant="outline"
            disabled={isResolved || resolveMutation.isPending}
            onClick={() => resolveMutation.mutate('INVESTIGATING')}
          >
            <ArrowUpRight className="size-4" />
            Escalate
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
