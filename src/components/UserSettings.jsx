import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Avatar } from './LoginScreen'

export default function UserSettings({ currentUser, onUpdate, onClose }) {
  const [nickname, setNickname] = useState(currentUser.nickname || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState(currentUser.avatar_url || null)
  const fileRef = useRef()

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('照片不能超過 2MB')
      return
    }
    setError('')
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${currentUser.id}/avatar.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setError('上傳失敗：' + uploadErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = data.publicUrl + '?t=' + Date.now()

    const { error: dbErr } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', currentUser.id)

    if (dbErr) {
      setError('更新失敗：' + dbErr.message)
    } else {
      setPreviewUrl(publicUrl)
      onUpdate({ ...currentUser, avatar_url: publicUrl })
    }
    setUploading(false)
  }

  async function handleRemovePhoto() {
    setSaving(true)
    await supabase.from('users').update({ avatar_url: null }).eq('id', currentUser.id)
    setPreviewUrl(null)
    onUpdate({ ...currentUser, avatar_url: null })
    setSaving(false)
  }

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
    await supabase.from('users').update({ nickname: null }).eq('id', currentUser.id)
    onUpdate({ ...currentUser, nickname: null })
    onClose()
    setSaving(false)
  }

  const fakeUser = { ...currentUser, avatar_url: previewUrl }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">⚙️ 個人設定</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>

        {/* 照片區 */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="relative">
            <Avatar user={fakeUser} index={0} size="lg" />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs">上傳中…</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="btn-ghost text-xs"
            >
              📷 {previewUrl ? '更換照片' : '上傳照片'}
            </button>
            {previewUrl && (
              <button onClick={handleRemovePhoto} disabled={saving} className="btn-danger text-xs">
                刪除照片
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="text-xs text-slate-400">支援 JPG / PNG，最大 2MB</p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">原本名字</label>
          <div className="px-3 py-2 rounded-lg bg-slate-50 text-slate-500 text-sm">
            {currentUser.default_name}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">自訂暱稱</label>
          <input
            className="input"
            placeholder="輸入暱稱（留空使用原名）"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            maxLength={20}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || uploading} className="btn-primary flex-1">
            {saving ? '儲存中…' : '儲存暱稱'}
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
