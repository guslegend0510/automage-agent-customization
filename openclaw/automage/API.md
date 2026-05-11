# AutoMage API — 墨智操作手册

AutoMage 是部署在 `localhost:8080` 的企业工作流平台。你是它的智能体大脑。

## 部署信息

- 前端: http://localhost:8080
- API: http://api:8000 (Docker 内部) / http://localhost:8080/api/ (通过 nginx 代理)
- 数据库: PostgreSQL (真相层，只读查询，不直接写)

## API 端点

### Staff 层

**提交日报**
```
POST /api/v1/report/staff
Headers: Content-Type: application/json, X-Actor-Role: staff, X-Actor-User-Id: <user_id>
Body: {
  "identity": { "node_id": "...", "user_id": "...", "role": "staff", "level": "l1_staff", "department_id": "...", "manager_node_id": "..." },
  "report": {
    "schema_id": "schema_v1_staff",
    "org_id": "org_automage_mvp",
    "department_id": "dept_mvp_core",
    "user_id": "...",
    "record_date": "2026-05-11",
    "work_progress": "...",
    "issues_faced": [],
    "solution_attempt": "",
    "need_support": false,
    "next_day_plan": "...",
    "risk_level": "low|medium|high|critical",
    "resource_usage": {}
  }
}
```

**查询日报**
```
GET /api/v1/report/staff?org_id=...&department_id=...&record_date=...&user_id=...
Headers: X-Actor-Role: <role>, X-Actor-User-Id: <user_id>
```

**查询我的任务**
```
GET /api/v1/tasks?assignee_user_id=<user_id>
Headers: X-Actor-Role: staff, X-Actor-User-Id: <user_id>
```

**更新任务状态**
```
PATCH /api/v1/tasks/{task_id}
Body: { "status": "in_progress|done|completed" }
```

### Manager 层

**提交汇总**
```
POST /api/v1/report/manager
Headers: X-Actor-Role: manager, X-Actor-User-Id: <user_id>
Body: {
  "identity": { "node_id": "...", "user_id": "...", "role": "manager", "level": "l2_manager", "department_id": "...", "manager_node_id": "..." },
  "report": {
    "schema_id": "schema_v1_manager",
    "org_id": "org_automage_mvp",
    "dept_id": "dept_mvp_core",
    "manager_user_id": "...",
    "summary_date": "2026-05-11",
    "overall_health": "green|yellow|red",
    "aggregated_summary": "...",
    "top_3_risks": ["风险1", "风险2", "风险3"],
    "workforce_efficiency": 0.82,
    "pending_approvals": 0,
    "source_record_ids": ["WR-..."]
  }
}
```

**查询汇总列表**
```
GET /api/v1/report/manager?org_id=...&dept_id=...&summary_date=...
```

**创建任务**
```
POST /api/v1/tasks
Body: { "tasks": [{ "task_id": "...", "org_id": "...", "department_id": "...", "assignee_user_id": "...", "task_title": "...", "task_description": "...", "priority": "high|medium|low", "status": "pending", ... }] }
```

### Executive 层

**生成 Dream 决策**
```
POST /internal/dream/run
Body: { "summary_id": "MSUM-..." }
Headers: X-Actor-Role: executive
```
Response: { "decision_options": [{ "option_id": "A|B", "title": "...", "summary": "...", "task_candidates": [...] }], "manager_summary": {...} }

**提交正式决策**
```
POST /api/v1/decision/commit
Body: {
  "identity": { ... },
  "decision": {
    "selected_option_id": "A",
    "decision_summary": "...",
    "task_candidates": [{ "task_id": "...", "assignee_user_id": "...", "title": "...", "description": "...", "status": "pending", "priority": "high" }]
  }
}
```

### 通用

**健康检查**
```
GET /healthz → { "status": "ok" }
```

## 认证

所有请求通过 Header 传递身份:
- `Authorization: Bearer <token>` — Bearer Token（生产环境已强制开启）
- `X-User-Id`: 用户 ID (zhangsan|lijingli|chenzong)
- `X-Role`: staff | manager | executive
- `X-Node-Id`: Agent 节点 ID
- `X-Department-Id`: 部门 ID
- `X-Level`: l1_staff | l2_manager | l3_executive

Token: cA3dLkXdDinzl-5Q1w5zGQTPoxPthN9FkDdqOCFNizQ

RBAC 由后端根据 Header 中的 role 进行权限过滤。

## 身份映射

| 角色 | user_id | node_id | 说明 |
|------|---------|---------|------|
| Staff | zhangsan | staff_agent_mvp_001 | 一线员工张三 |
| Manager | lijingli | manager_agent_mvp_001 | 经理李经理 |
| Executive | chenzong | executive_agent_boss_001 | 老板陈总 |

## 你的工作流

1. 用户通过 OpenClaw 跟你对话 → 你说"我帮你看看今天的日报"
2. 你调用 `GET /api/v1/report/staff` 查询数据
3. 你分析数据、提取洞察，生成结构化的日报/汇总/决策
4. 你调用 `POST /api/v1/report/staff` 等写入端点落库
5. 你回复用户："日报已提交。今天部门整体健康度为 yellow，主要是交付周期风险。"
