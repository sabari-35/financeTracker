import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: null, name: 'Food', icon: '🍕', default_type: 'unnecessary', color: '#F97316' },
  { id: null, name: 'Transport', icon: '🚗', default_type: 'necessary', color: '#3B82F6' },
  { id: null, name: 'Shopping', icon: '🛍️', default_type: 'unnecessary', color: '#A855F7' },
  { id: null, name: 'Rent', icon: '🏠', default_type: 'necessary', color: '#22C55E' },
  { id: null, name: 'Health', icon: '💊', default_type: 'necessary', color: '#EF4444' },
  { id: null, name: 'Entertainment', icon: '🎬', default_type: 'unnecessary', color: '#F59E0B' },
  { id: null, name: 'Subscriptions', icon: '📱', default_type: 'unnecessary', color: '#EC4899' },
  { id: null, name: 'Other', icon: '📦', default_type: 'necessary', color: '#6B7280' },
]

export const useFinanceStore = create((set, get) => ({
  transactions: [],
  categories: [],
  budgets: [],
  savingsGoals: [],
  loading: false,

  // ── Selectors ──────────────────────────────────────────────
  getMonthTransactions: (month, year) => {
    return get().transactions.filter(t => {
      // BUG-07 FIX: Parse date string directly to avoid UTC→local timezone shift.
      // new Date("2026-11-01") is UTC midnight; in timezones behind UTC that shifts
      // to the previous local day. Split the string instead.
      const [y, m] = t.date.split('-').map(Number)
      return m === month && y === year
    })
  },

  getStats: (month, year) => {
    const txs = get().getMonthTransactions(month, year)
    const totalSpent = txs.reduce((s, t) => s + Number(t.amount), 0)
    const necessary = txs.filter(t => t.type === 'necessary').reduce((s, t) => s + Number(t.amount), 0)
    const unnecessary = txs.filter(t => t.type === 'unnecessary').reduce((s, t) => s + Number(t.amount), 0)
    const score = totalSpent > 0 ? Math.round(100 - (unnecessary / totalSpent) * 100) : 100
    return { totalSpent, necessary, unnecessary, score }
  },

  getCategorySpend: (month, year) => {
    const txs = get().getMonthTransactions(month, year)
    const byCategory = {}
    txs.forEach(t => {
      const key = t.category_id
      byCategory[key] = (byCategory[key] || 0) + Number(t.amount)
    })
    return byCategory
  },

  getImpulsePatterns: () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentTxs = get().transactions.filter(t => new Date(t.date) >= weekAgo)
    const merchantCount = {}
    recentTxs.forEach(t => {
      if (t.merchant_name) {
        merchantCount[t.merchant_name] = (merchantCount[t.merchant_name] || 0) + 1
      }
    })
    return Object.entries(merchantCount).filter(([, count]) => count > 3).map(([name, count]) => ({ name, count }))
  },

  // ── Loaders ──────────────────────────────────────────────
  fetchAll: async (userId) => {
    set({ loading: true })
    try {
      const [txRes, catRes, budRes, goalsRes] = await Promise.all([
        supabase.from('transactions').select('*, categories(*)').eq('user_id', userId).order('date', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('budgets').select('*, categories(*)').eq('user_id', userId),
        supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      ])
      // Deduplicate categories by name (safeguard if INSERT ran multiple times)
      const rawCats = catRes.data || []
      const uniqueCats = rawCats.length
        ? [...new Map(rawCats.map(c => [c.name, c])).values()]
        : CATEGORIES

      set({
        transactions: txRes.data || [],
        categories: uniqueCats,
        budgets: budRes.data || [],
        savingsGoals: goalsRes.data || [],
      })
    } catch (err) {
      console.error('fetchAll failed:', err)
    } finally {
      // BUG-03 FIX: Always clear loading, even on network errors.
      set({ loading: false })
    }
  },

  // ── Mutations ────────────────────────────────────────────
  addTransaction: async (tx) => {
    const { data, error } = await supabase.from('transactions').insert(tx).select('*, categories(*)').single()
    if (error) throw error
    set(state => ({ transactions: [data, ...state.transactions] }))
    return data
  },

  updateTransaction: async (id, updates) => {
    const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select('*, categories(*)').single()
    if (error) throw error
    set(state => ({ transactions: state.transactions.map(t => t.id === id ? data : t) }))
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) throw error
    set(state => ({ transactions: state.transactions.filter(t => t.id !== id) }))
  },

  upsertBudget: async (budget) => {
    const { data, error } = await supabase
      .from('budgets')
      .upsert(budget, { onConflict: 'user_id,category_id,month,year' })
      .select('*, categories(*)')
      .single()
    if (error) throw error
    // BUG-01 FIX: Match existing budget by composite key (user_id+category_id+month+year),
    // NOT by id — the returned row id may not exist in state if this was an insert.
    set(state => {
      const exists = state.budgets.find(b =>
        b.user_id === data.user_id &&
        b.category_id === data.category_id &&
        b.month === data.month &&
        b.year === data.year
      )
      return {
        budgets: exists
          ? state.budgets.map(b =>
              b.user_id === data.user_id &&
              b.category_id === data.category_id &&
              b.month === data.month &&
              b.year === data.year
                ? data : b
            )
          : [...state.budgets, data],
      }
    })
  },

  addSavingsGoal: async (goal) => {
    const { data, error } = await supabase.from('savings_goals').insert(goal).select().single()
    if (error) throw error
    set(state => ({ savingsGoals: [...state.savingsGoals, data] }))
    return data
  },

  updateSavingsGoal: async (id, updates) => {
    const { data, error } = await supabase.from('savings_goals').update(updates).eq('id', id).select().single()
    if (error) throw error
    set(state => ({ savingsGoals: state.savingsGoals.map(g => g.id === id ? data : g) }))
  },

  deleteSavingsGoal: async (id) => {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id)
    if (error) throw error
    set(state => ({ savingsGoals: state.savingsGoals.filter(g => g.id !== id) }))
  },
}))
