// Raw-text dataset import. Same token map as the React app
// (src/data/userDataset.ts) so Postman imports behave identically.
const TOKEN_TO_CANONICAL = {
  'soap': 'SOAP', 'shampoo': 'SHAMPOO', 'makeup brush': 'MAKEUP-BRUSH', 'make up brush': 'MAKEUP-BRUSH',
  'hair spray': 'HAIR-SPRAY', 'setting spray': 'HAIR-SPRAY', 'hair gel': 'HAIR-GEL',
  'lip liner': 'LIP-LINER', 'highlighter': 'HIGHLIGHTER', 'blush': 'BLUSH',
  'blender': 'BLENDER', 'contour': 'CONTOUR', 'face wipes': 'FACE-WIPES',
  'face roller': 'FACE-ROLLER', 'gua sha': 'GUA-SHA',
  'eyelash curler': 'EYELASH-CURLER', 'eye curler': 'EYELASH-CURLER', 'lashes': 'EYELASH-CURLER',
  'eyeshadow': 'EYESHADOW', 'eyeliner': 'EYELINER', 'pimple patch': 'PIMPLE-PATCH',
  'face razor': 'FACE-RAZOR', 'face powder': 'FACE-POWDER', 'lipstick': 'LIPSTICK',
  'conditioner': 'CONDITIONER', 'body wash': 'BODY-WASH', 'eye patch': 'EYE-PATCH',
  'perfume': 'PERFUME', 'floral perfume': 'PERFUME',
  'face wash': 'FACE-WASH', 'cleanser': 'CLEANSER', 'toner': 'TONER', 'serum': 'SERUM',
  'sunscreen': 'SUNSCREEN', 'spf50 sunscreen': 'SUNSCREEN', 'face mask': 'FACE-MASK',
  'foundation': 'FOUNDATION', 'matte foundation': 'FOUNDATION', 'concealer': 'CONCEALER',
  'mascara': 'MASCARA', 'nail polish': 'NAIL-POLISH', 'hair mask': 'HAIR-MASK', 'hair masks': 'HAIR-MASK',
};

function canonicalOfTitle(title) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
}

function parseDatasetText(rawText) {
  const txns = [], rows = [];
  rawText.split('\n').map(l => l.trim()).filter(Boolean).forEach((line, idx) => {
    let id, items;
    if (line.includes('|')) {
      const [a, b] = line.split('|');
      id = (a || '').trim() || `T${String(idx + 1).padStart(4, '0')}`;
      items = (b || '').trim();
    } else {
      id = `T${String(idx + 1).padStart(4, '0')}`;
      items = line;
    }
    const ids = [];
    for (const tok of items.split(',').map(s => s.trim()).filter(Boolean)) {
      const c = TOKEN_TO_CANONICAL[tok.toLowerCase()];
      if (c && !ids.includes(c)) ids.push(c);
    }
    if (ids.length) txns.push({ id, orderId: `ORD-DATA-${idx + 1}`, date: '2026-09-28', itemIds: ids });
    rows.push({
      transaction_id: id, customer_id: `C${String(100 + (idx % 80)).padStart(3, '0')}`,
      transaction_date: '2026-09-28', products_purchased: items,
      type: ids.length >= 3 ? 'Strong' : ids.length === 2 ? 'Pair' : 'Single',
      matchedProductIds: ids,
    });
  });
  return { txns, rows };
}

module.exports = { TOKEN_TO_CANONICAL, canonicalOfTitle, parseDatasetText };
