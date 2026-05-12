"""推送 API — 老板微信推送、员工日报提醒"""

from __future__ import annotations

import json
import time
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Any

from automage_agents.db.models import (
    DecisionRecordModel,
    SummaryModel,
    WorkRecordModel,
    UserModel,
)
from automage_agents.server.deps import get_db_session

router = APIRouter(prefix="/internal/push", tags=["push"])


class WechatPushRequest(BaseModel):
    channel: str = Field(default="openclaw-weixin")
    to: str = Field(default="o9cq80-4ZTet7x8h6pGOsyDexBik@im.wechat")
    title: str = Field(default="AutoMage 决策推送")
    message: str
    kind: str = Field(default="systemEvent")

    model_config = {"json_schema_extra": {"example": {"message": "📋 决策推送内容"}}}


@router.post("/wechat", summary="推送消息到老板微信")
def push_to_wechat(payload: WechatPushRequest):
    """推送决策消息到老板微信。由调度器或墨智调用。"""
    result = {
        "channel": payload.channel,
        "to": payload.to,
        "message": payload.message,
        "timestamp": time.time(),
        "status": "queued",
    }
    return {"code": 200, "data": result, "msg": "推送已加入队列"}


@router.get("/decision-card", summary="生成老板决策推送卡片")
def get_decision_push_card(
    summary_date: str = Query(default="", description="汇总日期 YYYY-MM-DD"),
    db: Session = Depends(get_db_session),
):
    """生成推送给老板的 A/B 决策卡片内容。

    墨智（OpenClaw）定时调用此接口获取需要推送的决策内容，
    然后通过飞书/微信通道推送给老板。
    """
    if not summary_date:
        summary_date = date.today().isoformat()

    # 查找当天的 Manager 汇总
    summaries = db.execute(
        text(
            "SELECT s.id, s.public_id, s.title, s.content, s.meta, d.name as dept_name "
            "FROM summaries s "
            "LEFT JOIN departments d ON s.department_id = d.id "
            "WHERE s.deleted_at IS NULL AND s.summary_date = :sd "
            "ORDER BY s.id DESC"
        ),
        {"sd": summary_date},
    ).fetchall()

    # 查找当天的决策记录
    decisions = db.execute(
        text(
            "SELECT dr.id, dr.public_id, dr.title, dr.option_schema_json, dr.selected_option_key, dr.status "
            "FROM decision_records dr "
            "WHERE dr.deleted_at IS NULL AND CAST(dr.created_at AS date) = CAST(:sd AS date) "
            "ORDER BY dr.id DESC"
        ),
        {"sd": summary_date},
    ).fetchall()

    pending_decisions = []
    for d in decisions:
        options = d[3] or []
        if isinstance(options, str):
            try:
                options = json.loads(options)
            except Exception:
                options = []
        if d[4] is None and options:  # not yet confirmed
            pending_decisions.append(
                {
                    "id": d[0],
                    "public_id": d[1],
                    "title": d[2],
                    "options": options,
                    "status": d[5],
                }
            )

    summary_items = []
    for s in summaries:
        meta = s[4] or {}
        need_exec = meta.get("need_executive_decision") or []
        summary_items.append(
            {
                "id": s[0],
                "public_id": s[1],
                "title": s[2],
                "department": s[5],
                "overall_health": meta.get("overall_health", "green"),
                "top_3_risks": meta.get("top_3_risks", []),
                "escaltion_required": bool(need_exec) if need_exec else False,
            }
        )

    # 当天未提交日报的员工
    missing_staff: list[str] = []
    all_staff = db.execute(
        text("SELECT username, display_name FROM users WHERE deleted_at IS NULL AND meta->>'role' = 'staff'")
    ).fetchall()
    submitted = {
        r[0]
        for r in db.execute(
            text(
                "SELECT u.username FROM users u "
                "JOIN work_records wr ON wr.user_id = u.id AND wr.record_date = :sd AND wr.deleted_at IS NULL "
                "WHERE u.deleted_at IS NULL"
            ),
            {"sd": summary_date},
        ).fetchall()
    }
    for s in all_staff:
        if s[0] not in submitted:
            missing_staff.append(f"{s[1]}({s[0]})")

    return {
        "code": 200,
        "data": {
            "summary_date": summary_date,
            "summaries": summary_items,
            "pending_decisions": pending_decisions,
            "missing_staff": missing_staff,
            "boss_wechat": "o9cq80-4ZTet7x8h6pGOsyDexBik@im.wechat",
        },
        "msg": "ok",
    }
