import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useFinanceStore } from '../store/financeStore'
import Header from '../components/layout/Header'
import BottomNav from '../components/layout/BottomNav'
import QuickAddModal from '../components/QuickAdd/QuickAddModal'

const CATEGORIES = [
  { name: 'Food', icon: '🍕', color: '#F97316' },
  { name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { name: 'Shopping', icon: '🛍️', color: '#A855F7' },
  { name: 'Rent', icon: '🏠', color: '#22C55E' },
  { name: 'Health', icon: '💊', color: '#EF4444' },
  { name: 'Entertainment', icon: '🎬', color: '#F59E0B' },
  { name: 'Subscriptions', icon: '📱', color: '#EC4899' },
  { name: 'Other', icon: '📦', color: '#6B7280' },
]

function CategoryRing({ cat, spent, limit, onSetLimit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0
  const color = pct < 60 ? '#22C55E' : pct < 85 ? '#F59E0B' : '#EF4444'
  const data = [{ value: pct, fill: color }, { value: 100 - pct, fill: 'transparent' }]

  return (
    <div className="neu-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="icon-box text-xl">{cat.icon}</div>
        <div>
          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{cat.name}</div>
          <div className="text-xs" style={{ color: 'var(--sub)' }}>
            ₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-bold" style={{ color }}>{pct}%</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="neu-inset p-1 rounded-full mb-3">
        <div className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}bb)`,
            minWidth: pct > 0 ? 8 : 0,
          }}
        />
      </div>

      {/* Limit slider */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--sub)' }}>
          <span>Set limit</span>
          <span className="text-primary font-semibold">₹{limit.toLocaleString('en-IN')}</span>
        </div>
        <input
          type="range"
          min={0}
          max={20000}
          step={500}
          value={limit}
          onChange={e => onSetLimit(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: '#F97316' }}
        />
        <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>
          <span>₹0</span><span>₹20k</span>
        </div>
      </div>
    </div>
  )
}

export default function Budget() {
  const { user, profile, updateProfile } = useAuthStore()
  const { fetchAll, categories, budgets, upsertBudget, getCategorySpend } = useFinanceStore()
  const [showAdd, setShowAdd] = useState(false)
  const [monthlyBudget, setMonthlyBudget] = useState(profile?.monthly_budget || 0)
  const [alertThreshold, setAlertThreshold] = useState(profile?.alert_threshold || 80)
  const [categoryLimits, setCategoryLimits] = useState({})
  const [savingBudget, setSavingBudget] = useState(false)

  // Savings goal
  const [goalName, setGoalName] = useState(profile?.savings_goal_name || '')
  const [goalAmount, setGoalAmount] = useState(profile?.savings_target_amount || 0)
  const [goalDate, setGoalDate] = useState(profile?.savings_target_date || '')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const catSpend = getCategorySpend(month, year)
  const dbCats = categories.length ? categories : CATEGORIES

  useEffect(() => {
    if (user?.id) fetchAll(user.id)
  }, [user?.id])

  useEffect(() => {
    if (profile) {
      setMonthlyBudget(profile.monthly_budget || 0)
      setAlertThreshold(profile.alert_threshold || 80)
      setGoalName(profile.savings_goal_name || '')
      setGoalAmount(profile.savings_target_amount || 0)
      setGoalDate(profile.savings_target_date || '')
    }
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

  const handleSaveBudget = async () => {
    setSavingBudget(true)
    try {
      await updateProfile({
        monthly_budget: monthlyBudget,
        alert_threshold: alertThreshold,
        savings_goal_name: goalName,
        savings_target_amount: goalAmount,
        savings_target_date: goalDate || null,
      })
      // Save category limits
      for (const cat of dbCats) {
        const limit = categoryLimits[cat.name] || 0
        if (limit > 0) {
          await upsertBudget({
            user_id: user.id,
            category_id: cat.id,
            limit_amount: limit,
            month,
            year,
          })
        }
      }
      toast.success('Budget saved! 🎯')
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSavingBudget(false)
    }
  }

  const getSpentForCat = (catName) => {
    const cat = dbCats.find(c => c.name === catName)
    if (!cat?.id) return 0
    return catSpend[cat.id] || 0
  }

  return (
    <div className="page">
      <div className="page-content">
        <Header />
        <div className="section-title mb-4">Budget & Limits</div>

        {/* Overall monthly budget */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="icon-box text-xl icon-box-orange">🎯</div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Monthly Budget</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>Overall spending cap</div>
            </div>
            <div className="ml-auto text-xl font-bold" style={{ color: '#F97316' }}>
              ₹{monthlyBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={200000}
            step={1000}
            value={monthlyBudget}
            onChange={e => setMonthlyBudget(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#F97316' }}
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--sub)' }}>
            <span>₹0</span><span>₹2,00,000</span>
          </div>
        </div>

        {/* Alert threshold */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Alert Threshold</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>Warn me when budget is {alertThreshold}% used</div>
            </div>
            <div className="text-xl font-bold" style={{ color: '#F97316' }}>{alertThreshold}%</div>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={5}
            value={alertThreshold}
            onChange={e => setAlertThreshold(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#F97316' }}
          />
        </div>

        {/* Savings Goal */}
        <div className="neu-card p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-box text-xl icon-box-orange">🏆</div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Savings Goal</div>
              <div className="text-xs" style={{ color: 'var(--sub)' }}>Set your target</div>
            </div>
          </div>
          <input
            className="neu-input mb-3"
            placeholder="Goal name (e.g. Vacation fund)"
            value={goalName}
            onChange={e => setGoalName(e.target.value)}
          />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sub)' }}>Target: ₹{goalAmount.toLocaleString('en-IN')}</span>
            <span className="text-xs font-bold" style={{ color: '#F97316' }}>₹{goalAmount.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={0}
            max={500000}
            step={5000}
            value={goalAmount}
            onChange={e => setGoalAmount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3"
            style={{ accentColor: '#F97316' }}
          />
          <div>
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

        {/* Category Limits */}
        <div className="section-title mb-3">Category Limits</div>
        <div className="flex flex-col gap-4 mb-6">
          {CATEGORIES.map(cat => (
            <CategoryRing
              key={cat.name}
              cat={cat}
              spent={getSpentForCat(cat.name)}
              limit={categoryLimits[cat.name] || 0}
              onSetLimit={val => setCategoryLimits(prev => ({ ...prev, [cat.name]: val }))}
            />
          ))}
        </div>

        {/* Save button */}
        <button
          className="btn-primary w-full py-4 text-base mb-6"
          onClick={handleSaveBudget}
          disabled={savingBudget}
        >
          {savingBudget ? '⏳ Saving...' : '💾 Save Budget & Limits'}
        </button>
      </div>

      <BottomNav onAddClick={() => setShowAdd(true)} />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
