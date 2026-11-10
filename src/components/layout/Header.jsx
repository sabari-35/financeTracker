import React from 'react'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import ThemeToggle from '../ui/ThemeToggle'

// BUG-18 FIX: Google Fonts @import must live in a CSS file or <head>, NOT inside a
// JSX <style> tag that re-injects on every render. Moved to a module-level injection
// that runs once per app lifetime.
if (!document.getElementById('ft-great-vibes-font')) {
  const link = document.createElement('link')
  link.id = 'ft-great-vibes-font'
  link.rel = 'stylesheet'
  link.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
  document.head.appendChild(link)
}

export default function Header() {
  const { profile, signOut } = useAuthStore()
  const now = new Date()
  const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.name?.split(' ')[0] || 'there'

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between pt-5 pb-2">
        <div>
          <h1 className="tracking-wide" style={{ 
            fontFamily: "'Great Vibes', cursive", 
            fontSize: '32px',
            lineHeight: '1.2',
            color: '#F97316',
            textShadow: '1px 1px 2px rgba(0,0,0,0.15)'
          }}>
            Finance Tracker
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={signOut}
            className="neu-btn w-10 h-10 flex items-center justify-center"
            style={{ color: 'var(--sub)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      
      {/* Single line greeting below header */}
      <div className="flex items-center text-[13px] font-medium pb-2" style={{ color: 'var(--sub)' }}>
        <span>{greeting} 👋</span>
        <span className="mx-1.5 font-bold capitalize" style={{ color: 'var(--text)' }}>{name}</span>
        <span className="mx-1.5 opacity-50">•</span>
        <span>{monthYear}</span>
      </div>
    </div>
  )
}
