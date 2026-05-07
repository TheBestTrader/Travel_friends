import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import LoginScreen from './components/LoginScreen'
import UserSettings from './components/UserSettings'
import ProposalForm from './components/ProposalForm'
import ProposalCard from './components/ProposalCard'
import ConfirmModal from './components/ConfirmModal'
import ItineraryList from './components/ItineraryList'
import ItineraryAddModal from './components/ItineraryAddModal'

const SESSION_KEY = 'outing_user'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
  })
  const [showSettings, setShowSettings] = useState(false)
  const [proposals, setProposals] = useState([])
  const [itinerary, setItinerary] = useState([])
  const [myVotedIds, setMyVotedIds] = useState(new Set())
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [showItineraryAdd, setShowItineraryAdd] = useState(false)
  const [editItineraryItem, setEditItineraryItem] = useState(null)
  const [loadingData, setLoadingData] = useState(false)

  // ── 初始資料載入 ────────────────────────────────────────────
  const loadProposals = useCallback(async () => {
    const { data } = await supabase
      .from('proposals_with_votes')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProposals(data)
  }, [])

  const loadItinerary = useCallback(async () => {
    const { data } = await supabase
      .from('itinerary')
      .select('*, proposals(name, url, price)')
      .order('date')
    if (data) setItinerary(data)
  }, [])

  const loadMyVotes = useCallback(async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from('votes')
      .select('proposal_id')
      .eq('user_id', userId)
    if (data) setMyVotedIds(new Set(data.map(v => v.proposal_id)))
  }, [])

  useEffect(() => {
    if (!currentUser) return
    setLoadingData(true)
    Promise.all([
      loadProposals(),
      loadItinerary(),
      loadMyVotes(currentUser.id),
    ]).finally(() => setLoadingData(false))
  }, [currentUser, loadProposals, loadItinerary, loadMyVotes])

  // ── Supabase Realtime 訂閱 ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('outing-realtime')
      // 任何提案變動 → 重新整理提案列表
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => {
        loadProposals()
      })
      // 任何投票變動 → 重新整理提案（含票數）與自己的投票
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        loadProposals()
        loadMyVotes(currentUser.id)
      })
      // 任何行程變動 → 重新整理行程表
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itinerary' }, () => {
        loadItinerary()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUser, loadProposals, loadItinerary, loadMyVotes])

  // ── 事件處理 ────────────────────────────────────────────────
  function handleLogin(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    setCurrentUser(user)
  }

  function handleUserUpdate(updated) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
    setCurrentUser(updated)
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUser(null)
    setProposals([])
    setItinerary([])
    setMyVotedIds(new Set())
  }

  // ── 未登入：顯示選擇畫面 ─────────────────────────────────────
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const displayName = currentUser.nickname || currentUser.default_name
  const pendingProposals = proposals.filter(p => p.status === 'pending')
  const confirmedProposals = proposals.filter(p => p.status === 'confirmed')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─ Header ─ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✈️</span>
            <span className="font-bold text-slate-800">出去玩！</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 hidden sm:block">
              👋 {displayName}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-ghost text-xs"
              title="設定暱稱"
            >
              ⚙️
            </button>
            <button onClick={handleLogout} className="btn-ghost text-xs text-red-500">
              登出
            </button>
          </div>
        </div>
      </header>

      {/* ─ Main ─ */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loadingData && (
          <div className="text-center text-slate-400 text-sm py-4 animate-pulse">
            載入中…
          </div>
        )}

        {/* 新增提案表單 */}
        <ProposalForm currentUser={currentUser} />

        {/* 待定提案區 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-slate-700">🗳️ 住宿提案</h2>
            <span className="badge bg-sky-100 text-sky-700">
              {pendingProposals.length} 個
            </span>
          </div>
          {pendingProposals.length === 0 ? (
            <div className="card text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">🏨</div>
              <p className="text-sm">還沒有提案，搶先新增一個吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProposals.map(p => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  currentUser={currentUser}
                  myVotedIds={myVotedIds}
                  onConfirmClick={setConfirmTarget}
                />
              ))}
            </div>
          )}
        </section>

        {/* 正式行程表 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-bold text-slate-700">📋 正式行程表</h2>
            <span className="badge bg-emerald-100 text-emerald-700">
              {itinerary.length} 筆
            </span>
            <button
              onClick={() => { setEditItineraryItem(null); setShowItineraryAdd(true) }}
              className="btn-ghost text-xs ml-auto"
            >
              ＋ 新增行程
            </button>
          </div>
          <ItineraryList
            items={itinerary}
            onEdit={item => {
              if (!item.proposal_id) {
                setEditItineraryItem(item)
                setShowItineraryAdd(true)
              }
            }}
          />
        </section>

        {/* 已確認提案 */}
        {confirmedProposals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-bold text-slate-700">✅ 已定案住宿</h2>
            </div>
            <div className="space-y-3">
              {confirmedProposals.map(p => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  currentUser={currentUser}
                  myVotedIds={myVotedIds}
                  onConfirmClick={setConfirmTarget}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ─ Modals ─ */}
      {showSettings && (
        <UserSettings
          currentUser={currentUser}
          onUpdate={handleUserUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}
      {confirmTarget && (
        <ConfirmModal
          proposal={confirmTarget}
          onClose={() => setConfirmTarget(null)}
          onDone={() => {
            loadProposals()
            loadItinerary()
          }}
        />
      )}
      {showItineraryAdd && (
        <ItineraryAddModal
          currentUser={currentUser}
          editItem={editItineraryItem}
          onClose={() => { setShowItineraryAdd(false); setEditItineraryItem(null) }}
          onDone={loadItinerary}
        />
      )}
    </div>
  )
}
