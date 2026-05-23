from enum import Enum

from pydantic import BaseModel, Field


class Platform(str, Enum):
    x = "x"
    linkedin = "linkedin"
    instagram = "instagram"
    facebook = "facebook"
    tiktok = "tiktok"


class Tone(str, Enum):
    professional = "professional"
    casual = "casual"
    inspirational = "inspirational"
    humorous = "humorous"
    educational = "educational"


class ContentRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=500)
    platforms: list[Platform] = Field(..., min_length=1)
    tone: Tone = Tone.professional
    audience: str | None = Field(default=None, max_length=200)
    call_to_action: str | None = Field(default=None, max_length=200)


class DraftPost(BaseModel):
    platform: Platform
    content: str
    hashtags: list[str] = Field(default_factory=list)


class DraftPosts(BaseModel):
    posts: list[DraftPost]


class ImagePromptInput(BaseModel):
    platform: Platform
    post_content: str
    topic: str


class ImagePromptOutput(BaseModel):
    prompt: str
    negative_prompt: str | None = None
    aspect_ratio: str


class PlatformPost(BaseModel):
    platform: Platform
    content: str
    hashtags: list[str]
    image_prompt: str
    image_negative_prompt: str | None = None
    image_aspect_ratio: str


class ContentResponse(BaseModel):
    topic: str
    posts: list[PlatformPost]
