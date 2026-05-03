import React, { useState, useEffect, useRef } from 'react'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download, ChevronLeft, ChevronRight, IndianRupee, Landmark, ShieldCheck, Flame, Banknote, Smartphone, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import CircularProgress from '../components/ui/CircularProgress'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = ['#F97316','#22C55E','#3B82F6','#A855F7','#EF4444','#F59E0B','#EC4899','#6B7280']

export default function Reports() {
  const { user, profile } = useAuthStore()
  const { fetchAll, getStats, getMonthTransactions, categories, transactions } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  const stats = getStats(viewMonth + 1, viewYear)
  const monthTxs = getMonthTransactions(viewMonth + 1, viewYear)

  // Pie chart data
  const catSpend = {}
  monthTxs.forEach(t => {
    const cat = t.categories?.name || 'Other'
    catSpend[cat] = (catSpend[cat] || 0) + Number(t.amount)
  })
  const pieData = Object.entries(catSpend).map(([name, value]) => ({ name, value }))

  // 6-month line chart
  const lineData = []
  for (let i = 5; i >= 0; i--) {
    let m = viewMonth + 1 - i
    let y = viewYear
    if (m <= 0) { m += 12; y -= 1 }
    const s = getStats(m, y)
    lineData.push({
      month: MONTHS_SHORT[m - 1],
      necessary: Math.round(s.necessary),
      unnecessary: Math.round(s.unnecessary),
      total: Math.round(s.totalSpent),
    })
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    const now = new Date()
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth()) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const exportPDF = async () => {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#F0F0F0' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297))
      pdf.save(`FinanceReport_${MONTHS[viewMonth]}_${viewYear}.pdf`)
      toast.success('PDF exported! 📄')
    } catch (err) {
      toast.error('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="neu-card-sm p-3 text-xs" style={{ color: 'var(--text)' }}>
        <div className="font-bold mb-1">{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name}: ₹{p.value.toLocaleString('en-IN')}</div>)}
      </div>
    )
  }

  const budget = profile?.monthly_budget || 0
  const savings = budget - stats.totalSpent

  return (
    <div className="page">
      <div className="page-content">
        <Header />

        {/* Month selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="section-title mb-0">Monthly Report</div>
          <div className="flex items-center gap-2 neu-card-sm px-3 py-1.5">
            <button onClick={prevMonth} className="p-1"><ChevronLeft size={16} style={{ color: 'var(--sub)' }} /></button>
            <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
              {MONTHS[viewMonth].slice(0,3)} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1"><ChevronRight size={16} style={{ color: 'var(--sub)' }} /></button>
          </div>
        </div>

        <div ref={reportRef}>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Total Spent', val: stats.totalSpent, color: '#F97316', icon: <IndianRupee size={26} strokeWidth={2.5} color="#F97316" /> },
              { label: 'Savings', val: savings, color: savings >= 0 ? '#22C55E' : '#EF4444', icon: <Landmark size={26} strokeWidth={2} color={savings >= 0 ? '#22C55E' : '#EF4444'} /> },
              { label: 'Necessary', val: stats.necessary, color: '#22C55E', icon: <ShieldCheck size={26} strokeWidth={2.5} color="#22C55E" /> },
              { label: 'Unnecessary', val: stats.unnecessary, color: '#EF4444', icon: <Flame size={26} strokeWidth={2.5} color="#EF4444" /> },
            ].map(s => (
              <div key={s.label} className="neu-card p-4">
                <div className="icon-box mb-3" style={{ background: 'var(--card)' }}>{s.icon}</div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--sub)' }}>{s.label}</div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>
                  ₹{Math.abs(s.val).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Spend Score */}
          <div className="neu-card p-4 mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Spend Score</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>{MONTHS[viewMonth]} {viewYear}</div>
            </div>
            <CircularProgress score={stats.score} />
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="neu-card p-4 mb-4">
              <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Spend by Category</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 0, right: 25, bottom: 0, left: 25 }} style={{ fontSize: '11px' }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={55}
                    innerRadius={25}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Line chart */}
          <div className="neu-card p-4 mb-4">
            <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Necessary vs Unnecessary (6M)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--shadow-dark)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--sub)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--sub)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="necessary" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} name="Necessary" />
                <Line type="monotone" dataKey="unnecessary" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} name="Unnecessary" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction count */}
          {(() => {
            const counts = { cash: 0, upi: 0, card: 0 }
            monthTxs.forEach(t => {
              const m = t.payment_method || 'upi'
              counts[m] = (counts[m] || 0) + 1
            })
            return (
              <div className="neu-card p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Transactions</div>
                    <div className="text-xs" style={{ color: 'var(--sub)' }}>This month</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#F97316' }}>{monthTxs.length}</div>
                </div>
                
                {monthTxs.length > 0 && (
                  <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--shadow-dark)' }}>
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="mb-1.5"><Banknote size={32} strokeWidth={1.5} color="#15803d" fill="#86efac" style={{ filter: 'drop-shadow(0px 4px 8px rgba(34,197,94,0.4))' }} /></div>
                      <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--sub)' }}>Cash</div>
                      <div className="text-sm font-bold" style={{ color: '#22C55E' }}>{counts.cash}</div>
                    </div>
                    <div className="w-px h-10 bg-[var(--shadow-dark)] opacity-50" />
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="mb-1.5"><Smartphone size={32} strokeWidth={1.5} color="#1d4ed8" fill="#93c5fd" style={{ filter: 'drop-shadow(0px 4px 8px rgba(59,130,246,0.4))' }} /></div>
                      <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--sub)' }}>UPI</div>
                      <div className="text-sm font-bold" style={{ color: '#3B82F6' }}>{counts.upi}</div>
                    </div>
                    <div className="w-px h-10 bg-[var(--shadow-dark)] opacity-50" />
                    <div className="flex-1 text-center flex flex-col items-center">
                      <div className="mb-1.5"><CreditCard size={32} strokeWidth={1.5} color="#7e22ce" fill="#d8b4fe" style={{ filter: 'drop-shadow(0px 4px 8px rgba(168,85,247,0.4))' }} /></div>
                      <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--sub)' }}>Card</div>
                      <div className="text-sm font-bold" style={{ color: '#A855F7' }}>{counts.card}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Export PDF */}
        <button className="btn-primary w-full py-4 mb-6 flex items-center justify-center gap-2" onClick={exportPDF} disabled={exporting}>
          <Download size={18} />
          {exporting ? 'Generating PDF...' : 'Export PDF Report'}
        </button>
      </div>

      <BottomNav onAddClick={() => setShowAdd(true)} />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
