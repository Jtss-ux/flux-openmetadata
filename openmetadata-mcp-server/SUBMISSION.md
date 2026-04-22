# OpenMetadata MCP Server - Hackathon Submission

## Project Name
**OpenMetadata MCP Server** - AI-Powered Data Discovery & Governance

## Track
Paradox #T-01: MCP Ecosystem & AI Agents

## Team
Solo Developer: Joseph St

## Project Description

An MCP (Model Context Protocol) server that exposes OpenMetadata's powerful metadata platform as tools that any AI agent can use. The server provides 6 core capabilities:

1. **search_tables**: Search for data assets by name, description, tags, or owner
2. **get_table_lineage**: Get complete upstream/downstream lineage
3. **get_data_quality**: Retrieve data quality test results
4. **get_data_asset**: Get detailed asset info including schema
5. **list_pipelines**: List ingestion pipelines with status
6. **get_policy**: Access governance policies

## Problem Solved

AI agents need access to metadata to intelligently interact with enterprise data — but there's no standard way for them to discover data, understand lineage, or access governance rules. This MCP server bridges that gap.

## Solution Highlights

- **Universal AI Integration**: Works with Claude Desktop, Cursor, any MCP-compatible AI
- **Production Ready**: Full async support, error handling, Python 3.11+
- **Deep OpenMetadata Integration**: Leverages 120+ connectors, column-level lineage, quality tests
- **Easy Configuration**: Environment-based config, .env support

## Tech Stack

- **Language**: Python 3.11+
- **Framework**: MCP SDK (modelcontextprotocol)
- **HTTP Client**: httpx
- **Data Validation**: Pydantic

## Files Included

```
openmetadata-mcp-server/
├── pyproject.toml           # Package config
├── README.md                 # Full documentation
├── .env.example             # Environment template
├── mcp_settings.json       # Claude Desktop config
├── demo.py                 # Demo script
└── openmetadata_mcp/
    ├── __init__.py
    ├── config.py           # Server config
    ├── client.py           # API client
    ├── tools.py            # Tool implementations
    └── server.py           # Entry point
```

## How to Run

```bash
# Install
cd openmetadata-mcp-server
pip install -e .

# Run
python -m openmetadata_mcp.server
```

## Demo

Run `python demo.py` to see example outputs of all 6 tools.

## Why This Wins

1. **Creativity**: First MCP server specifically for OpenMetadata
2. **Technical Excellence**: Clean async code, proper error handling
3. **Real Impact**: Solves real problem - AI agents can't discover data without this
4. **Best Use of OpenMetadata**: Deep integration with search, lineage, quality, governance
5. **User Experience**: Simple to install, configure, and use

## Live Demo

- **Web App (Primary)**: https://truthly-blue.vercel.app
- **Web App (Backup)**: https://huggingface.co/spaces/jtsvize/flux-openmetadata
- **GitHub**: https://github.com/Jtss-ux/flux-openmetadata
- **OpenMetadata Sandbox**: https://sandbox.open-metadata.org

## Contribution Track (OpenMetadata Issue #26265)

As part of this hackathon, I have also contributed a bug fix to the core OpenMetadata repository addressing ClickHouse MATERIALIZED VIEW TO lineage extraction.

- **Pull Request**: https://github.com/open-metadata/OpenMetadata/pull/27628
- **Issue**: https://github.com/open-metadata/OpenMetadata/issues/26265

---

**Submission for OpenMetadata Back to the Future Hackathon 2026**
