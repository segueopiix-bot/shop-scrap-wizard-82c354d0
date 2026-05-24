import fs from 'fs';
import path from 'path';

// This is a simplified version because we can't easily import TS files directly in this environment without bun/tsx
// We will read the file and extract the data using regex or similar, or just use the raw text if it's manageable.
// Given the file is large, a regex approach on the whole file might be better.

const productsFilePath = 'src/data/products.ts';
const productsContent = fs.readFileSync(productsFilePath, 'utf-8');

// Extract the rawProducts array content
const arrayStartMarker = 'const rawProducts: Product[] = [';
const arrayEndMarker = '];\n\nexport const products';
const startIndex = productsContent.indexOf(arrayStartMarker);
const endIndex = productsContent.indexOf(arrayEndMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find products array in src/data/products.ts');
    process.exit(1);
}

const arrayText = productsContent.substring(startIndex + arrayStartMarker.length, endIndex);

// Parse products manually from the text since it's basically a JSON array
// We'll use a more robust approach to handle the objects
const products = [];
let currentPos = 0;

while (true) {
    const objStart = arrayText.indexOf('{', currentPos);
    if (objStart === -1) break;
    
    let bracketCount = 1;
    let objEnd = objStart + 1;
    let inString = false;
    
    while (bracketCount > 0 && objEnd < arrayText.length) {
        const char = arrayText[objEnd];
        if (char === '"' && arrayText[objEnd - 1] !== '\\') {
            inString = !inString;
        }
        if (!inString) {
            if (char === '{') bracketCount++;
            if (char === '}') bracketCount--;
        }
        objEnd++;
    }
    
    const objText = arrayText.substring(objStart, objEnd);
    try {
        // Replace potential trailing commas and single quotes if any (though it's mostly JSON-like)
        const jsonText = objText.replace(/,\s*([\]}])/g, '$1');
        const product = JSON.parse(jsonText);
        products.push(product);
    } catch (e) {
        // If JSON.parse fails, try a simpler regex approach for key fields
        const idMatch = objText.match(/"id":\s*"(.*?)"/);
        const nameMatch = objText.match(/"name":\s*"(.*?)"/);
        const priceMatch = objText.match(/"price":\s*([\d.]+)/);
        const imageMatch = objText.match(/"image":\s*"(.*?)"/);
        const categoryMatch = objText.match(/"category":\s*"(.*?)"/);
        
        if (idMatch && nameMatch && priceMatch && imageMatch) {
            products.push({
                id: idMatch[1],
                name: nameMatch[1],
                price: parseFloat(priceMatch[1]),
                image: imageMatch[1],
                category: categoryMatch ? categoryMatch[1] : 'Cosméticos'
            });
        }
    }
    currentPos = objEnd;
}

console.log(`Generating feed for ${products.length} products.`);

const baseUrl = 'https://tendenciacosmeticos.com.br';

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Tendencia Cosmeticos</title>
    <link>${baseUrl}</link>
    <description>Tendencia Cosmeticos — Cosméticos com os melhores preços.</description>
`;

for (const product of products) {
    const description = product.name; // Use name as description if none exists
    const category = product.category || 'Cosméticos';
    
    // Map categories to Google categories if possible
    let googleCategory = 'Health &amp; Beauty &gt; Personal Care &gt; Cosmetics';
    if (category.includes('cabelo')) googleCategory = 'Health &amp; Beauty &gt; Personal Care &gt; Hair Care';
    if (category.includes('maquiagem')) googleCategory = 'Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Makeup';

    xml += `    <item>
      <g:id>${product.id}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${baseUrl}/products/${product.id}</g:link>
      <g:image_link>${product.image}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${product.price.toFixed(2)} BRL</g:price>
      <g:condition>new</g:condition>
      <g:brand>Tendencia Cosmeticos</g:brand>
      <g:mpn>${product.id}</g:mpn>
      <g:identifier_exists>false</g:identifier_exists>
      <g:google_product_category>${googleCategory}</g:google_product_category>
      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 BRL</g:price>
      </g:shipping>
    </item>
`;
}

xml += `  </channel>
</rss>`;

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&"']/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
        }
    });
}

fs.writeFileSync('public/feed.xml', xml);
console.log('feed.xml updated successfully.');
