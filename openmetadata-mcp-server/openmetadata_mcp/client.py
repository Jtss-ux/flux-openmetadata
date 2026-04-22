"""OpenMetadata API client."""

import httpx
from typing import Any, Optional
from openmetadata_mcp.config import ServerConfig


class OpenMetadataClient:
    """Client for interacting with OpenMetadata APIs."""

    def __init__(self, config: ServerConfig):
        self.config = config
        self._client = httpx.AsyncClient(
            base_url=config.base_url,
            timeout=config.timeout,
            headers=self._get_headers(),
        )

    def _get_headers(self) -> dict[str, str]:
        """Get HTTP headers for API requests."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.config.auth_token:
            headers["Authorization"] = f"Bearer {self.config.auth_token}"
        return headers

    async def search(self, query: str, limit: int = 10) -> dict[str, Any]:
        """Search for entities in OpenMetadata."""
        response = await self._client.get(
            "/search/query",
            params={"q": query, "from": 0, "size": limit},
        )
        response.raise_for_status()
        return response.json()

    async def get_entity(
        self,
        entity_type: str,
        fqn: str,
        fields: Optional[str] = None,
    ) -> dict[str, Any]:
        """Get a specific entity by fully qualified name."""
        params = {"include": "all"}
        if fields:
            params["fields"] = fields

        response = await self._client.get(
            f"/{entity_type}/name/{fqn}",
            params=params,
        )
        response.raise_for_status()
        return response.json()

    async def get_lineage(
        self,
        entity_type: str,
        fqn: str,
        direction: str = "both",
    ) -> dict[str, Any]:
        """Get lineage for an entity."""
        response = await self._client.get(
            f"/lineage/{entity_type}/name/{fqn}",
            params={"upstreamDepth": 2, "downstreamDepth": 2},
        )
        response.raise_for_status()
        return response.json()

    async def get_table_tests(self, fqn: str) -> dict[str, Any]:
        """Get data quality tests for a table."""
        response = await self._client.get(
            f"/dataQuality/testCases",
            params={"entityLink": f"<#E::table::{fqn}>", "limit": 50},
        )
        response.raise_for_status()
        return response.json()

    async def list_pipelines(self, status: Optional[str] = None, limit: int = 10) -> dict[str, Any]:
        """List ingestion pipelines with optional status filter."""
        params = {"limit": limit}
        if status and status != "all":
            params["pipelineStatus"] = status

        response = await self._client.get("/ingestionPipelines", params=params)
        response.raise_for_status()
        return response.json()

    async def get_policy(self, name: Optional[str] = None) -> dict[str, Any]:
        """Get governance policies."""
        if name:
            response = await self._client.get(f"/policy/name/{name}")
        else:
            response = await self._client.get("/policy", params={"limit": 20})
        response.raise_for_status()
        return response.json()

    async def get_table_profile(self, fqn: str) -> dict[str, Any]:
        """Get table profile statistics."""
        response = await self._client.get(f"/table/name/{fqn}/profile")
        response.raise_for_status()
        return response.json()

    async def close(self):
        """Close the HTTP client."""
        await self._client.aclose()

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
