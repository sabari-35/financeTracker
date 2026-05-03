import React from 'react'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import ThemeToggle from '../ui/ThemeToggle'

export default function Header() {
  const { profile, signOut } = useAuthStore()
  const now = new Date()
  const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex items-center justify-between pt-5 pb-3">
      <div>
        <div className="text-xs font-medium" style={{ color: 'var(--sub)' }}>{greeting} 👋</div>
        <div className="text-xl font-bold" style={{ color: 'var(--text)' }}>{name}</div>
        <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--sub)' }}>{monthYear}</div>
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
  )
}
