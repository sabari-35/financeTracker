import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Target, Lightbulb, BarChart3, IndianRupee } from 'lucide-react'

const TABS = [
  { path: '/', icon: LayoutDashboard, label: 'Dash' },
  
  { path: '/budget', icon: Target, label: 'Budget' },
  { path: null, icon: PlusCircle, label: 'Add', isFab: true },
  { path: '/insights', icon: Lightbulb, label: 'Insights' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function BottomNav({ onAddClick }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          if (tab.isFab) {
            return (
              <button
                key="add"
                onClick={onAddClick}
                className="relative -top-5 w-14 h-14 rounded-full btn-primary shadow-orange-glow flex items-center justify-center overflow-hidden text-white"
                style={{ minHeight: 'unset' }}
              >
                <IndianRupee 
                  size={34} 
                  strokeWidth={2.5} 
                  style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.8))' }} 
                />
              </button>
            )
          }
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[44px]"
              style={{ color: isActive ? '#F97316' : 'var(--sub)' }}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
