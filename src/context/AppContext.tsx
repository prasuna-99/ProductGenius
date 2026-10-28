import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Role,
  User,
  Product,
  CartItem,
  Order,
  Review,
  Category,
  CategoryRequest,
  Transaction,
  FrequentItemset,
  AssociationRule,
  AprioriRecommendation,
  Campaign,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_ORDERS,
  INITIAL_CAMPAIGNS,
} from '../data/mockData';
import {
  parseUserDataset,
  INITIAL_PARSED_DATASET,
  GOOGLE_ADJUSTED_PRODUCTS,
  toCanonicalId,
  RawDatasetRow,
  RAW_DATASET_TEXT,
} from '../data/userDataset';
import {
  runApriori,
  generateAssociationRules,
  getAprioriRecommendationsForCart,
} from '../utils/apriori';
import { apiFetch, setToken, getToken, isBackendError, BackendUser, API_BASE } from '../utils/api';
import { uniqueById } from '../utils/unique';

// Safe localStorage helper to prevent quota exceeded or crash
const safeStorage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`localStorage save skipped for key "${key}" to prevent quota crash:`, err);
    }
  },
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  },
};

interface AppContextType {
  // Auth & Roles
  currentUser: User;
  currentRole: Role;
  switchRole: (role: Role) => void;
  switchAccount: (userId: string) => void;
  login: (
    email: string,
    password?: string,
    roleHint?: Role
  ) => Promise<{ ok: boolean; error?: string; offline?: boolean }>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    storeName?: string;
  }) => Promise<{ ok: boolean; error?: string; offline?: boolean }>;
  logout: () => void;
  allUsers: User[];
  deleteUser: (userId: string) => void;
  deleteSeller: (sellerId: string, removeProducts?: boolean) => void;

  // Catalog
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'canonicalId'> & Partial<Pick<Product, 'canonicalId'>>) => Promise<Product>;
  editProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleStock: (id: string) => Promise<void>;

  // Festival & Season Campaigns
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  addCampaign: (campaign: Omit<Campaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  toggleCampaignActive: (id: string) => Promise<void>;

  // Cart & Wishlist
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  // Orders
  orders: Order[];
  placeOrder: (
    shippingAddress: { street: string; city: string; state: string; zip: string },
    discountCode?: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status'], actor?: { sellerId?: string }) => Promise<void>;
  instantOrder: (product: Product, quantity?: number) => void;
  deliveryNotification: string | null;
  setDeliveryNotification: (msg: string | null) => void;

  // Apriori & Association Rules
  transactions: Transaction[];
  rawDatasetRows: RawDatasetRow[];
  importDatasetText: (text: string) => { count: number };
  resetToGoogleAdjustedDataset: () => void;
  minSupport: number;
  setMinSupport: (val: number) => void;
  minConfidence: number;
  setMinConfidence: (val: number) => void;
  frequentItemsets: FrequentItemset[];
  associationRules: AssociationRule[];
  cartRecommendations: AprioriRecommendation[];
  topRecommendations: AprioriRecommendation[];
  recomputeApriori: () => void;
  seedSyntheticTransactions: (count: number) => void;

  // Customer Reviews (only after delivery; rating = live average of rates)
  reviews: Review[];
  addReview: (productId: string, input: { rating: number; text: string; imageUrl?: string }) => Promise<void>;
  // Global categories + seller requests (approval lifecycle, synced with Neon)
  categories: Category[];
  categoryRequests: CategoryRequest[];
  requestCategory: (name: string, description?: string) => Promise<{ ok: boolean; error?: string }>;
  approveCategoryRequest: (id: string) => Promise<void>;
  rejectCategoryRequest: (id: string, adminNote?: string) => Promise<void>;
  // Backend sync state (null = not checked yet)
  backendOnline: boolean | null;
  syncNow: () => Promise<boolean>;
  lastSync: { at: string; pushed?: Record<string, number>; tombstonesApplied?: number; error?: string } | null;

  // Modals & UI States
  selectedProductDetail: Product | null;
  setSelectedProductDetail: (product: Product | null) => void;
  activeMathModalRule: AssociationRule | null;
  setActiveMathModalRule: (rule: AssociationRule | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  activeCustomerTab: 'storefront' | 'recommendations' | 'orders' | 'wishlist';
  setActiveCustomerTab: (tab: 'storefront' | 'recommendations' | 'orders' | 'wishlist') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current user & role. Identity persists until manually changed:
  // - current account id saved (pg_current_user_id)
  // - last account per role remembered (pg_last_user_<role>) so toggling
  //   customer <-> seller restores Rosy instead of resetting to seller-1.
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (safeStorage.getItem('pg_current_role') as Role) || 'customer';
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = safeStorage.getItem('pg_users_v2');
    let list: User[] = INITIAL_USERS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch (e) {}
    }
    // Merge seed users (e.g. newly added sellers like Rosy) into saved accounts
    const missing = INITIAL_USERS.filter(su => !list.some(u => u.id === su.id));
    return missing.length > 0 ? [...list, ...missing] : list;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = safeStorage.getItem('pg_current_user_id');
    const pool = (() => {
      const saved = safeStorage.getItem('pg_users_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const missing = INITIAL_USERS.filter(su => !parsed.some((u: User) => u.id === su.id));
            return [...parsed, ...missing];
          }
        } catch (e) {}
      }
      return INITIAL_USERS;
    })();
    if (savedId) {
      const byId = pool.find(u => u.id === savedId);
      if (byId) return byId;
    }
    const savedRole = (safeStorage.getItem('pg_current_role') as Role) || 'customer';
    return pool.find(u => u.role === savedRole) || pool[0];
  });

  // Product Catalog: check if saved products adhere to the new 4 categories (Skincare, Makeup, Bodycare, Fragrance)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = safeStorage.getItem('pg_products_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.some(p => p.category === 'Skincare' || p.category === 'Makeup')
        ) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_PRODUCTS;
  });

  // Campaigns (Festival & Season Offers)
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = safeStorage.getItem('pg_campaigns_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_CAMPAIGNS;
  });

  // Active campaigns
  const activeCampaigns = useMemo(() => {
    return campaigns.filter(c => c.isActive);
  }, [campaigns]);

  // Global categories (base 4 + admin-approved). Backend-first when signed in.
  const BASE_CATEGORIES: Category[] = [
    { id: 'cat-skincare', name: 'Skincare', slug: 'skincare' },
    { id: 'cat-makeup', name: 'Makeup', slug: 'makeup' },
    { id: 'cat-bodycare', name: 'Bodycare', slug: 'bodycare' },
    { id: 'cat-fragrance', name: 'Fragrance', slug: 'fragrance' },
  ];
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = safeStorage.getItem('pg_categories_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          for (const b of BASE_CATEGORIES) {
            if (!merged.some((c: Category) => c.slug === b.slug)) merged.push(b);
          }
          return merged;
        }
      } catch (e) {}
    }
    return BASE_CATEGORIES;
  });

  // Category requests (seller asks, admin approves/rejects)
  const [categoryRequests, setCategoryRequests] = useState<CategoryRequest[]>(() => {
    const saved = safeStorage.getItem('pg_category_requests_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    safeStorage.setItem('pg_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    safeStorage.setItem('pg_category_requests_v2', JSON.stringify(categoryRequests));
  }, [categoryRequests]);

  const requestCategory = async (
    name: string,
    description?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const clean = name.trim();
    if (!clean) return { ok: false, error: 'Name required' };
    if (getToken()) {
      try {
        const remote = (await apiFetch('/categories/requests', {
          method: 'POST',
          body: JSON.stringify({ name: clean, description: description?.trim() || '' }),
        })) as CategoryRequest;
        const withName = { ...remote, requesterName: currentUser.storeName || currentUser.name };
        setCategoryRequests(prev => [withName, ...prev.filter(r => r.id !== withName.id)]);
        return { ok: true };
      } catch (e) {
        if (!isBackendError(e)) return { ok: false, error: (e as Error).message };
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (
      categories.some(c => c.slug === slug) ||
      categoryRequests.some(r => r.slug === slug && r.status === 'pending')
    ) {
      return { ok: false, error: 'Category already exists or is pending' };
    }
    setCategoryRequests(prev => [
      {
        // Local ID = REQ-<date>-<seq>
        id: `REQ-${todayCompact()}-${pad6(nextLocalSeq(`REQ:${todayCompact()}`))}`,
        name: clean,
        slug,
        description: description?.trim() || '',
        requestedBy: currentUser.id,
        requesterName: currentUser.storeName || currentUser.name,
        status: 'pending',
      },
      ...prev,
    ]);
    return { ok: true };
  };

  const approveCategoryRequest = async (id: string): Promise<void> => {
    if (getToken()) {
      try {
        const data = (await withPushRetry(() => apiFetch(`/categories/requests/${id}/approve`, {
          method: 'POST',
          body: JSON.stringify({}),
        }))) as { category: Category; request: CategoryRequest };
        setCategories(prev =>
          prev.some(c => c.slug === data.category.slug) ? prev : [...prev, data.category]
        );
        setCategoryRequests(prev =>
          prev.map(r => (r.id === id ? { ...r, status: 'approved', categoryId: data.category.id } : r))
        );
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    const req = categoryRequests.find(r => r.id === id);
    if (!req) return;
    const category: Category = {
      // Local ID = CAT-<date>-<seq>
      id: `CAT-${todayCompact()}-${pad6(nextLocalSeq(`CAT:${todayCompact()}`))}`,
      name: req.name,
      slug: req.slug,
      description: req.description,
    };
    setCategories(prev => (prev.some(c => c.slug === category.slug) ? prev : [...prev, category]));
    setCategoryRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'approved' as const, categoryId: category.id } : r))
    );
  };

  const rejectCategoryRequest = async (id: string, adminNote?: string): Promise<void> => {
    if (getToken()) {
      try {
        await withPushRetry(() => apiFetch(`/categories/requests/${id}/reject`, {
          method: 'POST',
          body: JSON.stringify({ adminNote: adminNote || '' }),
        }));
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setCategoryRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'rejected' as const, adminNote: adminNote || '' } : r))
    );
  };

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = safeStorage.getItem('pg_cart_v8');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = safeStorage.getItem('pg_wishlist_v8');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ['PRD-000002-000003', 'PRD-000002-000020', 'PRD-000002-000024'];
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = safeStorage.getItem('pg_orders_v8');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ORDERS;
  });

  // Customer Reviews (photo + 5-star, only after delivery)
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = safeStorage.getItem('pg_reviews_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Live rating = average of customer rates (1 decimal). Count = number of reviews.
  const applyReviewLocally = (
    r: Review | { productId: string; rating: number; text: string; imageUrl?: string }
  ) => {
    // Full Review objects (from server) keep their IDs; fresh input mints
    // a local ID = REV-<authorSeq>-<perAuthorSeq>
    const review: Review =
      'id' in r && 'userId' in r
        ? (r as Review)
        : {
            id: `REV-${pad6(currentUser.seqNum || 0)}-${pad6(nextLocalSeq(`REV:${currentUser.id}`))}`,
            productId: r.productId,
            userId: currentUser.id,
            userName: currentUser.name,
            rating: Math.max(1, Math.min(5, Math.round(r.rating))),
            text: r.text.trim(),
            imageUrl: r.imageUrl,
            date: new Date().toISOString().split('T')[0],
          };
    const next = [review, ...reviews.filter(r => r.id !== review.id)];
    setReviews(next);
    safeStorage.setItem('pg_reviews_v2', JSON.stringify(next));
    const mine = next.filter(r => r.productId === review.productId);
    const avg = Math.round((mine.reduce((s, r) => s + r.rating, 0) / mine.length) * 10) / 10;
    setProducts(prev =>
      prev.map(p => (p.id === review.productId ? { ...p, rating: avg, reviewsCount: mine.length } : p))
    );
  };

  const addReview = async (
    productId: string,
    input: { rating: number; text: string; imageUrl?: string }
  ): Promise<void> => {
    // Backend-first when signed in (server enforces delivered-only + recomputes average)
    if (getToken()) {
      try {
        const remote = (await withPushRetry(() => apiFetch(`/products/${productId}/reviews`, {
          method: 'POST',
          body: JSON.stringify(input),
        }))) as Review;
        applyReviewLocally(remote);
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    applyReviewLocally({
      productId,
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      text: input.text.trim(),
      imageUrl: input.imageUrl,
    });
  };

  // Transactions & Raw Rows from 300 clean dataset
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = safeStorage.getItem('pg_transactions_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 100) return parsed;
      } catch (e) {}
    }
    return INITIAL_TRANSACTIONS;
  });

  const [rawDatasetRows, setRawDatasetRows] = useState<RawDatasetRow[]>(() => {
    const saved = safeStorage.getItem('pg_raw_dataset_rows_v8');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 100) return parsed;
      } catch (e) {}
    }
    return INITIAL_PARSED_DATASET.rawRows;
  });

  // Apriori hyper-parameters: calibrated for 300 transactions
  const [minSupport, setMinSupport] = useState<number>(0.04); // 4% (>= 8 orders)
  const [minConfidence, setMinConfidence] = useState<number>(0.40); // 40% confidence
  const [miningTick, setMiningTick] = useState<number>(0);

  // Modals & Navigation
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [activeMathModalRule, setActiveMathModalRule] = useState<AssociationRule | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [activeCustomerTab, setActiveCustomerTab] = useState<
    'storefront' | 'recommendations' | 'orders' | 'wishlist'
  >('storefront');
  const [deliveryNotification, setDeliveryNotification] = useState<string | null>(null);

  // Sync to localStorage safely
  useEffect(() => {
    safeStorage.setItem('pg_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    safeStorage.setItem('pg_users_v2', JSON.stringify(allUsers));
  }, [allUsers]);

  // Remember account identity until manually changed
  useEffect(() => {
    safeStorage.setItem('pg_current_user_id', currentUser.id);
    safeStorage.setItem(`pg_last_user_${currentUser.role}`, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    safeStorage.setItem('pg_products_v8', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    safeStorage.setItem('pg_campaigns_v2', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    safeStorage.setItem('pg_cart_v8', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    safeStorage.setItem('pg_wishlist_v8', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    safeStorage.setItem('pg_orders_v8', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeStorage.setItem('pg_transactions_v8', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    safeStorage.setItem('pg_raw_dataset_rows_v8', JSON.stringify(rawDatasetRows));
  }, [rawDatasetRows]);

  // Backend boot sync: when signed in (JWT), pull server truth and merge it
  // ahead of local seeds (remote wins, local-only rows kept). 401 -> drop token.
  // Re-runs on every sign-in/out (authTick), not just page load.
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [lastSync, setLastSync] = useState<{
    at: string;
    pushed?: Record<string, number>;
    tombstonesApplied?: number;
    error?: string;
  } | null>(null);
  const [authTick, setAuthTick] = useState(0);
  // Seed transaction ids never need pushing (Neon seeds carry the same ids)
  const seedTxnIds = new Set(INITIAL_TRANSACTIONS.map(t => t.id));
  const mergeById = <T extends { id: string }>(remote: T[], local: T[]): T[] => {
    // Dedupe both sides: repeated syncs/codemods must never stack twin ids.
    const clean = uniqueById(remote);
    const seen = new Set(clean.map(r => r.id));
    return [...clean, ...uniqueById(local).filter(l => !seen.has(l.id))];
  };
  // One-time ID codemod: the backend renamed every PK (pg-*/cuid -> USR/PRD/ORD/...)
  // via server/scripts/migrate-ids.js. This rewrites browser storage through the
  // served idmap so both sides agree byte-for-byte (no duplicate rows on merge).
  // Runs once per browser (flag pg_idmap_v2), before the first pull-merge.
  // Every slice is deduped by id afterwards: self-maps (old=new) plus an old
  // row can otherwise converge onto one id and twin it.
  const applyIdCodemod = async (): Promise<void> => {
    if (safeStorage.getItem('pg_idmap_v2')) return;
    // Fresh browser (no stored rows): in-memory seeds are already new-format.
    const STORED_KEYS = [
      'pg_users_v2', 'pg_products_v8', 'pg_cart_v8', 'pg_wishlist_v8', 'pg_orders_v8',
      'pg_transactions_v8', 'pg_raw_dataset_rows_v8', 'pg_reviews_v2', 'pg_campaigns_v2',
      'pg_category_requests_v2',
    ];
    const hasStored = STORED_KEYS.some(k => {
      try {
        const s = safeStorage.getItem(k);
        return !!s && s !== '[]';
      } catch {
        return false;
      }
    });
    if (!hasStored) {
      safeStorage.setItem('pg_idmap_v2', '1');
      return;
    }
    let map: any;
    try {
      map = await apiFetch('/sync/idmap');
    } catch {
      return; // try again next sync
    }
    if (!map || !map.users) return;
    const strMap = (t: any) =>
      new Map<string, string>(
        Object.entries(t || {}).map(([o, v]: any) => [o, typeof v === 'string' ? v : v.newId])
      );
    const uMap = strMap(map.users);
    const pMap = strMap(map.products);
    const oMap = strMap(map.orders);
    const cMap = strMap(map.campaigns);
    const catMap = strMap(map.categories);
    const qMap = strMap(map.requests);
    const rMap = strMap(map.reviews);
    const tMap = strMap(map.transactions);
    if (!uMap.size && !pMap.size) {
      safeStorage.setItem('pg_idmap_v2', '1');
      return;
    }
    const R = (m: Map<string, string>, id: string) => m.get(id) || id;
    const readArr = (k: string): any[] => {
      try {
        const s = safeStorage.getItem(k);
        if (s) {
          const p = JSON.parse(s);
          if (Array.isArray(p)) return p;
        }
      } catch {}
      return [];
    };
    const writeArr = (k: string, v: unknown[]) => safeStorage.setItem(k, JSON.stringify(v));
    // Store + set a slice, deduped by id: self-maps (old id == new id) plus an
    // old row can otherwise converge onto one id and twin it in render lists.
    const finalize = (key: string, arr: any[], set: (v: any[]) => void) => {
      const clean = uniqueById(arr);
      writeArr(key, clean);
      set(clean);
    };

    // Users + identity pointers (dedupe by id: repeated sign-ins must not
    // create twin rows with the same key)
    const users = readArr('pg_users_v2').map((u: any) =>
      uMap.has(u.id) ? { ...u, id: uMap.get(u.id) } : u
    );
    const dedupedUsers = dedupeById(users);
    finalize('pg_users_v2', dedupedUsers, setAllUsers);
    for (const k of ['pg_current_user_id', 'pg_last_user_customer', 'pg_last_user_seller', 'pg_last_user_admin']) {
      const v = safeStorage.getItem(k);
      if (v && uMap.has(v)) safeStorage.setItem(k, uMap.get(v) as string);
    }
    setCurrentUser(prev => (uMap.has(prev.id) ? { ...prev, id: uMap.get(prev.id) as string } : prev));

    // Products (id + owner)
    const prods = readArr('pg_products_v8').map((p: any) => ({
      ...p,
      id: R(pMap, p.id),
      sellerId: R(uMap, p.sellerId),
    }));
    finalize('pg_products_v8', prods, setProducts);

    // Cart (embedded product snapshots) + wishlist ids
    const cart = readArr('pg_cart_v8').map((ci: any) => ({
      ...ci,
      product: ci.product
        ? { ...ci.product, id: R(pMap, ci.product.id), sellerId: R(uMap, ci.product.sellerId) }
        : ci.product,
    }));
    // Cart rows key by embedded product id (CartItem itself has no id field)
    const seenCart = new Set<string>();
    const cartClean = cart.filter((ci: any) => {
      const k = ci.product?.id || JSON.stringify(ci);
      if (seenCart.has(k)) return false;
      seenCart.add(k);
      return true;
    });
    writeArr('pg_cart_v8', cartClean);
    setCart(cartClean);
    const wish = readArr('pg_wishlist_v8').map((id: string) => R(pMap, id));
    const wishClean = [...new Set(wish)];
    writeArr('pg_wishlist_v8', wishClean);
    setWishlist(wishClean);

    // Orders (id, customer, items, per-seller status keys)
    const remapStatus = (s: any) => {
      if (!s || typeof s !== 'object') return s;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(s)) out[R(uMap, k)] = v as string;
      return out;
    };
    const ords = readArr('pg_orders_v8').map((o: any) => ({
      ...o,
      id: R(oMap, o.id),
      customerId: R(uMap, o.customerId),
      sellerStatus: remapStatus(o.sellerStatus),
      items: (o.items || []).map((i: any) => ({
        ...i,
        productId: R(pMap, i.productId),
        sellerId: i.sellerId ? R(uMap, i.sellerId) : i.sellerId,
      })),
    }));
    finalize('pg_orders_v8', ords, setOrders);

    // Transactions + raw rows (rename ids; canonical tokens pass through untouched)
    const txns = readArr('pg_transactions_v8').map((t: any) => ({
      ...t,
      id: R(tMap, t.id),
      orderId: t.orderId ? R(oMap, t.orderId) : t.orderId,
      itemIds: (t.itemIds || []).map((id: string) => R(pMap, id)),
    }));
    finalize('pg_transactions_v8', txns, setTransactions);
    const rows = readArr('pg_raw_dataset_rows_v8').map((r: any) => ({
      ...r,
      transaction_id: R(tMap, r.transaction_id),
      matchedProductIds: (r.matchedProductIds || []).map((id: string) => R(pMap, id)),
    }));
    // Raw rows key by transaction_id (no top-level id field)
    const seenRows = new Set<string>();
    const rowsClean = rows.filter((r: any) => {
      const k = r.transaction_id || JSON.stringify(r);
      if (seenRows.has(k)) return false;
      seenRows.add(k);
      return true;
    });
    writeArr('pg_raw_dataset_rows_v8', rowsClean);
    setRawDatasetRows(rowsClean);

    // Reviews / campaigns / requests
    const revs = readArr('pg_reviews_v2').map((r: any) => ({
      ...r,
      id: R(rMap, r.id),
      productId: R(pMap, r.productId),
      userId: R(uMap, r.userId),
    }));
    finalize('pg_reviews_v2', revs, setReviews);
    const camps = readArr('pg_campaigns_v2').map((c: any) => ({ ...c, id: R(cMap, c.id) }));
    finalize('pg_campaigns_v2', camps, setCampaigns);
    const reqs = readArr('pg_category_requests_v2').map((q: any) => ({
      ...q,
      id: R(qMap, q.id),
      requestedBy: R(uMap, q.requestedBy),
    }));
    finalize('pg_category_requests_v2', reqs, setCategoryRequests);

    safeStorage.setItem('pg_idmap_v2', '1');
  };

  const syncNow = async (): Promise<boolean> => {
    if (!getToken()) {
      setBackendOnline(false);
      return false;
    }
    const stamp = () => new Date().toLocaleTimeString();
    // Tombstoned ids fetched this run (also enforced server-side on push).
    let deadProd = new Set<string>();
    let deadCamp = new Set<string>();
    let deadReq = new Set<string>();
    let tombstonesApplied = 0;
    try {
      await applyIdCodemod();
      // Tombstones first: rows deleted on another browser must vanish locally
      // BEFORE pull-merge, or merge would keep them and push would resurrect them.
      try {
        const since = safeStorage.getItem('pg_tombstone_since');
        const tombs = (await apiFetch(
          '/sync/tombstones' + (since ? `?since=${encodeURIComponent(since)}` : '')
        )) as { table: string; recordId: string }[];
        if (Array.isArray(tombs) && tombs.length) {
          const dead = (t: string) =>
            new Set(tombs.filter(x => x.table === t).map(x => x.recordId));
          deadProd = dead('products');
          deadCamp = dead('campaigns');
          deadReq = dead('requests');
          if (deadProd.size) {
            setProducts(prev => prev.filter(p => !deadProd.has(p.id)));
            setCart(prev => prev.filter(ci => !deadProd.has(ci.product.id)));
            setWishlist(prev => prev.filter(id => !deadProd.has(id)));
            // Reviews of deleted products lose their subject; order history
            // (snapshots) is intentionally left untouched.
            setReviews(prev => prev.filter(r => !deadProd.has(r.productId)));
          }
          if (deadCamp.size) setCampaigns(prev => prev.filter(c => !deadCamp.has(c.id)));
          if (deadReq.size) setCategoryRequests(prev => prev.filter(q => !deadReq.has(q.id)));
          tombstonesApplied = deadProd.size + deadCamp.size + deadReq.size;
        }
        safeStorage.setItem('pg_tombstone_since', new Date().toISOString());
      } catch {
        /* offline: keep local rows; try again next sync */
      }
      const [rp, ro, rr, rc, rg, rq] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/orders/mine'),
        apiFetch('/recent').catch(() => []),
        apiFetch('/campaigns').catch(() => []),
        apiFetch('/categories').catch(() => []),
        apiFetch('/categories/requests').catch(() => []),
      ]);
      // Push rows born locally (seed orders, offline products/campaigns/
      // requests/reviews/transactions) so later PATCH/DELETE calls stop 404ing.
      // Existing server rows are never overwritten — only missing ids upload.
      // Tombstoned ids are excluded here (and refused server-side) so a stale
      // browser can never resurrect a delete.
      let pushed: Record<string, number> | undefined;
      try {
        const missing = {
          products: products.filter(
            p => !deadProd.has(p.id) && !(rp as any[]).some((r: any) => r.id === p.id)
          ),
          orders: orders.filter(o => !(ro as any[]).some((r: any) => r.id === o.id)),
          campaigns: campaigns.filter(
            c => !deadCamp.has(c.id) && !(rc as any[]).some((r: any) => r.id === c.id)
          ),
          requests: categoryRequests.filter(
            q => !deadReq.has(q.id) && !(rq as any[]).some((r: any) => r.id === q.id)
          ),
          reviews: reviews.filter(r => !(rr as any[]).some((x: any) => x.id === r.id)),
          transactions: transactions.filter(t => !seedTxnIds.has(t.id)),
        };
        if (Object.values(missing).some(a => (a as unknown[]).length > 0)) {
          const res = (await apiFetch('/sync/push', {
            method: 'POST',
            body: JSON.stringify(missing),
          })) as { pushed?: Record<string, number> };
          pushed = res.pushed;
        }
      } catch {
        /* push is best-effort; pull-merge below still applies */
      }
      if (Array.isArray(rp) && rp.length) setProducts(prev => mergeById(rp as Product[], prev));
      if (Array.isArray(ro) && ro.length) {
        // Seller view returns items filtered to own lines; full orders come with all items
        setOrders(prev => mergeById(ro as Order[], prev));
      }
      if (Array.isArray(rr) && rr.length) setReviews(prev => mergeById(rr as Review[], prev));
      if (Array.isArray(rc) && rc.length) setCampaigns(prev => mergeById(rc as Campaign[], prev));
      if (Array.isArray(rg) && rg.length) {
        setCategories((rg as Category[]).filter(c => c.isActive !== false));
      }
      if (Array.isArray(rq) && rq.length) {
        setCategoryRequests(prev => mergeById(rq as CategoryRequest[], prev));
      }
      setBackendOnline(true);
      setLastSync({ at: stamp(), pushed, tombstonesApplied });
      return true;
    } catch (e) {
      const msg = (e as Error)?.message || 'sync failed';
      if (msg === 'Invalid token' || msg.includes('401')) {
        setToken(null);
      }
      setBackendOnline(false);
      setLastSync({ at: stamp(), error: msg });
      return false;
    }
  };

  // Retry-once wrapper: a 404 means the row was born locally and never pushed
  // (signed-out action, or push raced). Sync first, then retry the same call.
  const withPushRetry = async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (getToken() && /404/.test(String((e as Error)?.message || ''))) {
        await syncNow();
        return await fn();
      }
      throw e;
    }
  };
  useEffect(() => {
    syncNow();
    // Keep-warm: Neon free tier sleeps after minutes idle; a tiny ping every
    // 4 minutes keeps demo sessions warm so sign-in/saves never hang.
    // NOTE: /health lives at server ROOT, not under /api.
    const warm = setInterval(() => {
      fetch('http://localhost:5000/health').catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(warm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authTick]);

  // Role switching: keep current account when it already has that role,
  // otherwise restore the last-used account of that role (Rosy stays Rosy).
  // IMPORTANT: while signed in, the JWT belongs to exactly one backend user.
  // Switching view/account without re-authenticating would send that user's
  // token with another identity's actions (seller publish as customer -> 403
  // -> silent local save). So a tokened switch opens login instead; the
  // successful login sets view + identity + token together, atomically.
  const switchRole = (newRole: Role) => {
    if (getToken()) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentRole(newRole);
    if (currentUser.role === newRole) return;
    const lastId = safeStorage.getItem(`pg_last_user_${newRole}`);
    const remembered = lastId ? allUsers.find(u => u.id === lastId) : undefined;
    const profile = remembered || allUsers.find(u => u.role === newRole);
    if (profile) {
      setCurrentUser(profile);
    }
  };

  // Dedupe helper: repeated sign-ins/registrations must never leave twin
  // rows with the same id (React duplicate-key crash in account lists).
  const dedupeById = (list: User[]): User[] => {
    const seen = new Set<string>();
    return [...list].reverse().filter(u => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    }).reverse();
  };
  // Manual account switch (e.g. pick Rosy among sellers). Stays until changed again.
  // Same token rule as switchRole: re-authenticate when signed in.
  const switchAccount = (userId: string) => {
    if (getToken()) {
      setIsAuthModalOpen(true);
      return;
    }
    const profile = allUsers.find(u => u.id === userId);
    if (profile) {
      setCurrentUser(profile);
      setCurrentRole(profile.role);
    }
  };

  // Backend-authenticated login (JWT) with local fallback.
  // Online: verifies password on Express, stores JWT, and ADOPTS the backend
  // identity wholesale (backend ids are canonical after the rename migration).
  // Offline (server/Neon asleep): falls back to old local behavior.
  const login = async (
    email: string,
    password?: string,
    roleHint?: Role
  ): Promise<{ ok: boolean; error?: string; offline?: boolean }> => {
    const cleanEmail = email.trim();
    if (password) {
      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        setToken(data.token);
        const bu = data.user as BackendUser;
        const adopted: User = {
          id: bu.id,
          name: bu.name,
          email: bu.email,
          role: bu.role,
          storeName: bu.storeName || undefined,
          joinedDate: 'Oct 2026',
        };
        setAllUsers(prev => {
          const rest = prev.filter(
            u => u.email.toLowerCase() !== adopted.email.toLowerCase() || u.id === adopted.id
          );
          const next = rest.some(u => u.id === adopted.id) ? rest : [...rest, adopted];
          return dedupeById(next);
        });
        setCurrentUser(adopted);
        setCurrentRole(adopted.role);
        setIsAuthModalOpen(false);
        setAuthTick(t => t + 1); // pull server truth now that we hold a token
        return { ok: true };
      } catch (e) {
        if (!isBackendError(e)) {
          // Backend reachable but credentials wrong -> real error, no fallback
          return { ok: false, error: (e as Error).message || 'Sign in failed' };
        }
        // else: fall through to local offline mode
      }
    }
    const role = roleHint || currentRole;
    const found = allUsers.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setCurrentRole(found.role);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role,
        joinedDate: 'Sep 2026',
      };
      setAllUsers(prev => dedupeById([...prev, newUser]));
      setCurrentUser(newUser);
      setCurrentRole(role);
    }
    setIsAuthModalOpen(false);
    setBackendOnline(false); // local-only sign in
    return { ok: true, offline: Boolean(password) };
  };

  // Backend registration (JWT) with local fallback.
  const register = async (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    storeName?: string;
  }): Promise<{ ok: boolean; error?: string; offline?: boolean }> => {
    const cleanEmail = input.email.trim();
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name.trim(),
          email: cleanEmail,
          password: input.password,
          role: input.role,
          storeName: input.storeName?.trim() || undefined,
        }),
      });
      setToken(data.token);
      const bu = data.user as BackendUser;
      const created: User = {
        id: bu.id,
        name: bu.name,
        email: bu.email,
        role: bu.role,
        storeName: bu.storeName || undefined,
        joinedDate: 'Oct 2026',
      };
      setAllUsers(prev =>
        dedupeById(
          prev.some(u => u.email.toLowerCase() === created.email.toLowerCase())
            ? prev.map(u => (u.email.toLowerCase() === created.email.toLowerCase() ? created : u))
            : [...prev, created]
        )
      );
      setCurrentUser(created);
      setCurrentRole(created.role);
      setIsAuthModalOpen(false);
      setAuthTick(t => t + 1); // pull server truth now that we hold a token
      return { ok: true };
    } catch (e) {
      if (!isBackendError(e)) {
        return { ok: false, error: (e as Error).message || 'Sign up failed' };
      }
      // Offline fallback: local-only account (same as old behavior)
      const fallback: User = {
        id: `user-${Date.now()}`,
        name: input.name.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: input.role,
        storeName: input.storeName?.trim() || undefined,
        joinedDate: 'Sep 2026',
      };
      setAllUsers(prev => dedupeById([...prev, fallback]));
      setCurrentUser(fallback);
      setCurrentRole(fallback.role);
      setIsAuthModalOpen(false);
      setBackendOnline(false); // local-only account
      return { ok: true, offline: true };
    }
  };

  const logout = () => {
    setToken(null);
    setBackendOnline(false);
    const defaultCust = INITIAL_USERS[0];
    setCurrentUser(defaultCust);
    setCurrentRole('customer');
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const deleteSeller = (sellerId: string, removeProducts: boolean = true) => {
    setAllUsers(prev => prev.filter(u => u.id !== sellerId));
    if (removeProducts) {
      setProducts(prev => prev.filter(p => p.sellerId !== sellerId));
    }
  };

  // Local monotonic counters backing the ID scheme when offline
  // (keys mirror server Sequence keys; backend wins on merge).
  const nextLocalSeq = (key: string): number => {
    const k = `pg_seq_${key.replace(/:/g, '_')}`;
    const cur = Number(safeStorage.getItem(k) || 0) + 1;
    safeStorage.setItem(k, String(cur));
    return cur;
  };
  const todayCompact = () => new Date().toISOString().split('T')[0].replace(/-/g, '');
  const pad6 = (n: number) => String(n).padStart(6, '0');

// Product Catalog management (multi-seller: listingId per seller, canonicalId shared for Apriori)
  // Backend-first when signed in (POST/PATCH/DELETE /api/products), local mirror otherwise.
  const addProduct = async (
    newProductData: Omit<Product, 'id' | 'canonicalId'> & Partial<Pick<Product, 'canonicalId'>>
  ): Promise<Product> => {
    const canonicalId = newProductData.canonicalId || toCanonicalId(newProductData.title);
    if (getToken()) {
      try {
        const remote = (await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify({ ...newProductData, canonicalId }),
        })) as Product;
        setProducts(prev => [remote, ...prev.filter(p => p.id !== remote.id)]);
        return remote;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    const fullProduct: Product = {
      ...newProductData,
      // Local ID = PRD-<sellerSeq>-<perSellerSeq> (server re-issues on sync if needed)
      id: `PRD-${pad6(currentUser.seqNum || 0)}-${pad6(nextLocalSeq(`PRD:${currentUser.id}`))}`,
      canonicalId,
    } as Product;
    setProducts(prev => [fullProduct, ...prev]);
    return fullProduct;
  };

  const editProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
    if (getToken()) {
      try {
        const remote = (await withPushRetry(() => apiFetch(`/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }))) as Product;
        setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...remote } : p)));
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const next = { ...p, ...updates };
        // Keep canonical in sync when title changes (so same-name listings keep merging)
        if (updates.title && !updates.canonicalId) {
          next.canonicalId = toCanonicalId(updates.title);
        }
        return next;
      })
    );
  };

  const deleteProduct = async (id: string): Promise<void> => {
    if (getToken()) {
      try {
        await withPushRetry(() => apiFetch(`/products/${id}`, { method: 'DELETE' }));
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    setCart(prev => prev.filter(item => item.product.id !== id));
    setWishlist(prev => prev.filter(pId => pId !== id));
  };

  const toggleStock = async (id: string): Promise<void> => {
    const target = products.find(p => p.id === id);
    if (getToken() && target) {
      try {
        const nextStock = !target.inStock;
        const remote = (await withPushRetry(() => apiFetch(`/products/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            inStock: nextStock,
            stockCount: nextStock ? (target.stockCount > 0 ? target.stockCount : 10) : 0,
          }),
        }))) as Product;
        setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...remote } : p)));
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStock = !p.inStock;
          return {
            ...p,
            inStock: nextStock,
            stockCount: nextStock ? (p.stockCount > 0 ? p.stockCount : 10) : 0,
          };
        }
        return p;
      })
    );
  };

  // Campaign management (Festival & Season Offers) — backend-first when signed in
  const addCampaign = async (campaignData: Omit<Campaign, 'id'>): Promise<void> => {
    if (getToken()) {
      try {
        const remote = (await apiFetch('/campaigns', {
          method: 'POST',
          body: JSON.stringify(campaignData),
        })) as Campaign;
        setCampaigns(prev => [remote, ...prev.filter(c => c.id !== remote.id)]);
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    const newCampaign: Campaign = {
      ...campaignData,
      // Local ID = CMP-<date>-<seq>
      id: `CMP-${todayCompact()}-${pad6(nextLocalSeq(`CMP:${todayCompact()}`))}`,
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>): Promise<void> => {
    if (getToken()) {
      try {
        const remote = (await withPushRetry(() => apiFetch(`/campaigns/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }))) as Campaign;
        setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, ...remote } : c)));
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCampaign = async (id: string): Promise<void> => {
    if (getToken()) {
      try {
        await withPushRetry(() => apiFetch(`/campaigns/${id}`, { method: 'DELETE' }));
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const toggleCampaignActive = async (id: string): Promise<void> => {
    const target = campaigns.find(c => c.id === id);
    if (getToken() && target) {
      try {
        const remote = (await withPushRetry(() => apiFetch(`/campaigns/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: !target.isActive }),
        }))) as Campaign;
        setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, ...remote } : c)));
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Order placement — backend-first when signed in (atomic stock + split routing),
  // identical local simulation otherwise.
  const placeOrder = async (
    shippingAddress: { street: string; city: string; state: string; zip: string },
    discountCode?: string
  ): Promise<Order> => {
    if (getToken()) {
      // Retry-once wrapper: cart may hold listings born locally (never pushed).
      // Unknown-product 400 -> push first, then retry the same order.
      const postOrder = () =>
        apiFetch('/orders', {
          method: 'POST',
          body: JSON.stringify({
            items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
            shippingAddress,
            discountCode,
          }),
        }) as Promise<Order>;
      try {
        let remote: Order;
        try {
          remote = await postOrder();
        } catch (e) {
          if (/Unknown product/.test(String((e as Error)?.message || ''))) {
            await syncNow();
            remote = await postOrder();
          } else {
            throw e;
          }
        }
        setOrders(prev => [remote, ...prev.filter(o => o.id !== remote.id)]);
        clearCart();
        // Refresh stock levels changed server-side (merge, never replace)
        apiFetch('/products').then(rp => {
          if (Array.isArray(rp)) setProducts(prev => mergeById(rp as Product[], prev));
        }).catch(() => {});
        return remote;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
      }
    }
    const subtotal = cartSubtotal;
    let discount = 0;
    const cleanCode = discountCode?.trim().toUpperCase();

    // Check campaigns first
    const matchedCampaign = campaigns.find(
      c => c.isActive && c.discountCode.toUpperCase() === cleanCode
    );

    if (matchedCampaign) {
      discount = (subtotal * matchedCampaign.discountPercent) / 100;
    } else if (cleanCode === 'GENIUS10') {
      discount = subtotal * 0.1;
    } else if (cleanCode === 'BUNDLE15') {
      discount = subtotal * 0.15;
    }

    const total = Math.max(0, subtotal - discount);
    // Multi-seller routing: each line keeps its listing owner + shared canonical key
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      canonicalId: item.product.canonicalId || toCanonicalId(item.product.title),
      sellerId: item.product.sellerId,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      imageUrl: item.product.imageUrl,
    }));

    const newOrder: Order = {
      // Local ID = ORD-<date>-<seq>
      id: `ORD-${todayCompact()}-${pad6(nextLocalSeq(`ORD:${todayCompact()}`))}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerEmail: currentUser.email,
      items: orderItems,
      subtotal,
      shipping: 0,
      discount,
      total,
      status: 'Processing',
      // Every involved seller starts at Processing and delivers their own lines
      sellerStatus: Object.fromEntries(
        Array.from(new Set(orderItems.map(i => i.sellerId).filter(Boolean))).map(s => [s, 'Processing'])
      ) as Record<string, Order['status']>,
      date: new Date().toISOString().split('T')[0],
      shippingAddress,
      trackingNumber: `PG-EXP-${Math.floor(100000 + Math.random() * 900000)}-NP`,
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    return newOrder;
  };

  const instantOrder = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(false);
    setSelectedProductDetail(null);
    setIsCheckoutModalOpen(true);
  };

  // Per-seller fulfillment:
  // - A seller marks ONLY their own lines (actor.sellerId). Global status becomes
  //   Delivered only when EVERY involved seller delivered -> then the full itemset
  //   is ingested into the dataset once.
  // - Admin / customer calls (no actor) set the whole order at once (old behavior).
  const sellersOfOrder = (order: Order): string[] => {
    const fromItems = order.items.map(
      i => i.sellerId || products.find(p => p.id === i.productId)?.sellerId || ''
    );
    return Array.from(new Set(fromItems.filter(Boolean)));
  };

  // Shared ingestion: append a delivered order's full canonical itemset to the
  // LOCAL dataset (mirror of what the backend does in Postgres on all-delivered).
  // target: the delivered order. remote=true means Neon already ingested it
  // (server response); the local mirror below is display-only in that case.
  const ingestOrderToDataset = (target: Order, remote = false) => {
    const orderId = target.id;
    const txDate = new Date().toISOString().split('T')[0];
    const txDateCompact = txDate.replace(/-/g, '');
    const purchasedCanonicalIds = Array.from(
      new Set(
        target.items.map(
          i => i.canonicalId || products.find(p => p.id === i.productId)?.canonicalId || i.productId
        )
      )
    );

    const alreadyIngested = transactions.some(t => t.orderId === orderId);
    if (!alreadyIngested && purchasedCanonicalIds.length > 0) {
      // Resolve canonicals back to seed listing IDs when possible so the
      // dataset table keeps showing real catalog IDs.
      const purchasedProductIds = purchasedCanonicalIds.map(
        c => products.find(p => p.canonicalId === c)?.id || c
      );
      const newTx: Transaction = {
        // Local ID = TXN-<date>-<seq>
        id: `TXN-${txDateCompact}-${pad6(nextLocalSeq(`TXN:${txDateCompact}`))}`,
        orderId,
        date: txDate,
        itemIds: purchasedProductIds,
      };

      const updatedTxList = [newTx, ...transactions];
      setTransactions(updatedTxList);
      safeStorage.setItem('pg_transactions_v8', JSON.stringify(updatedTxList));

      const newRawRow: RawDatasetRow = {
        transaction_id: newTx.id,
        customer_id: target.customerId,
        transaction_date: newTx.date,
        products_purchased: target.items.map(i => i.title).join(', '),
        type: 'Live Delivered Order',
        matchedProductIds: purchasedProductIds,
      };

      const updatedRows = [newRawRow, ...rawDatasetRows];
      setRawDatasetRows(updatedRows);
      safeStorage.setItem('pg_raw_dataset_rows_v8', JSON.stringify(updatedRows));

      setDeliveryNotification(
        remote
          ? `Order ${orderId} delivered! Saved to Neon & ingested (${purchasedProductIds.length} items in Apriori Database).`
          : `Order ${orderId} delivered locally (offline) — dataset will sync on next sign-in.`
      );

      setMiningTick(prev => prev + 1);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status'],
    actor?: { sellerId?: string }
  ): Promise<void> => {
    // Backend-first when signed in: server derives per-seller/global status itself
    // (from the JWT identity) and ingests into Postgres on all-delivered.
    if (getToken()) {
      try {
        const data = (await withPushRetry(() => apiFetch(`/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }))) as { order: Order; ingested: boolean };
        setOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)));
        if (data.ingested) ingestOrderToDataset(data.order, true);
        // Refresh stock levels changed server-side (merge, never replace:
        // a wholesale replace could drop fields the UI needs mid-render)
        apiFetch('/products').then(rp => {
          if (Array.isArray(rp)) setProducts(prev => mergeById(rp as Product[], prev));
        }).catch(() => {});
        return;
      } catch {
        setBackendOnline(false); /* remote failed: saved locally, badge shows offline */
        /* fall through to local */
      }
    }
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    const involved = sellersOfOrder(target);
    const prevSellerStatus: Record<string, Order['status']> =
      target.sellerStatus || Object.fromEntries(involved.map(s => [s, target.status]));
    const prevGlobal = target.status;

    let nextSellerStatus = { ...prevSellerStatus };
    let nextGlobal: Order['status'] = prevGlobal;

    if (actor?.sellerId && involved.includes(actor.sellerId)) {
      // One seller updates only their share
      nextSellerStatus[actor.sellerId] = status;
      const vals = involved.map(s => nextSellerStatus[s] || 'Processing');
      if (vals.every(v => v === 'Delivered')) nextGlobal = 'Delivered';
      else if (vals.some(v => v === 'Shipped' || v === 'Delivered')) nextGlobal = 'Shipped';
      else if (vals.every(v => v === 'Cancelled')) nextGlobal = 'Cancelled';
      else if (vals.some(v => v === 'Processing')) nextGlobal = 'Processing';
      else nextGlobal = status;
    } else {
      // Admin / customer: whole order at once
      nextGlobal = status;
      involved.forEach(s => {
        nextSellerStatus[s] = status;
      });
    }

    setOrders(prev => {
      const updated = prev.map(o =>
        o.id === orderId ? { ...o, status: nextGlobal, sellerStatus: nextSellerStatus } : o
      );
      safeStorage.setItem('pg_orders_v8', JSON.stringify(updated));
      return updated;
    });

    // Decrement stock only for sellers newly marked Delivered (their own lines)
    const newlyDelivered = involved.filter(
      s => nextSellerStatus[s] === 'Delivered' && prevSellerStatus[s] !== 'Delivered'
    );
    if (newlyDelivered.length > 0 && target.items.length > 0) {
      setProducts(prev => {
        const updated = prev.map(p => {
          const orderItem = target.items.find(i => i.productId === p.id);
          if (!orderItem) return p;
          const owner = orderItem.sellerId || products.find(pp => pp.id === p.id)?.sellerId;
          if (owner && newlyDelivered.includes(owner)) {
            const newStock = Math.max(0, p.stockCount - orderItem.quantity);
            return { ...p, stockCount: newStock, inStock: newStock > 0 };
          }
          return p;
        });
        safeStorage.setItem('pg_products_v8', JSON.stringify(updated));
        return updated;
      });
    }

    // Ingest into Apriori ONLY when the whole order is Delivered, i.e. every
    // involved seller delivered their lines. One seller delivering a 2-seller
    // order does NOT ingest yet.
    // Multi-seller dedup: mine canonicalIds so same product from different
    // sellers merges (pg-s1-01 + pg-s2-soap -> SOAP) instead of splitting support.
    if (nextGlobal === 'Delivered' && prevGlobal !== 'Delivered' && target && target.items.length > 0) {
      ingestOrderToDataset(target);
    }
  };

  // Dataset management — local parse immediately, mirror raw text to backend when signed in
  const importDatasetText = (text: string) => {
    const parsed = parseUserDataset(text);
    if (parsed.transactions.length > 0) {
      setTransactions(parsed.transactions);
      setRawDatasetRows(parsed.rawRows);
      setMiningTick(prev => prev + 1);
      if (getToken()) {
        apiFetch('/dataset/import', { method: 'POST', body: JSON.stringify({ text }) }).catch(() => {});
      }
      return { count: parsed.transactions.length };
    }
    return { count: 0 };
  };

  const resetToGoogleAdjustedDataset = () => {
    setProducts(GOOGLE_ADJUSTED_PRODUCTS);
    setTransactions(INITIAL_PARSED_DATASET.transactions);
    setRawDatasetRows(INITIAL_PARSED_DATASET.rawRows);
    setMiningTick(prev => prev + 1);
  };

  const seedSyntheticTransactions = (count: number = 25) => {
    // Sample canonicals (not listings) so duplicate seller listings don't get
    // over-sampled as if they were different products.
    const canonicals = Array.from(new Set(products.map(p => p.canonicalId || p.id)));
    if (canonicals.length === 0) return;

    const repFor = (c: string) => products.find(p => p.canonicalId === c) || products.find(p => p.id === c);

    const newTxList: Transaction[] = [];
    const newRawRows: RawDatasetRow[] = [];

    for (let i = 0; i < count; i++) {
      const size = Math.floor(Math.random() * 3) + 2; // 2 to 4 items
      const selected = new Set<string>();
      while (selected.size < size) {
        const randCanonical = canonicals[Math.floor(Math.random() * canonicals.length)];
        // Store the representative listing ID so dataset rows keep real catalog IDs
        selected.add(repFor(randCanonical)?.id || randCanonical);
      }
      const arr = Array.from(selected);
      const synthDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
      // Synthetic IDs follow the scheme too: TXN-<date>-<seq>
      const txId = `TXN-${synthDate}-${pad6(nextLocalSeq(`TXN:${synthDate}`))}`;

      newTxList.push({
        id: txId,
        orderId: `ORD-${synthDate}-${pad6(nextLocalSeq(`ORD:${synthDate}`))}`,
        date: new Date().toISOString().split('T')[0],
        itemIds: arr,
      });

      const titles = arr
        .map(id => products.find(p => p.id === id)?.title || id)
        .join(', ');

      newRawRows.push({
        transaction_id: txId,
        customer_id: `C-SYNTH-${Math.floor(100 + Math.random() * 900)}`,
        transaction_date: new Date().toISOString().split('T')[0],
        products_purchased: titles,
        type: 'Synthetic Affinities',
        matchedProductIds: arr,
      });
    }

    const updatedTx = [...newTxList, ...transactions];
    const updatedRows = [...newRawRows, ...rawDatasetRows];
    setTransactions(updatedTx);
    setRawDatasetRows(updatedRows);
    setMiningTick(prev => prev + 1);
  };

  // Mining Engine (canonical): listings -> canonicalIds -> Apriori -> resolve back to listings.
  // Same product from different sellers shares one canonicalId, so support merges
  // (SOAP 5+5=10) instead of splitting (pg-s1-01=5, pg-s2-soap=5).
  const productById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const canonicalOf = (id: string): string => productById.get(id)?.canonicalId || id;

  const representativeListing = (canonicalOrId: string): Product | undefined => {
    const direct = productById.get(canonicalOrId);
    if (direct) return direct;
    const inStock = products.find(p => p.canonicalId === canonicalOrId && p.inStock);
    return inStock || products.find(p => p.canonicalId === canonicalOrId);
  };

  const canonicalTransactions = useMemo(() => {
    // Drop item ids that resolve to neither a listing nor a known canonical.
    // Dead ids (products deleted after test orders) otherwise mine into
    // top-ranked junk rules whose consequents can never resolve to a product
    // — emptying every suggestion surface at once. Stored transactions are
    // untouched; this only sanitizes mining input. Resulting empty itemsets
    // match nothing in countSupport, so they are harmless.
    return transactions.map(tx => ({
      ...tx,
      itemIds: Array.from(
        new Set(
          tx.itemIds
            .map(canonicalOf)
            .filter(
              id => productById.has(id) || products.some(p => p.canonicalId === id)
            )
        )
      ),
    }));
  }, [transactions, productById]);

  const frequentItemsets = useMemo(() => {
    return runApriori(canonicalTransactions, minSupport, 3);
  }, [canonicalTransactions, minSupport, miningTick]);

  const associationRules = useMemo(() => {
    return generateAssociationRules(frequentItemsets, canonicalTransactions, minConfidence);
  }, [frequentItemsets, canonicalTransactions, minConfidence, miningTick]);

  const recomputeApriori = () => {
    setMiningTick(prev => prev + 1);
  };

  // Recommendations for Cart (cart listings -> canonicals -> mine -> resolve to listings)
  const cartProductIds = useMemo(() => cart.map(i => i.product.id), [cart]);

  const toListingRecs = (recs: AprioriRecommendation[]): AprioriRecommendation[] => {
    return recs
      .map(r => {
        const rep = representativeListing(r.recommendedProduct.id);
        if (!rep) return null;
        const basedOn = r.basedOnProducts
          .map(p => representativeListing(p.id) || representativeListing(p.canonicalId) || p)
          .filter((p): p is Product => Boolean(p));
        return { ...r, recommendedProduct: rep, basedOnProducts: basedOn };
      })
      .filter((r): r is AprioriRecommendation => r !== null);
  };

  const cartRecommendations = useMemo(() => {
    const cartCanonicals = Array.from(new Set(cartProductIds.map(canonicalOf)));
    const canonicalProducts: Product[] = Array.from(
      new Map(
        products.map(p => [
          p.canonicalId,
          { ...p, id: p.canonicalId },
        ])
      ).values()
    );
    const raw = getAprioriRecommendationsForCart(cartCanonicals, associationRules, canonicalProducts, 4);
    return toListingRecs(raw);
  }, [cartProductIds, associationRules, products, productById]);

  // Top overall store recommendations
  const topRecommendations = useMemo(() => {
    const canonicalProducts: Product[] = Array.from(
      new Map(
        products.map(p => [
          p.canonicalId,
          { ...p, id: p.canonicalId },
        ])
      ).values()
    );
    const raw = getAprioriRecommendationsForCart([], associationRules, canonicalProducts, 6);
    return toListingRecs(raw);
  }, [associationRules, products, productById]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        switchAccount,
        login,
        register,
        logout,
        allUsers,
        deleteUser,
        deleteSeller,

        products,
        addProduct,
        editProduct,
        deleteProduct,
        toggleStock,

        campaigns,
        activeCampaigns,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        toggleCampaignActive,

        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        wishlist,
        toggleWishlist,

        orders,
        placeOrder,
        updateOrderStatus,
        instantOrder,
        deliveryNotification,
        setDeliveryNotification,

        transactions,
        rawDatasetRows,
        importDatasetText,
        resetToGoogleAdjustedDataset,
        minSupport,
        setMinSupport,
        minConfidence,
        setMinConfidence,
        frequentItemsets,
        associationRules,
        cartRecommendations,
        topRecommendations,
        recomputeApriori,
        seedSyntheticTransactions,

        reviews,
        addReview,
        categories,
        categoryRequests,
        requestCategory,
        approveCategoryRequest,
        rejectCategoryRequest,
        backendOnline,
        syncNow,
        lastSync,

        selectedProductDetail,
        setSelectedProductDetail,
        activeMathModalRule,
        setActiveMathModalRule,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        activeCustomerTab,
        setActiveCustomerTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
