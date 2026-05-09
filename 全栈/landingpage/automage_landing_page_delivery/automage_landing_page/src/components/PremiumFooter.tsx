interface Props {
  apiBase: string
}

const columns = [
  {
    title: 'Product',
    items: ['闭环流程', '三层 Agent', '老板控制台', '任务追踪'],
  },
  {
    title: 'Architecture',
    items: ['Schema', 'API', 'Database', 'Audit'],
  },
  {
    title: 'Delivery',
    items: ['Mock 闭环', '真实联调', 'RBAC 风险', 'Roadmap'],
  },
  {
    title: 'Resources',
    items: ['项目依据', '联调状态', 'P0 字段', '交付说明'],
  },
]

export function PremiumFooter({ apiBase }: Props) {
  return (
    <footer className="mt-14 overflow-hidden rounded-[28px] border border-slate-700 bg-slate-950 text-slate-300">
      <div className="bg-[linear-gradient(0deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px] p-8 md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-2xl font-semibold text-white">AutoMage-2</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              AutoMage-2 MVP Landing Page P0。<br />
              当前主链路已真实联调通过，唯一非阻塞风险是 manager_cross_dept。
            </p>
            <p className="mt-4 text-xs text-slate-400">API Base: {apiBase}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-white">{col.title}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {col.items.map((item) => (
                    <li key={item} className="text-slate-400">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 px-8 py-4 text-xs text-slate-400 md:px-12">
        <p>AutoMage-2 MVP Landing Page P0 | MAIN_RISK: manager_cross_dept 当前未拒绝，非阻塞，里程碑三前关闭</p>
      </div>
    </footer>
  )
}
