import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { identityProfiles } from '../../config/identities'
import { useRunContextStore } from '../../store/useRunContextStore'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'

export function DecisionCenter() {
  const { user, token } = useAuth()
  const { runDate } = useRunContextStore()
  const execIdentity = { ...identityProfiles.executive, userId: user?.username ?? 'chenzong', orgId: user?.org_id ?? 'org_automage_mvp' }
  const [expandedOption, setExpandedOption] = useState<string | null>(null)
  const [dreamResult, setDreamResult] = useState<any>(null)
  const [dreamLoading, setDreamLoading] = useState(false)

  const { data: summaries, isLoading } = useQuery({
    queryKey: ['managerReports', 'decision', runDate],
    queryFn: async () => {
      const res = await fetch(`/api/v1/report/manager?summary_date=${runDate}`, {
        headers: { Authorization: `Bearer ${token}`, 'X-User-Id': execIdentity.userId, 'X-Role': 'executive', 'X-Node-Id': execIdentity.nodeId },
      })
      if (!res.ok) throw new Error('查询失败')
      return res.json()
    },
    refetchInterval: 60_000,
  })

  const runDream = async (summaryId: string) => {
    setDreamLoading(true)
    try {
      const res = await fetch('/internal/dream/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-User-Id': execIdentity.userId, 'X-Role': 'executive', 'X-Node-Id': execIdentity.nodeId },
        body: JSON.stringify({ summary_id: summaryId }),
      })
      setDreamResult((await res.json()).data ?? null)
    } finally { setDreamLoading(false) }
  }

  const commitDecision = useMutation({
    mutationFn: async (decision: any) => {
      const res = await fetch('/api/v1/decision/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-User-Id': execIdentity.userId, 'X-Role': 'executive', 'X-Node-Id': execIdentity.nodeId },
        body: JSON.stringify({ identity: { node_id: execIdentity.nodeId, user_id: execIdentity.userId, role: 'executive', level: 'l3_executive' }, decision }),
      })
      return res.json()
    },
  })

  const reports = (summaries?.data?.reports ?? []) as any[]

  const healthColor = (h: string) => h === 'red' ? 'text-rose-600' : h === 'yellow' ? 'text-amber-600' : 'text-emerald-600'

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">决策中心</h2>
      {isLoading ? <p className="text-sm text-slate-400">加载汇总中…</p> : reports.length === 0 ? <p className="text-sm text-slate-400">暂无汇总数据（{runDate}）</p> : (
        <div className="space-y-3">
          {reports.map((r: any, i: number) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium">
                健康度: <span className={healthColor(r.overall_health ?? r.report?.overall_health ?? 'green')}>{r.overall_health ?? r.report?.overall_health ?? '—'}</span>
              </p>
              <p className="text-sm text-slate-600 mt-1">{r.aggregated_summary ?? r.report?.aggregated_summary}</p>
              <button onClick={() => runDream(r.summary_public_id ?? r.public_id)} disabled={dreamLoading}
                className="mt-2 rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white hover:bg-purple-700 disabled:opacity-50">
                {dreamLoading ? 'Dream 生成中…' : '生成 A/B 方案'}
              </button>
            </div>
          ))}
        </div>
      )}
      {dreamResult && (
        <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4 space-y-3">
          <h3 className="font-semibold text-purple-900">Dream 决策方案</h3>
          {(dreamResult.decision_options ?? []).map((opt: any, i: number) => (
            <div key={i} className="rounded-lg border border-purple-200 bg-white p-3">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedOption(expandedOption === opt.option_id ? null : opt.option_id)}>
                <p className="font-medium">方案 {opt.option_id}: {opt.title}</p>
                {expandedOption === opt.option_id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              {expandedOption === opt.option_id && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-slate-600">{opt.summary}</p>
                  {(opt.task_candidates ?? []).map((t: any, j: number) => (
                    <p key={j} className="text-xs text-slate-500">· {t.title} [优先级: {t.priority}]</p>
                  ))}
                  <button onClick={() => commitDecision.mutate({ selected_option_id: opt.option_id, decision_summary: opt.summary, task_candidates: opt.task_candidates ?? [] })}
                    className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700">
                    <Check size={14} className="inline mr-1" /> 确认方案 {opt.option_id}
                  </button>
                </div>
              )}
            </div>
          ))}
          {commitDecision.isSuccess && <p className="text-sm text-emerald-600">决策已提交，任务已下发</p>}
        </div>
      )}
    </div>
  )
}
