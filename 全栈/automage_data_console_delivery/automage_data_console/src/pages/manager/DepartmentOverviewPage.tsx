import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { apiClient } from '../../lib/apiClient'
import { useRunContextStore } from '../../store/useRunContextStore'
import { identityProfiles } from '../../config/identities'
import { Users, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

export function DepartmentOverviewPage() {
  const { user } = useAuth()
  const { runDate } = useRunContextStore()

  const mgrIdentity = {
    ...identityProfiles.manager,
    userId: user?.username ?? 'lijingli',
    departmentId: user?.department_id ?? 'dept_mvp_core',
    orgId: user?.org_id ?? 'org_automage_mvp',
  }

  const staffReports = useQuery({
    queryKey: ['staffReports', 'dept', runDate],
    queryFn: async () => {
      const res = await apiClient.getStaffReports(mgrIdentity, {
        org_id: mgrIdentity.orgId,
        department_id: mgrIdentity.departmentId,
        record_date: runDate,
      })
      if (!res.ok) throw new Error(res.msg ?? '查询日报失败')
      return (res.data as { reports?: unknown[] })?.reports ?? []
    },
    refetchInterval: 60_000,
  })

  const tasks = useQuery({
    queryKey: ['tasks', 'dept', runDate],
    queryFn: async () => {
      const res = await apiClient.getTasks(mgrIdentity)
      if (!res.ok) throw new Error(res.msg ?? '查询任务失败')
      return (res.data as { tasks?: unknown[] })?.tasks ?? []
    },
    refetchInterval: 60_000,
  })

  const incidents = useQuery({
    queryKey: ['incidents', 'dept'],
    queryFn: async () => {
      const res = await apiClient.getIncidents(mgrIdentity)
      if (!res.ok) throw new Error(res.msg ?? '查询异常失败')
      return (res.data as { incidents?: unknown[] })?.incidents ?? []
    },
    refetchInterval: 120_000,
  })

  const reportCount = Array.isArray(staffReports.data) ? staffReports.data.length : 0
  const taskList = Array.isArray(tasks.data) ? tasks.data : []
  const taskDone = taskList.filter((t: any) => t.status === 'done' || t.status === 'completed').length
  const incidentList = Array.isArray(incidents.data) ? incidents.data : []
  const openIncidents = incidentList.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length
  const completionRate = taskList.length > 0 ? Math.round((taskDone / taskList.length) * 100) : 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">部门全景</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={<Users size={18} />} label="日报提交数" value={String(reportCount)} color="blue" />
        <StatCard icon={<FileText size={18} />} label="活跃任务" value={String(taskList.length)} color="emerald" />
        <StatCard icon={<CheckCircle size={18} />} label="任务完成率" value={`${completionRate}%`} color="slate" />
        <StatCard icon={<AlertTriangle size={18} />} label="未关闭异常" value={String(openIncidents)} color={openIncidents > 0 ? 'rose' : 'slate'} />
      </div>
      <p className="text-xs text-slate-400">运行日: {runDate} | 部门: {user?.department_id ?? 'dept_mvp_core'}</p>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const borders: Record<string, string> = { blue: 'border-l-blue-500', emerald: 'border-l-emerald-500', rose: 'border-l-rose-500', slate: 'border-l-slate-400' }
  return (
    <div className={`console-panel rounded-lg border-l-4 p-4 ${borders[color] ?? borders.slate}`}>
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}
