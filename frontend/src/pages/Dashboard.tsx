import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, ShieldAlert, CheckCircle2, Landmark, Clock } from 'lucide-react'
import StatsCard from '../components/StatsCard'
import { dashboardApi } from '../services/dashboardService'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: 'var(--color-chart-5)',
  HIGH: 'var(--color-chart-4)',
  MEDIUM: 'var(--color-chart-2)',
  LOW: 'var(--color-chart-3)'
}

function statusVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const
  if (status === 'PENDING') return 'warning' as const
  return 'destructive' as const
}

function fraudVariant(level: string) {
  if (level === 'CRITICAL') return 'destructive' as const
  if (level === 'HIGH') return 'warning' as const
  return 'secondary' as const
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000
  })

  const { data: dailyVolume } = useQuery({
    queryKey: ['dailyVolume'],
    queryFn: () => dashboardApi.getDailyVolume(7),
    refetchInterval: 30000
  })

  const { data: fraudBreakdown } = useQuery({
    queryKey: ['fraudBreakdown'],
    queryFn: dashboardApi.getFraudLevelBreakdown,
    refetchInterval: 30000
  })

  const { data: recentTx } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: dashboardApi.getRecentTransactions,
    refetchInterval: 30000
  })

  const { data: alerts } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: dashboardApi.getRecentAlerts,
    refetchInterval: 30000
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  const volumeChartData = (dailyVolume ?? []).map((d) => ({
    name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    volume: Number((d.volume / 1_000_000).toFixed(3))
  }))

  const fraudChartData = (fraudBreakdown ?? []).map((d) => ({
    name: d.level,
    value: d.count,
    color: LEVEL_COLORS[d.level] ?? 'var(--color-chart-2)'
  }))
  const hasFraudData = fraudChartData.some((d) => d.value > 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{greeting}, Admin</h2>
        <p className="text-sm text-muted-foreground">Here's today's financial overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Volume"
          value={`฿${((stats?.todayVolume || 0) / 1000).toFixed(1)}K`}
          subtitle={`${stats?.todayCount || 0} transactions today`}
          icon={ArrowLeftRight}
          tone="primary"
        />
        <StatsCard
          title="Success Rate"
          value={`${(stats?.successRate ?? 100).toFixed(1)}%`}
          subtitle="Last 100 transactions"
          icon={CheckCircle2}
          tone="success"
        />
        <StatsCard
          title="Fraud Detections"
          value={stats?.fraudDetections ?? 0}
          subtitle="Open alerts"
          icon={ShieldAlert}
          tone="destructive"
        />
        <StatsCard
          title="Active Accounts"
          value={stats?.activeAccounts ?? 0}
          subtitle="Total registered accounts"
          icon={Landmark}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction Volume (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [`฿${value}M`, 'Volume']}
                  contentStyle={{
                    background: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    fontSize: 13
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--color-chart-1)"
                  fill="var(--color-chart-1)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fraud Alert Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex h-80 flex-col">
            {hasFraudData ? (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={fraudChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value">
                      {fraudChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-popover)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        fontSize: 13
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {fraudChartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <ShieldAlert className="size-8 opacity-40" />
                <p className="text-sm">No fraud alerts recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {recentTx && recentTx.length > 0 ? (
              recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex cursor-pointer items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-muted/50"
                  onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{tx.transactionId}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.fromAccount} → {tx.toAccount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">฿{tx.amount.toLocaleString()}</p>
                    <Badge variant={statusVariant(tx.status)} className="mt-0.5">
                      {tx.status === 'COMPLETED' ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <Clock className="size-3" />
                      )}
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Fraud Alerts</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex cursor-pointer items-center justify-between py-2.5 first:pt-0 last:pb-0 hover:bg-muted/50"
                  onClick={() => navigate(`/fraud-alerts/${alert.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">{alert.transactionId}</p>
                    <p className="text-xs text-muted-foreground">{alert.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-destructive tabular-nums">
                      {(alert.fraudScore * 100).toFixed(0)}%
                    </p>
                    <Badge variant={fraudVariant(alert.fraudLevel)} className="mt-0.5">
                      {alert.fraudLevel}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground">No active alerts</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
