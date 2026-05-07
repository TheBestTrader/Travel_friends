import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function TodoSection({ currentUser }) {
  const [todos, setTodos] = useState([])
  const [users, setUsers] = useState([])
  const [content, setContent] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [adding, setAdding] = useState(false)

  async function loadTodos() {
    const { data } = await supabase
      .from('todos')
      .select('*, assigned_user:assigned_to(id, default_name, nickname), creator:created_by(id, default_name, nickname)')
      .order('created_at')
    if (data) setTodos(data)
  }

  async function loadUsers() {
    const { data } = await supabase.from('users').select('id, default_name, nickname').order('created_at')
    if (data) setUsers(data)
  }

  useEffect(() => {
    loadTodos()
    loadUsers()

    const channel = supabase
      .channel('todos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, loadTodos)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!content.trim()) return
    setAdding(true)
    await supabase.from('todos').insert({
      content: content.trim(),
      assigned_to: assignedTo || null,
      created_by: currentUser.id,
    })
    setContent('')
    setAssignedTo('')
    setAdding(false)
  }

  async function handleToggle(todo) {
    await supabase.from('todos').update({ is_done: !todo.is_done }).eq('id', todo.id)
  }

  async function handleDelete(id) {
    await supabase.from('todos').delete().eq('id', id)
  }

  const pending = todos.filter(t => !t.is_done)
  const done = todos.filter(t => t.is_done)

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-bold text-slate-700">☑️ 待辦清單</h2>
        <span className="badge bg-amber-100 text-amber-700">{pending.length} 項待完成</span>
      </div>

      {/* 新增表單 */}
      <form onSubmit={handleAdd} className="card mb-3">
        <div className="flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-0"
            placeholder="新增待辦事項…"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={80}
          />
          <select
            className="input w-32 flex-shrink-0"
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
          >
            <option value="">指派給…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.nickname || u.default_name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={adding || !content.trim()} className="btn-primary flex-shrink-0">
            新增
          </button>
        </div>
      </form>

      {/* 待完成 */}
      {todos.length === 0 ? (
        <div className="card text-center py-8 text-slate-400">
          <div className="text-3xl mb-2">☑️</div>
          <p className="text-sm">還沒有待辦事項</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              currentUser={currentUser}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}

          {done.length > 0 && (
            <>
              <p className="text-xs text-slate-400 font-semibold pt-2 pb-1">已完成</p>
              {done.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  currentUser={currentUser}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  )
}

function TodoItem({ todo, currentUser, onToggle, onDelete }) {
  const assigneeName = todo.assigned_user
    ? (todo.assigned_user.nickname || todo.assigned_user.default_name)
    : null
  const isOwner = todo.created_by === currentUser.id

  return (
    <div className={`card flex items-center gap-3 py-3 transition-all ${todo.is_done ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(todo)}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
          todo.is_done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-300 hover:border-sky-400'
        }`}
      >
        {todo.is_done && <span className="text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <span className={`text-sm ${todo.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
          {todo.content}
        </span>
        {assigneeName && (
          <span className="ml-2 text-xs text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">
            👤 {assigneeName}
          </span>
        )}
      </div>

      {isOwner && (
        <button
          onClick={() => onDelete(todo.id)}
          className="text-slate-300 hover:text-red-400 text-xs flex-shrink-0 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
}
