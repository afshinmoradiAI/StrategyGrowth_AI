import asyncio

from app.agents import ContentAgent, ImagePromptAgent
from app.core.logging import get_logger
from app.schemas.content import (
    ContentRequest,
    ContentResponse,
    DraftPost,
    ImagePromptInput,
    PlatformPost,
)


class ContentOrchestrator:
    def __init__(
        self,
        content_agent: ContentAgent | None = None,
        image_prompt_agent: ImagePromptAgent | None = None,
    ) -> None:
        self.content_agent = content_agent or ContentAgent()
        self.image_prompt_agent = image_prompt_agent or ImagePromptAgent()
        self.logger = get_logger("orchestrator.content")

    async def run(self, request: ContentRequest) -> ContentResponse:
        self.logger.info("orchestrator start topic=%r", request.topic)

        drafts = await self.content_agent.run(request)
        self.logger.info("drafts received count=%d", len(drafts.posts))

        image_results = await asyncio.gather(
            *(self._image_for(draft, request.topic) for draft in drafts.posts)
        )

        posts = [
            PlatformPost(
                platform=draft.platform,
                content=draft.content,
                hashtags=draft.hashtags,
                image_prompt=image.prompt,
                image_negative_prompt=image.negative_prompt,
                image_aspect_ratio=image.aspect_ratio,
            )
            for draft, image in zip(drafts.posts, image_results, strict=True)
        ]
        self.logger.info("orchestrator done count=%d", len(posts))
        return ContentResponse(topic=request.topic, posts=posts)

    async def _image_for(self, draft: DraftPost, topic: str):
        return await self.image_prompt_agent.run(
            ImagePromptInput(
                platform=draft.platform,
                post_content=draft.content,
                topic=topic,
            )
        )
