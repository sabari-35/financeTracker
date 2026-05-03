import React from 'react'

export default function BudgetHealthBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
  const color = pct < 60 ? '#22C55E' : pct < 85 ? '#F59E0B' : '#EF4444'
  const label = pct < 60 ? 'On track 🟢' : pct < 85 ? 'Watch out ⚠️' : 'Over budget 🔴'

  return (
    <div className="neu-card p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>Budget Health</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--sub)' }}>{label}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color }}>{pct}%</div>
          <div className="text-[11px]" style={{ color: 'var(--sub)' }}>used</div>
        </div>
      </div>
      <div className="neu-inset p-1.5 rounded-full">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}66`,
            minWidth: pct > 0 ? 12 : 0,
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[11px]" style={{ color: 'var(--sub)' }}>
        <span>₹{spent.toLocaleString('en-IN')} spent</span>
        <span>₹{budget.toLocaleString('en-IN')} limit</span>
      </div>
    </div>
  )
}
