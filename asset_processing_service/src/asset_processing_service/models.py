# src/asset_processing_service/models.py
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class AssetProcessingJob(BaseModel):
    id: str
    thread_id: str
    user_id: str
    todo_kind: Literal["personal", "work"] = "personal"  #  Added Code
    status: Literal[
        "created", "in_progress", "completed", "failed", "max_attempts_exceeded"
    ]
    attempts: int
    last_heartbeat: Optional[datetime] = None
    error_message: Optional[str] = None
    size: int
    message: Optional[str] = None
    last_msg_type: Optional[str] = None  #  Changed Code
    last_msg_content: Optional[str] = None  #  Changed Code
    created_at: datetime
    updated_at: datetime


class Asset(BaseModel):
    id: str
    projectId: str
    title: str
    fileName: str
    fileUrl: str
    fileType: str
    mimeType: str
    size: int
    content: Optional[str]
    tokenCount: int
    createdAt: datetime
    updatedAt: datetime
