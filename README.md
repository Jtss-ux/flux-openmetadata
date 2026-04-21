# FLUX:// Conversational Data Navigator
### OpenMetadata OUTATIME Hackathon 2026 · Track: Paradox #T-01 — MCP Ecosystem & AI Agents

> *"Where we're going, we don't need SQL."*

---

## What is FLUX://?

**FLUX://** is an AI-powered, conversational metadata navigator built on top of OpenMetadata.  
It lets any user — technical or not — explore, interrogate, and act on their entire data estate using natural language.

The project has two layers:

| Layer | Tech | What it does |
|-------|------|--------------|
| **MCP Server** | Python 3.11+ | Exposes OpenMetadata as MCP tools for any AI agent (Claude, Cursor, etc.) |
| **Web App** | React + Vite | Retro-futuristic chat UI that talks to OpenMetadata in real time |

---

## The Problem

Data teams spend hours hunting for the right table, chasing lineage, and checking quality — all in separate tools.  
AI agents that could help them are blind to the metadata catalog.

There is **no standard, open bridge** between AI agents and enterprise metadata platforms.

## Our Solution: OpenMetadata MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives **any MCP-compatible AI agent** full access to OpenMetadata.

```
AI Agent ←→ MCP Protocol ←→ OpenMetadata MCP Server ←→ OpenMetadata REST API
```

### 6 Production-Ready MCP Tools

| Tool | Description |
|------|-------------|
| `search_tables` | Full-text search across all data assets by name, description, tags, or owner |
| `get_table_lineage` | Upstream & downstream lineage with column-level granularity |
| `get_data_quality` | Test results, pass/fail counts, anomaly detection scores |
| `get_data_asset` | Schema, columns, tags, ownership, and usage statistics |
| `list_pipelines` | Monitor ingestion pipeline health & status |
| `get_policy` | Governance rules, PII classification, access controls |

---

## Quick Start

### 1. Run the Web App

```bash
npm install
npm run dev
# → http://localhost:5173
```

> The Vite dev server proxies `/api` to the OpenMetadata sandbox automatically.

### 2. Run the MCP Server

```bash
cd openmetadata-mcp-server
pip install -e .

# Set credentials
export OPENMETADATA_HOST=https://sandbox.open-metadata.org
export OPENMETADATA_AUTH_TOKEN=<your-token>

# Start
python -m openmetadata_mcp.server
```

### 3. Connect to Claude Desktop

Copy `openmetadata-mcp-server/mcp_settings.json` into your Claude Desktop config:

```json
{
  "mcpServers": {
    "openmetadata": {
      "command": "python",
      "args": ["-m", "openmetadata_mcp.server"],
      "env": {
        "OPENMETADATA_HOST": "https://sandbox.open-metadata.org",
        "OPENMETADATA_AUTH_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### 4. Run the Demo Script

```bash
cd openmetadata-mcp-server
python demo.py
```

---

## Project Structure

```
.
├── src/                          # React web application
│   ├── App.jsx                   # FLUX:// chat interface
│   ├── index.css                 # Retro-futuristic design system
│   ├── api/openmetadata.js       # OpenMetadata REST client
│   └── utils/ai-processor.js    # Intent router (mirrors MCP tools)
│
├── openmetadata-mcp-server/      # Python MCP Server
│   ├── pyproject.toml
│   ├── mcp_settings.json         # Claude Desktop config
│   ├── demo.py                   # Tool demo script
│   └── openmetadata_mcp/
│       ├── server.py             # MCP entry point
│       ├── client.py             # Async OpenMetadata HTTP client
│       ├── tools.py              # 6 MCP tool implementations
│       └── config.py             # Server configuration
│
└── README.md
```

---

## Judging Criteria Mapping

| Criterion | How FLUX:// addresses it |
|-----------|--------------------------|
| **Potential Impact** | Bridges AI agents with enterprise metadata — a missing link for every data team |
| **Creativity & Innovation** | First open-source MCP server purpose-built for OpenMetadata |
| **Technical Excellence** | Full async Python, type-safe, production error handling, real API integration |
| **Best Use of OpenMetadata** | Uses Search, Lineage, Data Quality, Governance, and Pipelines APIs |
| **User Experience** | Zero-config retro chat UI; suggestion chips; live entity counts from sandbox |
| **Presentation Quality** | Live demo via sandbox, working demo script, complete documentation |

---

## Live Demo

- **Web App**: `npm run dev` → http://localhost:5173  
- **OpenMetadata Sandbox**: https://sandbox.open-metadata.org  
- **MCP Tools Demo**: `python openmetadata-mcp-server/demo.py`

---

## Hackathon Details

- **Event**: OUTATIME — OpenMetadata Hackathon 2026  
- **Organizer**: WeMakeDevs + Collate  
- **Track**: Paradox #T-01 — MCP Ecosystem & AI Agents  
- **Team**: josephst2007 (solo)  
- **Submission**: https://forms.gle/JHc3YGmaPhsDeiHXA

---

## License

MIT — Built with ⚡ for the OpenMetadata Hackathon 2026
