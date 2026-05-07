import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ProposalForm({ currentUser }) {
  const [form, setForm] = useState({ name: '', url: '', price: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('請輸入住宿名稱')
      return
    }
    setSubmitting(true)
    const { error: dbErr } = await supabase.from('proposals').insert({
      name: form.name.trim(),
      url: form.url.trim() || null,
      price: form.price ? Number(form.price) : null,
      proposed_by: currentUser.id,
    })
    if (dbErr) {
      setError('新增失敗：' + dbErr.message)
    } else {
      setForm({ name: '', url: '', price: '' })
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="font-bold text-base mb-4">➕ 新增住宿提案</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <input
            className="input"
            placeholder="住宿名稱 *"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            maxLength={60}
          />
        </div>
        <div className="sm:col-span-1">
          <input
            className="input"
            placeholder="網址（選填）"
            value={form.url}
            onChange={e => setField('url', e.target.value)}
          />
        </div>
        <div className="sm:col-span-1">
          <input
            className="input"
            placeholder="價格 / 晚（選填）"
            type="number"
            min="0"
            value={form.price}
            onChange={e => setField('price', e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? '新增中…' : '送出提案'}
        </button>
      </div>
    </form>
  )
}
