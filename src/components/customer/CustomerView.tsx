import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Heart,
  ShoppingBag,
  Star,
  Package,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { GeniusRecommendationsView } from './GeniusRecommendationsView';
import { ReviewModal } from '../ReviewModal';
import { CampaignShowcase } from './CampaignShowcase';
import { formatPrice } from '../../utils/format';
import { uniqueById } from '../../utils/unique';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const CustomerView: React.FC = () => {
  const {
    products,
    addToCart,
    instantOrder,
    wishlist,
    toggleWishlist,
    orders,
    updateOrderStatus,
    deliveryNotification,
    setDeliveryNotification,
    currentUser,
    setSelectedProductDetail,
    activeCustomerTab,
    setActiveCustomerTab,
    reviews,
    categories: globalCategories,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Category tabs = global list (base 4 + admin-approved), hence dynamic
  const categoryTabs = useMemo(
    () => ['All', ...globalCategories.map(c => c.name)],
    [globalCategories]
  );

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesCat =
          selectedCategory === 'All' ||
          p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesQuery =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // User's orders
  const userOrders = orders.filter(
    o => o.customerId === currentUser.id || o.customerEmail === currentUser.email
  );

  // Wishlisted products
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Real-time Delivery Toast */}
      {deliveryNotification && (
        <div className="p-4 bg-[#5B1423] text-white rounded-2xl border border-[#7A1C30] shadow-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="font-semibold text-xs tracking-wide uppercase text-[#F2CAC2] block">
                Apriori Transaction Ingestion Event
              </span>
              <p className="text-xs text-white/95 leading-snug">
                {deliveryNotification}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDeliveryNotification(null)}
            className="text-[#F2CAC2] hover:text-white transition-colors cursor-pointer text-xs font-semibold px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Below Navbar: Active Festival & Season Offer Campaign Showcase */}
      <CampaignShowcase
        onFilterCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveCustomerTab('storefront');
        }}
      />

      {/* Customer Space Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DDD8] pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveCustomerTab('storefront')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeCustomerTab === 'storefront'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          Curated Catalog
        </button>

        <button
          onClick={() => setActiveCustomerTab('recommendations')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeCustomerTab === 'recommendations'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8B4B8]" />
          <span>Genius Recommendations (Apriori)</span>
        </button>

        <button
          onClick={() => setActiveCustomerTab('orders')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeCustomerTab === 'orders'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          My Orders ({userOrders.length})
        </button>

        <button
          onClick={() => setActiveCustomerTab('wishlist')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeCustomerTab === 'wishlist'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          Wishlist ({wishlist.length})
        </button>
      </div>

      {/* View Switcher */}
      {activeCustomerTab === 'recommendations' && <GeniusRecommendationsView />}

      {activeCustomerTab === 'orders' && (
        <div className="space-y-6">
          <div className="border-b border-[#E8DDD8] pb-4">
            <h2 className="font-display text-2xl font-semibold text-[#2D1217]">
              Order History & Tracking
            </h2>
            <p className="text-xs text-[#5C4449] mt-1">
              Track deliveries, review item receipts in Rs, and view status history.
            </p>
          </div>

          {userOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E8DDD8] space-y-3">
              <Package className="w-10 h-10 text-[#7A5B61] mx-auto opacity-60" />
              <h3 className="text-sm font-semibold text-[#2D1217]">No previous orders</h3>
              <p className="text-xs text-[#7A5B61] max-w-sm mx-auto">
                Place your first boutique order from our curated catalog to initiate tracking.
              </p>
              <button
                onClick={() => setActiveCustomerTab('storefront')}
                className="mt-2 px-4 py-2 bg-[#5B1423] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#7A1C30] cursor-pointer"
              >
                Browse Storefront
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueById(userOrders).map(order => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E8DDD8] p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F5EBE6]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#5B1423]">{order.id}</span>
                        <span className="text-xs text-[#7A5B61]">· Placed on {order.date}</span>
                      </div>
                      <div className="text-xs text-[#5C4449] mt-0.5">
                        Tracking: <strong className="font-mono">{order.trackingNumber}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'Shipped'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className="text-base font-bold font-mono text-[#2D1217]">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Delivery progress stepper */}
                  <div className="py-2">
                    <div className="flex items-center justify-between text-xs text-[#7A5B61] mb-2 font-medium">
                      <span className={order.status ? 'text-[#5B1423] font-bold' : ''}>Ordered</span>
                      <span className={order.status !== 'Pending' ? 'text-[#5B1423] font-bold' : ''}>Processing</span>
                      <span className={order.status === 'Shipped' || order.status === 'Delivered' ? 'text-[#5B1423] font-bold' : ''}>Shipped</span>
                      <span className={order.status === 'Delivered' ? 'text-emerald-700 font-bold' : ''}>Delivered</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DDD8]">
                      <div
                        className="h-full bg-[#5B1423] transition-all"
                        style={{
                          width:
                            order.status === 'Delivered'
                              ? '100%'
                              : order.status === 'Shipped'
                              ? '75%'
                              : order.status === 'Processing'
                              ? '50%'
                              : '25%',
                        }}
                      />
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {order.items.map(item => {
                      const orderedProduct = products.find(p => p.id === item.productId);
                      const alreadyReviewed = reviews.some(
                        r => r.productId === item.productId && r.userId === currentUser.id
                      );
                      return (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD8]"
                      >
                        <ImageWithFallback
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded-lg"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-semibold text-[#2D1217] truncate">{item.title}</h5>
                          <div className="text-[11px] text-[#7A5B61]">Qty: {item.quantity}</div>
                          <div className="text-xs font-mono font-bold text-[#5B1423]">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          {order.status === 'Delivered' && orderedProduct && (
                            <button
                              onClick={() => setReviewProduct(orderedProduct)}
                              className={`mt-1 text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                alreadyReviewed
                                  ? 'text-emerald-700'
                                  : 'text-[#7A1C30] hover:underline'
                              }`}
                            >
                              <Star className={`w-3 h-3 ${alreadyReviewed ? 'fill-current' : ''}`} />
                              <span>{alreadyReviewed ? 'Reviewed' : 'Write a Review'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Order receipt footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F5EBE6] text-xs">
                    <div className="text-[11px] text-[#7A5B61]">
                      Shipping to: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                    </div>

                    {order.status !== 'Delivered' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'Delivered')}
                        className="py-1.5 px-3 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#F2CAC2]" />
                        <span>Confirm Delivery Received</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeCustomerTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="border-b border-[#E8DDD8] pb-4">
            <h2 className="font-display text-2xl font-semibold text-[#2D1217]">
              Saved Wishlist ({wishlistedProducts.length})
            </h2>
            <p className="text-xs text-[#5C4449] mt-1">
              Your curated collection of favorite pieces awaiting acquisition in Rs.
            </p>
          </div>

          {wishlistedProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E8DDD8] space-y-3">
              <Heart className="w-10 h-10 text-[#7A5B61] mx-auto opacity-60" />
              <h3 className="text-sm font-semibold text-[#2D1217]">No saved items</h3>
              <p className="text-xs text-[#7A5B61] max-w-sm mx-auto">
                Click the heart icon on any product in the catalog to save it for later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {uniqueById(wishlistedProducts).map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div
                    onClick={() => setSelectedProductDetail(product)}
                    className="cursor-pointer"
                  >
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-56"
                    />
                    <div className="p-4 space-y-1">
                      <div className="text-[11px] text-[#7A5B61] uppercase tracking-wider font-semibold">
                        {product.category}
                      </div>
                      <h4 className="text-sm font-semibold text-[#2D1217] truncate">
                        {product.title}
                      </h4>
                      <div className="text-sm font-mono font-bold text-[#5B1423]">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => addToCart(product, 1)}
                      className="flex-1 py-2 px-2.5 bg-white hover:bg-[#FAF7F2] text-[#5B1423] border border-[#E8DDD8] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Bag</span>
                    </button>
                    <button
                      onClick={() => instantOrder(product, 1)}
                      className="flex-1 py-2 px-2.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-[#F2CAC2]" />
                      <span>Order Now</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="p-2 border border-[#E8DDD8] rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Remove from Wishlist"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeCustomerTab === 'storefront' && (
        <div className="space-y-10">

          {/* Filter & Search Bar with the 4 Categories */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Category Filter Tabs: Skincare, Makeup, Bodycare, Fragrance */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white rounded-xl border border-[#E8DDD8]">
                {categoryTabs.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#5B1423] text-white shadow-sm'
                        : 'text-[#5C4449] hover:text-[#5B1423] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#7A5B61] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search Skincare, Makeup..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] w-48 sm:w-60"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#5C4449] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price (Rs): Low to High</option>
                  <option value="price-desc">Price (Rs): High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

            </div>

            {/* Product Grid (deduped: twin ids from repeated syncs render once) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {uniqueById(filteredProducts).map(product => {
                const isWishlisted = wishlist.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Card Image */}
                      <div
                        onClick={() => setSelectedProductDetail(product)}
                        className="relative h-64 overflow-hidden bg-[#FAF7F2] cursor-pointer"
                      >
                        <ImageWithFallback
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md shadow-sm transition-colors cursor-pointer ${
                            isWishlisted ? 'bg-[#5B1423] text-white' : 'bg-white/80 text-[#5B1423] hover:bg-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                        </button>

                        {product.isFeatured && (
                          <div className="absolute bottom-3 left-3 bg-[#5B1423]/90 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded tracking-wide backdrop-blur-sm">
                            Curator's Pick
                          </div>
                        )}
                      </div>

                      {/* Content & Metadata */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#7A5B61]">
                          <span className="uppercase tracking-wider font-bold text-[#5B1423]">
                            {product.category}
                          </span>
                          <span className="flex items-center gap-1 text-amber-700">
                            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                            <span className="font-bold">{product.rating}</span>
                          </span>
                        </div>

                        <h3
                          onClick={() => setSelectedProductDetail(product)}
                          className="font-display text-lg font-semibold text-[#2D1217] truncate cursor-pointer hover:text-[#5B1423] transition-colors"
                        >
                          {product.title}
                        </h3>

                        {product.googleSearchMatchedTerm && (
                          <div className="flex items-center gap-1 text-[10px] text-[#5B1423] font-medium bg-[#FCECE9] px-2 py-0.5 rounded-md border border-[#F2CAC2] w-fit">
                            <Sparkles className="w-2.5 h-2.5 text-[#7A1C30]" />
                            <span>Dataset: {product.googleSearchMatchedTerm}</span>
                          </div>
                        )}

                        <p className="text-xs text-[#5C4449] line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Purchase Bar */}
                    <div className="p-4 pt-0 border-t border-[#F5EBE6] flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold font-mono text-[#5B1423]">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-[#7A5B61] line-through font-mono">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="py-1.5 px-2.5 bg-white hover:bg-[#FAF7F2] text-[#5B1423] border border-[#E8DDD8] text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Add to shopping bag"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>

                        <button
                          onClick={() => instantOrder(product, 1)}
                          className="py-1.5 px-3 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          title="Instant order checkout in Rs"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-[#F2CAC2]" />
                          <span>Order</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-16 text-center bg-white rounded-2xl border border-[#E8DDD8] space-y-2">
                <Search className="w-8 h-8 text-[#7A5B61] mx-auto opacity-60" />
                <h3 className="text-sm font-semibold text-[#2D1217]">No products found</h3>
                <p className="text-xs text-[#7A5B61]">Try adjusting your search query or category filters.</p>
              </div>
            )}
          </div>

        </div>
      )}

      <ReviewModal product={reviewProduct} onClose={() => setReviewProduct(null)} />

    </div>
  );
};
