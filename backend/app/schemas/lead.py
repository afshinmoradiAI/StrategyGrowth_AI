from pydantic import BaseModel, Field


class LeadCapture(BaseModel):
    email: str = Field(min_length=5, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    user_input: str = Field(min_length=10)


class LeadResponse(BaseModel):
    id: str
    captured: bool = True
