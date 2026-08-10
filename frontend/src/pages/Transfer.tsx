import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import api from '../services/api'
import { TransferResult } from '../types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

type Step = 1 | 2 | 3 | 4

const STEP_LABELS = ['Recipient', 'Amount', 'Review', 'Success']

export default function Transfer() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('THB')
  const [description, setDescription] = useState('')

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/transactions/transfer', {
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        currency,
        description,
        idempotencyKey: `idemp-${Date.now()}`
      })
      return res.data as TransferResult
    },
    onSuccess: () => {
      setStep(4)
    },
    onError: (e: unknown) => {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(`Transfer failed${message ? `: ${message}` : ''}`)
    }
  })

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {step < 4 && (
        <Button variant="ghost" onClick={() => navigate('/transactions')} className="-ml-2">
          <ArrowLeft className="size-4" />
          Cancel
        </Button>
      )}

      <div className="flex items-center justify-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                  n === step
                    ? 'bg-primary text-primary-foreground'
                    : n < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {n < step ? <CheckCircle2 className="size-4" /> : n}
              </div>
              {i < STEP_LABELS.length - 1 && <div className="h-px w-8 bg-border" />}
            </div>
          )
        })}
      </div>

      <Card>
        <CardContent className="space-y-5 py-8">
          {step === 1 && (
            <>
              <div>
                <h3 className="text-lg font-semibold">Who is this transfer from?</h3>
                <p className="text-sm text-muted-foreground">Enter the source and recipient accounts</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromAccount">From Account</Label>
                <Input
                  id="fromAccount"
                  placeholder="ACC-001-0001"
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAccount">To Account</Label>
                <Input
                  id="toAccount"
                  placeholder="ACC-001-0002"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!fromAccount || !toAccount}
                onClick={() => setStep(2)}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h3 className="text-lg font-semibold">Amount</h3>
                <p className="text-sm text-muted-foreground">How much do you want to send?</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted-foreground">
                    ฿
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-8 text-lg"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Note (optional)</Label>
                <Input
                  id="description"
                  placeholder="Dinner payment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!amount || parseFloat(amount) <= 0}
                  onClick={() => setStep(3)}
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h3 className="text-lg font-semibold">Review Transfer</h3>
                <p className="text-sm text-muted-foreground">Confirm the details before sending</p>
              </div>
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{fromAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{toAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    ฿{parseFloat(amount || '0').toLocaleString()} {currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-medium">฿0</span>
                </div>
                {description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Note</span>
                    <span className="font-medium">{description}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">
                    ฿{parseFloat(amount || '0').toLocaleString()} {currency}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Edit
                </Button>
                <Button
                  className="flex-1"
                  disabled={transferMutation.isPending}
                  onClick={() => transferMutation.mutate()}
                >
                  {transferMutation.isPending ? 'Sending...' : 'Confirm Transfer'}
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold">Transfer successful</h3>
              <p className="text-3xl font-semibold tabular-nums">
                ฿{parseFloat(amount || '0').toLocaleString()}
              </p>
              <p className="font-mono text-sm text-muted-foreground">
                {transferMutation.data?.transactionId}
              </p>
              <div className="flex w-full gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/transactions/${transferMutation.data?.transactionId}`)}
                >
                  View Transaction
                </Button>
                <Button className="flex-1" onClick={() => navigate('/transactions')}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
