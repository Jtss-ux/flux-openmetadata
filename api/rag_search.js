import RagEngine from './rag_engine.js';

// Initialize the RAG engine pointing to our JSON datasets
const engine = new RagEngine([
    'omni_rag_knowledge_base.json',
    'firecrawl_rag_knowledge_base.json'
]);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, topK, type } = req.body;
    
    // Support stats requests
    if (type === 'stats') {
        try {
            engine.loadDataset();
            const stats = engine.getStats();
            return res.status(200).json(stats);
        } catch (err) {
            console.error(`[API] Error fetching stats:`, err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        console.log(`[API] Received search query: "${query}"`);

        // Load the dataset into memory if it hasn't been loaded yet
        engine.loadDataset();

        // Perform the semantic/keyword search
        const results = engine.search(query, topK || 3);
        
        // Return the top K results
        res.status(200).json({ results });
    } catch (err) {
        console.error(`[API] Error processing search:`, err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
