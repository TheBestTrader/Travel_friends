import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const AVATARS = ['🧑', '👩', '🧔', '👱', '👸', '🤴', '🧒', '👦', '👧', '🙋']

export default function LoginScreen({ onLogin }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(null)

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at')
      if (!error) setUsers(data)
      setLoading(false)
    }
    fetchUsers()
  }, [])

  async function handleSelect(user) {
    setSelecting(user.id)
    onLogin(user)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">✈️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">✈️</div>
          <h1 className="text-3xl font-bold text-slate-800">出去玩！</h1>
          <p className="text-slate-500 mt-2">選擇你的名字進入系統</p>
        </div>

        <div className="card shadow-lg">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            你是哪位？
          </p>
          <div className="grid grid-cols-2 gap-3">
            {users.map((user, i) => {
              const displayName = user.nickname || user.default_name
              const avatar = AVATARS[i % AVATARS.length]
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  disabled={selecting === user.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-sky-400 hover:bg-sky-50 transition-all duration-150 text-left group disabled:opacity-60"
                >
                  <span className="text-2xl">{avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-700 truncate group-hover:text-sky-600">
                      {displayName}
                    </div>
                    {user.nickname && (
                      <div className="text-xs text-slate-400 truncate">
                        原名：{user.default_name}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          進入後可在右上角設定修改暱稱
        </p>
      </div>
    </div>
  )
}
