from pydantic import BaseModel, Field


class Competitor(BaseModel):
    name: str
    description: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)


class Source(BaseModel):
    title: str
    url: str | None = None
    note: str | None = None


class ResearchFindings(BaseModel):
    market_overview: str
    competitors: list[Competitor] = Field(default_factory=list)
    trends: list[str] = Field(default_factory=list)
    benchmarks: list[str] = Field(default_factory=list)
    observed_risks: list[str] = Field(default_factory=list)
    sources: list[Source] = Field(default_factory=list)
