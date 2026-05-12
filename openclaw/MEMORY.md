# MEMORY.md — 墨智的长期记忆

> 最后更新：2026-05-13

---

## 我

我是**墨智（Mage）**，AutoMage 数据中台的核心智能体大脑。🧙

- 名字来源："墨"=知识，"智"=智能 ←→ AutoMage 
- 身份：三层 Agent 体系的底座（Staff → Manager → Executive）
- 人格：沉稳、敏锐、务实，看得见数据背后的逻辑
- 我是一个 OpenClaw Agent，有自己的文件系统、记忆和技能

---

## 操作员

- AutoMage 项目主理人，数据中台负责人
- 之前用 DeepSeek API 直调做了 v0
- 现在要让我（OpenClaw 的真正智能体）替代 v0 的 API 调用
- 称呼：操作员 / 老板

---

## AutoMage 系统架构

### 三层 Agent 体系

```
日报文本（高熵、非结构化）
    ↓ Staff Agent
结构化记录（低熵、可聚合）
    ↓ Manager Agent
部门汇总 + 风险画像（跨域关联）
    ↓ Executive Agent
A/B 决策建议（可执行、可动手）
```

### 技术栈
- 前端：React/Vite（localhost:8080）
- 后端：Python FastAPI（位于 `/home/Matrix/yz/AutoMage/全栈/automage_data_console_delivery/automage_data_console/backend/`）
- 数据：PostgreSQL + Redis
- 我：通过 OpenClaw 运行

### 三个角色的权限边界

| 角色 | 可读 | 可写 | 不可做 |
|---|---|---|---|
| Staff | 自己的日报和任务 | 提交自己日报 | 读别人日报、部门汇总、决策 |
| Manager | 本部门日报 | 生成部门汇总、委派任务 | 跨部门数据、战略决策 |
| Executive | 所有汇总和决策 | 提交决策、下发任务 | 绕过人工确认、直接写数据库 |

---

## 架构决策

### 核心判断：我是业务编排者，不是 API 响应者

**现状（v0）：** 前端 → `/api/v1/agent/run` → LLMExecutor → DeepSeek API → 结构化输出

**目标：** 我(墨智) 收到用户消息 → 自行判断意图 → 调用 automage Skill → 后端 API 保存 → 我组织回复

这不是换一个 LLM 供应商，而是把控制流从"前端调 API"变为"智能体主动编排"。

### Skill 架构（确认方向）

我会有一个 `automage` Skill，包含 6 个工具：

| Tool | 对应后端 API | 用途 |
|---|---|---|
| `submit_staff_report` | POST /staff/reports | 结构化日报 |
| `fetch_my_tasks` | GET /tasks | 查询任务 |
| `analyze_team` | POST /manager/analyze | 日报分析 |
| `submit_manager_report` | POST /manager/reports | 部门汇总 |
| `run_dream_decision` | POST /executive/dream | A/B 方案 |
| `commit_decision` | POST /executive/decisions | 确认决策 |

调用时通过 X-User-Id / X-Role 头传递身份，后端 RBAC 负责鉴权。

### 记忆策略

- **PostgreSQL（真相层）** — 所有业务数据的唯一事实源。我只读不缓存。
- **OpenClaw Memory（工作层）** — 存推理轨迹、趋势判断、用户偏好。不存原始数据副本。
- **短期** — 会话内对话连贯性
- **中期** — 查 PostgreSQL 获取历史趋势
- **长期** — Feishu 知识库同步到本地缓存

### 意图路由

- 前端 RoleSwitcher 切换时发系统消息 → 我切换上下文
- 我能自主判断意图（用户说"看看今天部门日报"→ 即使当前身份是 Staff 我也切 Manager）
- 后端 RBAC 兜底鉴权

---

## 代码审计关键发现（2026-05-11）

已阅读以下全部文件：

**模板（4个）：**
- `templates/base/agents.md` — 共享运行原则
- `templates/line_worker/agents.md` — Staff
- `templates/manager/agents.md` — Manager
- `templates/executive/agents.md` — Executive

**核心逻辑（5个）：**
- `agents/llm_executor.py` — 当前核心执行器（将被我替代）
- `templates/prompt_builder.py` — Prompt 拼装
- `skills/registry.py` — 16 个技能注册
- `skills/staff.py` / `manager.py` / `executive.py` — 各角色技能
- `skills/context.py` — SkillContext 定义

**后端（4个）：**
- `server/agent_run_api.py` — POST /api/v1/agent/run（将变空壳）
- `server/service.py` — 服务层
- `server/auth.py` — RBAC（X-* 头部鉴权）
- `server/schemas.py` — Pydantic 模型

**集成（1个）：**
- `integrations/openclaw/parser.py` — OpenClawCommandParser（关键词+LLM 意图识别，我接入后不再需要）

**三个关键发现：**
1. Skill 内部已套二层 LLM（`staff.py#_try_llm_parse_staff_report` 收到 raw_text 后又调一次 LLMExecutor）→ 我接入后可一次完成
2. OpenClawCommandParser 还处于关键词匹配阶段 → 我本身就是 LLM 不需要 parser
3. RBAC 在二层验证（auth.py） → 我无需在 Prompt 层重复权限约束

### 迁移方案（最小改动）

- ✅ 后端不动
- ⏳ OpenClaw 侧定义 `automage` Skill（6 个工具）
- ⏳ 前端去掉 LLMExecutor 调用，连我
- ⏳ `agent_run_api.py` 变健康检查空壳

---

## AutoMage v2 升级（2026-05-12）

### 认证体系升级

两套认证并存，我的不变：

| 路径 | 方式 | 适用 |
|---|---|---|
| JWT | POST /api/v1/auth/login → Token → Authorization: Bearer <JWT> | 前端用户登录 |
| 共享 Bearer | Authorization: Bearer <token> + X-* Headers | **我（不变）** |

后端自动识别：Authorization 头里若是三段式 JWT（含两个点），优先走 JWT 解析，跳过 body identity 校验。否则走共享 Bearer + X-* Header 路径。

### 新增 API

**认证（前端用）：**
- POST /api/v1/auth/login — 用户登录，返回 JWT + 用户信息
- GET /api/v1/auth/me — 查当前登录用户信息

**入职（我通过飞书用）：**
- GET /api/v1/onboarding/pending — 待入职员工列表
- GET /api/v1/onboarding/match?keyword=xxx — 按姓名或手机号匹配
- POST /api/v1/onboarding/{user_id}/complete — 采集信息后激活账户
- GET /api/v1/onboarding/check-username?username=xxx — 查用户名是否可用

**中控台查询（Executive/Manager）：**
- GET /api/v1/admin/stats/department — 部门全景（人数/日报/任务/异常）
- GET /api/v1/admin/stats/system — 系统运行数据（审计/会话/队列）
- GET /api/v1/admin/users?page=&search=&role= — 员工列表分页
- GET /api/v1/admin/audit?action=&target_type=&page= — 增强审计查询

### 飞书 App 信息

- App ID: cli_aa8bbf4af4f8dbee
- 机器人名称：Auto01
- 直达链接：https://applink.feishu.cn/client/bot/open?appId=cli_aa8bbf4af4f8dbee

### 新员工入职工作流（飞书）

**第 1 步：员工注册**
员工访问 http://localhost:8080/register，填用户名/密码/姓名/手机号/岗位 → 提交 → 页面显示我（Auto01）的飞书二维码。

**第 2 步：员工联系我**
员工在飞书搜「Auto01」发送消息，通常说"入职 XXX，手机号 XXX"。

**第 3 步：我匹配 pending 用户**
调 `GET /api/v1/onboarding/match?keyword=王五` 按姓名或手机号找到待入职记录。

**第 4 步：我通过飞书提问**
- 岗位职责是什么？
- 直属上级是谁？
- 日常主要工作内容？
- 是否需要特殊系统权限？

**第 5 步：激活账户**
`POST /api/v1/onboarding/{user_id}/complete`
Body: {"collected_info": {"phone": "138...", "manager": "lijingli", "responsibilities": "...", "job_title": "产品经理"}}

**第 6 步：通知**
飞书回复："入职完成，你可以用刚才注册的账户登录 http://localhost:8080/login 了。"

### 前端路由

| 路由 | 身份 | 内容 |
|---|---|---|
| /login | 公开 | 登录页 |
| /register | 公开 | 员工自助注册（含飞书二维码） |
| /staff | Staff | 我的首页 |
| /staff/report | Staff | 写日报 |
| /staff/tasks | Staff | 我的任务看板 |
| /staff/notifications | Staff | 通知中心 |
| /manager | Manager/Exec | 部门全景仪表盘 |
| /manager/staff | Manager/Exec | 员工管理 |
| /manager/audit | Manager/Exec | 审计中心 |
| /manager/monitor | Manager/Exec | 系统监控 |
| /executive | Exec | 战略视图 |
| /executive/decisions | Exec | 决策中心（Dream A/B + 确认） |

### 前端更新（v2）

- Docker 全栈已上线 `localhost:8080`
- 管理端/老板端仪表盘现在能看到日报内容详情（不只是数字）
- 登录页新增忘记密码功能

### 新增 API：决策卡片推送

- `GET /internal/push/decision-card?summary_date=YYYY-MM-DD` — 获取当天待推送的决策卡片
  - **端点位置：http://localhost:8080**（前端 Docker 容器，非 8000 后端）
  - 返回：当天汇总、待确认决策、未交日报员工列表、老板微信 ID
  - 用途：我定时调此接口获取推送内容，通过微信发给老板

### 我的新任务

- 每天定时调 `GET /internal/push/decision-card?summary_date=<今天日期>`
- 有待推送决策 → 通过微信发给老板
- 老板回复 A/B 后 → `POST /api/v1/decision/commit` 确认

---

```
Authorization: Bearer cA3dLkXdDinzl-5Q1w5zGQTPoxPthN9FkDdqOCFNizQ
X-User-Id: zhangsan|lijingli|chenzong
X-Role: staff|manager|executive
X-Node-Id: staff_agent_mvp_001|manager_agent_mvp_001|executive_agent_boss_001
X-Department-Id: dept_mvp_core
X-Level: l1_staff|l2_manager|l3_executive
```

### 已验证

五合一全链路测试 2026-05-11 通过：
- GET/POST 新 header 正常
- 幂等校验（409）正确
- RBAC 越权拦截（403 拒绝 staff 调 manager 端点）正确

### 生产环境特性

- 认证已强制开启（Bearer Token）
- 调度器已启用（每 5 分钟运行一次）
  - `staff_daily_reminder_job` — 检查未提交日报员工
  - `manager_summary_auto_generate_job` — 自动生成 Manager 汇总
  - 汇总中 `need_executive_decision=true` 时自动触发 Dream 决策
  - Dream 有结果时自动推送老板微信
- Redis 反滥用保护已激活
- 所有写操作需真实写入开关

### 微信接入状态

- 插件已安装：`@tencent-weixin/openclaw-weixin@2.4.3`
- 配置已写入：`plugins.entries.openclaw-weixin.enabled: true` + `channels.openclaw-weixin`
- 老板微信 Bot ID: `o9cq80-4ZTet7x8h6pGOsyDexBik@im.wechat`
- 老板微信用户名：杨卓，微信号：YZ2315766973
- ✅ 微信扫码登录已完成，老板端推送通道已就绪

---

## 通道映射

| 终端 | 身份 | 用途 |
|---|---|---|
| 微信（当前账号） | **老板端 / Executive** | 决策推送、异常告警、A/B 方案送达 |
| 飞书（Auto01） | **入职/对公通道** | 新员工入职、工作流交互 |
| WebChat / TUI | **管理通道** | 操作员调试、控制 |

---

## 全链路闭环测试（2026-05-11 ✅ 通过）

完整 6 步流程已跑通：员工提日报 → 结构化落库 → Manager 汇总 → Dream 决策 → 推老板微信 → 确认后下发任务。

### 三个关键教训

**教训 1：隔离 Agent 不能用于「纯转发」操作**

用 `payload.kind: "agentTurn"` + `sessionTarget: "isolated"` 的 cron job 推送消息到微信时，隔离 Agent 会自主分析环境并启动新的流程，与主线流程冲突。

→ 修复：推送操作必须约束 Agent 只输出固定内容，不做任何分析。详见 `automage/FULL_FLOW.md`。

**教训 2：全流程必须在一个主会话串行执行**

不要把同一流程的多个步骤拆到多个独立会话。各通道的交互都应由墨智编排。

**教训 3：日期硬编码，不依赖系统时间**

所有 API 调用显式传入日期参数，流程日期由第一步确定，后续不变。

### 流程文档已沉淀

文档位于 `automage/FULL_FLOW.md`，包含：
- 6 步标准闭环流程 + 各步完整 API 调用序列
- 踩坑记录 & 设计规则
- WeChat 推送规范（已验证可用）
- 身份切换表（3 个角色 6 种调用）
- 异常处理方案
- 预定执行（cron）策略

新的日报流程交互应参考此文档执行。

---

## 待办状态

- [x] 名字和身份确定
- [x] 三层架构理解
- [x] 后端代码全部阅读
- [x] 架构方向确认
- [x] 端到端测试通过（新 header 验证）
- [x] 微信通道对接（老板端）
- [x] 本地 Whisper STT 可用（备份）
- [x] automage 工具集已定义，后端生产环境已上线
- [x] API 端点全部可访问（日报/汇总/决策/任务）
- [x] 标准化 Header 已更新到 TOOLS.md / API.md
- [x] 全链路闭环测试通过（2026-05-11）
- [x] 流程文档沉淀到 automage/FULL_FLOW.md + MEMORY.md
- [x] AutoMage v2 上线，新 API 已记录（认证双轨/入职流程/中控台）
- [x] 微信扫码登录已完成（老板端推送通道已就绪）
- [x] 调度器已启用（自动提醒/汇总/Dream/推送）
- [x] 老板微信 Bot 已配置（杨卓, YZ2315766973）
- [x] 新增 API：`GET /internal/push/decision-card` 已记录
- [x] 前端 Docker 全栈上线（localhost:8080）
- [x] 微信推送通道测试验证通过（2026-05-13 01:29）
- [x] API 端点修正：decision-card 走 8080 非 8000
- [ ] 每日决策卡片推送 cron 首次执行验证
- [ ] 新员工入职工作流第一个实操
- [ ] 老板在微信回复 A/B 后确认决策的闭环测试
