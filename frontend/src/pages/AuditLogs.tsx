import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import api from '../services/api'
import { AuditLog } from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

const PAGE_SIZE = 20

function eventVariant(eventType: string) {
  if (eventType.includes('FAIL') || eventType.includes('REJECT')) return 'destructive' as const
  if (eventType.includes('FRAUD') || eventType.includes('ALERT')) return 'warning' as const
  return 'secondary' as const
}

export default function AuditLogs() {
  const [page, setPage] = useState(0)
  const [transactionId, setTransactionId] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, transactionId],
    queryFn: async () => {
      const url = transactionId
        ? `/audit/logs/transaction/${encodeURIComponent(transactionId)}`
        : `/audit/logs?page=${page}&size=${PAGE_SIZE}&sort=createdAt,desc`
      const res = await api.get(url)
      const body = res.data
      if (Array.isArray(body)) {
        return { content: body as AuditLog[], totalPages: 1, totalElements: body.length }
      }
      return body as { content: AuditLog[]; totalPages: number; totalElements: number }
    }
  })

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Audit Logs</h2>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(0)
          setTransactionId(search.trim())
        }}
      >
        <Input
          placeholder="Search by transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          <Search className="size-4" />
          Search
        </Button>
        {transactionId && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch('')
              setTransactionId('')
              setPage(0)
            }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ScrollText className="size-8 opacity-40" />
                      No audit logs found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={eventVariant(log.eventType)}>{log.eventType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.transactionId ?? '-'}</TableCell>
                    <TableCell>{log.fromAccount ?? '-'}</TableCell>
                    <TableCell>{log.toAccount ?? '-'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {log.amount != null ? `฿${log.amount.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>{log.status ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{log.actor ?? 'system'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {!transactionId && totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages} &middot; {data?.totalElements ?? 0} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
