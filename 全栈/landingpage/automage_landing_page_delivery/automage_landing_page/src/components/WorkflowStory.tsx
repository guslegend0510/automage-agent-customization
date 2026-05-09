import type { WorkflowStep } from '../data/demoData'

interface Props {
  steps: WorkflowStep[]
}

export function WorkflowStory({ steps }: Props) {
  return (
    <section id="workflow" className="scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Workflow Story</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">组织闭环滚动叙事</h2>
          <p className="mt-3 text-sm text-slate-600">
            Staff 记录事实，Manager 汇总判断，Dream 归并决策，老板确认后任务下发，再回流下一轮日报。
          </p>
          <ol className="mt-6 space-y-2">
            {steps.map((step, idx) => (
              <li key={step.step} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs">
                  {idx + 1}
                </span>
                <span>{step.step}</span>
              </li>
            ))}
          </ol>
        </aside>

        <div className="space-y-4">
          {steps.map((step, idx) => (
            <article
              key={step.step}
              className="group rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_22px_40px_rgba(3,105,161,0.12)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Step {idx + 1}</p>
                <span className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600">{step.status}</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{step.step}</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <p>角色：{step.role}</p>
                <p>API：{step.api}</p>
                <p>数据表：{step.table}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
