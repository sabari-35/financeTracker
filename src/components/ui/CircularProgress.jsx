import React from 'react'

export default function CircularProgress({ score }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const offset = circumference - (progress / 100) * circumference
  const color = progress >= 70 ? '#22C55E' : progress >= 40 ? '#F59E0B' : '#EF4444'
  const label = progress >= 70 ? 'Great' : progress >= 40 ? 'Fair' : 'Poor'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          <circle cx="56" cy="56" r={radius} fill="none" stroke="var(--shadow-dark)" strokeWidth="10" />
          <circle
            cx="56" cy="56" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] font-medium" style={{ color: 'var(--sub)' }}>{label}</span>
        </div>
      </div>
    </div>
  )
}
