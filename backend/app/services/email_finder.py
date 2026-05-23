import re
from urllib.parse import urlparse

import dns.asyncresolver
import dns.exception

from app.core.logging import get_logger

GENERIC_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
}


class EmailFinder:
    def __init__(self, dns_timeout: float = 3.0) -> None:
        self.dns_timeout = dns_timeout
        self.logger = get_logger("service.email_finder")
        self._resolver = dns.asyncresolver.Resolver()
        self._resolver.lifetime = dns_timeout
        self._resolver.timeout = dns_timeout

    @staticmethod
    def extract_domain(website_url: str | None) -> str | None:
        if not website_url:
            return None
        url = website_url.strip()
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        host = urlparse(url).netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        if not host or "." not in host or host in GENERIC_DOMAINS:
            return None
        return host

    @staticmethod
    def generate_candidates(full_name: str, domain: str) -> list[str]:
        if not full_name or not domain:
            return []
        parts = [p for p in re.split(r"\s+", full_name.strip()) if p]
        parts = [re.sub(r"[^a-zA-Z\-]", "", p).lower() for p in parts]
        parts = [p for p in parts if p]
        if not parts:
            return []

        first = parts[0]
        last = parts[-1] if len(parts) > 1 else ""

        patterns: list[str] = []
        if last:
            patterns.extend(
                [
                    f"{first}@{domain}",
                    f"{first}.{last}@{domain}",
                    f"{first[0]}{last}@{domain}",
                    f"{first}{last}@{domain}",
                    f"{first}_{last}@{domain}",
                    f"{last}.{first}@{domain}",
                ]
            )
        else:
            patterns.append(f"{first}@{domain}")

        seen: set[str] = set()
        ordered: list[str] = []
        for p in patterns:
            if p not in seen:
                seen.add(p)
                ordered.append(p)
        return ordered

    async def verify_domain(self, domain: str) -> bool:
        try:
            answers = await self._resolver.resolve(domain, "MX")
        except (dns.exception.DNSException, OSError) as exc:
            self.logger.info("mx lookup failed domain=%s err=%s", domain, exc)
            return False
        return len(list(answers)) > 0
