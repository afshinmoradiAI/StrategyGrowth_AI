from app.core.base_agent import BaseAgent
from app.schemas.intake import ProjectBrief
from app.schemas.research import ResearchFindings


class ResearchAgent(BaseAgent[ProjectBrief, ResearchFindings]):
    name = "research"
    prompt_name = "research"
    input_model = ProjectBrief
    output_model = ResearchFindings

    server_tools = [
        {
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 5,
        }
    ]

    def _user_message(self, inp: ProjectBrief) -> str:
        return (
            "Research the market context for this project brief, then submit "
            "structured findings.\n\nProject brief:\n"
            f"{inp.model_dump_json(indent=2)}"
        )
