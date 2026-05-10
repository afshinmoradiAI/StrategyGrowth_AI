from pydantic import BaseModel

from app.schemas.intake import ProjectBrief
from app.schemas.plan import Roadmap
from app.schemas.research import ResearchFindings
from app.schemas.risk import RiskRegister
from app.schemas.strategy import Strategy


class StrategyInput(BaseModel):
    brief: ProjectBrief
    research: ResearchFindings


class PlanInput(BaseModel):
    brief: ProjectBrief
    strategy: Strategy


class RiskInput(BaseModel):
    brief: ProjectBrief
    strategy: Strategy


class PlanResult(BaseModel):
    brief: ProjectBrief
    research: ResearchFindings
    strategy: Strategy
    roadmap: Roadmap
    risks: RiskRegister
