import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * EditBottomSheet
 * Props:
 *   open       – boolean
 *   onClose    – () => void
 *   onConfirm  – (value: number) => void
 *   title      – string, e.g. "Edit Cash Balance"
 *   label      – string, e.g. "Cash Balance (₹)"
 *   current    – number, current value
 *   hint       – optional string shown below the input
 */
export default function EditBottomSheet({ open, onClose, onConfirm, title, label, current, hint, inputType = 'number', prefix = '₹' }) {
  const [value, setValue] = useState(current ?? (inputType === 'number' ? 0 : ''))
  const inputRef = useRef(null)

  // Sync draft when sheet opens with a new field
  useEffect(() => {
    if (open) {
      setValue(current ?? (inputType === 'number' ? 0 : ''))
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open, current, inputType])

  if (!open) return null

  const handleConfirm = () => {
    const finalValue = inputType === 'number' ? (Number(value) || 0) : value;
    onConfirm(finalValue)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] rounded-t-3xl slide-up"
        style={{ background: 'var(--bg)', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--sub)', opacity: 0.35 }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-base font-bold" style={{ color: 'var(--text)' }}>{title}</span>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl neu-btn"
            style={{ color: 'var(--sub)' }}
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-8">
          {/* Field label */}
          <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
            {label}
          </div>

          {/* Input */}
          <div className="relative mb-2">
            {prefix && (
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold select-none"
                style={{ color: '#F97316' }}
              >
                {prefix}
              </span>
            )}
            <input
              ref={inputRef}
              type={inputType}
              min={inputType === 'number' ? 0 : undefined}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
              className={`neu-input ${prefix ? 'pl-9' : 'pl-4'} text-xl font-bold`}
              style={{ color: 'var(--text)', paddingTop: '0.85rem', paddingBottom: '0.85rem' }}
              placeholder={inputType === 'number' ? '0' : 'Add a note...'}
            />
          </div>

          {/* Hint */}
          {hint && (
            <p className="text-xs mb-5" style={{ color: 'var(--sub)' }}>{hint}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl font-semibold text-sm neu-btn"
              style={{ color: '#F97316' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
              style={{ background: '#F97316', boxShadow: '0 4px 15px #F9731640' }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
