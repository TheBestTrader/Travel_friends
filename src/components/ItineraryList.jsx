export default function ItineraryList({ items, onEdit }) {
  if (items.length === 0) {
    return (
      <div className="card text-center py-8 text-slate-400">
        <div className="text-3xl mb-2">🗓️</div>
        <p className="text-sm">還沒有行程</p>
        <p className="text-xs mt-1">點擊右上角「＋ 新增行程」自行新增，或在住宿提案中點「確認定案」</p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time || '').localeCompare(b.time || '')
  })

  // 依日期分組
  const grouped = sorted.reduce((acc, item) => {
    const key = item.date
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([date, dayItems]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              📅 {formatDate(date)}
            </span>
          </div>
          <div className="space-y-2 pl-1">
            {dayItems.map(item => {
              const isHotel = !!item.proposal_id
              const displayTitle = item.title || item.proposals?.name || '已刪除的提案'
              return (
                <div
                  key={item.id}
                  className={`card border-l-4 cursor-pointer hover:shadow-md transition-shadow ${isHotel ? 'border-l-emerald-400' : 'border-l-sky-400'}`}
                  onClick={() => onEdit(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{isHotel ? '🏨' : '📍'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{displayTitle}</span>
                        {isHotel && (
                          <span className="badge bg-emerald-100 text-emerald-700">住宿</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        {item.time && <span>⏰ {formatTime(item.time)}</span>}
                        {item.location && <span>📌 {item.location}</span>}
                        {isHotel && item.proposals?.price != null && (
                          <span>💰 NT${Number(item.proposals.price).toLocaleString()} / 晚</span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                          📝 {item.notes}
                        </p>
                      )}

                      {isHotel && item.proposals?.url && (
                        <a
                          href={item.proposals.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-sky-500 text-xs hover:underline mt-1 block"
                        >
                          🔗 查看訂房頁面
                        </a>
                      )}
                    </div>
                    <div className="text-slate-300 text-xs self-center">✏️</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`
}

function formatTime(timeStr) {
  return timeStr.slice(0, 5)
}
