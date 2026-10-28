export type Role = 'customer' | 'seller' | 'admin';

export interface User {
  id: string; // USR-<ROLE>-<YYYYMMDD>-<NNNNNN>
  seqNum?: number; // global account number -> owner prefix in PRD-/REV- ids
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  storeName?: string;
  joinedDate: string;
}

export type ProductCategory = 'Skincare' | 'Makeup' | 'Bodycare' | 'Fragrance' | string;

export interface Product {
  id: string; // listingId: seller-specific (e.g. pg-s1-soap). For cart/stock/money.
  canonicalId: string; // shared mining key (e.g. SOAP). Same product from different sellers shares this. Apriori mines this.
  title: string;
  category: ProductCategory;
  price: number; // In Rs
  originalPrice?: number; // In Rs
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  sku: string;
  sellerId: string;
  sellerName: string;
  description: string;
  features: string[];
  imageUrl: string;
  tags: string[];
  isFeatured?: boolean;
  googleSearchQuery?: string;
  googleBenchmarkPrice?: number;
  googleActiveIngredients?: string[];
  googleSearchMatchedTerm?: string;
  googleShoppingRating?: number;
  googleSearchTrends?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  text: string;
  imageUrl?: string; // optional customer photo (gallery upload)
  date: string;
}

export interface OrderItem {
  productId: string; // listingId: which seller's listing was bought
  canonicalId?: string; // shared product code for Apriori ingestion
  sellerId?: string; // which seller owns this line item
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  // Per-seller fulfillment (multi-seller): each involved seller marks their own
  // items. Global status becomes Delivered only when ALL sellers delivered.
  sellerStatus?: Record<string, Order['status']>;
  date: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  trackingNumber: string;
}

// Global categories (admin-approved; every seller can use them) +
// per-seller requests with an approval lifecycle.
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface CategoryRequest {
  id: string;
  name: string;
  slug: string;
  description?: string;
  requestedBy: string;
  requesterName?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  decidedAt?: string;
  categoryId?: string;
}

// Festival & Season Campaign Types
export interface Campaign {
  id: string;
  title: string;
  type: 'festival' | 'season';
  tagline: string;
  discountCode: string;
  discountPercent: number;
  themeColor: 'burgundy' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'purple';
  badgeText: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  featuredCategory: 'All' | 'Skincare' | 'Makeup' | 'Bodycare' | 'Fragrance';
  description: string;
}

// Apriori & Association Rule Types
export interface Transaction {
  id: string;
  orderId?: string;
  date: string;
  itemIds: string[]; // List of product IDs purchased together
}

export interface FrequentItemset {
  items: string[]; // Product IDs
  supportCount: number; // Frequency
  support: number; // supportCount / totalTransactions (0.0 to 1.0)
}

export interface AssociationRule {
  id: string;
  antecedent: string[]; // LHS product IDs
  consequent: string[]; // RHS product IDs
  support: number; // Support of (A U B)
  confidence: number; // Support(A U B) / Support(A)
  lift: number; // Confidence / Support(B)
  transactionCount: number; // how many transactions had both
  antecedentCount: number; // how many transactions had antecedent
}

export interface AprioriRecommendation {
  rule: AssociationRule;
  recommendedProduct: Product;
  basedOnProducts: Product[];
  confidencePercent: number;
  supportPercent: number;
  lift: number;
  reason: string;
}
