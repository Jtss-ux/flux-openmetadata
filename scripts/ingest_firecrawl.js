import fs from 'fs';

const inputFile = process.argv[2];
const outputFile = process.argv[3];

try {
  const rawData = fs.readFileSync(inputFile, 'utf8');
  const parsed = JSON.parse(rawData);
  
  const documents = [];
  
  if (parsed.data && Array.isArray(parsed.data)) {
    parsed.data.forEach(item => {
      documents.push({
        title: item.metadata?.title || item.metadata?.['og:title'] || 'OpenMetadata Documentation',
        url: item.metadata?.ogUrl || item.metadata?.sourceURL || '',
        markdown: item.markdown || item.text || ''
      });
    });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2));
  console.log(`Successfully extracted ${documents.length} documents into ${outputFile}`);
} catch (e) {
  console.error('Failed to parse and write:', e);
}
