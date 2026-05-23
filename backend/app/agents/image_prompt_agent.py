from app.core.growth_base_agent import BaseAgent
from app.schemas.content import ImagePromptInput, ImagePromptOutput


class ImagePromptAgent(BaseAgent[ImagePromptInput, ImagePromptOutput]):
    name = "image_prompt_agent"
    output_model = ImagePromptOutput

    def build_user_message(self, payload: ImagePromptInput) -> str:
        return (
            f"Platform: {payload.platform.value}\n"
            f"Topic: {payload.topic}\n"
            f"Post content:\n{payload.post_content}\n\n"
            "Generate one image prompt that visually matches this post and "
            "submit via the tool."
        )
