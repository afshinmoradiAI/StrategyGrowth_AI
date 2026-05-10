from pydantic import BaseModel, Field


class Task(BaseModel):
    id: str
    title: str
    description: str
    estimate: str | None = None
    dependencies: list[str] = Field(default_factory=list)


class Milestone(BaseModel):
    id: str
    title: str
    target: str
    tasks: list[Task] = Field(default_factory=list)


class Phase(BaseModel):
    id: str
    name: str
    duration: str
    objective: str
    milestones: list[Milestone] = Field(default_factory=list)


class KPI(BaseModel):
    name: str
    target: str
    measurement: str


class Roadmap(BaseModel):
    phases: list[Phase] = Field(default_factory=list)
    kpis: list[KPI] = Field(default_factory=list)
