import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ItineraryAddModal({ currentUser, onClose, onDone, editItem }) {
  const [title, setTitle] = useState(editItem?.title ?? '')
  const [date, setDate] = useState(editItem?.date ?? '')
  const [time, setTime] = useState(editItem?.time?.slice(0, 5) ?? '')
  const [location, setLocation] = useState(editItem?.location ?? '')
  const [address, setAddress] = useState(editItem?.address ?? '')
  const [notes, setNotes] = useState(editItem?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title.trim()) { setError('請輸入活動名稱'); return }
    if (!date) { setError('請選擇日期'); return }
    setSaving(true)
    setError('')

    const payload = {
      title: title.trim(),
      date,
      time: time || null,
      location: location.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      proposal_id: null,
    }

    let err
    if (editItem) {
      ;({ error: err } = await supabase.from('itinerary').update(payload).eq('id', editItem.id))
    } else {
      ;({ error: err } = await supabase.from('itinerary').insert(payload))
    }

    if (err) {
      setError('儲存失敗：' + err.message)
    } else {
      onDone()
      onClose()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!editItem) return
    setSaving(true)
    await supabase.from('itinerary').delete().eq('id', editItem.id)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{editItem ? '✏️ 編輯行程' : '➕ 新增行程'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>

        <div className="space-y-4">
          {/* 活動名稱 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              活動名稱 <span className="text-red-400">*</span>
            </label>
            <input
              className="input"
              placeholder="例：逛市區、吃晚餐、搭高鐵"
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              maxLength={50}
            />
          </div>

          {/* 日期 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              日期 <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => { setDate(e.target.value); setError('') }}
            />
          </div>

          {/* 時間 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">時間（選填）</label>
            <input
              type="time"
              className="input"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>

          {/* 地點 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">地點（選填）</label>
            <input
              className="input"
              placeholder="例：台北車站、九份老街"
              value={location}
              onChange={e => setLocation(e.target.value)}
              maxLength={80}
            />
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">地址（選填）</label>
            <input
              className="input"
              placeholder="例：新北市瑞芳區基山街"
              value={address}
              onChange={e => setAddress(e.target.value)}
              maxLength={120}
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">備註（選填）</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="其他補充說明…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={200}
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <div className="flex gap-2 mt-5">
          {editItem && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="btn-danger text-xs"
            >
              刪除
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? '儲存中…' : editItem ? '儲存變更' : '新增行程'}
          </button>
        </div>
      </div>
    </div>
  )
}
