import React, { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'
import EditBottomSheet from '../components/ui/EditBottomSheet'

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
  { key: 'cash_balance', label: 'Cash', icon: '💵', color: '#22C55E', payKey: 'cash' },
  { key: 'upi_balance',  label: 'UPI',  icon: '📲', color: '#3B82F6', payKey: 'upi'  },
  { key: 'card_balance', label: 'Card', icon: '💳', color: '#A855F7', payKey: 'card' },
]

/* ── Small pencil edit button pinned top-right of a card ───── */
function EditBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center neu-btn"
      style={{ color: '#F97316' }}
    >
      <Pencil size={13} />
    </button>
  )
}

/* ── Dashboard-style stat card ──────────────────────────────── */
function StatCard({ icon, iconBg, label, value, sub, color, onEdit }) {
  return (
    <div className="neu-card p-4 relative">
      <EditBtn onClick={onEdit} />
      <div className="icon-box mb-3" style={{ fontSize: '1.3rem', background: iconBg || 'var(--card)' }}>
        {icon}
      </div>
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--sub)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || 'var(--text)' }}>
        ₹{Number(value).toLocaleString('en-IN')}
      </div>
      {sub && <div className="text-[11px] mt-1" style={{ color: 'var(--sub)' }}>{sub}</div>}
    </div>
  )
}

/* ── Wallet card ────────────────────────────────────────────── */
function WalletCard({ wallet, balance, spent, onEdit }) {
  const remaining = balance - spent
  const pct      = balance > 0 ? Math.min(100, (spent / balance) * 100) : 0
  const barColor = pct < 60 ? wallet.color : pct < 85 ? '#F59E0B' : '#EF4444'

  return (
    <div className="neu-card p-3 relative overflow-hidden">
      <EditBtn onClick={onEdit} />

      <div className="icon-box mb-2" style={{ fontSize: '1.1rem', background: `${wallet.color}20`, width: 36, height: 36 }}>
        {wallet.icon}
      </div>
      <div className="text-[11px] font-medium mb-1" style={{ color: 'var(--sub)' }}>{wallet.label}</div>

      <div className="text-lg font-bold leading-tight" style={{ color: wallet.color }}>
        ₹{Number(balance).toLocaleString('en-IN')}
      </div>

      <div className="mt-1.5 flex flex-col gap-0.5">
        <div className="text-[9px] font-medium whitespace-nowrap" style={{ color: '#EF4444' }}>
          −₹{spent.toLocaleString('en-IN')} spent
        </div>
        <div className="text-[9px] font-bold whitespace-nowrap"
          style={{ color: remaining >= 0 ? '#22C55E' : '#EF4444' }}>
          ₹{Math.abs(remaining).toLocaleString('en-IN')} left
        </div>
      </div>

      {balance > 0 && (
        <div className="neu-inset p-0.5 rounded-full mt-2">
          <div className="h-1 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: barColor, minWidth: pct > 0 ? 4 : 0 }} />
        </div>
      )}
    </div>
  )
}

/* ── Category limit card ────────────────────────────────────── */
function CategoryCard({ cat, spent, limit, onEdit }) {
  const pct   = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const color = pct < 60 ? '#22C55E' : pct < 85 ? '#F59E0B' : '#EF4444'

  return (
    <div className="neu-card p-4 relative">
      {pct > 0 && (
        <div className="absolute top-9 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}22`, color }}>
          {pct}%
        </div>
      )}
      <EditBtn onClick={onEdit} />

      <div className="icon-box mb-3" style={{ fontSize: '1.2rem', background: `${cat.color}18` }}>
        {cat.icon}
      </div>
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--sub)' }}>{cat.name}</div>
      <div className="text-xl font-bold" style={{ color: limit > 0 ? 'var(--text)' : 'var(--sub)' }}>
        {limit > 0 ? `₹${Number(limit).toLocaleString('en-IN')}` : 'No limit'}
      </div>
      <div className="text-[11px] mt-1" style={{ color: 'var(--sub)' }}>
        Spent ₹{spent.toLocaleString('en-IN')}
      </div>
      {limit > 0 && (
        <div className="neu-inset p-0.5 rounded-full mt-3">
          <div className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? 6 : 0 }} />
        </div>
      )}
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────── */
export default function Budget() {
  const { user, profile, updateProfile } = useAuthStore()
  const { fetchAll, categories, budgets, upsertBudget, transactions } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)

  /* Budget state */
  const [monthlyBudget,  setMonthlyBudget]  = useState(0)
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [cashBalance,    setCashBalance]    = useState(0)
  const [upiBalance,     setUpiBalance]     = useState(0)
  const [cardBalance,    setCardBalance]    = useState(0)
  const [goalName,       setGoalName]       = useState('')
  const [goalAmount,     setGoalAmount]     = useState(0)
  const [goalDate,       setGoalDate]       = useState('')
  const [categoryLimits, setCategoryLimits] = useState({})

  /* Bottom sheet state — one shared sheet, configured per-field */
  const [sheet, setSheet] = useState(null)
  // sheet = { title, label, current, hint, onConfirm } | null

  const openSheet = (config) => setSheet(config)
  const closeSheet = () => setSheet(null)

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })
  const spentByMethod = { cash: 0, upi: 0, card: 0 }
  monthTxs.forEach(t => {
    const m = t.payment_method || 'upi'
    spentByMethod[m] = (spentByMethod[m] || 0) + Number(t.amount)
  })
  const spentByCat = {}
  monthTxs.forEach(t => {
    const name = t.categories?.name || 'Other'
    spentByCat[name] = (spentByCat[name] || 0) + Number(t.amount)
  })

  const dbCats = categories.length ? categories : CATEGORIES

  useEffect(() => { if (user?.id) fetchAll(user.id) }, [user?.id])
  useEffect(() => {
    if (!profile) return
    setMonthlyBudget(profile.monthly_budget     || 0)
    setAlertThreshold(profile.alert_threshold   || 80)
    setCashBalance(profile.cash_balance  || 0)
    setUpiBalance(profile.upi_balance    || 0)
    setCardBalance(profile.card_balance   || 0)
    setGoalName(profile.savings_goal_name        || '')
    setGoalAmount(profile.savings_target_amount  || 0)
    setGoalDate(profile.savings_target_date      || '')
  }, [profile])
  useEffect(() => {
    const limits = {}
    budgets.forEach(b => {
      if (b.categories?.name && b.month === month && b.year === year)
        limits[b.categories.name] = b.limit_amount
    })
    setCategoryLimits(limits)
  }, [budgets])

  const saveProfile = async (patch) => {
    try { await updateProfile(patch); toast.success('Saved ✓') }
    catch (e) { toast.error(e.message) }
  }
  const saveCatLimit = async (catName, val) => {
    const cat = dbCats.find(c => c.name === catName)
    if (!cat?.id) { toast.error('Category not found'); return }
    try {
      await upsertBudget({ user_id: user.id, category_id: cat.id, limit_amount: val, month, year })
      setCategoryLimits(prev => ({ ...prev, [catName]: val }))
      toast.success(`${catName} limit saved ✓`)
    } catch (e) { toast.error(e.message) }
  }

  const totalAvailable =
    (cashBalance + upiBalance + cardBalance) -
    (spentByMethod.cash + spentByMethod.upi + spentByMethod.card)

  return (
    <div className="page">
      <div className="page-content">
        <Header />
        <div className="section-title mb-4">Budget &amp; Limits</div>

        {/* ── Wallets 3-col ─────────────────────────────── */}
        <div className="text-xs font-bold mb-2 px-1" style={{ color: 'var(--sub)' }}>MY WALLETS</div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {WALLETS.map(w => {
            const bal    = w.key === 'cash_balance' ? cashBalance : w.key === 'upi_balance' ? upiBalance : cardBalance
            const setBal = w.key === 'cash_balance' ? setCashBalance : w.key === 'upi_balance' ? setUpiBalance : setCardBalance
            return (
              <WalletCard
                key={w.key}
                wallet={w}
                balance={bal}
                spent={spentByMethod[w.payKey] || 0}
                onEdit={() => openSheet({
                  title:   `Edit ${w.label} Balance`,
                  label:   `${w.label} Balance (₹)`,
                  current: bal,
                  hint:    `Spent this month: ₹${(spentByMethod[w.payKey] || 0).toLocaleString('en-IN')}`,
                  onConfirm: v => { setBal(v); saveProfile({ [w.key]: v }) },
                })}
              />
            )
          })}
        </div>

        {/* Total available */}
        <div className="neu-card p-3 mb-5 flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Total Available</span>
          <span className="text-lg font-bold" style={{ color: '#F97316' }}>
            ₹{totalAvailable.toLocaleString('en-IN')}
          </span>
        </div>

        {/* ── Spending Controls 2-col ───────────────────── */}
        <div className="text-xs font-bold mb-2 px-1" style={{ color: 'var(--sub)' }}>SPENDING CONTROLS</div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard
            icon="🎯" iconBg="#FFF0E6"
            label="Monthly Budget"
            value={monthlyBudget}
            sub="Overall cap"
            color="#F97316"
            onEdit={() => openSheet({
              title:   'Edit Monthly Budget',
              label:   'Monthly Budget (₹)',
              current: monthlyBudget,
              hint:    'This is your overall spending cap for the month.',
              onConfirm: v => { setMonthlyBudget(v); saveProfile({ monthly_budget: v }) },
            })}
          />
          {/* Alert threshold */}
          <div className="neu-card p-4">
            <div className="icon-box mb-3" style={{ fontSize: '1.3rem', background: '#FFF0E6' }}>🔔</div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--sub)' }}>Alert At</div>
            <div className="text-2xl font-bold" style={{ color: '#F97316' }}>{alertThreshold}%</div>
            <div className="text-[11px] mt-1 mb-3" style={{ color: 'var(--sub)' }}>of budget used</div>
            <input
              type="range" min={50} max={95} step={5}
              value={alertThreshold}
              onChange={e => setAlertThreshold(Number(e.target.value))}
              onMouseUp={e => saveProfile({ alert_threshold: Number(e.target.value) })}
              onTouchEnd={e => saveProfile({ alert_threshold: Number(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#F97316' }}
            />
          </div>
        </div>

        {/* ── Savings Goal 2-col ────────────────────────── */}
        <div className="text-xs font-bold mb-2 px-1" style={{ color: 'var(--sub)' }}>SAVINGS GOAL</div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard
            icon="🏆" iconBg="#FFF8DC"
            label="Target Amount"
            value={goalAmount}
            sub={goalName || 'Set a goal name below'}
            color="#F59E0B"
            onEdit={() => openSheet({
              title:   'Edit Savings Target',
              label:   'Target Amount (₹)',
              current: goalAmount,
              hint:    goalName ? `Goal: ${goalName}` : 'Enter your savings goal amount.',
              onConfirm: v => { setGoalAmount(v); saveProfile({ savings_target_amount: v }) },
            })}
          />
          <div className="neu-card p-4">
            <div className="icon-box mb-3" style={{ fontSize: '1.3rem', background: '#FFF8DC' }}>📅</div>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--sub)' }}>Goal Details</div>
            <input
              className="w-full text-sm font-semibold outline-none rounded-lg px-2 py-1.5 mb-2"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--shadow-dark)' }}
              placeholder="Goal name..."
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
              onBlur={() => saveProfile({ savings_goal_name: goalName })}
            />
            <input
              type="date"
              className="w-full text-xs outline-none rounded-lg px-2 py-1.5"
              style={{ background: 'var(--card)', color: 'var(--sub)', border: '1.5px solid var(--shadow-dark)' }}
              value={goalDate}
              onChange={e => setGoalDate(e.target.value)}
              onBlur={() => saveProfile({ savings_target_date: goalDate || null })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* ── Category Limits 2-col grid ────────────────── */}
        <div className="text-xs font-bold mb-2 px-1" style={{ color: 'var(--sub)' }}>CATEGORY LIMITS</div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.name}
              cat={cat}
              spent={spentByCat[cat.name] || 0}
              limit={categoryLimits[cat.name] || 0}
              onEdit={() => openSheet({
                title:   `Edit ${cat.name} Limit`,
                label:   `${cat.name} Monthly Limit (₹)`,
                current: categoryLimits[cat.name] || 0,
                hint:    `Spent so far: ₹${(spentByCat[cat.name] || 0).toLocaleString('en-IN')}`,
                onConfirm: v => saveCatLimit(cat.name, v),
              })}
            />
          ))}
        </div>
      </div>

      <BottomNav onAddClick={() => setShowAdd(true)} />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} />}

      {/* ── Shared bottom sheet ───────────────────────── */}
      <EditBottomSheet
        open={!!sheet}
        onClose={closeSheet}
        onConfirm={v => sheet?.onConfirm(v)}
        title={sheet?.title   || ''}
        label={sheet?.label   || ''}
        current={sheet?.current ?? 0}
        hint={sheet?.hint}
      />
    </div>
  )
}
