import { useMemo, useState } from 'react'
import { statusBadgeClass } from '../lib/format'

interface TaskItem {
  taskId: string
  publicId: string
  title: string
  assignee: string
  source: string
  priority: string
  dueAt: string
  status: string
  latestUpdate: string
  relatedDecision: string
  relatedIncident: string
}

interface Props {
  tasks: TaskItem[]
}

const FILTERS = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '阻塞', value: 'blocked' },
  { label: '已完成', value: 'completed' },
]

export function TaskBoard({ tasks }: Props) {
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((task) => task.status === filter)),
    [tasks, filter],
  )

  return (
    <section id="tasks" className="space-y-3 scroll-mt-24">
      <h2 className="section-title">任务看板</h2>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === item.value
                ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((task) => (
          <div key={task.taskId} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-slate-900">
                {task.title}
                <span className="ml-2 text-xs text-slate-500">({task.publicId})</span>
              </p>
              <span className={`rounded-full border px-2 py-1 text-xs ${statusBadgeClass(task.status)}`}>
                {task.status}
              </span>
            </div>
            <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-5">
              <p>assignee: {task.assignee}</p>
              <p>source: {task.source}</p>
              <p>priority: {task.priority}</p>
              <p>due_at: {task.dueAt}</p>
              <p>latest_update: {task.latestUpdate}</p>
              <p>task_id: {task.taskId}</p>
              <p>related_decision: {task.relatedDecision}</p>
              <p>related_incident: {task.relatedIncident}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">状态流转：待处理 -&gt; 进行中 -&gt; 阻塞 / 已完成 -&gt; 回流日报</p>
    </section>
  )
}
