import React, { useState, useEffect } from 'react'
import { Search, Trash2, Edit3, Filter, X, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'

const FILTERS = ['All', 'Necessary', 'Unnecessary', 'Food', 'Transport', 'Shopping', 'Rent', 'Health', 'Entertainment', 'Subscriptions', 'Other']

export default function Transactions() {
  const { user } = useAuthStore()
  const { fetchAll, transactions, deleteTransaction, updateTransaction } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [editId, setEditId] = useState(null)
  const [editNote, setEditNote] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [longPressed, setLongPressed] = useState(null)
  let pressTimer = null

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  const filtered = transactions.filter(t => {
    const matchSearch = !search || 
      (t.categories?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.note || '').toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'All' ? true :
      filter === 'Necessary' ? t.type === 'necessary' :
      filter === 'Unnecessary' ? t.type === 'unnecessary' :
      (t.categories?.name || 'Other') === filter

    return matchSearch && matchFilter
  })

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

  const handleEdit = async (id) => {
    try {
      await updateTransaction(id, { note: editNote })
      toast.success('Updated!')
      setEditId(null)
    } catch (err) {
      toast.error('Update failed')
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
                      {editId === tx.id ? (
                        <div className="flex gap-2">
                          <input
                            className="neu-input text-sm py-1.5 px-2"
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => handleEdit(tx.id)} className="neu-btn p-2">
                            <Check size={14} className="text-green-500" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {tx.categories?.name || 'Other'}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--sub)' }}>
                            {tx.note && `${tx.note} • `}
                            {tx.payment_method?.toUpperCase()} •{' '}
                            {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </div>
                        </>
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
                      onClick={() => { setEditId(tx.id); setEditNote(tx.note || ''); setLongPressed(null) }}
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
    </div>
  )
}
