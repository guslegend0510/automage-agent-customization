import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password flow
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request')
  const [forgotUsername, setForgotUsername] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  if (user) {
    const role = user.role
    navigate(role === 'executive' ? '/executive' : role === 'manager' ? '/manager' : '/staff', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      const stored = localStorage.getItem('automage_user')
      const u = stored ? JSON.parse(stored) : null
      const dest = u?.role === 'executive' ? '/executive' : u?.role === 'manager' ? '/manager' : '/staff'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotMsg('')
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername }),
      })
      const d = await res.json()
      if (d.code === 200 && d.data?.reset_token) {
        setResetToken(d.data.reset_token)
        setForgotStep('reset')
        setForgotMsg('重置令牌已生成。输入新密码完成重置。')
      } else {
        setForgotMsg(d.msg || '请求失败')
      }
    } catch {
      setForgotMsg('网络错误，请重试')
    } finally {
      setForgotLoading(false)
    }
  }

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername, reset_token: resetToken, new_password: newPassword }),
      })
      const d = await res.json()
      if (d.code === 200) {
        setForgotMsg('密码重置成功！请返回登录。')
        setTimeout(() => { setShowForgot(false); setForgotStep('request'); setForgotMsg('') }, 2000)
      } else {
        setForgotMsg(d.detail || d.msg || '重置失败')
      }
    } catch {
      setForgotMsg('网络错误')
    } finally {
      setForgotLoading(false)
    }
  }

  if (showForgot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
          <h1 className="mb-1 text-center text-xl font-bold text-slate-900">重置密码</h1>
          {forgotStep === 'request' ? (
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <p className="text-sm text-slate-600">输入用户名，系统将生成重置令牌。生产环境中会通过邮件/短信发送。</p>
              <input type="text" value={forgotUsername} onChange={(e) => setForgotUsername(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="用户名" required />
              <button type="submit" disabled={forgotLoading} className="w-full rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{forgotLoading ? '请求中…' : '获取重置令牌'}</button>
              {forgotMsg && <p className="text-sm text-amber-600">{forgotMsg}</p>}
            </form>
          ) : (
            <form onSubmit={doReset} className="mt-6 space-y-4">
              <p className="text-sm text-emerald-600">{forgotMsg}</p>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="新密码（至少4位）" required minLength={4} />
              <button type="submit" disabled={forgotLoading} className="w-full rounded-lg bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">{forgotLoading ? '重置中…' : '确认重置'}</button>
              {forgotMsg && forgotStep === 'reset' && <p className="text-sm text-amber-600">{forgotMsg}</p>}
            </form>
          )}
          <button onClick={() => { setShowForgot(false); setForgotStep('request'); setForgotMsg('') }} className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700">返回登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-900">AutoMage</h1>
        <p className="mb-6 text-center text-sm text-slate-500">数据中台 · 组织运行控制台</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="请输入用户名" autoFocus required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="请输入密码" required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? '登录中…' : '登录'}</button>
        </form>
        <div className="mt-4 flex justify-between text-xs">
          <button onClick={() => setShowForgot(true)} className="text-slate-400 hover:text-blue-600">忘记密码？</button>
          <Link to="/register" className="text-slate-400 hover:text-emerald-600">员工注册</Link>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">墨智 · AutoMage v2</p>
      </div>
    </div>
  )
}
