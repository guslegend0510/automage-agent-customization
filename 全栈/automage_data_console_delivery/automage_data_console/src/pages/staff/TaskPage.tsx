import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { identityProfiles } from '../../config/identities'

export function StaffTaskPage() {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const staffIdentity = { ...identityProfiles.staff, userId: user?.username ?? 'zhangsan', departmentId: user?.department_id ?? 'dept_mvp_core', orgId: user?.org_id ?? 'org_automage_mvp' }

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', 'staff', user?.username],
    queryFn: async () => {
      const res = await fetch(`/api/v1/tasks?assignee_user_id=${staffIdentity.userId}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': staffIdentity.userId, 'X-Role': 'staff', 'X-Node-Id': staffIdentity.nodeId },
      })
      if (!res.ok) throw new Error('查询失败')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  const updateTask = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await fetch(`/api/v1/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-User-Id': staffIdentity.userId, 'X-Role': 'staff', 'X-Node-Id': staffIdentity.nodeId },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('更新失败')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', 'staff'] }),
  })

  const tasks = (data?.data?.tasks ?? []) as any[]
  const grouped = {
    pending: tasks.filter((t: any) => t.status === 'pending' || t.status === 'not_started'),
    in_progress: tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'doing'),
    done: tasks.filter((t: any) => t.status === 'done' || t.status === 'completed'),
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">我的任务</h2>
      {isLoading ? <p className="text-sm text-slate-400">加载中…</p> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {(['pending', 'in_progress', 'done'] as const).map((col) => (
            <div key={col} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-700 capitalize">
                {{ pending: '📋 待处理', in_progress: '🔄 进行中', done: '✅ 已完成' }[col]} ({grouped[col].length})
              </p>
              <div className="space-y-2">
                {grouped[col].map((task: any) => (
                  <div key={task.task_id ?? task.public_id} className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="text-sm font-medium text-slate-900">{task.title ?? task.task_title}</p>
                    <p className="text-xs text-slate-500 mt-1">{task.description ?? task.task_description}</p>
                    <p className="mt-1 text-xs">
                      <span className={`status-pill ${task.priority === 'high' || task.priority === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {task.priority ?? 'medium'}
                      </span>
                    </p>
                    {col !== 'done' && (
                      <button
                        onClick={() => { setUpdatingId(task.task_id ?? task.public_id); updateTask.mutate({ taskId: task.task_id ?? task.public_id, status: col === 'pending' ? 'in_progress' : 'done' }, { onSettled: () => setUpdatingId(null) }) }}
                        disabled={updatingId === (task.task_id ?? task.public_id)}
                        className="mt-2 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {col === 'pending' ? '开始' : '完成'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
