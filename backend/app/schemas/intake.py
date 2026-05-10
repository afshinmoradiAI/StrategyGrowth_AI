from pydantic import BaseModel, Field


class IntakeRequest(BaseModel):
    user_input: str = Field(
        min_length=10,
        description="Free-text description of the project the user wants to plan.",
    )


class Stakeholder(BaseModel):
    role: str
    interest: str


class ProjectBrief(BaseModel):
    project_name: str
    domain: str
    summary: str
    goals: list[str] = Field(default_factory=list)
    target_audience: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(default_factory=list)
    timeline: str | None = None
    budget: str | None = None
    stakeholders: list[Stakeholder] = Field(default_factory=list)
    open_questions: list[str] = Field(
        default_factory=list,
        description="Things the user did not specify and should clarify before planning.",
    )


class IntakeResponse(BaseModel):
    brief: ProjectBrief
