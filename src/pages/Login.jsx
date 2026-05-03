import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function Login() {
  const { user, signIn, signUp, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Enter email and password'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        toast.success('Welcome back! 👋')
      } else {
        await signUp(email, password, name)
        toast.success('Account created! Check your email to verify.')
      }
    } catch (err) {
      toast.error(err.message || 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 relative" style={{ background: 'var(--bg)' }}>
      {/* Theme toggle */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-3xl neu-card flex items-center justify-center text-4xl mb-4 shadow-orange-glow">
            💰
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#F97316' }}>FinanceTracker</h1>
          <p className="text-sm mt-2 text-center" style={{ color: 'var(--sub)' }}>
            Smart spending. Better savings.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex p-1 rounded-2xl mb-6 neu-card">
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: mode === m ? '#F97316' : 'transparent',
                color: mode === m ? 'white' : 'var(--sub)',
                boxShadow: mode === m ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--sub)' }}>Your Name</label>
              <input className="neu-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--sub)' }}>Email</label>
            <input
              className="neu-input"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--sub)' }}>Password</label>
            <input
              className="neu-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn-primary w-full py-4 mt-2 text-base" disabled={loading}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? '🚀 Sign In' : '✨ Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--sub)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Google OAuth */}
        <button
          onClick={async () => {
            try { await signInWithGoogle() }
            catch (err) { toast.error(err.message) }
          }}
          className="neu-btn w-full py-4 flex items-center justify-center gap-3 text-sm font-semibold"
          style={{ color: 'var(--text)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--sub)' }}>
          Your data is secure and encrypted 🔒
        </p>
      </div>
    </div>
  )
}
