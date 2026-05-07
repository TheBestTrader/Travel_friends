import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function UserSettings({ currentUser, onUpdate, onClose }) {
  const [nickname, setNickname] = useState(currentUser.nickname || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const trimmed = nickname.trim()
    if (!trimmed) {
      setError('暱稱不能為空白')
      return
    }
    setSaving(true)
    setError('')
    const { error: dbErr } = await supabase
      .from('users')
      .update({ nickname: trimmed })
      .eq('id', currentUser.id)
    if (dbErr) {
      setError('儲存失敗，請再試一次')
    } else {
      onUpdate({ ...currentUser, nickname: trimmed })
      onClose()
    }
    setSaving(false)
  }

  async function handleClear() {
    setSaving(true)
    await supabase
      .from('users')
      .update({ nickname: null })
      .eq('id', currentUser.id)
    onUpdate({ ...currentUser, nickname: null })
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">⚙️ 設定暱稱</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            原本名字
          </label>
          <div className="px-3 py-2 rounded-lg bg-slate-50 text-slate-500 text-sm">
            {currentUser.default_name}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            自訂暱稱
          </label>
          <input
            className="input"
            placeholder={`輸入暱稱（留空使用原名）`}
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={20}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? '儲存中…' : '儲存'}
          </button>
          {currentUser.nickname && (
            <button onClick={handleClear} disabled={saving} className="btn-ghost">
              恢復原名
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
