export default function ItineraryList({ items }) {
  if (items.length === 0) {
    return (
      <div className="card text-center py-8 text-slate-400">
        <div className="text-3xl mb-2">🗓️</div>
        <p className="text-sm">還沒有確認的行程</p>
        <p className="text-xs mt-1">在上方提案中點擊「確認定案」即可加入</p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time || '').localeCompare(b.time || '')
  })

  return (
    <div className="space-y-3">
      {sorted.map(item => (
        <div key={item.id} className="card border-l-4 border-l-emerald-400">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🏨</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">
                  {item.proposals?.name ?? '已刪除的提案'}
                </span>
                <span className="badge bg-emerald-100 text-emerald-700">已確認</span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span>📅 {formatDate(item.date)}</span>
                {item.time && <span>⏰ {formatTime(item.time)}</span>}
                {item.proposals?.price != null && (
                  <span>💰 NT${Number(item.proposals.price).toLocaleString()} / 晚</span>
                )}
              </div>

              {item.notes && (
                <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  📝 {item.notes}
                </p>
              )}

              {item.proposals?.url && (
                <a
                  href={item.proposals.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 text-xs hover:underline mt-1 block"
                >
                  🔗 查看訂房頁面
                </a>
              )}
            </div>
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
