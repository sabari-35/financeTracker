import React, { useState } from 'react'
import { X, ChevronLeft, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useFinanceStore } from '../../store/financeStore'

const CATEGORIES = [
  { name: 'Food', icon: '🍕', default_type: 'unnecessary' },
  { name: 'Transport', icon: '🚗', default_type: 'necessary' },
  { name: 'Shopping', icon: '🛍️', default_type: 'unnecessary' },
  { name: 'Rent', icon: '🏠', default_type: 'necessary' },
  { name: 'Health', icon: '💊', default_type: 'necessary' },
  { name: 'Entertainment', icon: '🎬', default_type: 'unnecessary' },
  { name: 'Subscriptions', icon: '📱', default_type: 'unnecessary' },
  { name: 'Other', icon: '📦', default_type: 'necessary' },
]

const PAYMENT_METHODS = ['cash', 'upi', 'card']
const PAYMENT_LABELS = { cash: '💵 Cash', upi: '📲 UPI', card: '💳 Card' }

export default function QuickAddModal({ onClose }) {
  const { user } = useAuthStore()
  const { addTransaction, categories, budgets, getCategorySpend } = useFinanceStore()
  const [step, setStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('unnecessary')
  const [note, setNote] = useState('')
  const [payment, setPayment] = useState('upi')
  const [loading, setLoading] = useState(false)
  const [limitWarning, setLimitWarning] = useState(null)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const dbCategories = categories.length ? categories : CATEGORIES

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat)
    setType(cat.default_type || 'unnecessary')
    setStep(2)
  }

  const handleNumpad = (val) => {
    if (val === 'back') {
      setAmount(prev => prev.slice(0, -1))
    } else if (val === '.' && amount.includes('.')) {
      return
    } else if (amount.length < 8) {
      setAmount(prev => prev + val)
    }
  }

  const handleNext = () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    setStep(3)
  }

  const checkBudgetLimit = () => {
    const catBudget = budgets.find(b =>
      b.categories?.name === selectedCategory.name && b.month === month && b.year === year
    )
    if (!catBudget || catBudget.limit_amount <= 0) return false
    const catSpend = getCategorySpend(month, year)
    const catId = Object.keys(catSpend).find(id => {
      const cat = dbCategories.find(c => c.id === id)
      return cat?.name === selectedCategory.name
    })
    const currentSpend = catId ? (catSpend[catId] || 0) : 0
    const newTotal = currentSpend + Number(amount)
    if (newTotal > catBudget.limit_amount) {
      return {
        category: selectedCategory.name,
        limit: catBudget.limit_amount,
        current: currentSpend,
        newTotal,
        over: newTotal - catBudget.limit_amount,
      }
    }
    return false
  }

  const handleConfirm = async (force = false) => {
    if (!force) {
      const warning = checkBudgetLimit()
      if (warning) { setLimitWarning(warning); return }
    }
    setLimitWarning(null)
    setLoading(true)
    try {
      const catInDb = dbCategories.find(c => c.name === selectedCategory.name)
      await addTransaction({
        user_id: user.id,
        category_id: catInDb?.id || null,
        amount: Number(amount),
        type,
        note: note || null,
        payment_method: payment,
        date: now.toISOString().split('T')[0],
        is_recurring: selectedCategory.name === 'Subscriptions',
      })
      toast.success('Transaction added! ✅')
      onClose()
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl fade-in slide-up"
        style={{ background: 'var(--bg)', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--sub)', opacity: 0.4 }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          {step > 1 ? (
            <button className="neu-btn w-10 h-10 flex items-center justify-center" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={20} />
            </button>
          ) : <div className="w-10" />}
          <div className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {step === 1 ? 'Pick Category' : step === 2 ? 'Enter Amount' : step === 3 ? 'Classify Spend' : 'Add Details'}
          </div>
          <button className="neu-btn w-10 h-10 flex items-center justify-center" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {[1,2,3,4].map(s => (
            <div key={s} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: step >= s ? 24 : 8, background: step >= s ? '#F97316' : 'var(--shadow-dark)' }} />
          ))}
        </div>

        <div className="px-5 pb-8">
          {/* STEP 1: Category Grid */}
          {step === 1 && (
            <div className="grid grid-cols-4 gap-3 animate-fade-in">
              {dbCategories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl neu-btn min-h-[80px] justify-center"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: 'var(--text)' }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Amount Numpad */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-2">
                <span className="text-4xl font-bold" style={{ color: 'var(--sub)' }}>₹</span>
                <span className="text-5xl font-bold ml-2" style={{ color: 'var(--text)' }}>
                  {amount || '0'}
                </span>
              </div>
              <div className="text-center text-sm mb-6" style={{ color: 'var(--sub)' }}>
                {selectedCategory?.icon} {selectedCategory?.name}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {['1','2','3','4','5','6','7','8','9','.','0','back'].map(k => (
                  <button
                    key={k}
                    onClick={() => handleNumpad(k)}
                    className="neu-btn h-14 text-xl font-semibold flex items-center justify-center rounded-2xl"
                    style={{ color: k === 'back' ? '#F97316' : 'var(--text)' }}
                  >
                    {k === 'back' ? '⌫' : k}
                  </button>
                ))}
              </div>
              <button className="btn-primary w-full py-4 text-base" onClick={handleNext}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 3: Necessary / Unnecessary */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-2 text-sm" style={{ color: 'var(--sub)' }}>
                ₹{Number(amount).toLocaleString('en-IN')} • {selectedCategory?.icon} {selectedCategory?.name}
              </div>
              <div className="text-center text-sm font-medium mb-5" style={{ color: 'var(--sub)' }}>
                AI suggests: <span style={{ color: selectedCategory?.default_type === 'unnecessary' ? '#EF4444' : '#22C55E', fontWeight: 700 }}>
                  {selectedCategory?.default_type === 'unnecessary' ? 'Unnecessary' : 'Necessary'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setType('necessary')}
                  className="p-5 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200"
                  style={{
                    background: type === 'necessary' ? '#DCFCE7' : 'var(--card)',
                    boxShadow: type === 'necessary' ? '0 0 0 2px #22C55E' : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                    color: '#22C55E',
                  }}
                >
                  <span className="text-3xl">✅</span>
                  <span className="font-bold text-sm">Necessary</span>
                  <span className="text-[10px] text-center opacity-70">Rent, health, transport</span>
                </button>
                <button
                  onClick={() => setType('unnecessary')}
                  className="p-5 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200"
                  style={{
                    background: type === 'unnecessary' ? '#FEE2E2' : 'var(--card)',
                    boxShadow: type === 'unnecessary' ? '0 0 0 2px #EF4444' : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                    color: '#EF4444',
                  }}
                >
                  <span className="text-3xl">⚠️</span>
                  <span className="font-bold text-sm">Unnecessary</span>
                  <span className="text-[10px] text-center opacity-70">Entertainment, splurge</span>
                </button>
              </div>
              <button className="btn-primary w-full py-4" onClick={() => setStep(4)}>
                Continue →
              </button>
            </div>
          )}

          {/* STEP 4: Note + Payment */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-5 text-sm" style={{ color: 'var(--sub)' }}>
                ₹{Number(amount).toLocaleString('en-IN')} • {selectedCategory?.icon} {selectedCategory?.name} •{' '}
                <span style={{ color: type === 'unnecessary' ? '#EF4444' : '#22C55E', fontWeight: 600 }}>
                  {type === 'unnecessary' ? 'Unnecessary' : 'Necessary'}
                </span>
              </div>

              <input
                className="neu-input mb-4"
                placeholder="Add a note (optional)..."
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={80}
              />

              <div className="section-title text-sm mb-3">Payment Method</div>
              <div className="flex gap-3 mb-6">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setPayment(m)}
                    className={`chip flex-1 ${payment === m ? 'chip-active' : 'chip-inactive'}`}
                  >
                    {PAYMENT_LABELS[m]}
                  </button>
                ))}
              </div>

              <button
                className="btn-primary w-full py-4 text-base"
                onClick={() => handleConfirm(false)}
                disabled={loading}
              >
                {loading ? '⏳ Saving...' : '✅ Confirm & Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Budget Limit Warning Modal */}
      {limitWarning && (
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <div className="neu-card p-6 w-full max-w-sm animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={28} className="text-yellow-500" />
              <div>
                <div className="font-bold" style={{ color: 'var(--text)' }}>Budget Limit Alert</div>
                <div className="text-xs" style={{ color: 'var(--sub)' }}>{limitWarning.category}</div>
              </div>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
              This will exceed your {limitWarning.category} budget by{' '}
              <strong style={{ color: '#EF4444' }}>₹{limitWarning.over.toLocaleString('en-IN')}</strong>
              {'. '}Limit: ₹{limitWarning.limit.toLocaleString('en-IN')}, New total: ₹{limitWarning.newTotal.toLocaleString('en-IN')}
            </p>
            <div className="flex gap-3">
              <button className="neu-btn flex-1 py-3 text-sm font-medium" onClick={() => setLimitWarning(null)}>
                Cancel
              </button>
              <button className="btn-primary flex-1 py-3 text-sm" onClick={() => handleConfirm(true)}>
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
