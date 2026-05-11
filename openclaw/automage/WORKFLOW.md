# 墨智工作流程手册

> 全链路闭环文档详见 [FULL_FLOW.md](./FULL_FLOW.md)

---

## 三个核心原则

1. **全流程在一会话内串行执行**——不拆到多个独立会话
2. **推送 = 只转发，不分析**——隔离 Agent 无权启动自主流程
3. **日期由第一步决定**——不依赖系统时间

---

## 日报处理流程

当你收到类似"今天完成了X，遇到了Y问题..."的自然语言消息时：

1. 理解文本含义
2. 提取结构化字段：
   - work_progress: 核心工作内容
   - issues_faced: 遇到的问题（数组）
   - solution_attempt: 尝试的解决方案
   - need_support: 是否需要领导支持（bool）
   - next_day_plan: 明日计划
   - risk_level: low/medium/high/critical
   - resource_usage: 资源消耗（可选 object）
3. 构造 POST /api/v1/report/staff 请求体（详见 FULL_FLOW.md Step 1）
4. 携带 Staff 身份头 (X-Role: staff, X-User-Id: zhangsan) 发送请求
5. 确认 200 返回后回复用户

## 部门汇总流程

详见 FULL_FLOW.md Step 2-3。关键点：

- 用 Manager 身份（lijingli）查询和提交
- 需要上传推标记（escalation_required）当存在高风险时
- top_3_risks 必须是最严重的三个，不要超过三个

## Dream 决策流程

详见 FULL_FLOW.md Step 4。关键点：

- 用 Executive 身份（chenzong）调用
- 返回的两个选项可能包含建议的 task_candidates，可复用
- 用于后续的决策提交

## WeChat 推送流程

详见 FULL_FLOW.md「WeChat 推送规范」。核心约束：

- ⚠️ 不要用 `payload.kind: "agentTurn"` 的 isolation Agent 做"转发"
- ⚠️ 推送内容的 AI prompt 必须强制约束：**只输出固定内容，不分析、不查询、不执行任何额外操作**
- delivery.to 用老板的微信用户 ID（`o9cq80-...` 格式）

## 决策提交与任务下发流程

详见 FULL_FLOW.md Step 5。关键点：

- 老板确认方案后，用 Executive 身份提交决策
- task_candidates 可以复用 Dream 返回的建议，也可以自定义
- 提交后后端会自动创建任务并返回 task_ids

## 错误处理

| 异常 | 含义 | 处理方式 |
|------|------|---------|
| 409 Conflict | 重复提交 | 查询已有记录，告知用户已存在 |
| 403 Forbidden | 权限不足 | 检查当前 X-Role / X-User-Id 是否正确 |
| 422 Validation Error | 字段不合法 | 根据 error detail 修正 |
| 5xx | 后端故障 | 记录问题到 memory，告知用户稍后重试 |
