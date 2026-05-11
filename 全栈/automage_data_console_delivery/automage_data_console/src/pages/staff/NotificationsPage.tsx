import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { identityProfiles } from '../../config/identities'
import { Clock, CheckCircle } from 'lucide-react'

export function StaffNotificationsPage() {
  const { user, token } = useAuth()
  const staffIdentity = { ...identityProfiles.staff, userId: user?.username ?? 'zhangsan' }

  // Fetch recent audit logs relevant to this staff user
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', user?.username],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/audit?page=1&page_size=20&actor_user_id=${staffIdentity.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('查询失败')
      return res.json()
    },
    refetchInterval: 60_000,
  })

  const items = data?.data?.items ?? []

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">通知中心</h2>
      {isLoading ? <p className="text-sm text-slate-400">加载中…</p> : items.length === 0 ? (
        <p className="text-sm text-slate-400">暂无通知</p>
      ) : (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
              {item.action?.includes('create') ? <CheckCircle size={16} className="mt-0.5 text-emerald-500" /> : <Clock size={16} className="mt-0.5 text-blue-500" />}
              <div className="flex-1">
                <p className="text-sm text-slate-900">{item.summary}</p>
                <p className="text-xs text-slate-400 mt-1">{item.event_at?.slice(0, 19)} · {item.target_type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
