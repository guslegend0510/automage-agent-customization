import { useState } from 'react'
import { Link } from 'react-router-dom'

export function RegisterPage() {
  const [step, setStep] = useState<'form' | 'qrcode' | 'done'>('form')
  const [form, setForm] = useState({ username: '', password: '', display_name: '', phone: '', job_title: '', department_id: 'dept_mvp_core' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const checkUsername = async (username: string) => {
    if (username.length < 2) { setUsernameAvailable(null); return }
    try {
      const res = await fetch(`/api/v1/onboarding/check-username?username=${encodeURIComponent(username)}`)
      const d = await res.json()
      setUsernameAvailable(d.data?.available ?? null)
    } catch { setUsernameAvailable(null) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/v1/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || '注册失败')
      setUserId(d.data?.user_id ?? null)
      setStep('qrcode')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async () => {
    if (!userId) return
    setLoading(true)
    try {
      await fetch(`/api/v1/onboarding/${userId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collected_info: { phone: form.phone, job_title: form.job_title, display_name: form.display_name },
        }),
      })
      setStep('done')
    } catch {
      setError('激活失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Registration form
  if (step === 'form') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-1 text-center text-2xl font-bold text-slate-900">AutoMage</h1>
          <p className="mb-6 text-center text-sm text-slate-500">新员工注册</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">用户名 *</label>
              <input type="text" value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); checkUsername(e.target.value) }}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
              {usernameAvailable === false && <p className="text-xs text-red-500 mt-1">用户名已被使用</p>}
              {usernameAvailable === true && <p className="text-xs text-emerald-500 mt-1">可用</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">密码 *</label>
              <input type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required minLength={4} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">显示姓名 *</label>
              <input type="text" value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">手机号</label>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="用于飞书绑定" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">岗位</label>
              <input type="text" value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="例如：销售专员" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading || usernameAvailable === false}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? '注册中…' : '下一步：绑定飞书'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">
            已有账户？<Link to="/login" className="text-blue-600 hover:underline">登录</Link>
          </p>
        </div>
      </div>
    )
  }

  // Step 2: Feishu bind
  if (step === 'qrcode') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-900">绑定飞书智能体</h1>
          <p className="text-sm text-slate-600">
            注册信息已保存。请通过飞书联系 <strong>墨智</strong> 完成入职：
          </p>

          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
            <p className="font-semibold text-blue-800 mb-3">方式一：飞书扫码</p>
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://applink.feishu.cn/client/bot/open?appId=cli_aa8bbf4af4f8dbee"
              alt="飞书扫码添加 Auto01"
              className="mx-auto w-48 h-48 rounded-xl border border-slate-200"
            />
            <p className="text-xs text-slate-500 mt-2">打开飞书扫一扫添加 <strong>Auto01</strong></p>
          </div>

          <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800 mb-1">方式二：飞书搜索</p>
            <p className="text-sm text-emerald-700">在飞书中搜索 <strong>「Auto01」</strong></p>
            <p className="text-xs text-slate-500 mt-1">
              发送消息：<code className="bg-white px-1 rounded">入职 {form.display_name}，手机号 {form.phone || '未填'}</code>
            </p>
          </div>

          <p className="text-xs text-slate-400">
            墨智会在飞书中向你提问（岗位职责、直属上级等），回答完成后账户自动激活。
          </p>

          <div className="flex gap-2 justify-center pt-2">
            <button onClick={completeOnboarding} disabled={loading}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-300 disabled:opacity-50">
              {loading ? '处理中…' : '跳过飞书，直接激活'}
            </button>
            <Link to="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              前往登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Done
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg text-center">
        <h1 className="mb-2 text-2xl font-bold text-emerald-600">入职完成</h1>
        <p className="mb-4 text-slate-600">欢迎 <strong>{form.display_name}</strong>！</p>
        <p className="text-sm text-slate-500 mb-6">账户已激活，现在可以登录使用。</p>
        <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">前往登录</Link>
      </div>
    </div>
  )
}
