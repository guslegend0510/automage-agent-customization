import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { apiClient } from '../../lib/apiClient'
import { useRunContextStore } from '../../store/useRunContextStore'
import { identityProfiles } from '../../config/identities'

export function StaffMyDashboard() {
  const { user } = useAuth()
  const { runDate } = useRunContextStore()

  const staffIdentity = {
    ...identityProfiles.staff,
    userId: user?.username ?? 'zhangsan',
    departmentId: user?.department_id ?? 'dept_mvp_core',
    orgId: user?.org_id ?? 'org_automage_mvp',
  }

  const myReports = useQuery({
    queryKey: ['staffReports', 'my', runDate, user?.username],
    queryFn: async () => {
      const res = await apiClient.getStaffReports(staffIdentity, {
        org_id: staffIdentity.orgId,
        department_id: staffIdentity.departmentId,
        record_date: runDate,
        user_id: staffIdentity.userId,
      })
      if (!res.ok) throw new Error(res.msg ?? '查询日报失败')
      return (res.data as { reports?: unknown[] })?.reports ?? []
    },
  })

  const myTasks = useQuery({
    queryKey: ['tasks', 'my', user?.username],
    queryFn: async () => {
      const res = await apiClient.getTasks(staffIdentity)
      if (!res.ok) throw new Error(res.msg ?? '查询任务失败')
      return (res.data as { tasks?: unknown[] })?.tasks ?? []
    },
  })

  const todayReport = Array.isArray(myReports.data) ? myReports.data[0] : null
  const tasks = Array.isArray(myTasks.data) ? myTasks.data : []
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">我的首页</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          title="今日日报"
          value={todayReport ? '✅ 已提交' : '⚠️ 未提交'}
          hint={todayReport ? `日期: ${runDate}` : `请前往 Staff 工作台提交 (${runDate})`}
          color={todayReport ? 'emerald' : 'amber'}
        />
        <MetricCard
          title="待处理任务"
          value={String(pendingTasks.length)}
          hint={pendingTasks.length > 0 ? `${pendingTasks.length} 个任务等待处理` : '暂无待处理任务'}
          color={pendingTasks.length > 3 ? 'rose' : 'blue'}
        />
        <MetricCard
          title="总任务数"
          value={String(tasks.length)}
          hint="所有分配给我的任务"
          color="slate"
        />
      </div>
    </div>
  )
}

function MetricCard({ title, value, hint, color }: { title: string; value: string; hint: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    rose: 'border-rose-200 bg-rose-50',
    blue: 'border-blue-200 bg-blue-50',
    slate: 'border-slate-200 bg-slate-50',
  }
  return (
    <div className={`console-panel rounded-lg border p-4 ${colors[color] ?? colors.slate}`}>
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}
