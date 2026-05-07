import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ProposalCard({ proposal, currentUser, myVotedIds, onConfirmClick }) {
  const hasVoted = myVotedIds.has(proposal.id)
  const isConfirmed = proposal.status === 'confirmed'
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  async function handleCancel() {
    setCancelling(true)
    await supabase.from('proposals').update({ status: 'pending' }).eq('id', proposal.id)
    await supabase.from('itinerary').delete().eq('proposal_id', proposal.id)
    setCancelling(false)
    setCancelConfirm(false)
  }

  async function handleVote() {
    if (hasVoted) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('proposal_id', proposal.id)
    } else {
      await supabase.from('votes').insert({
        user_id: currentUser.id,
        proposal_id: proposal.id,
      })
    }
  }

  return (
    <div className={`card flex flex-col gap-3 transition-all ${isConfirmed ? 'border-emerald-300 bg-emerald-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 truncate">{proposal.name}</span>
            {isConfirmed && (
              <span className="badge bg-emerald-100 text-emerald-700">✅ 已確認</span>
            )}
          </div>
          {proposal.url && (
            <a
              href={proposal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500 text-xs hover:underline truncate block mt-0.5"
            >
              🔗 {proposal.url}
            </a>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {proposal.price != null && (
              <span>💰 NT${Number(proposal.price).toLocaleString()} {proposal.category === 'restaurant' ? '/ 人' : '/ 晚'}</span>
            )}
            <span>
              由 <strong>{proposal.proposer_display_name || '某人'}</strong> 提案
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={handleVote}
          disabled={isConfirmed}
          className={`btn gap-1.5 text-sm ${
            hasVoted
              ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          } disabled:opacity-40`}
        >
          {hasVoted ? '👍' : '👍'}{' '}
          <span>{hasVoted ? '收回' : '支持'}</span>
          <span className="badge bg-white text-slate-700 ml-1">
            {proposal.vote_count ?? 0}
          </span>
        </button>

        {!isConfirmed && (
          <button
            onClick={() => onConfirmClick(proposal)}
            className="btn-success ml-auto"
          >
            🎉 確認定案
          </button>
        )}

        {isConfirmed && !cancelConfirm && (
          <button
            onClick={() => setCancelConfirm(true)}
            className="btn-ghost text-xs text-red-500 ml-auto"
          >
            取消定案
          </button>
        )}

        {isConfirmed && cancelConfirm && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500">確定取消？</span>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-danger text-xs"
            >
              {cancelling ? '取消中…' : '確定'}
            </button>
            <button
              onClick={() => setCancelConfirm(false)}
              className="btn-ghost text-xs"
            >
              不了
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
