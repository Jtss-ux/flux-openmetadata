# OpenMetadata MCP Server

**Track: Paradox #T-01 - MCP Ecosystem & AI Agents**

An MCP (Model Context Protocol) server that brings OpenMetadata's powerful data discovery, lineage, quality monitoring, and governance capabilities to any AI agent or application.

![OpenMetadata](https://openmetadata.org/img/logos/openmetadata-logo.png)

## The Problem

AI agents need access to metadata to intelligently interact with enterprise data — but there's no standard way for them to:
- Discover and search for relevant data assets
- Understand data lineage and dependencies
- Monitor data quality
- Access governance policies and classifications

## Our Solution

An MCP server that exposes OpenMetadata as tools that ANY AI agent can use. Think of it as giving your AI agent a direct line to your data catalog.

## Features

### 6 Powerful MCP Tools

| Tool | Description |
|------|-------------|
| `search_tables` | Search for tables, views, dashboards, pipelines by name, description, tags, or owner |
| `get_table_lineage` | Get complete upstream/downstream lineage showing data flow |
| `get_data_quality` | Retrieve data quality test results with pass/fail status |
| `get_data_asset` | Get detailed info including schema, columns, owners, tags |
| `list_pipelines` | List ingestion pipelines with status filtering |
| `get_policy` | Access governance policies and compliance rules |

## Why This Matters

- **Universal AI Integration**: Works with Claude Desktop, Cursor, any MCP-compatible AI
- **Deep OpenMetadata Integration**: Leverages 120+ connectors, column-level lineage, quality tests
- **Production Ready**: Full async support, error handling, type safety
- **Easy to Extend**: Simple plugin architecture for adding more tools

## Quick Start

### 1. Installation

```bash
# Clone or navigate to project
cd openmetadata-mcp-server

# Install dependencies
pip install -e .

# Or with uv
uv sync
```

### 2. Configuration

Copy `.env.example` to `.env` and add your OpenMetadata credentials:

```bash
cp .env.example .env
# Edit .env with your credentials
```

Get your API token from:
- **Collate Cloud**: https://app.collate.io/settings/tokens
- **Self-hosted**: http://localhost:8585/settings/tokens

### 3. Run the Server

```bash
# Run with stdio (for Claude Desktop, etc.)
python -m openmetadata_mcp.server

# Or directly
python -c "from openmetadata_mcp.server import main; import asyncio; asyncio.run(main())"
```

### 4. Connect to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openmetadata": {
      "command": "python",
      "args": ["-m", "openmetadata_mcp.server"],
      "env": {
        "OPENMETADATA_HOST": "http://localhost:8585",
        "OPENMETADATA_AUTH_TOKEN": "your-token"
      }
    }
  }
}
```

## Usage Examples

### From an AI Agent

```
User: Find tables related to customer data and show their lineage

AI Agent calls:
1. search_tables({ "query": "customer", "limit": 10 })
2. get_table_lineage({ "table_fully_qualified_name": "...", "direction": "both" })
3. get_data_quality({ "table_fully_qualified_name": "..." })
```

### From Python Code

```python
import asyncio
from openmetadata_mcp.client import OpenMetadataClient
from openmetadata_mcp.config import ServerConfig

async def main():
    config = ServerConfig(
        host="http://localhost:8585",
        auth_token="your-token"
    )
    
    async with OpenMetadataClient(config) as client:
        # Search for tables
        result = await client.search("revenue", limit=5)
        print(result)
        
        # Get lineage
        lineage = await client.get_lineage(
            "table", 
            "warehouse.sales.fact_revenue",
            direction="both"
        )
        print(lineage)

asyncio.run(main())
```

## Project Structure

```
openmetadata-mcp-server/
├── pyproject.toml           # Python package config
├── README.md                 # This file
├── .env.example             # Environment template
├── mcp_settings.json        # Claude Desktop config
└── openmetadata_mcp/
    ├── __init__.py
    ├── config.py             # Server configuration
    ├── client.py             # OpenMetadata API client
    ├── tools.py              # MCP tool implementations
    └── server.py             # Server entry point
```

## Requirements

- **Python**: 3.11+
- **OpenMetadata**: 1.0+ (works with Collate cloud or self-hosted)
- **Dependencies**:
  - mcp>=1.1.0
  - httpx>=0.27.0
  - pydantic>=2.9.0
  - python-dotenv>=1.0.0

## Demo Video

See it in action! The MCP server connects to any OpenMetadata instance and exposes all metadata capabilities as AI-compatible tools.

## Hackathon Context

**Event**: OpenMetadata Back to the Future Hackathon 2026
**Track**: Paradox #T-01 - MCP Ecosystem & AI Agents
**Dates**: April 17-26, 2026

This project demonstrates how MCP can bridge AI agents with enterprise metadata platforms, enabling a new generation of data-aware AI applications.

## License

MIT License

---

Built with ⚡ for the OpenMetadata Hackathon 2026
