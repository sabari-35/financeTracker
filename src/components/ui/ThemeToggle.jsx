import React from 'react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { dark, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark/light mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        width: 72,
        height: 36,
        borderRadius: 999,
        background: 'var(--card)',
        boxShadow: dark
          ? 'inset 3px 3px 7px #111111, inset -3px -3px 7px #2d2d2d'
          : 'inset 3px 3px 7px #d1d1d1, inset -3px -3px 7px #ffffff',
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Sliding white circle — BEHIND icons */}
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: dark ? 36 : 4,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: 'var(--card)',
          boxShadow: dark
            ? '3px 3px 7px #111111, -3px -3px 7px #2d2d2d'
            : '3px 3px 7px #d1d1d1, -3px -3px 7px #ffffff',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1,
        }}
      />

      {/* Sun icon — LEFT — z-index above pill */}
      <span
        style={{
          position: 'absolute',
          left: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'opacity 0.3s ease',
          opacity: dark ? 0.4 : 1,
          pointerEvents: 'none',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={dark ? '#9CA3AF' : '#F97316'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2"  x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2"     y1="12"    x2="4"     y2="12" />
          <line x1="20"    y1="12"    x2="22"    y2="12" />
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
        </svg>
      </span>

      {/* Moon icon — RIGHT — z-index above pill */}
      <span
        style={{
          position: 'absolute',
          right: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'opacity 0.3s ease',
          opacity: dark ? 1 : 0.4,
          pointerEvents: 'none',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15" height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={dark ? '#F97316' : '#9CA3AF'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
