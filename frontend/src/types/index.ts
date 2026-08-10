export interface Account {
  id: number
  accountNumber: string
  accountHolderName: string
  balance: number
  currency: string
  status: string
  accountType: string
  createdAt: string
}

export interface Transaction {
  id: number
  transactionId: string
  fromAccount: string
  toAccount: string
  amount: number
  currency: string
  transactionType: string
  status: string
  description?: string
  merchant?: string
  createdAt: string
  fraudScore?: number
  fraudLevel?: string
}

export interface FraudAlert {
  id: number
  transactionId: string
  amount: number
  currency: string
  fraudScore: number
  fraudLevel: string
  reason: string
  status: string
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface DashboardStats {
  totalTransactions: number
  successRate: number
  fraudDetections: number
  activeAccounts: number
  todayVolume: number
  todayCount: number
}

export interface TransferResult {
  transactionId: string
  fromAccount: string
  toAccount: string
  amount: number
  currency: string
  status: string
  message?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface DailyStat {
  date: string
  volume: number
  count: number
}

export interface FraudLevelBreakdown {
  level: string
  count: number
}

export interface AuditLog {
  id: number
  eventType: string
  transactionId?: string
  fromAccount?: string
  toAccount?: string
  amount?: number
  currency?: string
  status?: string
  actor?: string
  payload?: string
  createdAt: string
}
