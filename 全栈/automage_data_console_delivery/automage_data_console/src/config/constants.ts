export const knownRisk = 'manager_cross_dept RBAC 已修复（v2 生产环境），所有已知风险已关闭'

export const integrationFacts = {
  backendStarted: true,
  healthzOk: true,
  pytestPassed: 30,
  mainChainPassed: true,
  dbSelectCheckPassed: true,
  nonBlockingRiskCount: 0,
}

type IdentityRole = 'staff' | 'manager' | 'executive'

interface NavItem { label: string; path: string; roles?: IdentityRole[] }

export const navItems: NavItem[] = [
  // === 员工端 ===
  { label: '🏠 我的首页', path: '/staff', roles: ['staff'] },
  { label: '📝 写日报', path: '/staff/report', roles: ['staff'] },
  { label: '📋 我的任务', path: '/staff/tasks', roles: ['staff'] },
  { label: '🔔 通知', path: '/staff/notifications', roles: ['staff'] },

  // === 中控台（Manager + Executive 可见）===
  { label: '📊 部门全景', path: '/manager', roles: ['manager', 'executive'] },
  { label: '👥 员工管理', path: '/manager/staff', roles: ['manager', 'executive'] },
  { label: '📄 汇总工作台', path: '/manager/reports', roles: ['manager', 'executive'] },
  { label: '📋 任务中心', path: '/tasks', roles: ['manager', 'executive'] },
  { label: '⚠️ 异常中心', path: '/incidents', roles: ['manager', 'executive'] },
  { label: '🔄 数据流转', path: '/data-flow', roles: ['manager', 'executive'] },
  { label: '🛡️ 审计中心', path: '/manager/audit', roles: ['manager', 'executive'] },
  { label: '🖥️ 系统监控', path: '/manager/monitor', roles: ['manager', 'executive'] },

  // === 老板端 ===
  { label: '🎯 战略视图', path: '/executive', roles: ['executive'] },
  { label: '🧠 决策中心', path: '/executive/decisions', roles: ['executive'] },
  { label: '📋 决策工作台', path: '/executive/workspace', roles: ['executive'] },

  // === 管理员 ===
  { label: '⚙️ Agent 控制台', path: '/agent-console', roles: ['executive'] },
  { label: '🔧 设置', path: '/settings', roles: ['executive'] },
]
