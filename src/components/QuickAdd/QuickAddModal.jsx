import React, { useState } from 'react'
import { X, ChevronLeft, AlertTriangle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useFinanceStore } from '../../store/financeStore'

const CATEGORIES = [
  { name: 'Food',          icon: '🍕', default_type: 'unnecessary' },
  { name: 'Transport',     icon: '🚗', default_type: 'necessary' },
  { name: 'Shopping',      icon: '🛍️', default_type: 'unnecessary' },
  { name: 'Rent',          icon: '🏠', default_type: 'necessary' },
  { name: 'Health',        icon: '💊', default_type: 'necessary' },
  { name: 'Entertainment', icon: '🎬', default_type: 'unnecessary' },
  { name: 'Subscriptions', icon: '📱', default_type: 'unnecessary' },
  { name: 'Other',         icon: '📦', default_type: 'necessary' },
]

const PAYMENT_METHODS = ['cash', 'upi', 'card']
const PAYMENT_LABELS  = { cash: '💵 Cash', upi: '📲 UPI', card: '💳 Card' }
const WALLET_KEY      = { cash: 'cash_balance', upi: 'upi_balance', card: 'card_balance' }

/* ── Block overlay shown when a hard limit is hit ───────────── */
function BlockedOverlay({ error, onClose }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-5 z-10"
      style={{ background: 'rgba(0,0,0,0.55)', borderRadius: 'inherit' }}>
      <div className="neu-card p-6 w-full max-w-sm animate-scale-in text-center">
        <div className="text-5xl mb-3">🚫</div>
        <div className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>
          Transaction Blocked
        </div>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--sub)' }}>
          {error}
        </p>
        <div className="p-3 rounded-xl mb-5 text-xs font-medium"
          style={{ background: '#EF444422', color: '#EF4444' }}>
          <Lock size={12} className="inline mr-1" />
          Add funds in Budget → My Wallets to continue spending
        </div>
        <button className="btn-primary w-full py-3" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}

export default function QuickAddModal({ onClose }) {
  const { user, profile } = useAuthStore()
  const { addTransaction, categories, budgets, getStats, getMonthTransactions, getCategorySpend } = useFinanceStore()

  const [step,             setStep]             = useState(1)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [amount,           setAmount]           = useState('')
  const [type,             setType]             = useState('unnecessary')
  const [note,             setNote]             = useState('')
  const [payment,          setPayment]          = useState('upi')
  const [loading,          setLoading]          = useState(false)
  const [blockError,       setBlockError]       = useState(null)

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const dbCategories = categories.length ? categories : CATEGORIES

  /* ── Hard limit checks ──────────────────────────────────────── */
  const getBlockReason = (amt, paymentMethod) => {
    const num = Number(amt)
    if (!num || num <= 0) return null

    // 1. Monthly budget check
    const monthlyBudget = profile?.monthly_budget || 0
    if (monthlyBudget > 0) {
      const stats      = getStats(month, year)
      const newTotal   = stats.totalSpent + num
      if (newTotal > monthlyBudget) {
        const remaining = monthlyBudget - stats.totalSpent
        return remaining <= 0
          ? `Your monthly budget of ₹${monthlyBudget.toLocaleString('en-IN')} is already exhausted. Add more budget in Settings to continue.`
          : `This ₹${num.toLocaleString('en-IN')} expense exceeds your monthly budget. You only have ₹${remaining.toLocaleString('en-IN')} left this month.`
      }
    }

    // 2. Wallet balance check for the chosen payment method
    const walletKey     = WALLET_KEY[paymentMethod]
    const walletBalance = profile?.[walletKey] || 0
    if (walletBalance > 0) {
      // Calculate already spent from this wallet this month
      const monthTxs   = getMonthTransactions(month, year)
      const walletSpent = monthTxs
        .filter(t => t.payment_method === paymentMethod)
        .reduce((s, t) => s + Number(t.amount), 0)
      const remaining = walletBalance - walletSpent
      if (num > remaining) {
        const label = PAYMENT_LABELS[paymentMethod]
        return remaining <= 0
          ? `Your ${label} balance is fully spent (₹${walletBalance.toLocaleString('en-IN')} total). Add funds to continue using ${label}.`
          : `Insufficient ${label} balance. You have ₹${remaining.toLocaleString('en-IN')} remaining but are trying to spend ₹${num.toLocaleString('en-IN')}.`
      }
    }

    // 3. Category budget check
    if (selectedCategory) {
      const catBudget = budgets.find(b =>
        b.categories?.name === selectedCategory.name && b.month === month && b.year === year
      )
      if (catBudget && catBudget.limit_amount > 0) {
        const catSpend  = getCategorySpend(month, year)
        const catId     = dbCategories.find(c => c.name === selectedCategory.name)?.id
        const catSpent  = catId ? (catSpend[catId] || 0) : 0
        const newCatTotal = catSpent + num
        if (newCatTotal > catBudget.limit_amount) {
          const remaining = catBudget.limit_amount - catSpent
          return remaining <= 0
            ? `Your ${selectedCategory.name} budget of ₹${catBudget.limit_amount.toLocaleString('en-IN')} is exhausted. Increase the limit in Budget page.`
            : `This exceeds your ${selectedCategory.name} category limit by ₹${(newCatTotal - catBudget.limit_amount).toLocaleString('en-IN')}. Only ₹${remaining.toLocaleString('en-IN')} remaining.`
        }
      }
    }

    return null
  }

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

  const handleConfirm = async () => {
    const block = getBlockReason(amount, payment)
    if (block) { setBlockError(block); return }

    setLoading(true)
    try {
      const catInDb = dbCategories.find(c => c.name === selectedCategory.name)
      await addTransaction({
        user_id:      user.id,
        category_id:  catInDb?.id || null,
        amount:       Number(amount),
        type,
        note:         note || null,
        payment_method: payment,
        date:         now.toISOString().split('T')[0],
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

  /* ── Payment method button: show remaining balance ──────────── */
  const WalletChip = ({ method }) => {
    const walletKey  = WALLET_KEY[method]
    const balance    = profile?.[walletKey] || 0
    const monthTxs  = getMonthTransactions(month, year)
    const spent      = monthTxs
      .filter(t => t.payment_method === method)
      .reduce((s, t) => s + Number(t.amount), 0)
    const remaining  = balance - spent
    const insufficient = balance > 0 && Number(amount) > remaining

    return (
      <button
        onClick={() => setPayment(method)}
        className="flex-1 rounded-2xl py-2.5 px-2 flex flex-col items-center gap-0.5 transition-all duration-200"
        style={{
          background:  payment === method ? '#F97316' : 'var(--card)',
          boxShadow:   payment === method
            ? '0 4px 12px #F9731640'
            : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
          color:       payment === method ? '#fff' : 'var(--text)',
          border:      insufficient ? '2px solid #EF4444' : '2px solid transparent',
          opacity:     balance > 0 && remaining <= 0 ? 0.5 : 1,
        }}
      >
        <span className="text-base">{PAYMENT_LABELS[method].split(' ')[0]}</span>
        <span className="text-[10px] font-semibold">{PAYMENT_LABELS[method].split(' ')[1]}</span>
        {balance > 0 && (
          <span className="text-[9px] mt-0.5" style={{ color: payment === method ? '#ffefde' : (remaining > 0 ? '#22C55E' : '#EF4444') }}>
            {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')}` : 'No funds'}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-[430px] rounded-t-3xl fade-in slide-up relative overflow-hidden"
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

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setType('necessary')}
                  className="p-5 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200"
                  style={{
                    background: type === 'necessary' ? '#DCFCE7' : 'var(--card)',
                    boxShadow:  type === 'necessary' ? '0 0 0 2px #22C55E' : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
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
                    boxShadow:  type === 'unnecessary' ? '0 0 0 2px #EF4444' : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
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
                  <WalletChip key={m} method={m} />
                ))}
              </div>

              {/* Live balance warning before confirm */}
              {(() => {
                const reason = getBlockReason(amount, payment)
                if (!reason) return null
                return (
                  <div className="flex items-start gap-2 p-3 rounded-xl mb-4"
                    style={{ background: '#EF444415', border: '1px solid #EF444440' }}>
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }} />
                    <span className="text-xs leading-relaxed" style={{ color: '#EF4444' }}>{reason}</span>
                  </div>
                )
              })()}

              <button
                className="btn-primary w-full py-4 text-base"
                onClick={handleConfirm}
                disabled={loading || !!getBlockReason(amount, payment)}
                style={{
                  opacity: getBlockReason(amount, payment) ? 0.5 : 1,
                  cursor:  getBlockReason(amount, payment) ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ Saving...' : getBlockReason(amount, payment) ? '🔒 Blocked — Insufficient Funds' : '✅ Confirm & Save'}
              </button>
            </div>
          )}
        </div>

        {/* Hard block overlay */}
        {blockError && (
          <BlockedOverlay error={blockError} onClose={() => setBlockError(null)} />
        )}
      </div>
    </div>
  )
}
