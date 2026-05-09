import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toneDotClass } from '../lib/format'
import dashboardPreview from '../assets/dashboard-preview-dark.svg'

interface Card {
  title: string
  value: string
  tone: 'green' | 'yellow' | 'red'
  description: string
}

interface Props {
  cards: Card[]
  taskStats: Array<{ name: string; value: number }>
}

export function ExecutiveDashboard({ cards, taskStats }: Props) {
  return (
    <section id="dashboard" className="space-y-4 scroll-mt-24">
      <h2 className="section-title">老板侧 P0 Dashboard</h2>
      <p className="text-sm text-slate-600">深色控制台作为产品截图嵌入页面，保留老板每日关注的核心决策与风险状态。</p>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
        <img src={dashboardPreview} alt="老板侧深色控制台预览" className="w-full rounded-2xl" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700">{item.title}</p>
              <span className={`h-2.5 w-2.5 rounded-full ${toneDotClass(item.tone)}`} />
            </div>
            <p className="mt-3 text-xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-2 text-xs text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="h-64 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm text-slate-700">今日任务状态分布</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={taskStats}>
            <XAxis dataKey="name" stroke="#475569" />
            <YAxis stroke="#475569" allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
