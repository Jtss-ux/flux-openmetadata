import { useState } from "react";

interface OpenMetadataConfig {
  host: string;
  token: string;
}

interface SearchResult {
  name: string;
  fullyQualifiedName: string;
  description: string;
  entityType: string;
  owner?: string;
  tags: string[];
}

interface LineageNode {
  id: string;
  name: string;
  fullyQualifiedName: string;
  type: string;
}

interface QualityTest {
  name: string;
  testType: string;
  status: string;
}

type TabType = "search" | "lineage" | "quality" | "asset";

export default function OpenMetadataDemo() {
  const [config, setConfig] = useState<OpenMetadataConfig>({
    host: "http://localhost:8585",
    token: "",
  });
  const [activeTab, setActiveTab] = useState<TabType>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.host}/api/v1/search/query`, {
        headers: {
          "Content-Type": "application/json",
          ...(config.token && { Authorization: `Bearer ${config.token}` }),
        },
        method: "POST",
        body: JSON.stringify({ q: query, from: 0, size: 10 }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const hits = data?.hits?.hits || [];

      setResults({
        total: hits.length,
        results: hits.map((hit: any) => ({
          name: hit._source?.name,
          fullyQualifiedName: hit._source?.fullyQualifiedName,
          description: hit._source?.description || "No description",
          entityType: hit._source?.entityType,
          owner: hit._source?.owner?.name,
          tags: hit._source?.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
        })),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLineage = async (tableName: string) => {
    if (!tableName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.host}/api/v1/table/name/${encodeURIComponent(tableName)}/lineage`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(config.token && { Authorization: `Bearer ${config.token}` }),
          },
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      setResults({
        nodes: data.nodes || [],
        edges: data.edges || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuality = async (tableName: string) => {
    if (!tableName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.host}/api/v1/table/name/${encodeURIComponent(tableName)}/testCaseResults`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(config.token && { Authorization: `Bearer ${config.token}` }),
          },
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      const tests = data.testCaseResults || [];

      const passed = tests.filter((t: any) => t.testCaseResultStatus === "Success").length;
      const failed = tests.filter((t: any) => t.testCaseResultStatus === "Failed").length;

      setResults({
        tests: tests.map((t: any) => ({
          name: t.testCase?.name,
          testType: t.testCase?.testType,
          status: t.testCaseResultStatus,
          lastRunTime: t.lastRunTime,
        })),
        summary: {
          total: tests.length,
          passed,
          failed,
        },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetDetails = async (fqn: string, type: string) => {
    if (!fqn.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.host}/api/v1/${type}/name/${encodeURIComponent(fqn)}?include=all`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(config.token && { Authorization: `Bearer ${config.token}` }),
          },
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      setResults({
        name: data.name,
        fullyQualifiedName: data.fullyQualifiedName,
        description: data.description,
        owner: data.owner?.name,
        tags: data.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
        columns: data.columns?.slice(0, 10).map((c: any) => ({
          name: c.name,
          dataType: c.dataType,
          description: c.description,
          tags: c.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
        })),
        columnCount: data.columns?.length || 0,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "search", label: "Search" },
    { id: "lineage", label: "Lineage" },
    { id: "quality", label: "Quality" },
    { id: "asset", label: "Asset Details" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            OpenMetadata MCP Server
          </h1>
          <p className="text-slate-400">
            AI-powered data discovery and governance for your AI agents
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">OpenMetadata Host</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                placeholder="http://localhost:8585"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">API Token</label>
              <input
                type="password"
                value={config.token}
                onChange={(e) => setConfig({ ...config, token: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                placeholder="Enter your OpenMetadata token"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg overflow-hidden mb-8">
          <div className="flex border-b border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                  setQuery("");
                }}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExecute()}
                placeholder={
                  activeTab === "search"
                    ? "Search tables, pipelines, dashboards..."
                    : "Enter fully qualified name (e.g., warehouse.db.schema.table)"
                }
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              />
              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded font-medium transition-colors"
              >
                {loading ? "Loading..." : "Search"}
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4 text-red-300">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-4">
                {activeTab === "search" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Found {results.total} results
                    </h3>
                    <div className="space-y-3">
                      {results.results?.map((r: SearchResult, i: number) => (
                        <div key={i} className="bg-slate-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-blue-400 font-medium">{r.name}</span>
                              <span className="text-slate-500 text-sm ml-2">
                                ({r.entityType})
                              </span>
                            </div>
                            {r.owner && (
                              <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                                {r.owner}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-2">{r.description}</p>
                          <code className="text-xs text-slate-500">{r.fullyQualifiedName}</code>
                          {r.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {r.tags.map((tag, j) => (
                                <span
                                  key={j}
                                  className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "lineage" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Lineage Graph</h3>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-600 rounded p-3">
                          <div className="text-2xl font-bold">
                            {results.nodes?.filter((n: LineageNode) => n.type === "table").length}
                          </div>
                          <div className="text-sm text-slate-400">Tables</div>
                        </div>
                        <div className="bg-slate-600 rounded p-3">
                          <div className="text-2xl font-bold">
                            {results.edges?.length || 0}
                          </div>
                          <div className="text-sm text-slate-400">Connections</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {results.nodes?.map((node: LineageNode, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-slate-600 rounded p-2"
                          >
                            <span className="text-blue-400">{node.type}</span>
                            <span className="text-white">{node.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "quality" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Data Quality Tests</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-slate-600 rounded p-3">
                        <div className="text-2xl font-bold">{results.summary?.total || 0}</div>
                        <div className="text-sm text-slate-400">Total Tests</div>
                      </div>
                      <div className="bg-green-900/50 rounded p-3">
                        <div className="text-2xl font-bold text-green-400">
                          {results.summary?.passed || 0}
                        </div>
                        <div className="text-sm text-green-300">Passed</div>
                      </div>
                      <div className="bg-red-900/50 rounded p-3">
                        <div className="text-2xl font-bold text-red-400">
                          {results.summary?.failed || 0}
                        </div>
                        <div className="text-sm text-red-300">Failed</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {results.tests?.map((test: QualityTest, i: number) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between bg-slate-700 rounded p-3 ${
                            test.status === "Failed" ? "border-l-4 border-red-500" : ""
                          }`}
                        >
                          <div>
                            <span className="font-medium">{test.name}</span>
                            <span className="text-slate-500 text-sm ml-2">{test.testType}</span>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              test.status === "Success"
                                ? "bg-green-900 text-green-300"
                                : test.status === "Failed"
                                ? "bg-red-900 text-red-300"
                                : "bg-slate-600"
                            }`}
                          >
                            {test.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "asset" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Asset Details</h3>
                    <div className="bg-slate-700 rounded-lg p-4 space-y-4">
                      <div>
                        <div className="text-sm text-slate-400">Fully Qualified Name</div>
                        <code className="text-blue-400">{results.fullyQualifiedName}</code>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400">Description</div>
                        <p>{results.description || "No description"}</p>
                      </div>
                      {results.owner && (
                        <div>
                          <div className="text-sm text-slate-400">Owner</div>
                          <span className="text-white">{results.owner}</span>
                        </div>
                      )}
                      {results.tags?.length > 0 && (
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Tags</div>
                          <div className="flex gap-1">
                            {results.tags.map((tag: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {results.columns && (
                        <div>
                          <div className="text-sm text-slate-400 mb-2">
                            Schema ({results.columnCount} columns)
                          </div>
                          <div className="space-y-2">
                            {results.columns.map((col: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 bg-slate-600 rounded p-2 text-sm"
                              >
                                <span className="text-blue-400 font-mono">{col.name}</span>
                                <span className="text-slate-500">({col.dataType})</span>
                                {col.tags?.length > 0 && (
                                  <span className="text-purple-400 text-xs">
                                    [{col.tags.join(", ")}]
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">MCP Server Tools Available</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">search_tables</h3>
              <p className="text-sm text-slate-400">
                Search for tables, views, and data assets by name, description, tags, or owner.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">get_table_lineage</h3>
              <p className="text-sm text-slate-400">
                Get complete upstream/downstream lineage for any table or column.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">get_data_quality</h3>
              <p className="text-sm text-slate-400">
                Retrieve data quality test results, pass/fail status, and execution history.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">get_data_asset</h3>
              <p className="text-sm text-slate-400">
                Get detailed information about any data asset including schema and ownership.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">list_pipelines</h3>
              <p className="text-sm text-slate-400">
                List ingestion pipelines with status filtering and metadata.
              </p>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-medium text-blue-400 mb-2">get_policy</h3>
              <p className="text-sm text-slate-400">
                Access governance policies, classification, and compliance rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const handleExecute = async () => {
    switch (activeTab) {
      case "search":
        await executeSearch();
        break;
      case "lineage":
        await fetchLineage(query);
        break;
      case "quality":
        await fetchQuality(query);
        break;
      case "asset":
        await fetchAssetDetails(query, "table");
        break;
    }
  };