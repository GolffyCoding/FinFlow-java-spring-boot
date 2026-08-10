import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { Skeleton } from '@/components/ui/skeleton'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const TransactionDetail = lazy(() => import('./pages/TransactionDetail'))
const Accounts = lazy(() => import('./pages/Accounts'))
const FraudAlerts = lazy(() => import('./pages/FraudAlerts'))
const FraudInvestigation = lazy(() => import('./pages/FraudInvestigation'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const Transfer = lazy(() => import('./pages/Transfer'))
const Login = lazy(() => import('./pages/Login'))

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:transactionId" element={<TransactionDetail />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="fraud-alerts" element={<FraudAlerts />} />
          <Route path="fraud-alerts/:id" element={<FraudInvestigation />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
