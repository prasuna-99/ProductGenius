import { Product, Transaction } from '../types';

export interface RawDatasetRow {
  transaction_id: string;
  customer_id: string;
  transaction_date: string;
  products_purchased: string;
  type: string;
  matchedProductIds: string[];
}

/** Normalize a display title to its shared mining key. */
export function toCanonicalId(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase();
}

// Multi-seller catalog. `id` = listingId (seller-specific, for cart/stock/money).
// `canonicalId` = shared key (for Apriori). Same product from different sellers shares it.
// All prices in Rupees (Rs). Images served from public/images/products/
export const GOOGLE_ADJUSTED_PRODUCTS: Product[] = [
  { id: 'PRD-000012-000001', canonicalId: 'SOAP', title: 'Soap', category: 'Skincare', price: 250, originalPrice: 320, rating: 4.5, reviewsCount: 90, inStock: true, stockCount: 60, sku: 'PG-SOAP-01', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Gentle daily soap.', features: ['Daily use', 'All skin types'], imageUrl: '/images/products/Body Wash.jpg', tags: ['Skincare', 'Soap'], isFeatured: true, googleSearchMatchedTerm: 'Soap' },
  { id: 'PRD-000007-000002', canonicalId: 'SHAMPOO', title: 'Shampoo', category: 'Bodycare', price: 750, originalPrice: 900, rating: 4.6, reviewsCount: 102, inStock: true, stockCount: 38, sku: 'PG-SH-02', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Repair shampoo for strong hair.', features: ['Repair', 'Daily use'], imageUrl: '/images/products/Shampoo.jpg', tags: ['Bodycare', 'Shampoo'], isFeatured: true, googleSearchMatchedTerm: 'Shampoo' },
  { id: 'PRD-000007-000003', canonicalId: 'MAKEUP-BRUSH', title: 'Makeup Brush', category: 'Makeup', price: 650, originalPrice: 800, rating: 4.5, reviewsCount: 70, inStock: true, stockCount: 40, sku: 'PG-MB-03', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Soft makeup brush set.', features: ['Soft bristles', 'Blends easily'], imageUrl: '/images/products/Make up Brush.jpg', tags: ['Makeup', 'Makeup Brush'], isFeatured: true, googleSearchMatchedTerm: 'Makeup Brush' },
  { id: 'PRD-000007-000004', canonicalId: 'HAIR-SPRAY', title: 'Hair Spray', category: 'Bodycare', price: 850, originalPrice: 1000, rating: 4.4, reviewsCount: 55, inStock: true, stockCount: 30, sku: 'PG-HS-04', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Long hold hair spray.', features: ['Long hold', 'No residue'], imageUrl: '/images/products/Setting Spray.jpg', tags: ['Bodycare', 'Hair Spray'], googleSearchMatchedTerm: 'Hair Spray' },
  { id: 'PRD-000007-000005', canonicalId: 'HAIR-GEL', title: 'Hair Gel', category: 'Bodycare', price: 550, originalPrice: 650, rating: 4.3, reviewsCount: 40, inStock: true, stockCount: 35, sku: 'PG-HG-05', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Strong hold hair gel.', features: ['Strong hold', 'Shiny finish'], imageUrl: '/images/products/Hair Gel.jpg', tags: ['Bodycare', 'Hair Gel'], googleSearchMatchedTerm: 'Hair Gel' },
  { id: 'PRD-000007-000006', canonicalId: 'LIP-LINER', title: 'Lip Liner', category: 'Makeup', price: 450, originalPrice: 550, rating: 4.4, reviewsCount: 62, inStock: true, stockCount: 44, sku: 'PG-LL-06', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Precise lip liner.', features: ['Precise', 'Long lasting'], imageUrl: '/images/products/Lipstick.jpg', tags: ['Makeup', 'Lip Liner'], googleSearchMatchedTerm: 'Lip Liner' },
  { id: 'PRD-000007-000007', canonicalId: 'HIGHLIGHTER', title: 'Highlighter', category: 'Makeup', price: 950, originalPrice: 1150, rating: 4.6, reviewsCount: 78, inStock: true, stockCount: 32, sku: 'PG-HL-07', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Glow highlighter.', features: ['Glow', 'Blendable'], imageUrl: '/images/products/Highlighter.jpg', tags: ['Makeup', 'Highlighter'], isFeatured: true, googleSearchMatchedTerm: 'Highlighter' },
  { id: 'PRD-000007-000008', canonicalId: 'BLUSH', title: 'Blush', category: 'Makeup', price: 850, originalPrice: 1000, rating: 4.5, reviewsCount: 74, inStock: true, stockCount: 36, sku: 'PG-BL-08', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Natural blush.', features: ['Natural flush', 'Long wear'], imageUrl: '/images/products/Blush.jpg', tags: ['Makeup', 'Blush'], googleSearchMatchedTerm: 'Blush' },
  { id: 'PRD-000007-000009', canonicalId: 'BLENDER', title: 'Blender', category: 'Makeup', price: 350, originalPrice: 450, rating: 4.4, reviewsCount: 66, inStock: true, stockCount: 50, sku: 'PG-BD-09', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Soft makeup blender sponge.', features: ['Soft', 'Even blend'], imageUrl: '/images/products/Blender.jpg', tags: ['Makeup', 'Blender'], googleSearchMatchedTerm: 'Blender' },
  { id: 'PRD-000007-000010', canonicalId: 'CONTOUR', title: 'Contour', category: 'Makeup', price: 1050, originalPrice: 1250, rating: 4.5, reviewsCount: 60, inStock: true, stockCount: 28, sku: 'PG-CT-10', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Sculpting contour kit.', features: ['Sculpt', 'Blendable'], imageUrl: '/images/products/Contour.jpg', tags: ['Makeup', 'Contour'], googleSearchMatchedTerm: 'Contour' },
  { id: 'PRD-000007-000011', canonicalId: 'FACE-WIPES', title: 'Face Wipes', category: 'Skincare', price: 350, originalPrice: 450, rating: 4.3, reviewsCount: 88, inStock: true, stockCount: 55, sku: 'PG-FW-11', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Gentle face wipes.', features: ['Gentle', 'Travel pack'], imageUrl: '/images/products/Face Wipes.jpg', tags: ['Skincare', 'Face Wipes'], googleSearchMatchedTerm: 'Face Wipes' },
  { id: 'PRD-000007-000012', canonicalId: 'FACE-ROLLER', title: 'Face Roller', category: 'Skincare', price: 750, originalPrice: 950, rating: 4.5, reviewsCount: 52, inStock: true, stockCount: 30, sku: 'PG-FR-12', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Cooling face roller.', features: ['Depuff', 'Firming'], imageUrl: '/images/products/Face Roller.jpg', tags: ['Skincare', 'Face Roller'], googleSearchMatchedTerm: 'Face Roller' },
  { id: 'PRD-000007-000013', canonicalId: 'GUA-SHA', title: 'Gua Sha', category: 'Skincare', price: 650, originalPrice: 800, rating: 4.6, reviewsCount: 58, inStock: true, stockCount: 32, sku: 'PG-GS-13', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Stone gua sha tool.', features: ['Sculpt', 'Relax'], imageUrl: '/images/products/Gua Sha.jpg', tags: ['Skincare', 'Gua Sha'], googleSearchMatchedTerm: 'Gua Sha' },
  { id: 'PRD-000007-000014', canonicalId: 'EYELASH-CURLER', title: 'Eyelash Curler', category: 'Makeup', price: 550, originalPrice: 700, rating: 4.4, reviewsCount: 49, inStock: true, stockCount: 34, sku: 'PG-EC-14', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Gentle eyelash curler.', features: ['Gentle', 'No pinch'], imageUrl: '/images/products/Eye Curler.jpg', tags: ['Makeup', 'Eyelash Curler'], googleSearchMatchedTerm: 'Eyelash Curler' },
  { id: 'PRD-000007-000015', canonicalId: 'EYESHADOW', title: 'Eyeshadow', category: 'Makeup', price: 1250, originalPrice: 1500, rating: 4.6, reviewsCount: 71, inStock: true, stockCount: 26, sku: 'PG-ES-15', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Blendable eyeshadow palette.', features: ['Pigmented', 'Blendable'], imageUrl: '/images/products/Eyeshadow.jpg.jpeg', tags: ['Makeup', 'Eyeshadow'], googleSearchMatchedTerm: 'Eyeshadow' },
  { id: 'PRD-000007-000016', canonicalId: 'EYELINER', title: 'Eyeliner', category: 'Makeup', price: 850, originalPrice: 1000, rating: 4.5, reviewsCount: 81, inStock: true, stockCount: 33, sku: 'PG-EL-16', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Precise eyeliner pen.', features: ['Precise', 'Waterproof'], imageUrl: '/images/products/Eyeliner.jpg', tags: ['Makeup', 'Eyeliner'], googleSearchMatchedTerm: 'Eyeliner' },
  { id: 'PRD-000007-000017', canonicalId: 'PIMPLE-PATCH', title: 'Pimple Patch', category: 'Skincare', price: 450, originalPrice: 550, rating: 4.5, reviewsCount: 95, inStock: true, stockCount: 48, sku: 'PG-PP-17', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Overnight pimple patches.', features: ['Overnight', 'Invisible'], imageUrl: '/images/products/Pimple patch.jpg', tags: ['Skincare', 'Pimple Patch'], googleSearchMatchedTerm: 'Pimple Patch' },
  { id: 'PRD-000007-000018', canonicalId: 'FACE-RAZOR', title: 'Face Razor', category: 'Skincare', price: 400, originalPrice: 500, rating: 4.3, reviewsCount: 57, inStock: true, stockCount: 42, sku: 'PG-FZ-18', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Gentle face razor.', features: ['Gentle', 'Precise'], imageUrl: '/images/products/Face Razor.jpg.jpeg', tags: ['Skincare', 'Face Razor'], googleSearchMatchedTerm: 'Face Razor' },
  { id: 'PRD-000007-000019', canonicalId: 'FACE-POWDER', title: 'Face Powder', category: 'Makeup', price: 1150, originalPrice: 1350, rating: 4.5, reviewsCount: 63, inStock: true, stockCount: 29, sku: 'PG-FP-19', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Matte face powder.', features: ['Matte', 'Oil control'], imageUrl: '/images/products/Face Powder.jpg.jpeg', tags: ['Makeup', 'Face Powder'], googleSearchMatchedTerm: 'Face Powder' },
  { id: 'PRD-000007-000020', canonicalId: 'LIPSTICK', title: 'Lipstick', category: 'Makeup', price: 950, originalPrice: 1150, rating: 4.7, reviewsCount: 140, inStock: true, stockCount: 45, sku: 'PG-LP-20', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Rich color lipstick.', features: ['Rich color', 'Long lasting'], imageUrl: '/images/products/Lipstick.jpg', tags: ['Makeup', 'Lipstick', 'Best Seller'], isFeatured: true, googleSearchMatchedTerm: 'Lipstick' },
  { id: 'PRD-000007-000021', canonicalId: 'CONDITIONER', title: 'Conditioner', category: 'Bodycare', price: 800, originalPrice: 950, rating: 4.6, reviewsCount: 95, inStock: true, stockCount: 36, sku: 'PG-CD-21', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Smooth conditioner.', features: ['Soft hair', 'Repair'], imageUrl: '/images/products/Conditioner.jpg', tags: ['Bodycare', 'Conditioner'], googleSearchMatchedTerm: 'Conditioner' },
  { id: 'PRD-000007-000022', canonicalId: 'BODY-WASH', title: 'Body Wash', category: 'Bodycare', price: 650, originalPrice: 800, rating: 4.5, reviewsCount: 84, inStock: true, stockCount: 42, sku: 'PG-BW-22', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Fresh body wash.', features: ['Fresh', 'Daily use'], imageUrl: '/images/products/Body Wash.jpg', tags: ['Bodycare', 'Body Wash'], googleSearchMatchedTerm: 'Body Wash' },
  { id: 'PRD-000007-000023', canonicalId: 'EYE-PATCH', title: 'Eye Patch', category: 'Skincare', price: 650, originalPrice: 800, rating: 4.4, reviewsCount: 38, inStock: true, stockCount: 30, sku: 'PG-EP-23', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Cooling under-eye patches.', features: ['Depuff', 'Brighten'], imageUrl: '/images/products/Eye Patch.jpg', tags: ['Skincare', 'Eye Patch'], googleSearchMatchedTerm: 'Eye Patch' },
  { id: 'PRD-000007-000024', canonicalId: 'PERFUME', title: 'Perfume', category: 'Fragrance', price: 2450, originalPrice: 2900, rating: 4.8, reviewsCount: 77, inStock: true, stockCount: 22, sku: 'PG-PF-24', sellerId: 'USR-SEL-20261007-000012', sellerName: 'Atelier Bordeaux & Co.', description: 'Long lasting perfume.', features: ['Long lasting', 'Fresh scent'], imageUrl: '/images/products/Perfume.jpg', tags: ['Fragrance', 'Perfume'], isFeatured: true, googleSearchMatchedTerm: 'Perfume' },
  // Second seller listings sharing canonicals (demo: same Soap + Shampoo from another shop)
  { id: 'PRD-000008-000001', canonicalId: 'SOAP', title: 'Soap', category: 'Skincare', price: 275, originalPrice: 340, rating: 4.4, reviewsCount: 21, inStock: true, stockCount: 25, sku: 'PG-SOAP-S2', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Handmade soap from second seller.', features: ['Handmade', 'Natural'], imageUrl: '/images/products/Body Wash.jpg', tags: ['Skincare', 'Soap'], googleSearchMatchedTerm: 'Soap' },
  { id: 'PRD-000008-000002', canonicalId: 'SHAMPOO', title: 'Shampoo', category: 'Bodycare', price: 795, originalPrice: 950, rating: 4.5, reviewsCount: 19, inStock: true, stockCount: 20, sku: 'PG-SH-S2', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Herbal shampoo from second seller.', features: ['Herbal', 'Gentle'], imageUrl: '/images/products/Shampoo.jpg', tags: ['Bodycare', 'Shampoo'], googleSearchMatchedTerm: 'Shampoo' },
  // Himalayan Glow House old-catalog listings (seller-2). Shared canonicals merge
  // with Rosy + Atelier at mining time (e.g. three LIPSTICK listings -> LIPSTICK).
  { id: 'PRD-000008-000003', canonicalId: 'FACE-WASH', title: 'Face Wash', category: 'Skincare', price: 799, originalPrice: 990, rating: 4.6, reviewsCount: 33, inStock: true, stockCount: 26, sku: 'PG-S2-01', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Gentle daily face wash from Himalayan Glow.', features: ['Daily use', 'All skin types'], imageUrl: '/images/products/Face Wash.jpg', tags: ['Skincare', 'Face Wash'], googleSearchMatchedTerm: 'Face Wash' },
  { id: 'PRD-000008-000004', canonicalId: 'CLEANSER', title: 'Cleanser', category: 'Skincare', price: 899, originalPrice: 1090, rating: 4.5, reviewsCount: 28, inStock: true, stockCount: 24, sku: 'PG-S2-02', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Deep cleansing cleanser from Himalayan Glow.', features: ['Deep cleanse', 'Daily use'], imageUrl: '/images/products/Cleanser.jpg', tags: ['Skincare', 'Cleanser'], googleSearchMatchedTerm: 'Cleanser' },
  { id: 'PRD-000008-000005', canonicalId: 'TONER', title: 'Toner', category: 'Skincare', price: 1050, originalPrice: 1250, rating: 4.4, reviewsCount: 25, inStock: true, stockCount: 22, sku: 'PG-S2-03', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Balancing toner from Himalayan Glow.', features: ['Balances skin', 'Preps for serum'], imageUrl: '/images/products/Toner.jpg', tags: ['Skincare', 'Toner'], googleSearchMatchedTerm: 'Toner' },
  { id: 'PRD-000008-000006', canonicalId: 'SERUM', title: 'Serum', category: 'Skincare', price: 1790, originalPrice: 2150, rating: 4.7, reviewsCount: 41, inStock: true, stockCount: 20, sku: 'PG-S2-04', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Active glow serum from Himalayan Glow.', features: ['Glow', 'Repair'], imageUrl: '/images/products/Serum.jpg', tags: ['Skincare', 'Serum'], isFeatured: true, googleSearchMatchedTerm: 'Serum' },
  { id: 'PRD-000008-000007', canonicalId: 'SUNSCREEN', title: 'Sunscreen', category: 'Skincare', price: 1190, originalPrice: 1390, rating: 4.5, reviewsCount: 30, inStock: true, stockCount: 24, sku: 'PG-S2-05', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Daily sun protection from Himalayan Glow.', features: ['UV protection', 'Daily use'], imageUrl: '/images/products/sunscreen.jpg', tags: ['Skincare', 'Sunscreen'], googleSearchMatchedTerm: 'Sunscreen' },
  { id: 'PRD-000008-000008', canonicalId: 'FACE-MASK', title: 'Face Mask', category: 'Skincare', price: 699, originalPrice: 850, rating: 4.4, reviewsCount: 22, inStock: true, stockCount: 20, sku: 'PG-S2-06', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Weekly face mask from Himalayan Glow.', features: ['Weekly care', 'Deep nourish'], imageUrl: '/images/products/Face Mask.jpg', tags: ['Skincare', 'Face Mask'], googleSearchMatchedTerm: 'Face Mask' },
  { id: 'PRD-000008-000009', canonicalId: 'FOUNDATION', title: 'Foundation', category: 'Makeup', price: 1590, originalPrice: 1890, rating: 4.5, reviewsCount: 27, inStock: true, stockCount: 22, sku: 'PG-S2-07', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Smooth foundation from Himalayan Glow.', features: ['Even tone', 'Long wear'], imageUrl: '/images/products/Foundation.jpg', tags: ['Makeup', 'Foundation'], googleSearchMatchedTerm: 'Foundation' },
  { id: 'PRD-000008-000010', canonicalId: 'CONCEALER', title: 'Concealer', category: 'Makeup', price: 1090, originalPrice: 1290, rating: 4.4, reviewsCount: 24, inStock: true, stockCount: 23, sku: 'PG-S2-08', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'High coverage concealer from Himalayan Glow.', features: ['High coverage', 'Blends easily'], imageUrl: '/images/products/Concealer.jpg', tags: ['Makeup', 'Concealer'], googleSearchMatchedTerm: 'Concealer' },
  { id: 'PRD-000008-000011', canonicalId: 'LIPSTICK', title: 'Lipstick', category: 'Makeup', price: 899, originalPrice: 1090, rating: 4.6, reviewsCount: 45, inStock: true, stockCount: 30, sku: 'PG-S2-09', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Rich color lipstick from Himalayan Glow.', features: ['Rich color', 'Long lasting'], imageUrl: '/images/products/Lipstick.jpg', tags: ['Makeup', 'Lipstick'], googleSearchMatchedTerm: 'Lipstick' },
  { id: 'PRD-000008-000012', canonicalId: 'MASCARA', title: 'Mascara', category: 'Makeup', price: 999, originalPrice: 1190, rating: 4.4, reviewsCount: 21, inStock: true, stockCount: 22, sku: 'PG-S2-10', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Volume mascara from Himalayan Glow.', features: ['Volume', 'Smudge proof'], imageUrl: '/images/products/Mascara.jpg', tags: ['Makeup', 'Mascara'], googleSearchMatchedTerm: 'Mascara' },
  { id: 'PRD-000008-000013', canonicalId: 'EYELINER', title: 'Eyeliner', category: 'Makeup', price: 799, originalPrice: 950, rating: 4.4, reviewsCount: 26, inStock: true, stockCount: 25, sku: 'PG-S2-11', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Precise eyeliner from Himalayan Glow.', features: ['Precise', 'Waterproof'], imageUrl: '/images/products/Eyeliner.jpg', tags: ['Makeup', 'Eyeliner'], googleSearchMatchedTerm: 'Eyeliner' },
  { id: 'PRD-000008-000014', canonicalId: 'NAIL-POLISH', title: 'Nail Polish', category: 'Makeup', price: 499, originalPrice: 650, rating: 4.3, reviewsCount: 19, inStock: true, stockCount: 34, sku: 'PG-S2-12', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Shiny nail polish from Himalayan Glow.', features: ['Shiny', 'Quick dry'], imageUrl: '/images/products/Nail Polish.jpg', tags: ['Makeup', 'Nail Polish'], googleSearchMatchedTerm: 'Nail Polish' },
  { id: 'PRD-000008-000015', canonicalId: 'CONDITIONER', title: 'Conditioner', category: 'Bodycare', price: 750, originalPrice: 900, rating: 4.5, reviewsCount: 29, inStock: true, stockCount: 27, sku: 'PG-S2-13', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Smooth conditioner from Himalayan Glow.', features: ['Soft hair', 'Repair'], imageUrl: '/images/products/Conditioner.jpg', tags: ['Bodycare', 'Conditioner'], googleSearchMatchedTerm: 'Conditioner' },
  { id: 'PRD-000008-000016', canonicalId: 'HAIR-MASK', title: 'Hair Mask', category: 'Bodycare', price: 899, originalPrice: 1090, rating: 4.4, reviewsCount: 20, inStock: true, stockCount: 20, sku: 'PG-S2-14', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Weekly hair mask from Himalayan Glow.', features: ['Weekly', 'Deep repair'], imageUrl: '/images/products/Hair Mask.jpg', tags: ['Bodycare', 'Hair Mask'], googleSearchMatchedTerm: 'Hair Mask' },
  { id: 'PRD-000008-000017', canonicalId: 'PERFUME', title: 'Perfume', category: 'Fragrance', price: 2390, originalPrice: 2850, rating: 4.7, reviewsCount: 25, inStock: true, stockCount: 16, sku: 'PG-S2-15', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Long lasting perfume from Himalayan Glow.', features: ['Long lasting', 'Fresh scent'], imageUrl: '/images/products/Perfume.jpg', tags: ['Fragrance', 'Perfume'], googleSearchMatchedTerm: 'Perfume' },
  { id: 'PRD-000008-000018', canonicalId: 'BODY-LOTION', title: 'Body Lotion', category: 'Bodycare', price: 799, originalPrice: 950, rating: 4.5, reviewsCount: 28, inStock: true, stockCount: 26, sku: 'PG-S2-16', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Nourishing body lotion from Himalayan Glow.', features: ['Nourish', 'Soft skin'], imageUrl: '/images/products/Body Lotion.jpg', tags: ['Bodycare', 'Body Lotion'], googleSearchMatchedTerm: 'Body Lotion' },
  { id: 'PRD-000008-000019', canonicalId: 'BODY-WASH', title: 'Body Wash', category: 'Bodycare', price: 599, originalPrice: 750, rating: 4.4, reviewsCount: 27, inStock: true, stockCount: 30, sku: 'PG-S2-17', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Fresh body wash from Himalayan Glow.', features: ['Fresh', 'Daily use'], imageUrl: '/images/products/Body Wash.jpg', tags: ['Bodycare', 'Body Wash'], googleSearchMatchedTerm: 'Body Wash' },
  { id: 'PRD-000008-000020', canonicalId: 'HAND-CREAM', title: 'Hand Cream', category: 'Bodycare', price: 499, originalPrice: 600, rating: 4.3, reviewsCount: 18, inStock: true, stockCount: 28, sku: 'PG-S2-18', sellerId: 'USR-SEL-20261007-000008', sellerName: 'Himalayan Glow House', description: 'Soft hand cream from Himalayan Glow.', features: ['Soft hands', 'Quick absorb'], imageUrl: '/images/products/Hand Cream.jpg', tags: ['Bodycare', 'Hand Cream'], googleSearchMatchedTerm: 'Hand Cream' },
  // Rosy Glow Studio listings (seller-3). Shared canonicals merge with other
  // sellers in Apriori (e.g. Rosy Shampoo + Atelier Shampoo -> SHAMPOO).
  { id: 'PRD-000009-000001', canonicalId: 'FACE-WASH', title: 'Face Wash', category: 'Skincare', price: 850, originalPrice: 1050, rating: 4.7, reviewsCount: 64, inStock: true, stockCount: 30, sku: 'PG-R3-01', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Gentle daily face wash from Rosy.', features: ['Daily use', 'All skin types'], imageUrl: '/images/products/Face Wash.jpg', tags: ['Skincare', 'Face Wash'], googleSearchMatchedTerm: 'Face Wash' },
  { id: 'PRD-000009-000002', canonicalId: 'CLEANSER', title: 'Cleanser', category: 'Skincare', price: 950, originalPrice: 1150, rating: 4.6, reviewsCount: 58, inStock: true, stockCount: 28, sku: 'PG-R3-02', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Deep cleansing cleanser from Rosy.', features: ['Deep cleanse', 'Daily use'], imageUrl: '/images/products/Cleanser.jpg', tags: ['Skincare', 'Cleanser'], googleSearchMatchedTerm: 'Cleanser' },
  { id: 'PRD-000009-000003', canonicalId: 'TONER', title: 'Toner', category: 'Skincare', price: 1100, originalPrice: 1300, rating: 4.5, reviewsCount: 44, inStock: true, stockCount: 25, sku: 'PG-R3-03', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Balancing toner from Rosy.', features: ['Balances skin', 'Preps for serum'], imageUrl: '/images/products/Toner.jpg', tags: ['Skincare', 'Toner'], googleSearchMatchedTerm: 'Toner' },
  { id: 'PRD-000009-000004', canonicalId: 'SERUM', title: 'Serum', category: 'Skincare', price: 1850, originalPrice: 2200, rating: 4.8, reviewsCount: 82, inStock: true, stockCount: 22, sku: 'PG-R3-04', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Active glow serum from Rosy.', features: ['Glow', 'Repair'], imageUrl: '/images/products/Serum.jpg', tags: ['Skincare', 'Serum'], isFeatured: true, googleSearchMatchedTerm: 'Serum' },
  { id: 'PRD-000009-000005', canonicalId: 'SUNSCREEN', title: 'Sunscreen', category: 'Skincare', price: 1250, originalPrice: 1450, rating: 4.6, reviewsCount: 51, inStock: true, stockCount: 26, sku: 'PG-R3-05', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Daily sun protection from Rosy.', features: ['UV protection', 'Daily use'], imageUrl: '/images/products/sunscreen.jpg', tags: ['Skincare', 'Sunscreen'], googleSearchMatchedTerm: 'Sunscreen' },
  { id: 'PRD-000009-000006', canonicalId: 'FACE-MASK', title: 'Face Mask', category: 'Skincare', price: 750, originalPrice: 900, rating: 4.5, reviewsCount: 39, inStock: true, stockCount: 24, sku: 'PG-R3-06', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Weekly face mask from Rosy.', features: ['Weekly care', 'Deep nourish'], imageUrl: '/images/products/Face Mask.jpg', tags: ['Skincare', 'Face Mask'], googleSearchMatchedTerm: 'Face Mask' },
  { id: 'PRD-000009-000007', canonicalId: 'FOUNDATION', title: 'Foundation', category: 'Makeup', price: 1650, originalPrice: 1950, rating: 4.6, reviewsCount: 47, inStock: true, stockCount: 24, sku: 'PG-R3-07', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Smooth foundation from Rosy.', features: ['Even tone', 'Long wear'], imageUrl: '/images/products/Foundation.jpg', tags: ['Makeup', 'Foundation'], googleSearchMatchedTerm: 'Foundation' },
  { id: 'PRD-000009-000008', canonicalId: 'CONCEALER', title: 'Concealer', category: 'Makeup', price: 1150, originalPrice: 1350, rating: 4.5, reviewsCount: 41, inStock: true, stockCount: 26, sku: 'PG-R3-08', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'High coverage concealer from Rosy.', features: ['High coverage', 'Blends easily'], imageUrl: '/images/products/Concealer.jpg', tags: ['Makeup', 'Concealer'], googleSearchMatchedTerm: 'Concealer' },
  { id: 'PRD-000009-000009', canonicalId: 'LIPSTICK', title: 'Lipstick', category: 'Makeup', price: 950, originalPrice: 1150, rating: 4.7, reviewsCount: 73, inStock: true, stockCount: 32, sku: 'PG-R3-09', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Rich color lipstick from Rosy.', features: ['Rich color', 'Long lasting'], imageUrl: '/images/products/Lipstick.jpg', tags: ['Makeup', 'Lipstick'], googleSearchMatchedTerm: 'Lipstick' },
  { id: 'PRD-000009-000010', canonicalId: 'MASCARA', title: 'Mascara', category: 'Makeup', price: 1050, originalPrice: 1250, rating: 4.5, reviewsCount: 36, inStock: true, stockCount: 24, sku: 'PG-R3-10', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Volume mascara from Rosy.', features: ['Volume', 'Smudge proof'], imageUrl: '/images/products/Mascara.jpg', tags: ['Makeup', 'Mascara'], googleSearchMatchedTerm: 'Mascara' },
  { id: 'PRD-000009-000011', canonicalId: 'EYELINER', title: 'Eyeliner', category: 'Makeup', price: 850, originalPrice: 1000, rating: 4.5, reviewsCount: 43, inStock: true, stockCount: 27, sku: 'PG-R3-11', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Precise eyeliner from Rosy.', features: ['Precise', 'Waterproof'], imageUrl: '/images/products/Eyeliner.jpg', tags: ['Makeup', 'Eyeliner'], googleSearchMatchedTerm: 'Eyeliner' },
  { id: 'PRD-000009-000012', canonicalId: 'NAIL-POLISH', title: 'Nail Polish', category: 'Makeup', price: 550, originalPrice: 700, rating: 4.4, reviewsCount: 31, inStock: true, stockCount: 38, sku: 'PG-R3-12', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Shiny nail polish from Rosy.', features: ['Shiny', 'Quick dry'], imageUrl: '/images/products/Nail Polish.jpg', tags: ['Makeup', 'Nail Polish'], googleSearchMatchedTerm: 'Nail Polish' },
  { id: 'PRD-000009-000013', canonicalId: 'SHAMPOO', title: 'Shampoo', category: 'Bodycare', price: 750, originalPrice: 900, rating: 4.6, reviewsCount: 55, inStock: true, stockCount: 30, sku: 'PG-R3-13', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Repair shampoo from Rosy.', features: ['Repair', 'Daily use'], imageUrl: '/images/products/Shampoo.jpg', tags: ['Bodycare', 'Shampoo'], googleSearchMatchedTerm: 'Shampoo' },
  { id: 'PRD-000009-000014', canonicalId: 'CONDITIONER', title: 'Conditioner', category: 'Bodycare', price: 800, originalPrice: 950, rating: 4.6, reviewsCount: 50, inStock: true, stockCount: 29, sku: 'PG-R3-14', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Smooth conditioner from Rosy.', features: ['Soft hair', 'Repair'], imageUrl: '/images/products/Conditioner.jpg', tags: ['Bodycare', 'Conditioner'], googleSearchMatchedTerm: 'Conditioner' },
  { id: 'PRD-000009-000015', canonicalId: 'HAIR-MASK', title: 'Hair Mask', category: 'Bodycare', price: 950, originalPrice: 1150, rating: 4.5, reviewsCount: 33, inStock: true, stockCount: 22, sku: 'PG-R3-15', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Weekly hair mask from Rosy.', features: ['Weekly', 'Deep repair'], imageUrl: '/images/products/Hair Mask.jpg', tags: ['Bodycare', 'Hair Mask'], googleSearchMatchedTerm: 'Hair Mask' },
  { id: 'PRD-000009-000016', canonicalId: 'BODY-WASH', title: 'Body Wash', category: 'Bodycare', price: 650, originalPrice: 800, rating: 4.5, reviewsCount: 46, inStock: true, stockCount: 33, sku: 'PG-R3-16', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Fresh body wash from Rosy.', features: ['Fresh', 'Daily use'], imageUrl: '/images/products/Body Wash.jpg', tags: ['Bodycare', 'Body Wash'], googleSearchMatchedTerm: 'Body Wash' },
  { id: 'PRD-000009-000017', canonicalId: 'BODY-LOTION', title: 'Body Lotion', category: 'Bodycare', price: 850, originalPrice: 1000, rating: 4.6, reviewsCount: 48, inStock: true, stockCount: 28, sku: 'PG-R3-17', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Nourishing body lotion from Rosy.', features: ['Nourish', 'Soft skin'], imageUrl: '/images/products/Body Lotion.jpg', tags: ['Bodycare', 'Body Lotion'], googleSearchMatchedTerm: 'Body Lotion' },
  { id: 'PRD-000009-000018', canonicalId: 'HAND-CREAM', title: 'Hand Cream', category: 'Bodycare', price: 550, originalPrice: 650, rating: 4.4, reviewsCount: 29, inStock: true, stockCount: 31, sku: 'PG-R3-18', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Soft hand cream from Rosy.', features: ['Soft hands', 'Quick absorb'], imageUrl: '/images/products/Hand Cream.jpg', tags: ['Bodycare', 'Hand Cream'], googleSearchMatchedTerm: 'Hand Cream' },
  { id: 'PRD-000009-000019', canonicalId: 'PERFUME', title: 'Perfume', category: 'Fragrance', price: 2450, originalPrice: 2900, rating: 4.8, reviewsCount: 42, inStock: true, stockCount: 18, sku: 'PG-R3-19', sellerId: 'USR-SEL-20261007-000009', sellerName: 'Rosy Glow Studio', description: 'Long lasting perfume from Rosy.', features: ['Long lasting', 'Fresh scent'], imageUrl: '/images/products/Perfume.jpg', tags: ['Fragrance', 'Perfume'], googleSearchMatchedTerm: 'Perfume' },
];

export const USER_TRANSACTIONS_RAW: Array<{ id: string; items: string }> = [
  { id: 'TXN-20260928-000001', items: 'Face Wash, Cleanser, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000002', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000003', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000004', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000005', items: 'Blush, Highlighter, Contour' },
  { id: 'TXN-20260928-000006', items: 'Face Wipes, Face Roller, Gua Sha' },
  { id: 'TXN-20260928-000007', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000008', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000009', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000010', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000011', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000012', items: 'Face Razor, Face Powder, Face Wipes' },
  { id: 'TXN-20260928-000013', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000014', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000015', items: 'Nail Polish, Lipstick' },
  { id: 'TXN-20260928-000016', items: 'Face Wash, Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000017', items: 'Foundation, Concealer, Lipstick, Eyeliner' },
  { id: 'TXN-20260928-000018', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000019', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000020', items: 'Mascara, Eyeliner, Lipstick' },
  { id: 'TXN-20260928-000021', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000022', items: 'Face Mask, Serum, Toner' },
  { id: 'TXN-20260928-000023', items: 'Makeup Brush, Eyeshadow, Eyeliner' },
  { id: 'TXN-20260928-000024', items: 'Blush, Highlighter, Contour, Blender' },
  { id: 'TXN-20260928-000025', items: 'Soap, Shampoo' },
  { id: 'TXN-20260928-000026', items: 'Face Wash, Face Mask, Serum' },
  { id: 'TXN-20260928-000027', items: 'Foundation, Concealer' },
  { id: 'TXN-20260928-000028', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000029', items: 'Face Wipes, Face Razor' },
  { id: 'TXN-20260928-000030', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000031', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000032', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000033', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000034', items: 'Cleanser, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000035', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000036', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000037', items: 'Face Wash, Cleanser' },
  { id: 'TXN-20260928-000038', items: 'Highlighter, Blush, Contour' },
  { id: 'TXN-20260928-000039', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000040', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000041', items: 'Face Mask, Toner, Serum' },
  { id: 'TXN-20260928-000042', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000043', items: 'Makeup Brush, Blender, Highlighter' },
  { id: 'TXN-20260928-000044', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000045', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000046', items: 'Lip Liner, Lipstick' },
  { id: 'TXN-20260928-000047', items: 'Face Razor, Face Powder' },
  { id: 'TXN-20260928-000048', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000049', items: 'Blush, Contour, Blender' },
  { id: 'TXN-20260928-000050', items: 'Mascara, Eyeliner' },
  { id: 'TXN-20260928-000051', items: 'Face Wash, Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000052', items: 'Foundation, Concealer, Highlighter' },
  { id: 'TXN-20260928-000053', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000054', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000055', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000056', items: 'Makeup Brush, Eyeshadow, Mascara' },
  { id: 'TXN-20260928-000057', items: 'Face Wipes, Face Razor, Pimple Patch' },
  { id: 'TXN-20260928-000058', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000059', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000060', items: 'Face Mask, Serum' },
  { id: 'TXN-20260928-000061', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000062', items: 'Blush, Highlighter, Contour' },
  { id: 'TXN-20260928-000063', items: 'Foundation, Concealer, Eyeliner' },
  { id: 'TXN-20260928-000064', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000065', items: 'Face Wash, Serum, Sunscreen' },
  { id: 'TXN-20260928-000066', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000067', items: 'Makeup Brush, Blender' },
  { id: 'TXN-20260928-000068', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000069', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000070', items: 'Nail Polish, Lipstick' },
  { id: 'TXN-20260928-000071', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000072', items: 'Face Powder, Blush, Highlighter' },
  { id: 'TXN-20260928-000073', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000074', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000075', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000076', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000077', items: 'Face Wash, Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000078', items: 'Makeup Brush, Blender, Contour' },
  { id: 'TXN-20260928-000079', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000080', items: 'Mascara, Eyeliner, Lipstick' },
  { id: 'TXN-20260928-000081', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000082', items: 'Face Mask, Serum, Toner' },
  { id: 'TXN-20260928-000083', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000084', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000085', items: 'Foundation, Concealer' },
  { id: 'TXN-20260928-000086', items: 'Face Razor, Face Wipes' },
  { id: 'TXN-20260928-000087', items: 'Highlighter, Blush, Contour' },
  { id: 'TXN-20260928-000088', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000089', items: 'Makeup Brush, Eyeshadow, Eyeliner' },
  { id: 'TXN-20260928-000090', items: 'Face Wash, Face Mask, Serum' },
  { id: 'TXN-20260928-000091', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000092', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000093', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000094', items: 'Foundation, Concealer, Lipstick, Mascara' },
  { id: 'TXN-20260928-000095', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000096', items: 'Blush, Highlighter, Contour, Blender' },
  { id: 'TXN-20260928-000097', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000098', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000099', items: 'Nail Polish, Lipstick' },
  { id: 'TXN-20260928-000100', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000101', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000102', items: 'Face Wash, Cleanser' },
  { id: 'TXN-20260928-000103', items: 'Face Mask, Serum, Sunscreen' },
  { id: 'TXN-20260928-000104', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000105', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000106', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000107', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000108', items: 'Face Razor, Face Powder' },
  { id: 'TXN-20260928-000109', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000110', items: 'Blush, Contour, Highlighter' },
  { id: 'TXN-20260928-000111', items: 'Foundation, Concealer, Eyeliner' },
  { id: 'TXN-20260928-000112', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000113', items: 'Face Wash, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000114', items: 'Makeup Brush, Blender' },
  { id: 'TXN-20260928-000115', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000116', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000117', items: 'Mascara, Eyeliner' },
  { id: 'TXN-20260928-000118', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000119', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000120', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000121', items: 'Face Mask, Serum' },
  { id: 'TXN-20260928-000122', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000123', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000124', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000125', items: 'Highlighter, Blush, Contour' },
  { id: 'TXN-20260928-000126', items: 'Face Wash, Cleanser, Serum' },
  { id: 'TXN-20260928-000127', items: 'Makeup Brush, Eyeshadow, Mascara' },
  { id: 'TXN-20260928-000128', items: 'Face Razor, Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000129', items: 'Nail Polish, Lipstick' },
  { id: 'TXN-20260928-000130', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000131', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000132', items: 'Foundation, Concealer' },
  { id: 'TXN-20260928-000133', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000134', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000135', items: 'Face Mask, Toner, Serum' },
  { id: 'TXN-20260928-000136', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000137', items: 'Blush, Contour, Blender' },
  { id: 'TXN-20260928-000138', items: 'Face Wipes, Face Razor' },
  { id: 'TXN-20260928-000139', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000140', items: 'Face Wash, Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000141', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000142', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000143', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000144', items: 'Makeup Brush, Blender, Highlighter' },
  { id: 'TXN-20260928-000145', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000146', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000147', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000148', items: 'Lip Liner, Lipstick' },
  { id: 'TXN-20260928-000149', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000150', items: 'Face Mask, Serum, Sunscreen' },
  { id: 'TXN-20260928-000151', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000152', items: 'Blush, Highlighter, Contour' },
  { id: 'TXN-20260928-000153', items: 'Mascara, Eyeliner, Lipstick' },
  { id: 'TXN-20260928-000154', items: 'Face Wash, Cleanser' },
  { id: 'TXN-20260928-000155', items: 'Foundation, Concealer, Eyeliner' },
  { id: 'TXN-20260928-000156', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000157', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000158', items: 'Makeup Brush, Blender' },
  { id: 'TXN-20260928-000159', items: 'Face Powder, Blush, Highlighter' },
  { id: 'TXN-20260928-000160', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000161', items: 'Face Razor, Face Wipes' },
  { id: 'TXN-20260928-000162', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000163', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000164', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000165', items: 'Face Wash, Serum, Sunscreen' },
  { id: 'TXN-20260928-000166', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000167', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000168', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000169', items: 'Face Mask, Serum' },
  { id: 'TXN-20260928-000170', items: 'Makeup Brush, Eyeshadow, Eyeliner' },
  { id: 'TXN-20260928-000171', items: 'Highlighter, Blush, Contour' },
  { id: 'TXN-20260928-000172', items: 'Cleanser, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000173', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000174', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000175', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000176', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000177', items: 'Face Razor, Face Powder' },
  { id: 'TXN-20260928-000178', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000179', items: 'Mascara, Eyeliner' },
  { id: 'TXN-20260928-000180', items: 'Face Wash, Cleanser, Serum' },
  { id: 'TXN-20260928-000181', items: 'Foundation, Concealer' },
  { id: 'TXN-20260928-000182', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000183', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000184', items: 'Blush, Highlighter, Contour, Blender' },
  { id: 'TXN-20260928-000185', items: 'Face Mask, Serum, Sunscreen' },
  { id: 'TXN-20260928-000186', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000187', items: 'Cleanser, Toner' },
  { id: 'TXN-20260928-000188', items: 'Lip Liner, Lipstick' },
  { id: 'TXN-20260928-000189', items: 'Face Wipes, Face Razor, Pimple Patch' },
  { id: 'TXN-20260928-000190', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000191', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000192', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000193', items: 'Face Wash, Serum, Sunscreen' },
  { id: 'TXN-20260928-000194', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000195', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000196', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000197', items: 'Makeup Brush, Blender, Highlighter' },
  { id: 'TXN-20260928-000198', items: 'Face Mask, Serum, Sunscreen' },
  { id: 'TXN-20260928-000199', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000200', items: 'Face Wash, Cleanser, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000201', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000202', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000203', items: 'Foundation, Concealer, Eyeliner' },
  { id: 'TXN-20260928-000204', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000205', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000206', items: 'Face Razor, Face Powder, Face Wipes' },
  { id: 'TXN-20260928-000207', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000208', items: 'Blush, Highlighter, Contour' },
  { id: 'TXN-20260928-000209', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000210', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000211', items: 'Face Wash, Face Mask, Serum' },
  { id: 'TXN-20260928-000212', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000213', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000214', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000215', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000216', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000217', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000218', items: 'Mascara, Eyeliner' },
  { id: 'TXN-20260928-000219', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000220', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000221', items: 'Face Wash, Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000222', items: 'Blush, Contour, Blender' },
  { id: 'TXN-20260928-000223', items: 'Face Razor, Face Powder' },
  { id: 'TXN-20260928-000224', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000225', items: 'Makeup Brush, Eyeshadow, Mascara' },
  { id: 'TXN-20260928-000226', items: 'Lip Liner, Lipstick' },
  { id: 'TXN-20260928-000227', items: 'Face Mask, Serum' },
  { id: 'TXN-20260928-000228', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000229', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000230', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000231', items: 'Foundation, Concealer, Highlighter' },
  { id: 'TXN-20260928-000232', items: 'Face Wash, Cleanser, Toner' },
  { id: 'TXN-20260928-000233', items: 'Pimple Patch, Face Wipes' },
  { id: 'TXN-20260928-000234', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000235', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000236', items: 'Makeup Brush, Blender, Contour' },
  { id: 'TXN-20260928-000237', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000238', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000239', items: 'Face Mask, Serum, Sunscreen' },
  { id: 'TXN-20260928-000240', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000241', items: 'Face Razor, Face Wipes' },
  { id: 'TXN-20260928-000242', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000243', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000244', items: 'Blush, Highlighter, Contour' },
  { id: 'TXN-20260928-000245', items: 'Face Wash, Serum, Sunscreen' },
  { id: 'TXN-20260928-000246', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000247', items: 'Makeup Brush, Eyeshadow, Eyeliner' },
  { id: 'TXN-20260928-000248', items: 'Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000249', items: 'Perfume, Body Lotion' },
  { id: 'TXN-20260928-000250', items: 'Nail Polish, Lipstick' },
  { id: 'TXN-20260928-000251', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000252', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000253', items: 'Foundation, Concealer' },
  { id: 'TXN-20260928-000254', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000255', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000256', items: 'Face Mask, Serum' },
  { id: 'TXN-20260928-000257', items: 'Lip Liner, Lipstick, Highlighter' },
  { id: 'TXN-20260928-000258', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000259', items: 'Cleanser, Serum, Sunscreen' },
  { id: 'TXN-20260928-000260', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000261', items: 'Face Wash, Cleanser, Toner, Serum' },
  { id: 'TXN-20260928-000262', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000263', items: 'Blush, Contour, Highlighter' },
  { id: 'TXN-20260928-000264', items: 'Face Razor, Face Powder' },
  { id: 'TXN-20260928-000265', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000266', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000267', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000268', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000269', items: 'Makeup Brush, Eyeshadow, Mascara' },
  { id: 'TXN-20260928-000270', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000271', items: 'Cleanser, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000272', items: 'Lip Liner, Lipstick, Blush' },
  { id: 'TXN-20260928-000273', items: 'Face Mask, Serum, Sunscreen' },
  { id: 'TXN-20260928-000274', items: 'Face Wash, Serum' },
  { id: 'TXN-20260928-000275', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000276', items: 'Foundation, Concealer, Eyeliner' },
  { id: 'TXN-20260928-000277', items: 'Gua Sha, Face Roller, Face Wipes' },
  { id: 'TXN-20260928-000278', items: 'Shampoo, Conditioner' },
  { id: 'TXN-20260928-000279', items: 'Blush, Highlighter, Contour, Blender' },
  { id: 'TXN-20260928-000280', items: 'Face Razor, Face Wipes' },
  { id: 'TXN-20260928-000281', items: 'Mascara, Eyeliner' },
  { id: 'TXN-20260928-000282', items: 'Cleanser, Serum' },
  { id: 'TXN-20260928-000283', items: 'Makeup Brush, Blender, Highlighter' },
  { id: 'TXN-20260928-000284', items: 'Face Wash, Cleanser' },
  { id: 'TXN-20260928-000285', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000286', items: 'Lip Liner, Lipstick' },
  { id: 'TXN-20260928-000287', items: 'Face Mask, Serum' },
  { id: 'TXN-20260928-000288', items: 'Body Wash, Body Lotion' },
  { id: 'TXN-20260928-000289', items: 'Foundation, Concealer, Lipstick' },
  { id: 'TXN-20260928-000290', items: 'Gua Sha, Face Roller' },
  { id: 'TXN-20260928-000291', items: 'Face Wipes, Pimple Patch' },
  { id: 'TXN-20260928-000292', items: 'Mascara, Eyeliner, Eyeshadow' },
  { id: 'TXN-20260928-000293', items: 'Cleanser, Toner, Serum, Sunscreen' },
  { id: 'TXN-20260928-000294', items: 'Shampoo, Hair Spray' },
  { id: 'TXN-20260928-000295', items: 'Blush, Highlighter, Contour' },
  { id: 'TXN-20260928-000296', items: 'Makeup Brush, Blender, Foundation' },
  { id: 'TXN-20260928-000297', items: 'Face Wash, Face Mask, Serum' },
  { id: 'TXN-20260928-000298', items: 'Body Wash, Body Lotion, Perfume' },
  { id: 'TXN-20260928-000299', items: 'Shampoo, Conditioner, Hair Mask' },
  { id: 'TXN-20260928-000300', items: 'Face Wash, Cleanser, Toner, Serum, Sunscreen, Foundation' },
];

/**
 * Maps raw dataset item tokens to seller-1 listing IDs.
 * Apriori layer converts listings -> canonicalId, so duplicate
 * seller listings merge instead of splitting support.
 */
export function mapItemTokenToProductId(token: string): string | null {
  const norm = token.trim().toLowerCase();
  // Old-catalog names (Rosy + seller-2 carry these). Mapped to Rosy listings;
  // canonicals merge across sellers at mining time.
  if (norm === 'face wash') return 'PRD-000009-000001';
  if (norm === 'cleanser') return 'PRD-000009-000002';
  if (norm === 'toner') return 'PRD-000009-000003';
  if (norm === 'serum') return 'PRD-000009-000004';
  if (norm === 'sunscreen' || norm === 'spf50 sunscreen') return 'PRD-000009-000005';
  if (norm === 'face mask') return 'PRD-000009-000006';
  if (norm === 'foundation' || norm === 'matte foundation') return 'PRD-000009-000007';
  if (norm === 'concealer') return 'PRD-000009-000008';
  if (norm === 'mascara') return 'PRD-000009-000010';
  if (norm === 'nail polish') return 'PRD-000009-000012';
  if (norm === 'hair mask' || norm === 'hair masks') return 'PRD-000009-000015';
  if (norm === 'soap') return 'PRD-000012-000001';
  if (norm === 'shampoo') return 'PRD-000007-000002';
  if (norm === 'makeup brush' || norm === 'make up brush') return 'PRD-000007-000003';
  if (norm === 'hair spray' || norm === 'setting spray') return 'PRD-000007-000004';
  if (norm === 'hair gel') return 'PRD-000007-000005';
  if (norm === 'lip liner') return 'PRD-000007-000006';
  if (norm === 'highlighter') return 'PRD-000007-000007';
  if (norm === 'blush') return 'PRD-000007-000008';
  if (norm === 'blender') return 'PRD-000007-000009';
  if (norm === 'contour') return 'PRD-000007-000010';
  if (norm === 'face wipes') return 'PRD-000007-000011';
  if (norm === 'face roller') return 'PRD-000007-000012';
  if (norm === 'gua sha') return 'PRD-000007-000013';
  if (norm === 'eyelash curler' || norm === 'eye curler' || norm === 'lashes') return 'PRD-000007-000014';
  if (norm === 'eyeshadow') return 'PRD-000007-000015';
  if (norm === 'eyeliner') return 'PRD-000007-000016';
  if (norm === 'pimple patch') return 'PRD-000007-000017';
  if (norm === 'face razor') return 'PRD-000007-000018';
  if (norm === 'face powder') return 'PRD-000007-000019';
  if (norm === 'lipstick') return 'PRD-000007-000020';
  if (norm === 'conditioner') return 'PRD-000007-000021';
  if (norm === 'body wash') return 'PRD-000007-000022';
  if (norm === 'eye patch') return 'PRD-000007-000023';
  if (norm === 'perfume') return 'PRD-000007-000024';
  return null;
}

export function parseRawTransactions(rawList: Array<{ id: string; items: string }>): {
  transactions: Transaction[];
  rawRows: RawDatasetRow[];
} {
  const transactions: Transaction[] = [];
  const rawRows: RawDatasetRow[] = [];

  rawList.forEach((row, idx) => {
    const rawItems = row.items.split(',').map(s => s.trim()).filter(Boolean);
    const matchedIds: string[] = [];

    for (const item of rawItems) {
      const pId = mapItemTokenToProductId(item);
      if (pId && !matchedIds.includes(pId)) {
        matchedIds.push(pId);
      }
    }

    if (matchedIds.length > 0) {
      transactions.push({
        id: row.id,
        orderId: `ORD-DATA-${idx + 1}`,
        date: '2026-09-28',
        itemIds: matchedIds,
      });
    }

    rawRows.push({
      transaction_id: row.id,
      customer_id: `C${String(100 + (idx % 80)).padStart(3, '0')}`,
      transaction_date: '2026-09-28',
      products_purchased: row.items,
      type: matchedIds.length >= 3 ? 'Strong' : matchedIds.length === 2 ? 'Pair' : 'Single',
      matchedProductIds: matchedIds,
    });
  });

  return { transactions, rawRows };
}

export const INITIAL_PARSED_DATASET = parseRawTransactions(USER_TRANSACTIONS_RAW);

export const RAW_DATASET_TEXT = USER_TRANSACTIONS_RAW.map(
  t => `${t.id} | ${t.items}`
).join('\n');

export function parseUserDataset(rawText: string): {
  transactions: Transaction[];
  rawRows: RawDatasetRow[];
} {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const parsedList: Array<{ id: string; items: string }> = [];
  // Imported rows take TXN-<date>-<seq> ids per the ID scheme
  const impDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const impId = (idx: number) => `TXN-${impDate}-${String(idx + 1).padStart(6, '0')}`;

  lines.forEach((line, idx) => {
    if (line.includes('|')) {
      const [idPart, itemsPart] = line.split('|');
      parsedList.push({
        id: idPart.trim() || impId(idx),
        items: itemsPart.trim(),
      });
    } else if (line.includes('\t')) {
      const parts = line.split('\t');
      if (parts.length >= 4) {
        parsedList.push({
          id: parts[0].trim(),
          items: parts[3].trim(),
        });
      }
    } else {
      parsedList.push({
        id: impId(idx),
        items: line,
      });
    }
  });

  return parseRawTransactions(parsedList);
}
