"""
Unit tests for OpenMetadata MCP server tools.

Tests use mocked HTTP responses so no live server is required.
Run with: pytest tests/test_tools.py -v
"""

import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_client(return_value: dict) -> MagicMock:
    """Return a mock OpenMetadataClient whose async methods return return_value."""
    client = MagicMock()
    for method in ("search", "get_lineage", "get_table_tests", "get_entity", "list_pipelines", "get_policy"):
        setattr(client, method, AsyncMock(return_value=return_value))
    return client


# ---------------------------------------------------------------------------
# search_tables
# ---------------------------------------------------------------------------


class TestSearchTables(unittest.IsolatedAsyncioTestCase):
    async def test_returns_formatted_results(self):
        from openmetadata_mcp.tools import search_tables

        mock_response = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "name": "orders",
                            "fullyQualifiedName": "db.schema.orders",
                            "description": "Order table",
                            "entityType": "table",
                            "owner": {"name": "alice"},
                            "tags": [],
                        }
                    }
                ]
            }
        }
        client = _make_client(mock_response)
        result = await search_tables(client, "orders")
        data = json.loads(result)

        assert data["total_results"] == 1
        assert data["results"][0]["name"] == "orders"
        assert data["results"][0]["fullyQualifiedName"] == "db.schema.orders"
        assert data["query"] == "orders"

    async def test_no_results_returns_message(self):
        from openmetadata_mcp.tools import search_tables

        client = _make_client({"hits": {"hits": []}})
        result = await search_tables(client, "nonexistent_xyz")
        data = json.loads(result)

        assert "message" in data
        assert data["message"] == "No results found"

    async def test_error_returns_error_json(self):
        from openmetadata_mcp.tools import search_tables

        client = MagicMock()
        client.search = AsyncMock(side_effect=Exception("connection refused"))
        result = await search_tables(client, "any")
        data = json.loads(result)

        assert "error" in data
        assert "connection refused" in data["error"]


# ---------------------------------------------------------------------------
# get_table_lineage
# ---------------------------------------------------------------------------


class TestGetTableLineage(unittest.IsolatedAsyncioTestCase):
    async def test_returns_nodes_and_edges(self):
        from openmetadata_mcp.tools import get_table_lineage

        mock_response = {
            "nodes": [
                {"id": "1", "name": "source_table", "fullyQualifiedName": "db.schema.source_table", "type": "table"},
                {"id": "2", "name": "target_table", "fullyQualifiedName": "db.schema.target_table", "type": "table"},
            ],
            "edges": [{"from": "1", "to": "2"}],
        }
        client = _make_client(mock_response)
        result = await get_table_lineage(client, "db.schema.target_table", direction="upstream")
        data = json.loads(result)

        assert len(data["nodes"]) == 2
        assert len(data["edges"]) == 1
        assert data["table"] == "db.schema.target_table"
        assert data["direction"] == "upstream"

    async def test_empty_lineage(self):
        from openmetadata_mcp.tools import get_table_lineage

        client = _make_client({"nodes": [], "edges": []})
        result = await get_table_lineage(client, "db.schema.isolated", direction="both")
        data = json.loads(result)

        assert data["nodes"] == []
        assert data["edges"] == []

    async def test_error_returns_error_json(self):
        from openmetadata_mcp.tools import get_table_lineage

        client = MagicMock()
        client.get_lineage = AsyncMock(side_effect=RuntimeError("timeout"))
        result = await get_table_lineage(client, "db.schema.t")
        data = json.loads(result)

        assert "error" in data


# ---------------------------------------------------------------------------
# get_data_quality
# ---------------------------------------------------------------------------


class TestGetDataQuality(unittest.IsolatedAsyncioTestCase):
    async def test_returns_test_summary(self):
        from openmetadata_mcp.tools import get_data_quality

        mock_response = {
            "testCaseResults": [
                {
                    "testCase": {"name": "not_null_check", "testType": "ColumnValues"},
                    "testCaseResultStatus": "Success",
                    "executionTime": 0.12,
                    "lastRunTime": "2026-04-01T00:00:00Z",
                },
                {
                    "testCase": {"name": "min_value_check", "testType": "ColumnValues"},
                    "testCaseResultStatus": "Failed",
                    "executionTime": 0.08,
                    "lastRunTime": "2026-04-01T00:00:00Z",
                },
            ]
        }
        client = _make_client(mock_response)
        result = await get_data_quality(client, "db.schema.orders")
        data = json.loads(result)

        assert data["summary"]["total"] == 2
        assert data["summary"]["passed"] == 1
        assert data["summary"]["failed"] == 1

    async def test_no_tests_returns_message(self):
        from openmetadata_mcp.tools import get_data_quality

        client = _make_client({"testCaseResults": []})
        result = await get_data_quality(client, "db.schema.no_tests")
        data = json.loads(result)

        assert "message" in data


# ---------------------------------------------------------------------------
# get_data_asset
# ---------------------------------------------------------------------------


class TestGetDataAsset(unittest.IsolatedAsyncioTestCase):
    async def test_table_asset_includes_columns(self):
        from openmetadata_mcp.tools import get_data_asset

        mock_entity = {
            "name": "orders",
            "fullyQualifiedName": "db.schema.orders",
            "description": "Order records",
            "owner": {"name": "alice"},
            "tags": [],
            "entityType": "table",
            "columns": [
                {"name": "id", "dataType": "INT", "description": "PK", "nullable": False, "tags": []},
                {"name": "total", "dataType": "FLOAT", "description": None, "nullable": True, "tags": []},
            ],
        }
        client = _make_client(mock_entity)
        result = await get_data_asset(client, "db.schema.orders", "table")
        data = json.loads(result)

        assert data["name"] == "orders"
        assert len(data["columns"]) == 2
        assert data["columns"][0]["name"] == "id"
        assert data["columnCount"] == 2

    async def test_non_table_asset_no_columns(self):
        from openmetadata_mcp.tools import get_data_asset

        mock_entity = {
            "name": "my_pipeline",
            "fullyQualifiedName": "service.my_pipeline",
            "description": None,
            "entityType": "pipeline",
            "tags": [],
        }
        client = _make_client(mock_entity)
        result = await get_data_asset(client, "service.my_pipeline", "pipeline")
        data = json.loads(result)

        assert data["name"] == "my_pipeline"
        assert "columns" not in data


# ---------------------------------------------------------------------------
# list_pipelines
# ---------------------------------------------------------------------------


class TestListPipelines(unittest.IsolatedAsyncioTestCase):
    async def test_returns_pipeline_list(self):
        from openmetadata_mcp.tools import list_pipelines

        mock_response = {
            "data": [
                {
                    "name": "etl_pipeline",
                    "fullyQualifiedName": "service.etl_pipeline",
                    "pipelineStatus": "Success",
                    "source": "mysql",
                    "service": {"name": "mysql_service"},
                }
            ]
        }
        client = _make_client(mock_response)
        result = await list_pipelines(client, status="all", limit=5)
        data = json.loads(result)

        assert data["total"] == 1
        assert data["pipelines"][0]["name"] == "etl_pipeline"

    async def test_empty_list(self):
        from openmetadata_mcp.tools import list_pipelines

        client = _make_client({"data": []})
        result = await list_pipelines(client)
        data = json.loads(result)

        assert "message" in data
        assert data["pipelines"] == []


# ---------------------------------------------------------------------------
# get_policy
# ---------------------------------------------------------------------------


class TestGetPolicy(unittest.IsolatedAsyncioTestCase):
    async def test_returns_policies(self):
        from openmetadata_mcp.tools import get_policy

        mock_response = {
            "data": [
                {
                    "name": "DataConsumerPolicy",
                    "fullyQualifiedName": "DataConsumerPolicy",
                    "description": "Consumer access policy",
                    "policyType": "AccessControl",
                    "rules": [{"name": "ViewAll", "effect": "allow"}],
                }
            ]
        }
        client = _make_client(mock_response)
        result = await get_policy(client, "DataConsumerPolicy")
        data = json.loads(result)

        assert len(data["policies"]) == 1
        assert data["policies"][0]["name"] == "DataConsumerPolicy"
        assert data["policies"][0]["rules"][0]["effect"] == "allow"


if __name__ == "__main__":
    unittest.main()
