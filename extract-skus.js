const fs = require('fs');
const path = require('path');

// Read image files from antscorner-images
const imagesDir = 'antscorner-images';
const files = fs.readdirSync(imagesDir);

// Extract SKUs from filenames (remove extensions)
const skus = files
  .filter(f => f.match(/\.(png|jpg)$/i))
  .map(f => path.parse(f).name)
  .sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });

// Read Loyverse items
const loyverseItems = JSON.parse(
  fs.readFileSync('.cache/loyverse_items.json', 'utf8')
);

// Create mapping structure
const mapping = skus.map(sku => {
  // Find matching Loyverse item by SKU
  let matchedItem = null;
  for (const item of loyverseItems) {
    const variant = item.variants?.find(v => v.sku === sku);
    if (variant) {
      matchedItem = {
        item_id: item.id,
        item_name: item.item_name,
        variant_id: variant.variant_id,
        sku: variant.sku
      };
      break;
    }
  }

  return {
    sku: sku,
    image_filename: `${sku}.png`,
    has_image: true,
    loyverse_match: matchedItem
  };
});

// Write mapping to JSON file
const outputPath = 'sku-image-mapping.json';
fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

console.log(`✅ Created mapping file with ${mapping.length} SKUs`);
console.log(`   Matched: ${mapping.filter(m => m.loyverse_match).length}`);
console.log(`   Unmatched: ${mapping.filter(m => !m.loyverse_match).length}`);
console.log(`   Output: ${outputPath}`);
