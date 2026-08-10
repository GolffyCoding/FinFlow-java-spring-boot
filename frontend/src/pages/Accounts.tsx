import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Landmark, Lock, LockOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../services/api'
import { Account } from '../types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const emptyAccount = {
  accountNumber: '',
  accountHolderName: '',
  currency: 'THB',
  accountType: 'SAVINGS'
}

export default function Accounts() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [newAccount, setNewAccount] = useState(emptyAccount)

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get<Account[]>('/accounts')
      return res.data
    }
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/accounts', newAccount),
    onSuccess: () => {
      toast.success('Account created')
      setOpen(false)
      setNewAccount(emptyAccount)
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(`Failed to create account${message ? `: ${message}` : ''}`)
    }
  })

  const freezeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/accounts/${id}/freeze`),
    onSuccess: () => {
      toast.success('Account frozen')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: () => toast.error('Failed to freeze account')
  })

  const unfreezeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/accounts/${id}/unfreeze`),
    onSuccess: () => {
      toast.success('Account unfrozen')
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: () => toast.error('Failed to unfreeze account')
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Accounts</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Account</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  required
                  placeholder="ACC-001-0003"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  required
                  value={newAccount.accountHolderName}
                  onChange={(e) => setNewAccount({ ...newAccount, accountHolderName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    required
                    value={newAccount.currency}
                    onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select
                    value={newAccount.accountType}
                    onValueChange={(value) => setNewAccount({ ...newAccount, accountType: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAVINGS">Savings</SelectItem>
                      <SelectItem value="CURRENT">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {accounts?.map((acc) => (
          <Card key={acc.id}>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold">{acc.accountNumber}</p>
                  <p className="text-sm text-muted-foreground">{acc.accountHolderName}</p>
                </div>
                <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'warning'}>
                  <Landmark className="size-3" />
                  {acc.status}
                </Badge>
              </div>

              <p className="text-3xl font-bold text-primary tabular-nums">
                ฿{acc.balance.toLocaleString()}
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{acc.accountType}</Badge>
                <Badge variant="outline">{acc.currency}</Badge>
              </div>

              <div className="flex gap-2 pt-1">
                {acc.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-warning-foreground"
                    disabled={freezeMutation.isPending}
                    onClick={() => freezeMutation.mutate(acc.id)}
                  >
                    <Lock className="size-3.5" />
                    Freeze
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-success"
                    disabled={unfreezeMutation.isPending}
                    onClick={() => unfreezeMutation.mutate(acc.id)}
                  >
                    <LockOpen className="size-3.5" />
                    Unfreeze
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
