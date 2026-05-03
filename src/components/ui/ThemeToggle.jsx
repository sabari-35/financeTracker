import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { dark, toggle } = useThemeStore()
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-200"
      style={{
        background: 'var(--card)',
        boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
        color: 'var(--sub)',
        minHeight: 44,
      }}
    >
      <Sun size={15} className={dark ? 'opacity-40' : 'text-primary'} />
      <div className="w-8 h-4 rounded-full mx-1 relative transition-all duration-300"
        style={{ background: dark ? '#F97316' : '#D1D5DB' }}>
        <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300"
          style={{ left: dark ? '18px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </div>
      <Moon size={15} className={dark ? 'text-primary' : 'opacity-40'} />
    </button>
  )
}
