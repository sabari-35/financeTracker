import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RefreshCw, TrendingDown, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import { getAISuggestions } from '../lib/claudeApi'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function TipCard({ tip, index }) {
  return (
    <div
      className="neu-card p-4 border-l-4 animate-slide-up"
      style={{ borderLeftColor: '#F97316', animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start gap-3">
        <div className="icon-box text-xl flex-shrink-0">💡</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#DC2626' }}>
              {tip.category}
            </span>
            <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>
              -₹{tip.overspend_amount?.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text)' }}>{tip.suggestion}</p>
          {tip.estimated_saving > 0 && (
            <div className="mt-2 text-xs font-semibold px-2 py-1 rounded-full inline-block" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              💰 Could save ₹{tip.estimated_saving.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Insights() {
  const { user } = useAuthStore()
  const { fetchAll, transactions, categories, getMonthTransactions, getStats } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [aiTips, setAiTips] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [chartData, setChartData] = useState([])

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  useEffect(() => {
    if (transactions.length > 0) {
      buildChartData()
      fetchAITips()
    }
  }, [transactions.length])

  const buildChartData = () => {
    const data = []
    for (let i = 5; i >= 0; i--) {
      let m = month - i
      let y = year
      if (m <= 0) { m += 12; y -= 1 }
      const stats = getStats(m, y)
      data.push({
        month: MONTHS[m - 1],
        necessary: Math.round(stats.necessary),
        unnecessary: Math.round(stats.unnecessary),
      })
    }
    setChartData(data)
  }

  const fetchAITips = async () => {
    setAiLoading(true)
    try {
      const last30 = transactions.filter(t => {
        const d = new Date(t.date)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        return d >= cutoff
      })

      // Summarise by category
      const summary = {}
      last30.forEach(t => {
        const cat = t.categories?.name || 'Other'
        if (!summary[cat]) summary[cat] = { total: 0, necessary: 0, unnecessary: 0, count: 0 }
        summary[cat].total += Number(t.amount)
        summary[cat][t.type] += Number(t.amount)
        summary[cat].count++
      })

      const tips = await getAISuggestions(summary)
      setAiTips(tips)
    } catch (err) {
      toast.error('AI insights unavailable')
    } finally {
      setAiLoading(false)
    }
  }

  // Top unnecessary categories this month
  const monthTxs = getMonthTransactions(month, year)
  const unnecessaryByCategory = {}
  monthTxs.filter(t => t.type === 'unnecessary').forEach(t => {
    const cat = t.categories?.name || 'Other'
    if (!unnecessaryByCategory[cat]) {
      unnecessaryByCategory[cat] = { total: 0, txs: [] }
    }
    unnecessaryByCategory[cat].total += Number(t.amount)
    unnecessaryByCategory[cat].txs.push(t)
  })
  const top3Unnecessary = Object.entries(unnecessaryByCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3)

  // Subscriptions
  const recurringTxs = transactions.filter(t => t.is_recurring)
  const uniqueRecurring = Array.from(new Map(recurringTxs.map(t => [t.categories?.name, t])).values())

  const stats = getStats(month, year)

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="neu-card-sm p-3 text-sm" style={{ color: 'var(--text)' }}>
        <div className="font-bold mb-1">{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color }}>
            {p.name}: ₹{p.value.toLocaleString('en-IN')}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-content">
        <Header />
        <div className="section-title mb-4">AI Insights 🧠</div>

        {/* This Month Summary */}
        <div className="neu-card p-4 mb-4">
          <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>This Month</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total', value: stats.totalSpent, color: '#F97316' },
              { label: 'Necessary', value: stats.necessary, color: '#22C55E' },
              { label: 'Unnecessary', value: stats.unnecessary, color: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>
                  ₹{s.value.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--sub)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Unnecessary */}
        {top3Unnecessary.length > 0 && (
          <div className="neu-card p-4 mb-4">
            <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <AlertCircle size={16} className="text-red-400" /> Top Unnecessary Spends
            </div>
            {top3Unnecessary.map(([cat, data], i) => (
              <div key={cat} className="mb-4 last:mb-0 border-b border-dashed pb-3 last:border-0 last:pb-0" style={{ borderColor: 'var(--shadow-light)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: ['#EF4444','#F97316','#F59E0B'][i] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 text-sm font-bold" style={{ color: 'var(--text)' }}>{cat}</div>
                  <div className="text-sm font-bold" style={{ color: '#EF4444' }}>₹{data.total.toLocaleString('en-IN')}</div>
                </div>
                {/* Sublist of transactions */}
                <div className="pl-9 space-y-1.5">
                  {data.txs.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-xs">
                      <div className="truncate pr-2" style={{ color: 'var(--sub)' }}>
                        • {tx.note || tx.merchant_name || 'Unnamed'} <span className="opacity-60 text-[10px]">({tx.payment_method?.toUpperCase()})</span>
                      </div>
                      <div className="font-semibold" style={{ color: '#EF4444', opacity: 0.85 }}>₹{Number(tx.amount).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6-Month Chart */}
        <div className="neu-card p-4 mb-4">
          <div className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>6-Month Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--shadow-dark)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--sub)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--sub)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="necessary" fill="#22C55E" radius={[4,4,0,0]} name="Necessary" />
              <Bar dataKey="unnecessary" fill="#EF4444" radius={[4,4,0,0]} name="Unnecessary" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Tips */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>AI Suggestions 🤖</div>
          <button
            onClick={fetchAITips}
            className="neu-btn w-9 h-9 flex items-center justify-center"
            disabled={aiLoading}
          >
            <RefreshCw size={16} className={aiLoading ? 'animate-spin text-primary' : ''} style={{ color: 'var(--sub)' }} />
          </button>
        </div>

        {aiLoading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="neu-card h-24 animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {aiTips.map((tip, i) => <TipCard key={i} tip={tip} index={i} />)}
          </div>
        )}

        {/* Subscription Audit */}
        {uniqueRecurring.length > 0 && (
          <div className="neu-card p-4 mb-4">
            <div className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              📱 Subscription Audit
            </div>
            {uniqueRecurring.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                <div className="icon-box text-lg">{tx.categories?.icon || '📦'}</div>
                <div className="flex-1 text-sm" style={{ color: 'var(--text)' }}>
                  {tx.note || tx.categories?.name}
                </div>
                <div className="text-sm font-bold" style={{ color: '#EF4444' }}>
                  ₹{Number(tx.amount).toLocaleString('en-IN')}
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
