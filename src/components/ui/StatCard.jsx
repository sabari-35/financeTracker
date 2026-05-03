import React from 'react'

export default function StatCard({ icon, label, value, sub, alert, color, onClick }) {
  return (
    <div
      className="neu-card p-4 cursor-pointer hover:scale-[1.02] transition-transform duration-200 relative"
      onClick={onClick}
    >
      {alert && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full leading-none">
          {alert}
        </div>
      )}
      <div className="icon-box mb-3" style={{ fontSize: '1.3rem', background: 'var(--card)' }}>
        {icon}
      </div>
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--sub)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: color || 'var(--text)' }}>{value}</div>
      {sub && <div className="text-[11px] mt-1" style={{ color: 'var(--sub)' }}>{sub}</div>}
    </div>
  )
}
