import RagEngine from '../api/rag_engine.js';
import fs from 'fs';

async function test() {
    const omniData = JSON.parse(fs.readFileSync('./api/omni_rag_knowledge_base.json', 'utf8'));
    const firecrawlData = JSON.parse(fs.readFileSync('./api/firecrawl_rag_knowledge_base.json', 'utf8'));
    
    const engine = new RagEngine([...omniData, ...firecrawlData]);
    engine.loadDataset(); // Trigger processing
    
    console.log('Stats:', engine.getStats());
    console.log('Search Result for "lineage":', engine.search('lineage', 1));
}

test();
