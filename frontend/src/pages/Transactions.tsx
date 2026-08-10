import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  Undo2,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '../services/api'
import { Transaction } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

function statusVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const
  if (status === 'PENDING') return 'warning' as const
  return 'destructive' as const
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="size-3" />
  if (status === 'PENDING') return <Clock className="size-3" />
  return <XCircle className="size-3" />
}

type TxKind = 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND'

const KIND_META: Record<TxKind, { label: string; icon: typeof ArrowDownToLine; endpoint: string }> = {
  DEPOSIT: { label: 'Deposit', icon: ArrowDownToLine, endpoint: '/transactions/deposit' },
  WITHDRAW: { label: 'Withdraw', icon: ArrowUpFromLine, endpoint: '/transactions/withdraw' },
  PAYMENT: { label: 'Payment', icon: CreditCard, endpoint: '/transactions/payment' },
  REFUND: { label: 'Refund', icon: Undo2, endpoint: '/transactions/refund' }
}

const emptyForm = {
  accountNumber: '',
  amount: '',
  currency: 'THB',
  merchant: '',
  idempotencyKey: ''
}

const QUICK_FILTERS: { label: string; status?: string }[] = [
  { label: 'All' },
  { label: 'Successful', status: 'COMPLETED' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Failed', status: 'FAILED' },
  { label: 'Blocked', status: 'BLOCKED' }
]

const PAGE_SIZE = 15

export default function Transactions() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<TxKind>('DEPOSIT')
  const [form, setForm] = useState(emptyForm)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, statusFilter],
    queryFn: async () => {
      const statusParam = statusFilter ? `&status=${statusFilter}` : ''
      const res = await api.get(
        `/transactions?page=${page}&size=${PAGE_SIZE}&sort=createdAt,desc${statusParam}`
      )
      return res.data as { content: Transaction[]; totalPages: number; totalElements: number }
    },
    enabled: !search.trim()
  })

  const { data: searchResult, isFetching: isSearching } = useQuery({
    queryKey: ['transactionSearch', search],
    queryFn: async () => {
      const res = await api.get(`/transactions/${encodeURIComponent(search.trim())}`)
      return res.data as Transaction
    },
    enabled: !!search.trim(),
    retry: false
  })

  const submitMutation = useMutation({
    mutationFn: (): Promise<unknown> => {
      const meta = KIND_META[kind]
      return api.post(meta.endpoint, {
        accountNumber: form.accountNumber,
        amount: parseFloat(form.amount),
        currency: form.currency,
        merchant: form.merchant || undefined,
        idempotencyKey: form.idempotencyKey || `idemp-${Date.now()}`
      })
    },
    onSuccess: () => {
      toast.success(`${KIND_META[kind].label} completed`)
      setOpen(false)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(`${KIND_META[kind].label} failed${message ? `: ${message}` : ''}`)
    }
  })

  const rows = search.trim() ? (searchResult ? [searchResult] : []) : data?.content ?? []
  const totalPages = data?.totalPages ?? 0
  const Icon = KIND_META[kind].icon

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Transactions</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/transfer')}>
            <ArrowLeftRight className="size-4" />
            Transfer
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>New Transaction</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(KIND_META) as TxKind[]).map((k) => {
                const meta = KIND_META[k]
                const KIcon = meta.icon
                return (
                  <DropdownMenuItem
                    key={k}
                    onClick={() => {
                      setKind(k)
                      setForm(emptyForm)
                      setOpen(true)
                    }}
                  >
                    <KIcon className="size-4" />
                    {meta.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className="size-4" />
                New {KIND_META[kind].label}
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                submitMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  required
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                />
              </div>

              {(kind === 'PAYMENT' || kind === 'REFUND') && (
                <div className="space-y-2">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input
                    id="merchant"
                    required
                    value={form.merchant}
                    onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    required
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idempotencyKey">Idempotency Key (optional)</Label>
                <Input
                  id="idempotencyKey"
                  value={form.idempotencyKey}
                  onChange={(e) => setForm({ ...form, idempotencyKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Prevents duplicate submissions</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Submitting...' : `Submit ${KIND_META[kind].label}`}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => {
                setStatusFilter(f.status)
                setPage(0)
              }}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === f.status
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading || isSearching ? (
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
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                  >
                    <TableCell className="font-medium">{tx.transactionId}</TableCell>
                    <TableCell>{tx.fromAccount}</TableCell>
                    <TableCell>{tx.toAccount}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ฿{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{tx.currency}</TableCell>
                    <TableCell>{tx.transactionType}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(tx.status)}>
                        <StatusIcon status={tx.status} />
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {!search.trim() && totalPages > 1 && (
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
