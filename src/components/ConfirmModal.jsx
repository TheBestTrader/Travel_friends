import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ConfirmModal({ proposal, onClose, onDone }) {
  const isHotel = proposal.category !== 'restaurant'
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!date) {
      setError('請選擇日期')
      return
    }
    setSaving(true)
    setError('')

    const { error: propErr } = await supabase
      .from('proposals')
      .update({ status: 'confirmed' })
      .eq('id', proposal.id)

    if (propErr) {
      setError('更新提案狀態失敗：' + propErr.message)
      setSaving(false)
      return
    }

    const { error: itiErr } = await supabase.from('itinerary').insert({
      proposal_id: proposal.id,
      date,
      time: time || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    })

    if (itiErr) {
      setError('寫入行程表失敗：' + itiErr.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">🎉 確認定案</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>

        <div className="mb-5 p-3 bg-sky-50 rounded-xl border border-sky-100">
          <p className="text-sm font-semibold text-sky-800">{proposal.name}</p>
          {proposal.price != null && (
            <p className="text-xs text-sky-600 mt-0.5">
              💰 NT${Number(proposal.price).toLocaleString()} / 晚
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {isHotel ? '入住日期' : '用餐日期'} <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => { setDate(e.target.value); setError('') }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {isHotel ? '入住時間' : '用餐時間'}（選填）
            </label>
            <input
              type="time"
              className="input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              地址（選填）
            </label>
            <input
              className="input"
              placeholder="例：台北市中正區忠孝東路一段"
              value={address}
              onChange={e => setAddress(e.target.value)}
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              備註（選填）
            </label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="例：含早餐、可寄放行李…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="btn-success flex-1"
          >
            {saving ? '確認中…' : '✅ 寫入行程表'}
          </button>
          <button onClick={onClose} className="btn-ghost">取消</button>
        </div>
      </div>
    </div>
  )
}
