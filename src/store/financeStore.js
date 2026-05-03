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
  loading: false,

  // ── Selectors ──────────────────────────────────────────────
  getMonthTransactions: (month, year) => {
    return get().transactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() + 1 === month && d.getFullYear() === year
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
    const [txRes, catRes, budRes] = await Promise.all([
      supabase.from('transactions').select('*, categories(*)').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('budgets').select('*, categories(*)').eq('user_id', userId),
    ])
    set({
      transactions: txRes.data || [],
      categories: catRes.data?.length ? catRes.data : CATEGORIES,
      budgets: budRes.data || [],
      loading: false,
    })
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
    set(state => {
      const exists = state.budgets.find(b => b.id === data.id)
      return {
        budgets: exists
          ? state.budgets.map(b => b.id === data.id ? data : b)
          : [...state.budgets, data],
      }
    })
  },
}))
