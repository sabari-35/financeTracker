import React, { useState, useEffect } from 'react'
import { Search, Trash2, Edit3, Filter, X, Check, Calendar, Clock, CalendarDays, CalendarRange, Settings2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'
import EditBottomSheet from '../components/ui/EditBottomSheet'

const FILTERS = ['All', 'Necessary', 'Unnecessary', 'Food', 'Transport', 'Shopping', 'Rent', 'Health', 'Entertainment', 'Subscriptions', 'Other']

export default function Transactions() {
  const { user } = useAuthStore()
  const { fetchAll, transactions, deleteTransaction, updateTransaction } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All Time')
  const [showDateDropdown, setShowDateDropdown] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sheet, setSheet] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [longPressed, setLongPressed] = useState(null)
  let pressTimer = null

  const DATE_FILTERS = [
    { id: 'All Time', label: 'All Time', icon: Calendar },
    { id: 'Today', label: 'Today', icon: Clock },
    { id: 'Last 7 Days', label: 'Last 7 Days', icon: CalendarDays },
    { id: 'Last 30 Days', label: 'Last 30 Days', icon: CalendarRange },
    { id: 'Custom', label: 'Custom Days', icon: Settings2 },
  ]

  const openSheet = (config) => setSheet(config)
  const closeSheet = () => setSheet(null)

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  // Helper to normalize dates for comparison (ignoring time)
  const normalizeDate = (d) => {
    const date = new Date(d)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const filtered = transactions.filter(t => {
    const matchSearch = !search || 
      (t.categories?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.note || '').toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'All' ? true :
      filter === 'Necessary' ? t.type === 'necessary' :
      filter === 'Unnecessary' ? t.type === 'unnecessary' :
      (t.categories?.name || 'Other') === filter

    let matchDate = true
    const txDate = normalizeDate(t.date)
    const today = normalizeDate(new Date())

    if (dateFilter === 'Today') {
      matchDate = txDate.getTime() === today.getTime()
    } else if (dateFilter === 'Last 7 Days') {
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 7)
      matchDate = txDate >= sevenDaysAgo && txDate <= today
    } else if (dateFilter === 'Last 30 Days') {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)
      matchDate = txDate >= thirtyDaysAgo && txDate <= today
    } else if (dateFilter === 'Custom') {
      if (customStart && customEnd) {
        const start = normalizeDate(customStart)
        const end = normalizeDate(customEnd)
        matchDate = txDate >= start && txDate <= end
      } else if (customStart) {
        const start = normalizeDate(customStart)
        matchDate = txDate >= start
      } else if (customEnd) {
        const end = normalizeDate(customEnd)
        matchDate = txDate <= end
      }
    }

    return matchSearch && matchFilter && matchDate
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const handleLongPress = (id) => {
    setLongPressed(prev => prev === id ? null : id)
  }

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted')
      setLongPressed(null)
      setDeleteConfirm(null)
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <Header />
        <div className="section-title mb-4">Transactions</div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--sub)' }} />
          <input
            className="neu-input pl-10"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
              <X size={16} style={{ color: 'var(--sub)' }} />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="mb-4 relative z-20">
          <button 
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="neu-input w-full font-bold flex items-center justify-between"
            style={{ color: 'var(--text)' }}
          >
            <div className="flex items-center gap-2">
              {React.createElement(DATE_FILTERS.find(f => f.id === dateFilter)?.icon || Calendar, { size: 18, style: { color: '#F97316' } })}
              {DATE_FILTERS.find(f => f.id === dateFilter)?.label}
            </div>
            <ChevronDown size={18} style={{ color: 'var(--sub)', transform: showDateDropdown ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>

          {showDateDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 neu-card p-2 flex flex-col gap-1 animate-slide-up shadow-xl">
              {DATE_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setDateFilter(f.id); setShowDateDropdown(false) }}
                  className="flex items-center gap-3 p-3 rounded-lg text-sm font-semibold transition-colors text-left"
                  style={{ 
                    background: dateFilter === f.id ? '#FFF0E6' : 'transparent',
                    color: dateFilter === f.id ? '#F97316' : 'var(--text)' 
                  }}
                >
                  <f.icon size={18} style={{ color: dateFilter === f.id ? '#F97316' : 'var(--sub)' }} />
                  {f.label}
                  {dateFilter === f.id && <Check size={16} className="ml-auto" />}
                </button>
              ))}
            </div>
          )}
          
          {dateFilter === 'Custom' && (
            <div className="flex gap-3 mt-3 animate-slide-up">
              <div className="flex-1">
                <label className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--sub)' }}>Start Date</label>
                <input 
                  type="date" 
                  className="neu-input w-full text-xs" 
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--sub)' }}>End Date</label>
                <input 
                  type="date" 
                  className="neu-input w-full text-xs" 
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {['All', 'Necessary', 'Unnecessary', 'Food', 'Transport', 'Shopping', 'Rent', 'Health', 'Entertainment', 'Subscriptions'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip flex-shrink-0 ${filter === f ? 'chip-active' : 'chip-inactive'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="text-xs mb-3" style={{ color: 'var(--sub)' }}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          {filter !== 'All' || search ? ' (filtered)' : ''}
        </div>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <div className="neu-card p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-semibold" style={{ color: 'var(--text)' }}>No transactions found</div>
            <div className="text-sm mt-1" style={{ color: 'var(--sub)' }}>Try a different search or filter</div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {filtered.map(tx => (
              <div key={tx.id}>
                {/* Main card */}
                <div
                  className="neu-card-sm p-3 cursor-pointer select-none transition-all duration-200"
                  style={{ borderLeft: longPressed === tx.id ? '3px solid #F97316' : '3px solid transparent' }}
                  onClick={() => longPressed === tx.id ? setLongPressed(null) : null}
                  onMouseDown={() => { pressTimer = setTimeout(() => handleLongPress(tx.id), 400) }}
                  onMouseUp={() => clearTimeout(pressTimer)}
                  onTouchStart={() => { pressTimer = setTimeout(() => handleLongPress(tx.id), 400) }}
                  onTouchEnd={() => clearTimeout(pressTimer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-box text-lg flex-shrink-0">{tx.categories?.icon || '📦'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {tx.categories?.name || 'Other'}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--sub)' }}>
                        {tx.payment_method?.toUpperCase()} •{' '}
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      {tx.note && (
                        <div className="text-xs mt-1 italic" style={{ color: 'var(--sub)', opacity: 0.85 }}>
                          {tx.note}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: tx.type === 'unnecessary' ? '#EF4444' : '#22C55E' }}>
                        -₹{Number(tx.amount).toLocaleString('en-IN')}
                      </div>
                      <span className={tx.type === 'unnecessary' ? 'badge-unnecessary' : 'badge-necessary'}>
                        {tx.type === 'unnecessary' ? 'Unnecessary' : 'Necessary'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons (long press) */}
                {longPressed === tx.id && (
                  <div className="flex gap-2 mt-2 px-1 animate-slide-up">
                    <button
                      onClick={() => {
                        setLongPressed(null)
                        openSheet({
                          title: 'Edit Note',
                          label: 'Transaction Note',
                          current: tx.note || '',
                          hint: 'Add details about this transaction.',
                          inputType: 'text',
                          prefix: '',
                          onConfirm: async (val) => {
                            try {
                              await updateTransaction(tx.id, { note: val })
                              toast.success('Note updated!')
                            } catch (err) {
                              toast.error('Update failed')
                            }
                          }
                        })
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: '#DBEAFE', color: '#1D4ED8' }}
                    >
                      <Edit3 size={14} /> Edit Note
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(tx.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: '#FEE2E2', color: '#DC2626' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="neu-card p-6 w-full max-w-sm animate-scale-in">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🗑️</div>
              <div className="font-bold" style={{ color: 'var(--text)' }}>Delete Transaction?</div>
              <div className="text-sm mt-1" style={{ color: 'var(--sub)' }}>This action cannot be undone.</div>
            </div>
            <div className="flex gap-3">
              <button className="neu-btn flex-1 py-3 text-sm font-medium" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="flex-1 py-3 text-sm font-semibold rounded-xl text-white"
                style={{ background: '#EF4444' }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav onAddClick={() => setShowAdd(true)} />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} />}

      <EditBottomSheet
        open={!!sheet}
        onClose={closeSheet}
        onConfirm={v => sheet?.onConfirm(v)}
        title={sheet?.title || ''}
        label={sheet?.label || ''}
        current={sheet?.current ?? ''}
        hint={sheet?.hint}
        inputType={sheet?.inputType || 'text'}
        prefix={sheet?.prefix ?? ''}
      />
    </div>
  )
}
