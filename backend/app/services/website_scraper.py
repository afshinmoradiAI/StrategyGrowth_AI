from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.core.logging import get_logger

ABOUT_KEYWORDS = ("about", "team", "people", "leadership", "founders", "contact", "staff")
MAX_PAGES = 3
MAX_TEXT_CHARS = 30000
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; GrowthMindBot/0.1; "
        "+https://growthmind.ai/bot)"
    )
}


class WebsiteScraper:
    def __init__(self, timeout: float = 10.0) -> None:
        self.timeout = timeout
        self.logger = get_logger("service.website_scraper")

    async def scrape(self, website_url: str) -> str:
        if not website_url:
            return ""

        normalised = self._normalise(website_url)
        self.logger.info("scrape start url=%s", normalised)

        async with httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True,
            headers=DEFAULT_HEADERS,
        ) as client:
            home_html = await self._fetch(client, normalised)
            if not home_html:
                return ""

            sub_urls = self._find_relevant_links(home_html, normalised)
            texts = [self._extract_text(home_html)]
            for sub_url in sub_urls[: MAX_PAGES - 1]:
                html = await self._fetch(client, sub_url)
                if html:
                    texts.append(self._extract_text(html))

        combined = "\n\n".join(t for t in texts if t).strip()
        truncated = combined[:MAX_TEXT_CHARS]
        self.logger.info(
            "scrape done url=%s pages=%d chars=%d",
            normalised,
            len(texts),
            len(truncated),
        )
        return truncated

    @staticmethod
    def _normalise(url: str) -> str:
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        return url

    async def _fetch(self, client: httpx.AsyncClient, url: str) -> str:
        try:
            response = await client.get(url)
        except httpx.HTTPError as exc:
            self.logger.warning("fetch failed url=%s err=%s", url, exc)
            return ""
        if response.status_code != 200:
            self.logger.warning(
                "fetch non-200 url=%s status=%d", url, response.status_code
            )
            return ""
        content_type = response.headers.get("content-type", "")
        if "html" not in content_type.lower():
            return ""
        return response.text

    @staticmethod
    def _find_relevant_links(html: str, base_url: str) -> list[str]:
        soup = BeautifulSoup(html, "html.parser")
        base_domain = urlparse(base_url).netloc
        candidates: list[tuple[int, str]] = []
        seen: set[str] = set()

        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            absolute = urljoin(base_url, href)
            parsed = urlparse(absolute)
            if parsed.netloc and parsed.netloc != base_domain:
                continue
            url_clean = absolute.split("#")[0]
            if url_clean in seen or url_clean == base_url:
                continue

            text = (a.get_text() or "").lower()
            path = parsed.path.lower()
            score = 0
            for kw in ABOUT_KEYWORDS:
                if kw in path:
                    score += 2
                if kw in text:
                    score += 1
            if score > 0:
                candidates.append((score, url_clean))
                seen.add(url_clean)

        candidates.sort(key=lambda x: -x[0])
        return [url for _, url in candidates]

    @staticmethod
    def _extract_text(html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript", "svg"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return " ".join(text.split())
