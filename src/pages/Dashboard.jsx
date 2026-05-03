import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, ChevronRight, Wallet, IndianRupee, ShieldCheck, Flame, Banknote, Smartphone, CreditCard } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import StatCard from '../components/ui/StatCard'
import BudgetHealthBar from '../components/ui/BudgetHealthBar'
import CircularProgress from '../components/ui/CircularProgress'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'

export default function Dashboard() {
  const user = useAuthStore(state => state.user)
  const profile = useAuthStore(state => state.profile)
  const fetchAll = useFinanceStore(state => state.fetchAll)
  const getStats = useFinanceStore(state => state.getStats)
  const getMonthTransactions = useFinanceStore(state => state.getMonthTransactions)
  const transactions = useFinanceStore(state => state.transactions)
  const loading = useFinanceStore(state => state.loading)
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Last month for trend
  const lastMonth = month === 1 ? 12 : month - 1
  const lastYear = month === 1 ? year - 1 : year

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  const stats = useMemo(() => getStats(month, year), [month, year, transactions, getStats])
  const lastStats = useMemo(() => getStats(lastMonth, lastYear), [lastMonth, lastYear, transactions, getStats])
  const scoreTrend = stats.score - lastStats.score
  const monthTxs = useMemo(() => getMonthTransactions(month, year), [month, year, transactions, getMonthTransactions])
  const recentTxs = useMemo(() => monthTxs.slice(0, 5), [monthTxs])

  const budget = profile?.monthly_budget || 0
  const balance = budget - stats.totalSpent

  // Wallet spending this month
  const spentByMethod = useMemo(() => {
    const spent = { cash: 0, upi: 0, card: 0 }
    monthTxs.forEach(t => {
      const m = t.payment_method || 'upi'
      spent[m] = (spent[m] || 0) + Number(t.amount)
    })
    return spent
  }, [monthTxs])
  
  const cashLeft = (profile?.cash_balance || 0) - spentByMethod.cash
  const upiLeft  = (profile?.upi_balance  || 0) - spentByMethod.upi
  const cardLeft = (profile?.card_balance  || 0) - spentByMethod.card

  const fmt = (n) => '₹' + Math.abs(n).toLocaleString('en-IN')

  return (
    <div className="page">
      <div className="page-content">
        <Header />

        {/* Stat Cards 2x2 */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="neu-card p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard
              icon={<Wallet size={26} strokeWidth={2} color={balance >= 0 ? '#3B82F6' : '#EF4444'} />}
              label="Total Balance"
              value={`${balance >= 0 ? '' : '-'}${fmt(balance)}`}
              sub="This month"
              color={balance >= 0 ? '#3B82F6' : '#EF4444'}
            />
            <StatCard
              icon={<IndianRupee size={26} strokeWidth={2.5} color="#F97316" />}
              label="Total Spent"
              value={fmt(stats.totalSpent)}
              sub={`${monthTxs.length} transactions`}
              color="#F97316"
            />
            <StatCard
              icon={<ShieldCheck size={26} strokeWidth={2.5} color="#22C55E" />}
              label="Necessary"
              value={fmt(stats.necessary)}
              sub="Essential spend"
              color="#22C55E"
            />
            <StatCard
              icon={<Flame size={26} strokeWidth={2.5} color="#EF4444" />}
              label="Unnecessary"
              value={fmt(stats.unnecessary)}
              sub="Could be reduced"
              color="#EF4444"
              alert={stats.unnecessary > (budget * 0.3) ? '⚠️ High' : null}
            />
          </div>
        )}

        {/* Wallet Strip */}
        {(profile?.cash_balance > 0 || profile?.upi_balance > 0 || profile?.card_balance > 0) && (
          <div className="neu-card p-3 mb-4">
            <div className="text-xs font-bold mb-3" style={{ color: 'var(--sub)' }}>WALLET BALANCES</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Cash',  icon: <Banknote size={32} strokeWidth={1.5} color="#15803d" fill="#86efac" style={{ filter: 'drop-shadow(0px 4px 8px rgba(34,197,94,0.4))' }} />, left: cashLeft,  spent: spentByMethod.cash, color: '#22C55E' },
                { label: 'UPI',   icon: <Smartphone size={32} strokeWidth={1.5} color="#1d4ed8" fill="#93c5fd" style={{ filter: 'drop-shadow(0px 4px 8px rgba(59,130,246,0.4))' }} />, left: upiLeft,   spent: spentByMethod.upi,  color: '#3B82F6' },
                { label: 'Card',  icon: <CreditCard size={32} strokeWidth={1.5} color="#7e22ce" fill="#d8b4fe" style={{ filter: 'drop-shadow(0px 4px 8px rgba(168,85,247,0.4))' }} />, left: cardLeft,  spent: spentByMethod.card, color: '#A855F7' },
              ].map(w => (
                <div key={w.label} className="neu-card-sm p-2 text-center flex flex-col items-center">
                  <div className="mb-1.5">{w.icon}</div>
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--sub)' }}>{w.label}</div>
                  <div className="text-sm font-bold" style={{ color: w.left >= 0 ? w.color : '#EF4444' }}>
                    {w.left >= 0 ? '' : '-'}{fmt(w.left)}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>
                    -{fmt(w.spent)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Health */}
        <BudgetHealthBar spent={stats.totalSpent} budget={budget} />

        {/* Spend Score */}
        <div className="neu-card p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Spend Score</div>
            <div className="text-xs mb-2" style={{ color: 'var(--sub)' }}>Unnecessary spend ratio</div>
            <div className="flex items-center gap-1">
              {scoreTrend >= 0
                ? <ArrowUpRight size={16} className="text-green-500" />
                : <ArrowDownRight size={16} className="text-red-400" />
              }
              <span className="text-xs font-semibold" style={{ color: scoreTrend >= 0 ? '#22C55E' : '#EF4444' }}>
                {scoreTrend >= 0 ? '+' : ''}{scoreTrend} vs last month
              </span>
            </div>
          </div>
          <CircularProgress score={stats.score} />
        </div>

        {/* Recent Transactions */}
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0">Recent</div>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold flex items-center gap-1"
            style={{ color: '#F97316' }}
          >
            See all <ChevronRight size={14} />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="neu-card p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No transactions yet</div>
            <div className="text-sm" style={{ color: 'var(--sub)' }}>Tap + to add your first expense</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {recentTxs.map(tx => (
              <div key={tx.id} className="neu-card-sm p-3 flex items-center gap-3">
                <div className="icon-box text-lg flex-shrink-0">
                  {tx.categories?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {tx.categories?.name || 'Other'}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--sub)' }}>
                    {tx.note || tx.payment_method?.toUpperCase()} • {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: tx.type === 'unnecessary' ? '#EF4444' : '#22C55E' }}>
                    -₹{Number(tx.amount).toLocaleString('en-IN')}
                  </div>
                  <span className={tx.type === 'unnecessary' ? 'badge-unnecessary' : 'badge-necessary'}>
                    {tx.type === 'unnecessary' ? 'UN' : 'NE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav onAddClick={() => setShowAdd(true)} />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
