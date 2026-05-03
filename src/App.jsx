import React, { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Budget = lazy(() => import('./pages/Budget'))
const Insights = lazy(() => import('./pages/Insights'))
const Reports = lazy(() => import('./pages/Reports'))
const Transactions = lazy(() => import('./pages/Transactions'))

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl neu-card flex items-center justify-center text-3xl animate-pulse-soft">💰</div>
        <div className="text-primary font-bold text-xl">FinanceTracker</div>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )
}

export default function App() {
  const { initialize, loading } = useAuthStore()
  const { apply } = useThemeStore()

  useEffect(() => {
    apply()
    initialize()
  }, [])

  if (loading) {
    return <FullScreenLoader />
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: 'var(--card)', color: 'var(--text)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
          success: { iconTheme: { primary: '#22C55E', secondary: 'white' } },
          error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
        }}
      />
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
