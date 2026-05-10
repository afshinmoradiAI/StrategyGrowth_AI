from typing import Literal

from pydantic import BaseModel, Field

Severity = Literal["low", "medium", "high"]


class Risk(BaseModel):
    id: str
    description: str
    category: str
    likelihood: Severity
    impact: Severity
    mitigation: str
    owner: str | None = None


class RiskRegister(BaseModel):
    risks: list[Risk] = Field(default_factory=list)
