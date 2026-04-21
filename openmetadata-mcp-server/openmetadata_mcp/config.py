"""Server configuration for OpenMetadata MCP."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class ServerConfig:
    """Configuration for the OpenMetadata MCP server."""

    host: str = "http://localhost:8585"
    api_version: str = "v1"
    auth_token: Optional[str] = None
    timeout: int = 30

    @property
    def base_url(self) -> str:
        """Get the base URL for API requests."""
        return f"{self.host}/api/{self.api_version}"