const fs = require('fs');
const path = require('path');

// Mock a minimal environment to read the products file
const productsFilePath = path.join(__dirname, 'src/data/products.ts');
const content = fs.readFileSync(productsFilePath, 'utf8');

// Use a regex to extract the rawProducts array
const startMarker = 'const rawProducts: Product[] = [';
const startIndex = content.indexOf(startMarker);
const endIndex = content.lastIndexOf('];');

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find rawProducts array');
  process.exit(1);
}

const rawProductsText = content.substring(startIndex + startMarker.length, endIndex + 1);

// Parse the products (simplified, assuming they are JSON-like objects in the TS file)
// We'll wrap it in [ ] and use eval because it's a JS/TS array literal, not strictly JSON
let products;
try {
  // Replace potential TS imports or symbols if any, but in this file it looks like a clean array
  products = eval('[' + rawProductsText + ']');
} catch (e) {
  console.error('Error parsing products:', e);
  process.exit(1);
}

const DOMAIN = 'https://farmadr0gal.co';

let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
xml += '  <channel>\n';
xml += '    <title>Drogal - Farmadr0gal</title>\n';
xml += '    <link>' + DOMAIN + '</link>\n';
xml += '    <description>Catálogo de produtos Drogal</description>\n';

products.forEach(p => {
  xml += '    <item>\n';
  xml += '      <g:id>' + (p.id || '') + '</g:id>\n';
  xml += '      <g:title><![CDATA[' + (p.name || '') + ']]></g:title>\n';
  xml += '      <g:description><![CDATA[' + (p.name || '') + ']]></g:description>\n';
  xml += '      <g:link>' + DOMAIN + '/produtos/' + (p.id || '') + '</g:link>\n';
  xml += '      <g:image_link>' + (p.image.startsWith('http') ? p.image : DOMAIN + p.image) + '</g:image_link>\n';
  xml += '      <g:condition>new</g:condition>\n';
  xml += '      <g:availability>in stock</g:availability>\n';
  xml += '      <g:price>' + (p.price || 0).toFixed(2) + ' BRL</g:price>\n';
  if (p.ean) {
    xml += '      <g:gtin>' + p.ean + '</g:gtin>\n';
  }
  xml += '      <g:brand>Drogal</g:brand>\n';
  xml += '      <g:google_product_category>' + (p.category || '') + '</g:google_product_category>\n';
  xml += '    </item>\n';
});

xml += '  </channel>\n';
xml += '</rss>';

fs.writeFileSync('public/products.xml', xml);
console.log('XML generated at public/products.xml');
