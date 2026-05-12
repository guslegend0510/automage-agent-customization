import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useRunContextStore } from '../../store/useRunContextStore'
import { identityProfiles } from '../../config/identities'
import { Users, FileText, ClipboardList } from 'lucide-react'

export function DepartmentOverviewPage() {
  const { user, token } = useAuth()
  const { runDate } = useRunContextStore()
  const mgr = { ...identityProfiles.manager, userId: user?.username ?? 'lijingli', orgId: user?.org_id ?? 'org_automage_mvp', departmentId: user?.department_id ?? 'dept_mvp_core' }

  const { data: reports, isLoading } = useQuery({
    queryKey: ['staffReports', 'dept', runDate],
    queryFn: async () => {
      const res = await fetch(`/api/v1/report/staff?org_id=${mgr.orgId}&department_id=${mgr.departmentId}&record_date=${runDate}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': mgr.userId, 'X-Role': 'manager', 'X-Node-Id': mgr.nodeId },
      })
      return (await res.json())
    },
    refetchInterval: 30_000,
  })

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'dept', runDate],
    queryFn: async () => {
      const res = await fetch('/api/v1/tasks', {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': mgr.userId, 'X-Role': 'manager', 'X-Node-Id': mgr.nodeId },
      })
      return (await res.json())
    },
    refetchInterval: 30_000,
  })

  const reportList = (reports?.data?.reports ?? []) as any[]
  const taskList = (tasks?.data?.tasks ?? []) as any[]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">部门全景 — {runDate}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat icon={<Users size={16} />} label="日报数" value={reportList.length} color="blue" />
        <MiniStat icon={<ClipboardList size={16} />} label="任务数" value={taskList.length} color="emerald" />
        <MiniStat icon={<FileText size={16} />} label="提交率" value={reportList.length > 0 ? '已提交' : '暂无'} color="slate" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-800 mb-3">今日日报详情</h3>
        {isLoading ? <p className="text-sm text-slate-400">加载中…</p> : reportList.length === 0 ? (
          <p className="text-sm text-slate-400">今日暂无日报</p>
        ) : (
          <div className="space-y-3">
            {reportList.map((r: any, i: number) => {
              const d = r.report ?? r
              return (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-900">{d.user_id ?? r.user_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${(d.risk_level ?? 'low') === 'high' ? 'bg-rose-100 text-rose-700' : (d.risk_level ?? 'low') === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {d.risk_level ?? 'low'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{d.work_progress ?? '—'}</p>
                  {Array.isArray(d.issues_faced) && d.issues_faced.length > 0 && (
                    <p className="text-xs text-amber-700 mt-1">⚠️ {d.issues_faced[0]}</p>
                  )}
                  {d.issues_faced && !Array.isArray(d.issues_faced) && (
                    <p className="text-xs text-amber-700 mt-1">⚠️ {d.issues_faced}</p>
                  )}
                  {d.next_day_plan && <p className="text-xs text-slate-500 mt-1">📅 {d.next_day_plan}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, color }: any) {
  const borders: Record<string, string> = { blue: 'border-l-blue-400', emerald: 'border-l-emerald-400', amber: 'border-l-amber-400', slate: 'border-l-slate-300' }
  return (
    <div className={`flex items-center gap-3 rounded-lg border-l-4 bg-white p-3 ${borders[color]}`}>
      <span className="text-slate-400">{icon}</span>
      <div><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-semibold text-slate-900">{value}</p></div>
    </div>
  )
}
