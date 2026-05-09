export function FinalCTA() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-900 px-6 py-14 text-center md:px-12">
      <p className="text-3xl font-semibold tracking-tight text-white md:text-5xl">先跑通组织闭环，再逐步交给 Agent。</p>
      <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
        MVP 阶段先不追求全自动管理公司，而是先让组织运行过程变成可验证的数据链路。
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href="#dashboard" className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900">
          查看 Demo 控制台
        </a>
        <a href="#integration-status" className="rounded-full border border-slate-500 px-5 py-2.5 text-sm font-medium text-slate-100">
          查看联调报告
        </a>
      </div>
    </section>
  )
}
