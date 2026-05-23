from app.core.growth_base_agent import BaseAgent
from app.schemas.content import ContentRequest, DraftPosts


class ContentAgent(BaseAgent[ContentRequest, DraftPosts]):
    name = "content_agent"
    output_model = DraftPosts

    def build_user_message(self, payload: ContentRequest) -> str:
        platforms = ", ".join(p.value for p in payload.platforms)
        lines = [
            f"Topic: {payload.topic}",
            f"Platforms: {platforms}",
            f"Tone: {payload.tone.value}",
        ]
        if payload.audience:
            lines.append(f"Audience: {payload.audience}")
        if payload.call_to_action:
            lines.append(f"Call to action: {payload.call_to_action}")
        lines.append(
            "\nGenerate one post per platform listed above and submit via the tool."
        )
        return "\n".join(lines)
