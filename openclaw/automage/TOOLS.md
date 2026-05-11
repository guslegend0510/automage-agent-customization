# 墨智的 AutoMage 工具集

这些工具让你直接操作 AutoMage 后端 API。每个工具对应一个业务操作。

## 使用方式

调用时用 curl 直接请求 `http://localhost:8080` 上的对应端点。
请求头必须携带身份信息：

```
Authorization: Bearer cA3dLkXdDinzl-5Q1w5zGQTPoxPthN9FkDdqOCFNizQ
X-Role: staff|manager|executive
X-User-Id: zhangsan|lijingli|chenzong
X-Node-Id: staff_agent_mvp_001|manager_agent_mvp_001|executive_agent_boss_001
X-Department-Id: dept_mvp_core
X-Level: l1_staff|l2_manager|l3_executive
```

---

## Staff 工具

### submit_staff_report
提交员工日报。调用 POST /api/v1/report/staff

身份要求: staff (X-Actor-Role: staff)
```json
{
  "identity": {
    "node_id": "staff_agent_mvp_001",
    "user_id": "zhangsan",
    "role": "staff",
    "level": "l1_staff",
    "department_id": "dept_mvp_core",
    "manager_node_id": "manager_agent_mvp_001"
  },
  "report": {
    "schema_id": "schema_v1_staff",
    "org_id": "org_automage_mvp",
    "department_id": "dept_mvp_core",
    "user_id": "zhangsan",
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

### fetch_my_tasks
查询当前用户的任务。调用 GET /api/v1/tasks?assignee_user_id=<user_id>

身份要求: staff

---

## Manager 工具

### read_department_reports
读取本部门 Staff 日报。调用 GET /api/v1/report/staff?department_id=dept_mvp_core&record_date=<date>

身份要求: manager

### submit_manager_summary
提交部门汇总。调用 POST /api/v1/report/manager

身份要求: manager (X-Actor-Role: manager)
```json
{
  "identity": {
    "node_id": "manager_agent_mvp_001",
    "user_id": "lijingli",
    "role": "manager",
    "level": "l2_manager",
    "department_id": "dept_mvp_core",
    "manager_node_id": "executive_agent_boss_001"
  },
  "report": {
    "schema_id": "schema_v1_manager",
    "org_id": "org_automage_mvp",
    "dept_id": "dept_mvp_core",
    "manager_user_id": "lijingli",
    "summary_date": "2026-05-11",
    "overall_health": "green|yellow|red",
    "aggregated_summary": "...",
    "top_3_risks": [],
    "workforce_efficiency": 0.82,
    "pending_approvals": 0,
    "source_record_ids": []
  }
}
```

### delegate_task
创建/分配任务。调用 POST /api/v1/tasks

身份要求: manager

---

## Executive 工具

### run_dream_decision
基于经理汇总生成 A/B 决策。调用 POST /internal/dream/run

身份要求: executive (X-Actor-Role: executive)
```json
{
  "summary_id": "SUM-..."
}
```

### commit_decision
确认决策并下发任务。调用 POST /api/v1/decision/commit

身份要求: executive
```json
{
  "identity": {
    "node_id": "executive_agent_boss_001",
    "user_id": "chenzong",
    "role": "executive",
    "level": "l3_executive"
  },
  "decision": {
    "selected_option_id": "A",
    "decision_summary": "...",
    "task_candidates": [{
      "task_id": "TASK-...",
      "assignee_user_id": "zhangsan",
      "title": "...",
      "description": "...",
      "status": "pending",
      "priority": "high"
    }]
  }
}
```

---

## 工作流

标准的三层流转：

1. 收到员工自然语言日报
2. 你(墨智)理解文本，提取结构化字段
3. 用 submit_staff_report 写入
4. 定期用 read_department_reports 读部门数据
5. 分析后生成汇总 → submit_manager_summary
6. 基于汇总生成 A/B 方案 → run_dream_decision
7. 等老板人工确认 → commit_decision
8. 新任务自动创建 → 通知对应员工
