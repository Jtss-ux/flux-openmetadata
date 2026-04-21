#!/usr/bin/env python3
"""
Demo script for OpenMetadata MCP Server.

This script demonstrates the MCP tools with mock data to show how they work.
Replace with actual OpenMetadata connection for production use.
"""

import json
import asyncio
from typing import Any


async def demo_search_tables(query: str, limit: int = 10) -> str:
    """Demo search_tables tool output."""
    mock_results = {
        "query": query,
        "total_results": 3,
        "results": [
            {
                "name": "customer_orders",
                "fullyQualifiedName": "warehouse.raw.customer_orders",
                "description": "Raw customer order transactions from all channels",
                "entityType": "table",
                "owner": "data_team",
                "tags": ["pii", "customer", "finance"]
            },
            {
                "name": "customer_dim",
                "fullyQualifiedName": "warehouse.dimensions.customer_dim",
                "description": "Customer dimension table with enriched data",
                "entityType": "table",
                "owner": "analytics_team",
                "tags": ["customer", "dimension"]
            },
            {
                "name": "customer_revenue_agg",
                "fullyQualifiedName": "warehouse.analytics.customer_revenue_agg",
                "description": "Aggregated customer revenue metrics",
                "entityType": "table",
                "owner": "finance_team",
                "tags": ["revenue", "customer", "aggregate"]
            }
        ]
    }
    return json.dumps(mock_results, indent=2)


async def demo_get_table_lineage(table: str, direction: str = "both") -> str:
    """Demo get_table_lineage tool output."""
    mock_lineage = {
        "table": table,
        "direction": direction,
        "nodes": [
            {"id": "1", "name": "raw_orders", "fullyQualifiedName": "warehouse.raw.orders", "type": "table"},
            {"id": "2", "name": "customer_orders", "fullyQualifiedName": "warehouse.raw.customer_orders", "type": "table"},
            {"id": "3", "name": "customer_dim", "fullyQualifiedName": "warehouse.dimensions.customer_dim", "type": "table"},
            {"id": "4", "name": "order_enrichment", "fullyQualifiedName": "dbt.order_enrichment", "type": "pipeline"},
            {"id": "5", "name": "revenue_dashboard", "fullyQualifiedName": "metabase.revenue_dashboard", "type": "dashboard"}
        ],
        "edges": [
            {"from": "1", "to": "2"},
            {"from": "2", "to": "4"},
            {"from": "3", "to": "4"},
            {"from": "4", "to": "5"}
        ],
        "total_upstream": 2,
        "total_downstream": 2
    }
    return json.dumps(mock_lineage, indent=2)


async def demo_get_data_quality(table: str) -> str:
    """Demo get_data_quality tool output."""
    mock_quality = {
        "table": table,
        "summary": {"total": 5, "passed": 4, "failed": 1},
        "tests": [
            {"name": "row_count_between", "testType": "rowCountBetween", "status": "Success", "executionTime": 1234, "lastRunTime": "2026-04-22T10:00:00Z"},
            {"name": "not_null_columns", "testType": "columnNotNull", "status": "Success", "executionTime": 567, "lastRunTime": "2026-04-22T10:00:00Z"},
            {"name": "unique_customer_id", "testType": "columnUniqueness", "status": "Failed", "executionTime": 890, "lastRunTime": "2026-04-22T10:00:00Z"},
            {"name": "valid_email_format", "testType": "regex", "status": "Success", "executionTime": 234, "lastRunTime": "2026-04-22T10:00:00Z"},
            {"name": "fresh_data", "testType": "rowFreshness", "status": "Success", "executionTime": 456, "lastRunTime": "2026-04-22T10:00:00Z"}
        ]
    }
    return json.dumps(mock_quality, indent=2)


async def demo_get_data_asset(fqn: str, asset_type: str) -> str:
    """Demo get_data_asset tool output."""
    mock_asset = {
        "name": "customer_orders",
        "fullyQualifiedName": fqn,
        "description": "Raw customer order transactions from all channels",
        "owner": "data_team",
        "tags": ["pii", "customer", "finance"],
        "entityType": asset_type,
        "columns": [
            {"name": "order_id", "dataType": "VARCHAR", "description": "Unique order identifier", "nullable": False, "tags": ["id"]},
            {"name": "customer_id", "dataType": "INTEGER", "description": "Customer reference", "nullable": False, "tags": ["customer"]},
            {"name": "order_total", "dataType": "DECIMAL", "description": "Order total amount", "nullable": False, "tags": ["revenue"]},
            {"name": "created_at", "dataType": "TIMESTAMP", "description": "Order creation time", "nullable": False, "tags": ["timestamp"]},
            {"name": "status", "dataType": "VARCHAR", "description": "Order status", "nullable": True, "tags": []}
        ],
        "columnCount": 15
    }
    return json.dumps(mock_asset, indent=2)


async def demo_list_pipelines(status: str = "all", limit: int = 10) -> str:
    """Demo list_pipelines tool output."""
    mock_pipelines = {
        "status": status,
        "total": 3,
        "pipelines": [
            {"name": "raw_ingestion", "fullyQualifiedName": "airbyte.raw_ingestion", "pipelineStatus": "success", "service": "Airbyte", "source": "postgres"},
            {"name": "dbt_transform", "fullyQualifiedName": "airflow.dbt_transform", "pipelineStatus": "running", "service": "Airflow", "source": "dbt"},
            {"name": "bi_sync", "fullyQualifiedName": "airbyte.bi_sync", "pipelineStatus": "failed", "service": "Airbyte", "source": "metabase"}
        ]
    }
    return json.dumps(mock_pipelines, indent=2)


async def demo_get_policy(policy_name: str = "") -> str:
    """Demo get_policy tool output."""
    mock_policy = {
        "query": policy_name or "All Policies",
        "policies": [
            {
                "name": "PII Data Classification",
                "fullyQualifiedName": "governance.pii_policy",
                "description": "Policies for handling Personally Identifiable Information",
                "policyType": "AccessControl",
                "rules": [
                    {"name": "mask_email", "effect": "MASK"},
                    {"name": "restrict_ssn", "effect": "DENY"}
                ]
            },
            {
                "name": "Finance Data Access",
                "fullyQualifiedName": "governance.finance_access",
                "description": "Access controls for financial data",
                "policyType": "AccessControl",
                "rules": [
                    {"name": "finance_team_only", "effect": "ALLOW"}
                ]
            }
        ]
    }
    return json.dumps(mock_policy, indent=2)


async def run_demo():
    """Run demonstration of all MCP tools."""
    print("=" * 60)
    print("OpenMetadata MCP Server - Tool Demo")
    print("=" * 60)
    
    print("\n[s] search_tables")
    print("-" * 40)
    result = await demo_search_tables("customer")
    print(result)
    
    print("\n[l] get_table_lineage")
    print("-" * 40)
    result = await demo_get_table_lineage("warehouse.raw.customer_orders")
    print(result)
    
    print("\n[q] get_data_quality")
    print("-" * 40)
    result = await demo_get_data_quality("warehouse.raw.customer_orders")
    print(result)
    
    print("\n[d] get_data_asset")
    print("-" * 40)
    result = await demo_get_data_asset("warehouse.raw.customer_orders", "table")
    print(result)
    
    print("\n[p] list_pipelines")
    print("-" * 40)
    result = await demo_list_pipelines()
    print(result)
    
    print("\n[g] get_policy")
    print("-" * 40)
    result = await demo_get_policy()
    print(result)
    
    print("\n" + "=" * 60)
    print("Demo complete! These are the outputs AI agents receive.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_demo())