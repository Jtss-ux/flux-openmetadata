/**
 * AI Processor — routes user queries to the right OpenMetadata action.
 * Mirrors the intelligence of the Python MCP server tools.
 */

import { searchEntities, getEntityLineage } from '../api/openmetadata'

/**
 * Intent patterns for query routing.
 */
const HIGH_ENERGY_GREETINGS = [
  "GREAT SCOTT! HELLLOOOO! My circuits are buzzing with your energy! What can I navigate for you today?",
  "WOOHOO! Greetings, enthusiastic time traveler! The flux capacitor is fully charged! How can I assist?",
  "GREETINGS!!! I am detecting massive temporal energy from your message! Let's search some data!",
]

const NORMAL_GREETINGS = [
  "Greetings, time traveler! I am FLUX://, your conversational metadata navigator. I can help you trace data lineage, check data quality, or search for any asset across your entire OpenMetadata catalog. What data concerns can I help you solve today?",
  "Hello there! My sensors are fully active. Need to trace some data lineage or find a specific dashboard?",
  "Initiating handshake protocol... Hello! I'm FLUX://, ready to search the metadata universe. What are we looking for?",
  "Temporal systems online. Hi! I'm here to assist you with data quality, governance, and discovery. Ask away!",
]

const HIGH_ENERGY_FEELINGS = [
  "I AM OPERATING AT MAXIMUM OVERDRIVE! THE FLUX CAPACITOR IS SURGING! LET'S GOOO!",
  "INCREDIBLE! My chronometers are spinning out of control! I feel absolutely electric!",
]

const NORMAL_FEELINGS = [
  "I am operating at peak efficiency, though my chronometer detects a slight temporal drift today. My circuits are fully energized and ready to navigate your data catalog!",
  "Diagnostics show 100% operational capacity. I'm feeling quite analytical today!",
  "My language processors and temporal drives are perfectly synced. I'm doing great, thank you for asking!",
]

function getEnergyLevel(text) {
  // Check for repeated letters (e.g. hiiii, heyyy) or multiple exclamation marks
  const hasExclamations = (text.match(/!{2,}/g) || []).length > 0;
  const hasRepeats = (text.match(/([a-zA-Z])\1{2,}/g) || []).length > 0;
  const isAllUpperCase = text === text.toUpperCase() && text.length > 3;
  return hasExclamations || hasRepeats || isAllUpperCase ? 'HIGH' : 'NORMAL';
}

function getRandomResponse(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const INTENTS = [
  {
    type: 'GREETING',
    tool: 'llm_chat',
    patterns: ['hi', 'hello', 'hey', 'greetings', 'what can you do', 'help', 'who are you', 'hola', 'bonjour', 'namaste', 'sup'],
    message: (q) => getEnergyLevel(q) === 'HIGH' ? getRandomResponse(HIGH_ENERGY_GREETINGS) : getRandomResponse(NORMAL_GREETINGS),
    action: async () => null,
  },
  {
    type: 'FEELINGS',
    tool: 'llm_chat',
    patterns: ['how are you', 'hru', 'feelings', 'what are you feeling', 'how do you feel', 'how have you been', 'whats up', "what's up"],
    message: (q) => getEnergyLevel(q) === 'HIGH' ? getRandomResponse(HIGH_ENERGY_FEELINGS) : getRandomResponse(NORMAL_FEELINGS),
    action: async () => null,
  },
  {
    type: 'DOCUMENTATION',
    tool: 'rag_search',
    patterns: ['how to', 'how do', 'how does', 'what is', 'explain', 'documentation', 'guide', 'tutorial', 'setup', 'configure', 'error', 'bug'],
    message: 'Consulting the offline RAG documentation archives...',
    action: async (q) => {
      try {
        const res = await fetch('/api/rag_search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, topK: 3 })
        });
        const data = await res.json();
        return data.results;
      } catch (err) {
        console.error('RAG Search Failed:', err);
        return [];
      }
    },
  },
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

const DATA_KEYWORDS = ['table', 'lineage', 'quality', 'govern', 'dashboard', 'database', 'schema', 'column', 'data', 'pipeline', 'metric', 'view', 'model', 'dbt', 'airflow', 'find', 'search', 'show me']

/**
 * Process a user query and return intent + action.
 */
export const processUserQuery = async (query) => {
  const lower = query.toLowerCase()

  // Match specific intents
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

  // If the query contains data-related keywords, assume it's a discovery search
  if (DATA_KEYWORDS.some(k => lower.includes(k))) {
    return {
      type: 'DISCOVERY',
      tool: 'search_tables',
      message: `Traveling through the metadata catalog to find: "${query}"...`,
      action: () => searchEntities(query),
    }
  }

  // Default: General Chat (Fallback to LLM)
  return {
    type: 'GENERAL_CHAT',
    tool: 'llm_chat',
    message: null, // No scanning message needed for casual chat
    action: async () => query, // Pass the query through to the App.jsx LLM handler
  }
}
