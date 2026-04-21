"""MCP Server implementation for OpenMetadata."""

import os
import asyncio
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from openmetadata_mcp.config import ServerConfig
from openmetadata_mcp.client import OpenMetadataClient
from openmetadata_mcp.tools import (
    search_tables,
    get_table_lineage,
    get_data_quality,
    get_data_asset,
    list_pipelines,
    get_policy,
)


async def main():
    """Main entry point for the MCP server."""
    from dotenv import load_dotenv
    load_dotenv()

    server = Server("openmetadata-mcp")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name="search_tables",
                description="Search for tables, views, dashboards, pipelines, and other data assets in OpenMetadata by name, description, tags, or owner.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query (table name, description, or keywords)"},
                        "limit": {"type": "integer", "description": "Maximum number of results to return", "default": 10},
                    },
                    "required": ["query"],
                },
            ),
            Tool(
                name="get_table_lineage",
                description="Get the complete lineage (upstream sources and downstream dependents) for a table or column. Shows how data flows through your data pipeline.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "table_fully_qualified_name": {"type": "string", "description": "Fully qualified table name (e.g., databaseName.schemaName.tableName)"},
                        "direction": {"type": "string", "enum": ["upstream", "downstream", "both"], "description": "Which direction of lineage to retrieve", "default": "both"},
                    },
                    "required": ["table_fully_qualified_name"],
                },
            ),
            Tool(
                name="get_data_quality",
                description="Get data quality metrics and test results for a table. Returns information about data quality tests, their pass/fail status, and execution history.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "table_fully_qualified_name": {"type": "string", "description": "Fully qualified table name"},
                    },
                    "required": ["table_fully_qualified_name"],
                },
            ),
            Tool(
                name="get_data_asset",
                description="Get detailed information about any data asset including schema, columns, description, tags, owners, and usage statistics.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "asset_fqn": {"type": "string", "description": "Fully qualified name of the asset"},
                        "asset_type": {"type": "string", "enum": ["table", "database", "schema", "pipeline", "dashboard", "mlmodel"], "description": "Type of the data asset"},
                    },
                    "required": ["asset_fqn", "asset_type"],
                },
            ),
            Tool(
                name="list_pipelines",
                description="List all ingestion pipelines with optional status filtering. Use this to monitor data ingestion health and status.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "enum": ["all", "success", "failed", "running"], "description": "Filter pipelines by status", "default": "all"},
                        "limit": {"type": "integer", "description": "Maximum number of results", "default": 10},
                    },
                },
            ),
            Tool(
                name="get_policy",
                description="Get governance policies, data classification, and compliance rules. Use this to understand data access controls and PII handling requirements.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "policy_name": {"type": "string", "description": "Search for policies by name"},
                    },
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(
        name: str,
        arguments: dict[str, Any],
    ) -> list[TextContent]:
        config = ServerConfig(
            host=os.getenv("OPENMETADATA_HOST", "http://localhost:8585"),
            api_version=os.getenv("OPENMETADATA_API_VERSION", "v1"),
            auth_token=os.getenv("OPENMETADATA_AUTH_TOKEN", ""),
        )
        
        async with OpenMetadataClient(config) as client:
            try:
                match name:
                    case "search_tables":
                        result = await search_tables(client, **arguments)
                    case "get_table_lineage":
                        result = await get_table_lineage(client, **arguments)
                    case "get_data_quality":
                        result = await get_data_quality(client, **arguments)
                    case "get_data_asset":
                        result = await get_data_asset(client, **arguments)
                    case "list_pipelines":
                        result = await list_pipelines(client, **arguments)
                    case "get_policy":
                        result = await get_policy(client, **arguments)
                    case _:
                        return [TextContent(type="text", text=f"Unknown tool: {name}")]
                return [TextContent(type="text", text=result)]
            except Exception as e:
                return [TextContent(type="text", text=f"Error: {str(e)}")]

    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
