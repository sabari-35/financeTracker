import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'

const CATEGORIES = [
  { name: 'Food',          icon: '🍕', color: '#F97316' },
  { name: 'Transport',     icon: '🚗', color: '#3B82F6' },
  { name: 'Shopping',      icon: '🛍️', color: '#A855F7' },
  { name: 'Rent',          icon: '🏠', color: '#22C55E' },
  { name: 'Health',        icon: '💊', color: '#EF4444' },
  { name: 'Entertainment', icon: '🎬', color: '#F59E0B' },
  { name: 'Subscriptions', icon: '📱', color: '#EC4899' },
  { name: 'Other',         icon: '📦', color: '#6B7280' },
]

const WALLETS = [
  { key: 'cash_balance', label: 'Cash',  icon: '💵', color: '#22C55E' },
  { key: 'upi_balance',  label: 'UPI',   icon: '📲', color: '#3B82F6' },
  { key: 'card_balance', label: 'Card',  icon: '💳', color: '#A855F7' },
]

/* ── Rupee input field ─────────────────────────────────────── */
function RupeeInput({ value, onChange, placeholder = '0', label, sub }) {
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: 'var(--sub)' }}>{label}</span>
          {sub && <span className="text-xs" style={{ color: 'var(--sub)' }}>{sub}</span>}
        </div>
      )}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold"
          style={{ color: '#F97316' }}
        >₹</span>
        <input
          type="number"
          min={0}
          value={value || ''}
          onChange={e => onChange(Number(e.target.value) || 0)}
          placeholder={placeholder}
          className="neu-input pl-8 text-base font-semibold"
          style={{ color: 'var(--text)' }}
        />
      </div>
    </div>
  )
}

/* ── Category limit row ─────────────────────────────────────── */
function CategoryLimitRow({ cat, spent, limit, onSetLimit }) {
  const pct   = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const color = pct < 60 ? '#22C55E' : pct < 85 ? '#F59E0B' : '#EF4444'

  return (
    <div className="neu-card p-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="icon-box text-xl">{cat.icon}</div>
        <div className="flex-1">
          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{cat.name}</div>
          <div className="text-xs" style={{ color: 'var(--sub)' }}>
            Spent: ₹{spent.toLocaleString('en-IN')}
            {limit > 0 && ` / ₹${limit.toLocaleString('en-IN')}`}
          </div>
        </div>
        {pct > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, color }}
          >
            {pct}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {limit > 0 && (
        <div className="neu-inset p-1 rounded-full mb-3">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}, ${color}bb)`,
              minWidth: pct > 0 ? 8 : 0,
            }}
          />
        </div>
      )}

      {/* Number input */}
      <RupeeInput
        value={limit}
        onChange={onSetLimit}
        placeholder="Set limit"
        label="Monthly limit"
      />
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────── */
export default function Budget() {
  const { user, profile, updateProfile } = useAuthStore()
  const { fetchAll, categories, budgets, upsertBudget, transactions } = useFinanceStore()
  const [showAdd,  setShowAdd]  = useState(false)
  const [saving,   setSaving]   = useState(false)

  // Overall budget
  const [monthlyBudget,   setMonthlyBudget]   = useState(0)
  const [alertThreshold,  setAlertThreshold]  = useState(80)

  // Wallets (how much the user has in each)
  const [cashBalance, setCashBalance] = useState(0)
  const [upiBalance,  setUpiBalance]  = useState(0)
  const [cardBalance, setCardBalance] = useState(0)

  // Savings goal
  const [goalName,   setGoalName]   = useState('')
  const [goalAmount, setGoalAmount] = useState(0)
  const [goalDate,   setGoalDate]   = useState('')

  // Per-category limits
  const [categoryLimits, setCategoryLimits] = useState({})

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  // Derive category spending from all transactions this month
  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })

  // Spending by payment method this month
  const spentByMethod = { cash: 0, upi: 0, card: 0 }
  monthTxs.forEach(t => {
    const m = t.payment_method || 'upi'
    spentByMethod[m] = (spentByMethod[m] || 0) + Number(t.amount)
  })

  // Spending by category
  const spentByCat = {}
  monthTxs.forEach(t => {
    const name = t.categories?.name || 'Other'
    spentByCat[name] = (spentByCat[name] || 0) + Number(t.amount)
  })

  const dbCats = categories.length ? categories : CATEGORIES

  /* Load data */
  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  useEffect(() => {
    if (!profile) return
    setMonthlyBudget(profile.monthly_budget   || 0)
    setAlertThreshold(profile.alert_threshold  || 80)
    setCashBalance(profile.cash_balance  || 0)
    setUpiBalance(profile.upi_balance   || 0)
    setCardBalance(profile.card_balance  || 0)
    setGoalName(profile.savings_goal_name   || '')
    setGoalAmount(profile.savings_target_amount || 0)
    setGoalDate(profile.savings_target_date   || '')
  }, [profile])

  useEffect(() => {
    const limits = {}
    budgets.forEach(b => {
      if (b.categories?.name && b.month === month && b.year === year) {
        limits[b.categories.name] = b.limit_amount
      }
    })
    setCategoryLimits(limits)
  }, [budgets])

  /* Save all */
  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({
        monthly_budget:        monthlyBudget,
        alert_threshold:       alertThreshold,
        cash_balance:          cashBalance,
        upi_balance:           upiBalance,
        card_balance:          cardBalance,
        savings_goal_name:     goalName,
        savings_target_amount: goalAmount,
        savings_target_date:   goalDate || null,
      })

      for (const cat of dbCats) {
        const limit = categoryLimits[cat.name]
        if (limit > 0) {
          await upsertBudget({
            user_id:     user.id,
            category_id: cat.id,
            limit_amount: limit,
            month,
            year,
          })
        }
      }
      toast.success('Budget saved! 🎯')
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <Header />
        <div className="section-title mb-4">Budget & Limits</div>

        {/* ── Wallet Balances ─────────────────────────────── */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">👛</span>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>My Wallets</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>Enter your current balance per method</div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {WALLETS.map(w => {
              const bal  = w.key === 'cash_balance' ? cashBalance : w.key === 'upi_balance' ? upiBalance : cardBalance
              const set  = w.key === 'cash_balance' ? setCashBalance : w.key === 'upi_balance' ? setUpiBalance : setCardBalance
              const key  = w.key === 'cash_balance' ? 'cash' : w.key === 'upi_balance' ? 'upi' : 'card'
              const spent = spentByMethod[key] || 0
              const remaining = bal - spent

              return (
                <div key={w.key} className="neu-card-sm p-3">
                  {/* Wallet header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="icon-box text-xl"
                      style={{ background: `${w.color}22`, color: w.color }}
                    >
                      {w.icon}
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{w.label}</div>
                    <div className="ml-auto flex gap-3 text-xs">
                      <div className="text-right">
                        <div style={{ color: '#EF4444' }}>-₹{spent.toLocaleString('en-IN')}</div>
                        <div style={{ color: 'var(--sub)' }}>spent</div>
                      </div>
                      <div className="text-right">
                        <div style={{ color: remaining >= 0 ? '#22C55E' : '#EF4444' }}>
                          ₹{Math.abs(remaining).toLocaleString('en-IN')}
                        </div>
                        <div style={{ color: 'var(--sub)' }}>left</div>
                      </div>
                    </div>
                  </div>

                  {/* Balance input */}
                  <RupeeInput
                    value={bal}
                    onChange={set}
                    placeholder="Enter balance"
                    label={`${w.label} balance`}
                  />

                  {/* Spent progress bar */}
                  {bal > 0 && (
                    <div className="mt-2">
                      <div className="neu-inset p-1 rounded-full">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(100, (spent / bal) * 100)}%`,
                            background: w.color,
                            minWidth: spent > 0 ? 6 : 0,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Total remaining */}
          <div className="mt-4 p-3 rounded-2xl flex justify-between items-center"
            style={{ background: '#F97316' + '15' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Total Available</span>
            <span className="text-lg font-bold" style={{ color: '#F97316' }}>
              ₹{(cashBalance + upiBalance + cardBalance - spentByMethod.cash - spentByMethod.upi - spentByMethod.card).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* ── Monthly Budget ───────────────────────────────── */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box text-xl icon-box-orange">🎯</div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Monthly Spending Budget</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>Overall cap for this month</div>
            </div>
          </div>
          <RupeeInput value={monthlyBudget} onChange={setMonthlyBudget} placeholder="e.g. 50000" />
        </div>

        {/* ── Alert Threshold ──────────────────────────────── */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Alert Threshold</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>Warn me when budget is {alertThreshold}% used</div>
            </div>
            <div className="text-xl font-bold" style={{ color: '#F97316' }}>{alertThreshold}%</div>
          </div>
          <input
            type="range" min={50} max={95} step={5}
            value={alertThreshold}
            onChange={e => setAlertThreshold(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#F97316' }}
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--sub)' }}>
            <span>50%</span><span>95%</span>
          </div>
        </div>

        {/* ── Savings Goal ─────────────────────────────────── */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box text-xl icon-box-orange">🏆</div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Savings Goal</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>What are you saving towards?</div>
            </div>
          </div>
          <input
            className="neu-input mb-3"
            placeholder="e.g. Vacation fund, New laptop..."
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
          />
          <RupeeInput
            value={goalAmount}
            onChange={setGoalAmount}
            placeholder="Target amount"
            label="Target amount"
          />
          <div className="mt-3">
            <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--sub)' }}>Target Date</label>
            <input
              type="date"
              className="neu-input"
              value={goalDate}
              onChange={e => setGoalDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* ── Category Limits ──────────────────────────────── */}
        <div className="section-title mb-3">Category Limits</div>
        <div className="flex flex-col gap-4 mb-6">
          {CATEGORIES.map(cat => (
            <CategoryLimitRow
              key={cat.name}
              cat={cat}
              spent={spentByCat[cat.name] || 0}
              limit={categoryLimits[cat.name] || 0}
              onSetLimit={val => setCategoryLimits(prev => ({ ...prev, [cat.name]: val }))}
            />
          ))}
        </div>

        {/* Save */}
        <button
          className="btn-primary w-full py-4 text-base mb-6"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳ Saving...' : '💾 Save Budget & Wallets'}
        </button>
      </div>

      <BottomNav onAddClick={() => setShowAdd(true)} />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
