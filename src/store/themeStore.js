import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  dark: localStorage.getItem('ft-theme') === 'dark',
  toggle: () => set(state => {
    const next = !state.dark
    localStorage.setItem('ft-theme', next ? 'dark' : 'light')
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { dark: next }
  }),
  apply: () => {
    const dark = localStorage.getItem('ft-theme') === 'dark'
    if (dark) document.documentElement.classList.add('dark')
    return { dark }
  },
}))
