/**
 * OpenMetadata API Client
 * Handles requests for data discovery, lineage, and governance.
 * - Dev mode:  uses Vite proxy (/api → sandbox) to avoid CORS
 * - Production: calls the sandbox directly (CORS permitted on sandbox)
 */

// In dev, Vite proxies /api → sandbox. In prod, call sandbox directly.
const OPENMETADATA_BASE_URL = import.meta.env.DEV
  ? '/api/v1'
  : 'https://sandbox.open-metadata.org/api/v1';

const AUTH_TOKEN = 'eyJraWQiOiJHYjM4OWEtOWY3Ni1nZGpzLWE5MmotMDI0MmJrOTQzNTYiLCJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJvcGVuLW1ldGFkYXRhLm9yZyIsInN1YiI6Impvc2VwaHN0MjAwNyIsInJvbGVzIjpbXSwiZW1haWwiOiJqb3NlcGhzdDIwMDdAZ21haWwuY29tIiwiaXNCb3QiOmZhbHNlLCJ0b2tlblR5cGUiOiJQRVJTT05BTF9BQ0NFU1MiLCJ1c2VybmFtZSI6Impvc2VwaHN0MjAwNyIsInByZWZlcnJlZF91c2VybmFtZSI6Impvc2VwaHN0MjAwNyIsImlhdCI6MTc3Njc5NzI5MywiZXhwIjoxNzg0NTczMjkzfQ.Ar-fjM-RmPMh72tZb6SeABgqGNSDWe7zc8GCoM2tm7M4PHLzU82mNY5DnhN3AstXXfvIyfVBfI5dpPEKnzRm7XTSzRC8aTcXAqFWohtwon5G5S-ROu0Q067rbdJbAsBNEd3E1rsjkkV1wi2uLOCUPQIekWDZ2XDMuv_Gu_v7U-3tBN_xG5icdYjSWZLCc8ibBXuYQB63duti_N0eCsSVQI76pxJSC4kUgMvkYmrsderYNgklDsKb3o3226tqTBmHYeYBVu8KzeTNSvQN8zu2h9A1iA2MBg8Bf_dbAakreFIE4yELJQ3JjwOg8rOHxa_dbCNe1QhNIH745fFaXUoevQ';


export const fetchMetadata = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${OPENMETADATA_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN ? `Bearer ${AUTH_TOKEN}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenMetadata API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch from OpenMetadata:', error);
    throw error;
  }
};

/**
 * Search for entities (tables, topics, dashboards, etc.)
 */
export const searchEntities = async (query, index = 'table_search_index') => {
  return fetchMetadata(`/search/query?q=${encodeURIComponent(query)}&index=${index}`);
};

/**
 * Fetch lineage for a specific entity
 */
export const getEntityLineage = async (entityType, entityId) => {
  return fetchMetadata(`/lineage/${entityType}/${entityId}?upstreamDepth=2&downstreamDepth=2`);
};

/**
 * Fetch glossary terms
 */
export const getGlossaryTerms = async () => {
  return fetchMetadata('/glossaries/name/BusinessGlossary?fields=terms');
};
