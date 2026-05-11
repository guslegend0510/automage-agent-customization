# AutoMage 全链路工作流 v2（已验证通过）

> 最后更新：2026-05-11
> 测试通过：员工日报提交 → 部门汇总 → Dream 决策 → 老板确认 → 任务下发

---

## 🧩 角色与职责

| 角色 | API 身份 | 负责环节 |
|---|----------|---------|
| **员工/Staff** | X-User-Id: zhangsan, X-Role: staff | 提交日报 |
| **Manager Agent** | X-User-Id: lijingli, X-Role: manager | 读日报、生成汇总、创建任务 |
| **Executive Agent** | X-User-Id: chenzong, X-Role: executive | Dream 决策、提交决策、下发任务 |
| **墨智（我）** | 编排者 | 串联全流程，调用各角色 API |

---

## 🔄 标准闭环流程（6步）

```
员工提交日报
    ↓
① 墨智结构化 → POST /api/v1/report/staff   【Staff 身份】
    ↓
② 墨智查日报 → GET /api/v1/report/staff    【Manager 身份】
    ↓
③ 墨智生成汇总 → POST /api/v1/report/manager 【Manager 身份】
    ↓
④ 墨智跑 Dream → POST /internal/dream/run   【Executive 身份】
    ↓
⑤ 墨智推送 A/B 方案到老板微信
    ↓
⑥ 老板确认 → 墨智提交决策 → POST /api/v1/decision/commit 【Executive 身份】
    ↓
   ✅ 任务自动创建 → 通知对应员工
```

---

## ⚠️ 踩坑记录 & 设计规则

### 🕳️ 坑1：WeChat 推送用了隔离 Agent 导致自主分析

**现象：** 我用 cron 推送 A/B 方案时，设了 `sessionTarget: "isolated"` 和 `payload.kind: "agentTurn"`。老板回 "A" 后，**隔离 Agent 自行拉当日数据跑了一遍完整的分析流程**，跟主线流程撞车。

**根因：** 隔离 Agent 没有当前对话上下文，它收到消息"请将以下内容推送给老板"→ 把内容转发后，又自主开始"分析日报"。

**规则：**
- ✅ **推送消息**时，用 `payload.kind: "systemEvent"` 纯事件，不启动隔离 Agent
- ❌ 不要用 `payload.kind: "agentTurn"` 做"转发内容"操作——隔离 Agent 总会分析环境再行动
- ✅ 必须转发的内容，格式化为纯文本放在 delivery 的 summary 字段里

### 🕳️ 坑2：同一流程不能拆成多个独立 Session

**现象：** 员工飞书端和老板微信端是两个独立的通道。如果两边各自启动流程，会生成重复的汇总和决策。

**规则：**
- 全流程必须在**一个主会话**中串行执行（墨智主持）
- 推送只需通知，不授权操作
- 老板端的回复应回到墨智（通过 cron 或 webhook），而不是被隔离 Agent 消费

### 🕳️ 坑3：日期不匹配

**现象：** 日报是 5 月 5 日的，但隔离 Agent 拉了 5 月 11 日的数据。

**规则：**
- 流程数据日期由第一步（员工日报）确定，后续所有步骤用同一日期
- API 调用时显式传入 `record_date` / `summary_date`，不依赖系统时间

---

## 📬 WeChat 推送规范

### 推送流程

```
墨智（主会话）→ 格式化推送内容
    → 创建 cron job (systemEvent, sessionTarget: "isolated")
    → delivery: announce, channel: openclaw-weixin, to: <老板微信ID>
    → 老板在微信收到消息并回复
    → 回复内容通过 cron 回传给主会话
```

### 推送内容格式（微信适配）

```
📋 AutoMage-2 MVP A/B 决策方案

━━━━━━━━━━━━━━━━━━━━━━
来源：<汇总ID>
日期：<日期>

部门健康度：🟡 Yellow

━ 风险 ━━━━━━━━━━━━━━━━
1. 🔴 <风险标题>
2. 🟡 <风险标题>

━ 方案 ━━━━━━━━━━━━━━━━

🅰 方案 A：<标题>
【策略】<策略说明>
【任务】<任务描述>
优先级：🔴 高

🅱 方案 B：<标题>
【策略】<策略说明>
【任务】<任务描述>
优先级：🟡 中

━━━━━━━━━━━━━━━━━━━━━━
请回复 A 或 B 确认选择方案。
```

### production 推送方法（已验证可用）

```typescript
cron.add({
  name: "push-ab-to-boss-wechat",
  schedule: { kind: "at", at: "<ISO 时间>" },
  payload: {
    kind: "agentTurn",
    message: "请将以下内容直接回复出来（作为你的回复内容即可，不需要额外确认或问候）：\n\n<格式化内容>",
    timeoutSeconds: 180
  },
  delivery: {
    mode: "announce",
    channel: "openclaw-weixin",
    to: "<老板微信用户ID>"
  },
  sessionTarget: "isolated",
  deleteAfterRun: true
})
```

**关键点：**
- Agent prompt 必须**强制约束**"只转发内容，不分析"
- 用 `timeoutSeconds: 180` 避免因启动慢超时
- `deleteAfterRun: true` 自动清理

---

## 📋 完整的 API 调用序列

### Step 1：提交员工日报

```
POST /api/v1/report/staff
X-Role: staff
X-User-Id: zhangsan

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
    "record_date": "<日报日期>",
    "work_progress": "...",
    "issues_faced": ["..."],
    "solution_attempt": "...",
    "need_support": bool,
    "support_detail": "...",
    "next_day_plan": "...",
    "risk_level": "low|medium|high|critical",
    "risk_detail": "...",
    "resource_usage": {},
    "need_approval": bool,
    "approval_items": ["..."],
    "key_achievements": "...",
    "key_risks": "...",
    "is_owner_confirmed": true,
    "owner_confirmed_at": "<日期>",
    "work_type": "..."
  }
}
```

### Step 2：读取部门日报

```
GET /api/v1/report/staff?department_id=dept_mvp_core&record_date=<日期>
X-Role: manager
X-User-Id: lijingli
```

### Step 3：提交部门汇总

```
POST /api/v1/report/manager
X-Role: manager
X-User-Id: lijingli

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
    "summary_date": "<日期>",
    "overall_health": "green|yellow|red",
    "aggregated_summary": "...",
    "top_3_risks": ["..."],
    "workforce_efficiency": 0.0-1.0,
    "pending_approvals": int,
    "source_record_ids": ["wr_..."],
    "escalation_required": bool,
    "escalation_reason": "...",
    "escalation_to": ["chenzong"]
  }
}
```

### Step 4：跑 Dream 决策

```
POST /internal/dream/run
X-Role: executive
X-User-Id: chenzong

{
  "summary_id": "SUM-..."
}
```

### Step 5：提交正式决策 + 创建任务

```
POST /api/v1/decision/commit
X-Role: executive
X-User-Id: chenzong

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
    "summary_public_id": "SUM-...",
    "task_candidates": [
      {
        "assignee_user_id": "zhangsan",
        "title": "...",
        "description": "...",
        "status": "pending",
        "priority": "high|medium|low"
      }
    ]
  }
}
```

---

## 🔐 身份切换表

完整的流程需要切换 3 个角色。规则：

| 步骤 | 使用身份 | X-Role | X-User-Id | X-Node-Id |
|------|---------|--------|-----------|----------|
| 提交日报 | Staff | staff | zhangsan | staff_agent_mvp_001 |
| 查日报 | Manager | manager | lijingli | manager_agent_mvp_001 |
| 提交汇总 | Manager | manager | lijingli | manager_agent_mvp_001 |
| Dream 决策 | Executive | executive | chenzong | executive_agent_boss_001 |
| 提交决策 | Executive | executive | chenzong | executive_agent_boss_001 |
| 创建任务 | Manager/Exec | manager | lijingli | manager_agent_mvp_001 |

**常见错误：** 同一个请求用错 X-User-Id → 后端 RBAC 会返回 403

---

## 🤖 机器对机器（静默执行）

当流程被 cron 或 webhook 触发（无人工对话）时：

1. 调用顺序同上，不需要等待用户确认
2. 每个 API 调用的返回数据中包含下个步骤需要的 ID（如 summary_id）
3. 出错时推送告警到 boss 微信通道
4. 正常完成推送执行摘要到 boss 微信通道

---

## 🔄 预定执行与异常处理

### 预定执行（cron）

```yaml
时间: 每天 17:00
动作: 
  1. 查当日员工日报
  2. 如有新日报 → 生成汇总
  3. 如有高风险 → 跑 Dream 决策 → 推老板微信
```

### 异常处理

| 异常 | 处理方式 |
|------|---------|
| 409 Conflict（重复提交） | 查询已有记录，跳过 |
| 403 Forbidden | 检查 X-Role 和 X-User-Id 是否匹配 |
| 422 Validation | 根据错误详情修正字段，重新提交 |
| 5xx 后端故障 | 记录到 memory，下次重试，推异常告警到老板微信 |
| 推送失败 | bestEffort 模式，记录失败不阻塞主流程 |
