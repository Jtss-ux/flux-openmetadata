/**
 * AI Processor — routes user queries to the right OpenMetadata action.
 * Mirrors the intelligence of the Python MCP server tools.
 */

import { searchEntities, getEntityLineage } from '../api/openmetadata'

/**
 * Intent patterns for query routing.
 */
const INTENTS = [
  {
    type: 'LINEAGE',
    tool: 'get_table_lineage',
    patterns: ['lineage', 'where does', 'data flow', 'upstream', 'downstream', 'source of', 'feeds into', 'depend'],
    message: 'Scanning the timeline for lineage connections — tracing data flows across your pipeline...',
    action: async (q) => {
      const res = await searchEntities(q)
      const entity = res?.hits?.hits?.[0]?._source
      if (entity?.id) {
        try {
          // Return the lineage API response (entity + edges) — even if edges are empty
          const lineage = await getEntityLineage(entity.entityType || 'table', entity.id)
          return lineage
        } catch {
          // Lineage call failed (e.g. entity type not supported) — return search results
          return res
        }
      }
      // No entity found — return the search results for the fallback formatter
      return res
    },
  },
  {
    type: 'QUALITY',
    tool: 'get_data_quality',
    patterns: ['quality', 'test', 'pass', 'fail', 'anomaly', 'drift', 'health', 'profil'],
    message: 'Running quality diagnostics through the flux capacitor...',
    action: async (q) => searchEntities(q + ' test'),
  },
  {
    type: 'GOVERNANCE',
    tool: 'get_policy',
    patterns: ['pii', 'policy', 'governance', 'compliance', 'classify', 'tag', 'sensitive', 'access control', 'permission', 'gdpr'],
    message: 'Querying the governance timeline — retrieving compliance data...',
    action: async (q) => searchEntities(q),
  },
  {
    type: 'PIPELINE',
    tool: 'list_pipelines',
    patterns: ['pipeline', 'ingestion', 'airflow', 'dbt', 'airbyte', 'ingest', 'etl', 'elt'],
    message: 'Scanning the pipeline dimension for active data flows...',
    action: async (q) => searchEntities(q),
  },
  {
    type: 'DASHBOARD',
    tool: 'get_data_asset',
    patterns: ['dashboard', 'report', 'chart', 'visualization', 'looker', 'tableau', 'metabase', 'powerbi', 'superset'],
    message: 'Navigating the dashboard sector of the metadata universe...',
    action: async (q) => searchEntities(q, 'dashboard_search_index'),
  },
]

/**
 * Process a user query and return intent + action.
 */
export const processUserQuery = async (query) => {
  const lower = query.toLowerCase()

  // Match intent
  for (const intent of INTENTS) {
    if (intent.patterns.some(p => lower.includes(p))) {
      return {
        type: intent.type,
        tool: intent.tool,
        message: intent.message,
        action: () => intent.action(query),
      }
    }
  }

  // Default: discovery search
  return {
    type: 'DISCOVERY',
    tool: 'search_tables',
    message: `Traveling through the metadata catalog to find: "${query}"...`,
    action: () => searchEntities(query),
  }
}
