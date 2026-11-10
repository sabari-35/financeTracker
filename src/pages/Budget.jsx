import React, { useState, useEffect, useMemo } from 'react'
import { Pencil, Trash2, PlusCircle, Banknote, Smartphone, CreditCard } from 'lucide-react'
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
  { key: 'cash_balance', label: 'Cash', icon: <Banknote size={24} strokeWidth={1.5} color="#15803d" fill="#86efac" style={{ filter: 'drop-shadow(0px 3px 5px rgba(34,197,94,0.4))' }} />, color: '#22C55E', payKey: 'cash' },
  { key: 'upi_balance',  label: 'UPI',  icon: <Smartphone size={24} strokeWidth={1.5} color="#1d4ed8" fill="#93c5fd" style={{ filter: 'drop-shadow(0px 3px 5px rgba(59,130,246,0.4))' }} />, color: '#3B82F6', payKey: 'upi'  },
  { key: 'card_balance', label: 'Card', icon: <CreditCard size={24} strokeWidth={1.5} color="#7e22ce" fill="#d8b4fe" style={{ filter: 'drop-shadow(0px 3px 5px rgba(168,85,247,0.4))' }} />, color: '#A855F7', payKey: 'card' },
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
      <EditBtn onClick={onEdit} />

      <div className="icon-box mb-3" style={{ fontSize: '1.2rem', background: `${cat.color}18` }}>
        {cat.icon}
      </div>
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--sub)' }}>{cat.name}</div>
      <div className="text-xl font-bold" style={{ color: limit > 0 ? 'var(--text)' : 'var(--sub)' }}>
        {limit > 0 ? `₹${Number(limit).toLocaleString('en-IN')}` : 'No limit'}
      </div>

      {/* Spent + % badge on same row */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-[11px]" style={{ color: 'var(--sub)' }}>
          Spent ₹{spent.toLocaleString('en-IN')}
        </span>
        {pct > 0 && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${color}22`, color }}>
            {pct}%
          </span>
        )}
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
  const user = useAuthStore(state => state.user)
  const profile = useAuthStore(state => state.profile)
  const updateProfile = useAuthStore(state => state.updateProfile)
  
  const fetchAll = useFinanceStore(state => state.fetchAll)
  const categories = useFinanceStore(state => state.categories)
  const budgets = useFinanceStore(state => state.budgets)
  const upsertBudget = useFinanceStore(state => state.upsertBudget)
  const transactions = useFinanceStore(state => state.transactions)
  const savingsGoals = useFinanceStore(state => state.savingsGoals)
  const addSavingsGoal = useFinanceStore(state => state.addSavingsGoal)
  const updateSavingsGoal = useFinanceStore(state => state.updateSavingsGoal)
  const deleteSavingsGoal = useFinanceStore(state => state.deleteSavingsGoal)

  const [showAdd, setShowAdd] = useState(false)

  /* Budget state */
  const [monthlyBudget,  setMonthlyBudget]  = useState(0)
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [cashBalance,    setCashBalance]    = useState(0)
  const [upiBalance,     setUpiBalance]     = useState(0)
  const [cardBalance,    setCardBalance]    = useState(0)
  const [showAddGoal,    setShowAddGoal]    = useState(false)
  const [newGoal,        setNewGoal]        = useState({ name: '', target_amount: '' })
  const [categoryLimits, setCategoryLimits] = useState({})

  /* Bottom sheet state — one shared sheet, configured per-field */
  const [sheet, setSheet] = useState(null)
  // sheet = { title, label, current, hint, onConfirm } | null

  const openSheet = (config) => setSheet(config)
  const closeSheet = () => setSheet(null)

  const [actionSheet, setActionSheet] = useState(null)
  // actionSheet = { goal, type: 'deposit' | 'withdraw' } | null

  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()

  const monthTxs = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  }), [transactions, month, year])

  const spentByMethod = useMemo(() => {
    const spent = { cash: 0, upi: 0, card: 0 }
    monthTxs.forEach(t => {
      const m = t.payment_method || 'upi'
      spent[m] = (spent[m] || 0) + Number(t.amount)
    })
    return spent
  }, [monthTxs])

  const spentByCat = useMemo(() => {
    const spent = {}
    monthTxs.forEach(t => {
      const name = t.categories?.name || 'Other'
      spent[name] = (spent[name] || 0) + Number(t.amount)
    })
    return spent
  }, [monthTxs])

  const dbCats = categories.length ? categories : CATEGORIES

  useEffect(() => { if (user?.id) fetchAll(user.id) }, [user?.id])
  useEffect(() => {
    if (!profile) return
    setMonthlyBudget(profile.monthly_budget     || 0)
    setAlertThreshold(profile.alert_threshold   || 80)
    setCashBalance(profile.cash_balance  || 0)
    setUpiBalance(profile.upi_balance    || 0)
    setCardBalance(profile.card_balance   || 0)
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
    // BUG-04 FIX: Use `categories` from store (which has real UUIDs from DB).
    // Local CATEGORIES fallback has id:undefined and would always fail.
    const cat = categories.find(c => c.name === catName)
    if (!cat?.id) { toast.error('Categories not loaded yet — please wait a moment'); return }
    try {
      await upsertBudget({ user_id: user.id, category_id: cat.id, limit_amount: val, month, year })
      setCategoryLimits(prev => ({ ...prev, [catName]: val }))
      toast.success(`${catName} limit saved ✓`)
    } catch (e) { toast.error(e.message) }
  }

  const totalAvailable =
    (cashBalance + upiBalance + cardBalance) -
    (spentByMethod.cash + spentByMethod.upi + spentByMethod.card)

  /* Savings Action Handler */
  const handleSavingsAction = async (goalId, amount, type, walletKey) => {
    const goal = savingsGoals.find(g => g.id === goalId)
    if (!goal) return

    // BUG-05 FIX: Supabase returns NUMERIC columns as strings — coerce to Number.
    const currentGoalAmount = Number(goal.current_amount)

    try {
      if (type === 'deposit') {
        const walletBalance = Number(profile[walletKey] || 0)
        const wKey = walletKey.split('_')[0] // 'cash', 'upi', 'card'
        const spent = spentByMethod[wKey] || 0
        const available = walletBalance - spent

        if (amount > available) {
          throw new Error(`Insufficient funds in ${wKey.toUpperCase()}. Available: ₹${available.toLocaleString('en-IN')}`)
        }

        const newGoalAmt  = currentGoalAmount + amount
        // BUG-06 FIX: Ensure wallet balance never goes negative.
        const newWalletBal = walletBalance - amount
        if (newWalletBal < 0) {
          throw new Error(`Cannot deposit — wallet balance would go negative.`)
        }

        await updateSavingsGoal(goalId, { current_amount: newGoalAmt })
        await updateProfile({ [walletKey]: newWalletBal })
        toast.success(`₹${amount.toLocaleString('en-IN')} deposited to ${goal.name}! 🎯`)
      } else {
        // BUG-05 FIX: compare numbers, not string vs number.
        if (amount > currentGoalAmount) {
          throw new Error(`Cannot withdraw more than goal balance (₹${currentGoalAmount.toLocaleString('en-IN')})`)
        }

        const newGoalAmt   = currentGoalAmount - amount
        const newWalletBal = Number(profile[walletKey] || 0) + amount

        await updateSavingsGoal(goalId, { current_amount: newGoalAmt })
        await updateProfile({ [walletKey]: newWalletBal })
        toast.success(`₹${amount.toLocaleString('en-IN')} withdrawn to ${walletKey.split('_')[0].toUpperCase()}! 💰`)
      }
      setActionSheet(null)
    } catch (e) {
      toast.error(e.message)
    }
  }

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

        {/* ── Savings Goals ─────────────────────────────── */}
        <div className="text-xs font-bold mb-2 px-1" style={{ color: 'var(--sub)' }}>SAVINGS GOALS</div>
        
        {savingsGoals?.map(goal => {
          const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0
          return (
            <div key={goal.id} className="neu-card p-4 mb-4 relative">
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => openSheet({
                    title: 'Edit Target Amount',
                    label: 'Target Amount (₹)',
                    current: goal.target_amount,
                    hint: `Goal: ${goal.name}`,
                    onConfirm: async (v) => {
                      try { await updateSavingsGoal(goal.id, { target_amount: v }); toast.success('Updated'); }
                      catch (e) { toast.error(e.message); }
                    }
                  })}
                  className="w-7 h-7 rounded-lg flex items-center justify-center neu-btn" style={{ color: '#3B82F6' }}
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete goal "${goal.name}"?`)) {
                      try { await deleteSavingsGoal(goal.id); toast.success('Deleted'); }
                      catch (e) { toast.error(e.message); }
                    }
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center neu-btn" style={{ color: '#EF4444' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="icon-box" style={{ fontSize: '1.2rem', background: '#FFF8DC' }}>🏆</div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{goal.name}</div>
                  {goal.target_date && <div className="text-[10px]" style={{ color: 'var(--sub)' }}>By {new Date(goal.target_date).toLocaleDateString()}</div>}
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <div className="text-sm font-bold" style={{ color: '#F97316' }}>
                  ₹{Number(goal.current_amount).toLocaleString('en-IN')} <span className="text-xs" style={{ color: 'var(--sub)' }}>/ ₹{Number(goal.target_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-xs font-bold" style={{ color: '#22C55E' }}>{pct.toFixed(0)}%</div>
              </div>

              <div className="neu-inset p-0.5 rounded-full mb-4">
                <div className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: '#F59E0B', minWidth: pct > 0 ? 8 : 0 }} />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActionSheet({ goal, type: 'deposit' })}
                  className="flex-[2] btn-primary py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-lg"
                >
                  Deposit
                </button>
                <button
                  onClick={() => setActionSheet({ goal, type: 'withdraw' })}
                  className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold neu-btn"
                  style={{ color: '#3B82F6' }}
                >
                  Withdraw
                </button>
              </div>
            </div>
          )
        })}

        {showAddGoal ? (
          <div className="neu-card p-4 mb-5">
            <div className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Create New Goal</div>
            <input
              className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-3"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--shadow-dark)' }}
              placeholder="Goal Name (e.g. Car)"
              value={newGoal.name}
              onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
            />
            <input
              type="number"
              className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-3"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--shadow-dark)' }}
              placeholder="Target Amount (₹)"
              value={newGoal.target_amount || ''}
              onChange={e => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
            />
            <input
              type="date"
              className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-4"
              style={{ background: 'var(--card)', color: 'var(--sub)', border: '1.5px solid var(--shadow-dark)' }}
              value={newGoal.target_date || ''}
              onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })}
            />
            <div className="flex gap-3">
              <button className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl" onClick={() => setShowAddGoal(false)}>Cancel</button>
              <button className="flex-1 py-2.5 text-sm font-bold btn-primary rounded-xl" onClick={async () => {
                if (!newGoal.name || !newGoal.target_amount) return toast.error('Name and Amount required');
                try {
                  await addSavingsGoal({ user_id: user.id, ...newGoal });
                  setNewGoal({ name: '', target_amount: '' });
                  setShowAddGoal(false);
                  toast.success('Goal created');
                } catch(e) { toast.error(e.message) }
              }}>Save Goal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAddGoal(true)} className="w-full py-3 mb-5 neu-btn rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ color: '#F97316' }}>
            <PlusCircle size={16} /> Add New Savings Goal
          </button>
        )}

        {/* ── Category Limits 2-col grid ────────────────── */}
        <div className="text-xs font-bold mb-2 px-1" style={{ color: 'var(--sub)' }}>CATEGORY LIMITS</div>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* BUG-09 FIX: Use dbCats (from store, with real UUIDs) not the local
              hardcoded CATEGORIES array, so budget upserts use correct category IDs. */}
          {dbCats.map(cat => (
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

      {/* ── Savings Action Sheet ─────────────────────── */}
      <SavingsGoalSheet
        action={actionSheet}
        onClose={() => setActionSheet(null)}
        onAction={handleSavingsAction}
        profile={profile}
        spentByMethod={spentByMethod}
        totalAvailable={totalAvailable}
        monthlyBudget={monthlyBudget}
        totalSpent={spentByMethod.cash + spentByMethod.upi + spentByMethod.card}
      />
    </div>
  )
}

/* ── Specialized Savings Goal Sheet ─────────────────────────── */
function SavingsGoalSheet({ action, onClose, onAction, profile, spentByMethod, totalAvailable, monthlyBudget, totalSpent }) {
  const [amount, setAmount] = useState('')
  const [wallet, setWallet] = useState('upi_balance')

  if (!action) return null
  const { goal, type } = action

  // Actual Savings = Total Cash - (Planned Budget - Already Spent)
  // This is the "extra" money from previous months.
  const budgetLeft = Math.max(0, monthlyBudget - totalSpent)
  const actualSavings = Math.max(0, totalAvailable - budgetLeft)

  const handleSubmit = () => {
    const num = Number(amount)
    if (!num || num <= 0) return toast.error('Enter a valid amount')

    if (type === 'deposit' && num > actualSavings) {
      return toast.error(`You can only deposit from your Actual Savings (₹${actualSavings.toLocaleString()}). The rest is reserved for this month's budget!`)
    }

    onAction(goal.id, num, type, wallet)
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] rounded-t-3xl slide-up p-6 bg-white" style={{ background: 'var(--bg)' }}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6 opacity-30" />
        
        <div className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
          {type === 'deposit' ? 'Deposit Savings' : 'Withdraw from Goal'}
        </div>
        <div className="text-sm mb-6" style={{ color: 'var(--sub)' }}>
          {type === 'deposit' 
            ? `Move "Carry-over" money into "${goal.name}"` 
            : `Move money from "${goal.name}" to wallet`}
        </div>

        {type === 'deposit' && (
          <div className="p-3 rounded-2xl mb-6 flex justify-between items-center" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Available to Save</span>
              <span className="text-sm font-bold text-blue-800">₹{actualSavings.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-[9px] text-blue-500 max-w-[140px] text-right italic">
              Money left from past months (Total Balance − Budget Left)
            </div>
          </div>
        )}

        <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--sub)' }}>Amount (₹)</div>
        <input
          type="number"
          autoFocus
          className="neu-input text-2xl font-bold mb-6"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />

        <div className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--sub)' }}>
          {type === 'deposit' ? 'Select Source Wallet' : 'Withdraw To'}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {WALLETS.map(w => {
            const balance = profile[w.key] || 0
            const spent   = spentByMethod[w.payKey] || 0
            const left    = balance - spent
            const active  = wallet === w.key
            
            return (
              <button
                key={w.key}
                onClick={() => setWallet(w.key)}
                className="flex flex-col items-center p-3 rounded-2xl transition-all duration-200"
                style={{
                  background: active ? w.color : 'var(--card)',
                  boxShadow: active ? `0 8px 16px ${w.color}33` : '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
                  color: active ? '#fff' : 'var(--text)'
                }}
              >
                <div style={{ opacity: active ? 1 : 0.7 }}>{w.icon}</div>
                <div className="text-[10px] font-bold mt-1 uppercase">{w.label}</div>
                <div className="text-[9px] mt-0.5 opacity-80">₹{Math.max(0, left).toLocaleString()}</div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary w-full py-4 rounded-2xl text-base font-bold shadow-lg"
          style={{ background: type === 'deposit' ? '#F97316' : '#3B82F6' }}
        >
          {type === 'deposit' ? '🎯 Confirm Deposit' : '💰 Confirm Withdrawal'}
        </button>
      </div>
    </>
  )
}
