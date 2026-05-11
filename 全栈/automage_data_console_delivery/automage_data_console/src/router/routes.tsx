import { Navigate, createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { StaffMyDashboard } from '../pages/staff/MyDashboard'
import { StaffReportPage } from '../pages/staff/ReportPage'
import { StaffTaskPage } from '../pages/staff/TaskPage'
import { StaffNotificationsPage } from '../pages/staff/NotificationsPage'
import { DepartmentOverviewPage } from '../pages/manager/DepartmentOverviewPage'
import { StaffManagementPage } from '../pages/manager/StaffManagementPage'
import { AuditCenterPage } from '../pages/manager/AuditCenterPage'
import { SystemMonitorPage } from '../pages/manager/SystemMonitorPage'
import { ManagerWorkspacePage } from '../pages/ManagerWorkspacePage'
import { StrategyDashboard } from '../pages/executive/StrategyDashboard'
import { DecisionCenter } from '../pages/executive/DecisionCenter'
import { ExecutiveWorkspacePage } from '../pages/ExecutiveWorkspacePage'
import { DataFlowPage } from '../pages/DataFlowPage'
import { TaskCenterPage } from '../pages/TaskCenterPage'
import { IncidentCenterPage } from '../pages/IncidentCenterPage'
import { AuditPage } from '../pages/AuditPage'
import { ApiDbMonitorPage } from '../pages/ApiDbMonitorPage'
import { AgentConsolePage } from '../pages/AgentConsolePage'
import { SettingsPage } from '../pages/SettingsPage'
import AuthGuard from './AuthGuard'
import App from '../App'

export const routes = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: <AuthGuard><App /></AuthGuard>,
    children: [
      // 通用
      { index: true, element: <DashboardPage /> },
      // 员工端
      { path: 'staff', element: <StaffMyDashboard /> },
      { path: 'staff/report', element: <StaffReportPage /> },
      { path: 'staff/tasks', element: <StaffTaskPage /> },
      { path: 'staff/notifications', element: <StaffNotificationsPage /> },
      // 中控台
      { path: 'manager', element: <DepartmentOverviewPage /> },
      { path: 'manager/staff', element: <StaffManagementPage /> },
      { path: 'manager/audit', element: <AuditCenterPage /> },
      { path: 'manager/monitor', element: <SystemMonitorPage /> },
      { path: 'manager/reports', element: <ManagerWorkspacePage /> },
      { path: 'data-flow', element: <DataFlowPage /> },
      { path: 'tasks', element: <TaskCenterPage /> },
      { path: 'incidents', element: <IncidentCenterPage /> },
      // 老板端
      { path: 'executive', element: <StrategyDashboard /> },
      { path: 'executive/decisions', element: <DecisionCenter /> },
      { path: 'executive/workspace', element: <ExecutiveWorkspacePage /> },
      // 管理通用
      { path: 'audit', element: <AuditPage /> },
      { path: 'api-monitor', element: <ApiDbMonitorPage /> },
      { path: 'agent-console', element: <AgentConsolePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])
