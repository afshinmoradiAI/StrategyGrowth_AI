from pydantic import BaseModel, Field


class Objective(BaseModel):
    objective: str
    rationale: str


class Strategy(BaseModel):
    positioning: str
    value_propositions: list[str] = Field(default_factory=list)
    differentiators: list[str] = Field(default_factory=list)
    objectives: list[Objective] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
