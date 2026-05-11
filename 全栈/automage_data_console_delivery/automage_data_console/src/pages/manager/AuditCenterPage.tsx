import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'


export function AuditCenterPage() {
  const { token } = useAuth()
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', action, targetType, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: '50' })
      if (action) params.set('action', action)
      if (targetType) params.set('target_type', targetType)
      const res = await fetch(`/api/v1/admin/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('查询失败')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const items = data?.data?.items ?? []
  const total = data?.data?.total ?? 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">审计日志中心</h2>

      <div className="flex flex-wrap gap-2">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className="rounded border border-slate-200 px-2 py-1 text-sm">
          <option value="">全部操作</option>
          <option value="crud_create">创建</option>
          <option value="crud_patch">更新</option>
          <option value="crud_delete">删除</option>
          <option value="dream_run">Dream</option>
        </select>
        <select value={targetType} onChange={(e) => { setTargetType(e.target.value); setPage(1) }} className="rounded border border-slate-200 px-2 py-1 text-sm">
          <option value="">全部类型</option>
          <option value="work_records">日报</option>
          <option value="summaries">汇总</option>
          <option value="tasks">任务</option>
          <option value="decisions">决策</option>
          <option value="incidents">异常</option>
        </select>
        <span className="text-sm text-slate-400 self-center">共 {total} 条</span>
      </div>

      {isLoading ? <p className="text-sm text-slate-400">加载中…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-2 w-24">时间</th>
                <th className="pb-2">操作</th>
                <th className="pb-2">对象类型</th>
                <th className="pb-2">摘要</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-slate-50 text-xs">
                  <td className="py-2 text-slate-400">{item.event_at?.slice(0, 19)}</td>
                  <td className="py-2"><span className="status-pill bg-slate-100 text-slate-700">{item.action}</span></td>
                  <td className="py-2 text-slate-500">{item.target_type}</td>
                  <td className="py-2">{item.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30">上一页</button>
            <button disabled={page * 50 >= total} onClick={() => setPage(page + 1)} className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30">下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}
