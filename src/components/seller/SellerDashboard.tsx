import React, { useState, useMemo } from 'react';
import {
  Store,
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Truck,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Order } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { CategoryRequestBox } from './CategoryRequestBox';
import { formatPrice } from '../../utils/format';
import { uniqueById } from '../../utils/unique';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const SellerDashboard: React.FC = () => {
  const {
    products,
    deleteProduct,
    toggleStock,
    orders,
    updateOrderStatus,
    associationRules,
    setActiveMathModalRule,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'apriori'>('inventory');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Seller isolation: private inventory (own listings only).
  // Storefront stays public (customer sees all sellers), Apriori merges via canonicalId.
  const sellerProducts = useMemo(
    () => products.filter(p => p.sellerId === currentUser.id),
    [products, currentUser.id]
  );
  const ownIds = useMemo(() => new Set(sellerProducts.map(p => p.id)), [sellerProducts]);
  // Orders containing at least one of my listings; rows show only my items.
  const sellerOrders = useMemo(
    () =>
      orders
        .map(o => ({
          ...o,
          items: o.items.filter(i => (i.sellerId ? i.sellerId === currentUser.id : ownIds.has(i.productId))),
        }))
        .filter(o => o.items.length > 0),
    [orders, currentUser.id, ownIds]
  );
  const totalRevenue = sellerOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    0
  );
  const totalUnitsSold = sellerOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const lowStockItems = sellerProducts.filter(p => p.stockCount <= 5);

  // Mined Apriori association insights (rules are canonical; resolve to my listings when possible)
  const productMap = new Map(products.map(p => [p.id, p]));
  const canonicalRep = (canonical: string) =>
    sellerProducts.find(p => p.canonicalId === canonical) ||
    products.find(p => p.canonicalId === canonical) ||
    productMap.get(canonical);
  const merchantAssociationInsights = useMemo(() => {
    return associationRules.slice(0, 5).map(rule => {
      const p1 = canonicalRep(rule.antecedent[0]);
      const p2 = canonicalRep(rule.consequent[0]);
      return {
        rule,
        antecedent: p1,
        consequent: p2,
        confPct: Math.round(rule.confidence * 100),
        supPct: Math.round(rule.support * 100),
      };
    }).filter(item => Boolean(item.antecedent && item.consequent));
  }, [associationRules, products]);

  const filteredProducts = sellerProducts.filter(p =>
    p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Seller Header Banner */}
      <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#E8DDD8] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#5B1423] text-white flex items-center justify-center shrink-0 shadow-md">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#7A5B61] font-semibold">
                Merchant Portal
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Active Atelier
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2D1217]">
              {currentUser.storeName || 'Atelier Bordeaux & Co.'}
            </h1>
            <p className="text-xs text-[#5C4449] mt-0.5">
              Fulfillment center, live inventory in Rupees (Rs) & Apriori basket affinity cross-sell mining.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setProductToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Cards in Rupees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
            <span className="font-mono text-xs font-bold text-[#5B1423]">Rs</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#5B1423] tabular-nums">
            {formatPrice(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% from last period
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <Package className="w-4 h-4 text-[#5B1423]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2D1217] tabular-nums">
            {sellerOrders.length}
          </div>
          <div className="text-[11px] text-[#5C4449] mt-1">
            {sellerOrders.filter(o => o.status === 'Processing').length} awaiting fulfillment
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Units Sold</span>
            <Store className="w-4 h-4 text-[#5B1423]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2D1217] tabular-nums">
            {totalUnitsSold}
          </div>
          <div className="text-[11px] text-[#5C4449] mt-1">
            Across {sellerProducts.length} active catalog listings
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Health</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Items running low on stock (&le; 5 units)
          </div>
        </div>
      </div>

      {/* Request new global category */}
      <CategoryRequestBox />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DDD8] pb-4">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          Inventory & Listings ({sellerProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          Fulfillment Orders ({sellerOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('apriori')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
            activeTab === 'apriori'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8B4B8]" />
          <span>Apriori Cross-Sell Opportunities</span>
        </button>
      </div>

      {/* Tab 1: Inventory & Listings */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7A5B61] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title or SKU..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] w-64"
              />
            </div>
            <div className="text-xs text-[#7A5B61]">
              Showing {filteredProducts.length} items
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price (Rs)</th>
                    <th className="py-3 px-4">Stock Count</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {uniqueById(filteredProducts).map(p => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg border border-[#E8DDD8]"
                          />
                          <div>
                            <div className="font-semibold text-[#2D1217] max-w-[200px] truncate">{p.title}</div>
                            <div className="text-[10px] text-[#7A5B61]">Rating: {p.rating} ★ ({p.reviewsCount})</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#5C4449] font-semibold">{p.category}</td>
                      <td className="py-3 px-4 font-mono text-[#5C4449]">{p.sku}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#5B1423]">{formatPrice(p.price)}</td>

                      <td className="py-3 px-4 font-mono">
                        <span className={p.stockCount <= 5 ? 'text-amber-700 font-bold' : 'text-[#2D1217]'}>
                          {p.stockCount} units
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleStock(p.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            p.inStock
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {p.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setProductToEdit(p);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 text-[#5B1423] hover:bg-[#FCECE9] rounded-lg transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Orders & Fulfillment */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total (Rs)</th>
                    <th className="py-3 px-4">Shipping Destination</th>
                    <th className="py-3 px-4">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {uniqueById(sellerOrders).map(order => {
                    const myStatus = order.sellerStatus?.[currentUser.id] || order.status;
                    const others = Object.entries(order.sellerStatus || {}).filter(
                      ([sid]) => sid !== currentUser.id
                    );
                    const myTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
                    return (
                    <tr key={order.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#5B1423]">{order.id}</td>
                      <td className="py-3 px-4 text-[#5C4449]">{order.date}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2D1217]">{order.customerName}</div>
                        <div className="text-[10px] text-[#7A5B61]">{order.customerEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-[#5C4449]">
                        {order.items.map(i => `${i.quantity}x ${i.title.split(' ')[0]}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#2D1217]">
                        {formatPrice(myTotal)}
                      </td>
                      <td className="py-3 px-4 text-[#5C4449]">
                        {order.shippingAddress.city}, {order.shippingAddress.state}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={myStatus}
                          onChange={e =>
                            updateOrderStatus(order.id, e.target.value as any, {
                              sellerId: currentUser.id,
                            })
                          }
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E8DDD8] bg-[#FAF7F2] text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer"
                          title="Your fulfillment status for your items in this order"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        {others.length > 0 && (
                          <div className="text-[10px] text-[#7A5B61] mt-1">
                            Others: {others.map(([sid, st]) => `${st}`).join(' · ')} — dataset
                            ingests when all sellers delivered
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Apriori Cross-Sell Opportunities */}
      {activeTab === 'apriori' && (
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DDD8] space-y-2">
            <div className="flex items-center gap-2 text-[#5B1423]">
              <Sparkles className="w-5 h-5 text-[#5B1423]" />
              <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                Merchant Cross-Sell & Bundling Insights
              </h3>
            </div>
            <p className="text-xs text-[#5C4449] leading-relaxed max-w-3xl">
              Using the Apriori algorithm on 300 customer transactions, these product associations reflect high support and confidence. Sellers can use these insights to launch curated gift bundles, cross-merchandise complementary pieces, and maximize average order value in Rupees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merchantAssociationInsights.map(({ rule, antecedent, consequent, confPct, supPct }) => (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-[#E8DDD8] p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#F5EBE6]">
                  <span className="text-[10px] uppercase tracking-wider text-[#7A5B61] font-semibold">
                    Strong Association Mined
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="bg-[#FCECE9] text-[#5B1423] font-bold px-2 py-0.5 rounded">
                      {confPct}% Confidence
                    </span>
                    <span className="text-[#7A5B61]">{supPct}% Support</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center p-2 rounded-lg bg-[#FAF7F2]">
                    <div className="text-[10px] text-[#7A5B61] uppercase font-semibold">Primary Product</div>
                    <div className="text-xs font-semibold text-[#2D1217] truncate mt-1">{antecedent?.title}</div>
                    <div className="text-xs font-mono font-bold text-[#5B1423]">{formatPrice(antecedent?.price)}</div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-[#5B1423] shrink-0" />

                  <div className="flex-1 text-center p-2 rounded-lg bg-[#FCECE9]">
                    <div className="text-[10px] text-[#5B1423] uppercase font-semibold">Associated Co-Purchase</div>
                    <div className="text-xs font-semibold text-[#2D1217] truncate mt-1">{consequent?.title}</div>
                    <div className="text-xs font-mono font-bold text-[#5B1423]">{formatPrice(consequent?.price)}</div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD8] text-xs text-[#5C4449] space-y-1">
                  <div className="font-semibold text-[#5B1423]">Merchant Action Recommendation:</div>
                  <p className="text-[11px] leading-snug">
                    Consider launching a gift bundle pairing {antecedent?.title.split(' ')[0]} with {consequent?.title.split(' ')[0]} at 10% off. Basket lift ratio is <strong>{rule.lift}x</strong>.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveMathModalRule(rule)}
                    className="text-xs text-[#7A1C30] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View Mathematical Derivation <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Edit / Add Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        productToEdit={productToEdit}
      />

    </div>
  );
};
