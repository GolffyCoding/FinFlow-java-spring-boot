import api from './api'
import { Account, DailyStat, FraudLevelBreakdown, Transaction, FraudAlert } from '../types'

export interface DashboardStats {
  todayVolume: number
  todayCount: number
  successRate: number
  fraudDetections: number
  activeAccounts: number
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const [txStats, fraudStats, accounts, recentTx] = await Promise.all([
      api.get('/transactions/stats/today'),
      api.get('/fraud/stats'),
      api.get<Account[]>('/accounts'),
      api.get('/transactions?page=0&size=100&sort=createdAt,desc')
    ])
    const recent: Transaction[] = recentTx.data.content || []
    const successRate = recent.length > 0
      ? (recent.filter((t) => t.status === 'COMPLETED').length / recent.length) * 100
      : 100
    return {
      todayVolume: txStats.data.volume || 0,
      todayCount: txStats.data.count || 0,
      successRate,
      fraudDetections: fraudStats.data.openAlerts || 0,
      activeAccounts: accounts.data.length || 0
    }
  },
  getDailyVolume: async (days = 7): Promise<DailyStat[]> => {
    const res = await api.get(`/transactions/stats/daily?days=${days}`)
    return res.data || []
  },
  getFraudLevelBreakdown: async (): Promise<FraudLevelBreakdown[]> => {
    const res = await api.get('/fraud/stats')
    return res.data.levelBreakdown || []
  },
  getRecentTransactions: async (): Promise<Transaction[]> => {
    const res = await api.get('/transactions?page=0&size=8&sort=createdAt,desc')
    return res.data.content || []
  },
  getRecentAlerts: async (): Promise<FraudAlert[]> => {
    const res = await api.get('/fraud/alerts?status=OPEN&page=0&size=5')
    return res.data.content || []
  }
}
