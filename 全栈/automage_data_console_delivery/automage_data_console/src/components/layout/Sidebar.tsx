import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { navItems } from '../../config/constants'

export function Sidebar() {
  const { user } = useAuth()
  const role = user?.role ?? 'staff'

  const visibleItems = navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.includes(role)
  })

  const roleLabel = { staff: '员工端', manager: '中控台', executive: '老板端' }[role]

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/70 bg-white/60 p-4 backdrop-blur">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">AutoMage {roleLabel}</p>
        <p className="text-xs text-slate-400">{user?.display_name ?? user?.username}</p>
      </div>
      <nav className="space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`
            }
            end={item.path === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-4 left-4">
        <LogoutButton />
      </div>
    </aside>
  )
}

function LogoutButton() {
  const { logout, user } = useAuth()
  return (
    <button
      onClick={logout}
      className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
    >
      退出 ({user?.display_name ?? user?.username})
    </button>
  )
}
