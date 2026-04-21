"""MCP tool implementations for OpenMetadata."""

import json
from typing import Any
from openmetadata_mcp.client import OpenMetadataClient


async def search_tables(client: OpenMetadataClient, query: str, limit: int = 10) -> str:
    """Search for tables and data assets."""
    try:
        results = await client.search(query, limit)
        hits = results.get("hits", {}).get("hits", [])

        if not hits:
            return json.dumps({"message": "No results found", "query": query}, indent=2)

        formatted_results = []
        for hit in hits:
            source = hit.get("_source", {})
            formatted_results.append({
                "name": source.get("name"),
                "fullyQualifiedName": source.get("fullyQualifiedName"),
                "description": source.get("description", "No description"),
                "entityType": source.get("entityType"),
                "owner": source.get("owner", {}).get("name"),
                "tags": [t.get("tag", {}).get("name") for t in source.get("tags", [])],
            })

        return json.dumps({
            "query": query,
            "total_results": len(formatted_results),
            "results": formatted_results,
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "query": query}, indent=2)


async def get_table_lineage(
    client: OpenMetadataClient,
    table_fully_qualified_name: str,
    direction: str = "both",
) -> str:
    """Get lineage information for a table."""
    try:
        lineage = await client.get_lineage(
            entity_type="table",
            fqn=table_fully_qualified_name,
            direction=direction,
        )

        nodes = lineage.get("nodes", [])
        edges = lineage.get("edges", [])

        formatted_nodes = []
        for node in nodes:
            formatted_nodes.append({
                "id": node.get("id"),
                "name": node.get("name"),
                "fullyQualifiedName": node.get("fullyQualifiedName"),
                "type": node.get("type"),
            })

        formatted_edges = []
        for edge in edges:
            formatted_edges.append({
                "from": edge.get("from"),
                "to": edge.get("to"),
            })

        return json.dumps({
            "table": table_fully_qualified_name,
            "direction": direction,
            "nodes": formatted_nodes,
            "edges": formatted_edges,
            "total_upstream": sum(1 for e in edges if direction in ["both", "upstream"]),
            "total_downstream": sum(1 for e in edges if direction in ["both", "downstream"]),
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "table": table_fully_qualified_name}, indent=2)


async def get_data_quality(client: OpenMetadataClient, table_fully_qualified_name: str) -> str:
    """Get data quality tests and results for a table."""
    try:
        tests = await client.get_table_tests(table_fully_qualified_name)

        test_results = tests.get("testCaseResults", [])

        if not test_results:
            return json.dumps({
                "table": table_fully_qualified_name,
                "message": "No data quality tests found",
                "tests": [],
            }, indent=2)

        formatted_tests = []
        passed = 0
        failed = 0

        for result in test_results:
            test_case = result.get("testCase", {})
            status = result.get("testCaseResultStatus", "UNKNOWN")

            if status == "Success":
                passed += 1
            elif status == "Failed":
                failed += 1

            formatted_tests.append({
                "name": test_case.get("name"),
                "testType": test_case.get("testType"),
                "status": status,
                "executionTime": result.get("executionTime"),
                "lastRunTime": result.get("lastRunTime"),
            })

        return json.dumps({
            "table": table_fully_qualified_name,
            "summary": {
                "total": len(formatted_tests),
                "passed": passed,
                "failed": failed,
            },
            "tests": formatted_tests,
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "table": table_fully_qualified_name}, indent=2)


async def get_data_asset(
    client: OpenMetadataClient,
    asset_fqn: str,
    asset_type: str,
) -> str:
    """Get detailed information about a data asset."""
    try:
        entity_type_map = {
            "table": "table",
            "database": "database",
            "schema": "database",
            "pipeline": "pipeline",
            "dashboard": "dashboard",
            "mlmodel": "mlModel",
        }

        entity_type = entity_type_map.get(asset_type, asset_type)
        entity = await client.get_entity(
            entity_type=entity_type,
            fqn=asset_fqn,
            fields="owner,tags,description,columns,usageSummary",
        )

        formatted = {
            "name": entity.get("name"),
            "fullyQualifiedName": entity.get("fullyQualifiedName"),
            "description": entity.get("description"),
            "owner": entity.get("owner", {}).get("name") if entity.get("owner") else None,
            "tags": [t.get("tag", {}).get("name") for t in entity.get("tags", [])],
            "entityType": entity.get("entityType"),
        }

        if entity_type == "table":
            columns = entity.get("columns", [])
            formatted["columns"] = [
                {
                    "name": col.get("name"),
                    "dataType": col.get("dataType"),
                    "description": col.get("description"),
                    "nullable": col.get("nullable"),
                    "tags": [t.get("tag", {}).get("name") for t in col.get("tags", [])],
                }
                for col in columns[:20]
            ]
            formatted["columnCount"] = len(columns)

            if entity.get("usageSummary"):
                formatted["usage"] = {
                    "weeklyStats": entity["usageSummary"].get("weeklyStats"),
                    "monthlyStats": entity["usageSummary"].get("monthlyStats"),
                }

        return json.dumps(formatted, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "asset": asset_fqn, "type": asset_type}, indent=2)


async def list_pipelines(
    client: OpenMetadataClient,
    status: str = "all",
    limit: int = 10,
) -> str:
    """List ingestion pipelines."""
    try:
        pipelines = await client.list_pipelines(status=status, limit=limit)

        data = pipelines.get("data", [])

        if not data:
            return json.dumps({
                "status": status,
                "message": "No pipelines found",
                "pipelines": [],
            }, indent=2)

        formatted_pipelines = []
        for pipeline in data:
            formatted_pipelines.append({
                "name": pipeline.get("name"),
                "fullyQualifiedName": pipeline.get("fullyQualifiedName"),
                "pipelineStatus": pipeline.get("pipelineStatus"),
                "source": pipeline.get("source"),
                "service": pipeline.get("service", {}).get("name") if pipeline.get("service") else None,
            })

        return json.dumps({
            "status": status,
            "total": len(formatted_pipelines),
            "pipelines": formatted_pipelines,
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)}, indent=2)


async def get_policy(client: OpenMetadataClient, policy_name: str) -> str:
    """Get governance policies."""
    try:
        policy = await client.get_policy(policy_name)

        if isinstance(policy, dict) and "data" in policy:
            policies = policy["data"]
        else:
            policies = [policy] if isinstance(policy, dict) else []

        formatted_policies = []
        for p in policies:
            formatted_policies.append({
                "name": p.get("name"),
                "fullyQualifiedName": p.get("fullyQualifiedName"),
                "description": p.get("description"),
                "policyType": p.get("policyType"),
                "rules": [
                    {
                        "name": rule.get("name"),
                        "effect": rule.get("effect"),
                    }
                    for rule in p.get("rules", [])
                ],
            })

        return json.dumps({
            "query": policy_name,
            "policies": formatted_policies,
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e), "policy": policy_name}, indent=2)
