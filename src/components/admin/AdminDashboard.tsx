import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Layers,
  Sparkles,
  Sliders,
  RefreshCw,
  PlusCircle,
  Database,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Package,
  Search,
  Filter,
  X,
  AlertTriangle,
  Plus,
  FileText,
  RotateCcw,
  ExternalLink,
  Code,
  Gift,
  Tag,
  Copy,
  Calendar,
  Check,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role, Product, User, Campaign } from '../../types';
import { ProductFormModal } from '../seller/ProductFormModal';
import { CampaignManagerModal } from './CampaignManagerModal';
import { CategoryApprovalQueue } from './CategoryApprovalQueue';
import { RAW_DATASET_TEXT, GOOGLE_ADJUSTED_PRODUCTS } from '../../data/userDataset';
import { formatPrice } from '../../utils/format';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    deleteProduct,
    orders,
    allUsers,
    deleteUser,
    deleteSeller,
    switchRole,
    updateOrderStatus,
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
    recomputeApriori,
    seedSyntheticTransactions,
    setActiveMathModalRule,
    currentUser,
    campaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaignActive,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'products' | 'campaigns' | 'sellers' | 'apriori' | 'transactions'
  >('products');
  const [isMining, setIsMining] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sellerFilter, setSellerFilter] = useState('All');
  const [productSourceFilter, setProductSourceFilter] = useState<'all' | 'seller' | 'catalog'>('all');
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'seller' | 'customer' | 'admin'>('all');

  // Dataset State
  const [searchTx, setSearchTx] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [datasetSubTab, setDatasetSubTab] = useState<'transactions' | 'mappings'>('transactions');
  const [isRawDatasetModalOpen, setIsRawDatasetModalOpen] = useState(false);
  const [datasetInputText, setDatasetInputText] = useState(RAW_DATASET_TEXT);

  // Modals & Confirmation States
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<User | null>(null);
  const [removeSellerProducts, setRemoveSellerProducts] = useState<boolean>(true);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState<boolean>(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Platform calculations in Rs
  const totalGMV = orders.reduce((sum, o) => sum + o.total, 0);
  const productMap = new Map(products.map(p => [p.id, p]));
  // Rules are canonical (multi-seller dedup); resolve to a representative listing title.
  const repTitle = (canonicalOrId: string) =>
    productMap.get(canonicalOrId)?.title ||
    products.find(p => p.canonicalId === canonicalOrId)?.title ||
    canonicalOrId;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRunMining = () => {
    setIsMining(true);
    setTimeout(() => {
      recomputeApriori();
      setIsMining(false);
      showToast('Apriori association rules successfully re-mined from 300 transaction records.');
    }, 300);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    const title = productToDelete.title;
    deleteProduct(productToDelete.id);
    setProductToDelete(null);
    showToast(`Product "${title}" has been permanently removed.`);
  };

  const handleConfirmDeleteSeller = () => {
    if (!sellerToDelete) return;
    const name = sellerToDelete.storeName || sellerToDelete.name;
    deleteSeller(sellerToDelete.id, removeSellerProducts);
    setSellerToDelete(null);
    showToast(`Seller "${name}" and permissions have been removed.`);
  };

  const handleSaveCampaign = (campaignData: Omit<Campaign, 'id'>) => {
    if (campaignToEdit) {
      updateCampaign(campaignToEdit.id, campaignData);
      showToast(`Campaign "${campaignData.title}" updated.`);
    } else {
      addCampaign(campaignData);
      showToast(`New campaign "${campaignData.title}" launched live!`);
    }
    setCampaignToEdit(null);
  };

  // Unique Categories from active products
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Unique Sellers for filtering
  const uniqueSellers = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.sellerName) set.add(p.sellerName);
    });
    return Array.from(set);
  }, [products]);

  // Count of seller-added products
  const sellerAddedCount = useMemo(() => {
    return products.filter(p => !GOOGLE_ADJUSTED_PRODUCTS.some(gp => gp.id === p.id)).length;
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat =
        categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchSeller = sellerFilter === 'All' || (p.sellerName && p.sellerName === sellerFilter);
      const isSellerAdded = !GOOGLE_ADJUSTED_PRODUCTS.some(gp => gp.id === p.id);
      const matchSource =
        productSourceFilter === 'all' ||
        (productSourceFilter === 'seller' && isSellerAdded) ||
        (productSourceFilter === 'catalog' && !isSellerAdded);

      const q = searchProduct.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchCat && matchSeller && matchSource && matchSearch;
    });
  }, [products, categoryFilter, sellerFilter, productSourceFilter, searchProduct]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const q = searchUser.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.storeName && u.storeName.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [allUsers, roleFilter, searchUser]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return rawDatasetRows.filter(row => {
      const matchType = txTypeFilter === 'all' || row.type.toLowerCase().includes(txTypeFilter.toLowerCase());
      const q = searchTx.toLowerCase().trim();
      const matchSearch =
        !q ||
        row.transaction_id.toLowerCase().includes(q) ||
        row.customer_id.toLowerCase().includes(q) ||
        row.products_purchased.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [rawDatasetRows, txTypeFilter, searchTx]);

  const sellerCount = allUsers.filter(u => u.role === 'seller').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className="p-4 bg-emerald-900 text-emerald-100 rounded-xl border border-emerald-700 shadow-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-[#460F1A] text-white p-6 sm:p-8 rounded-2xl border border-[#3D0F18] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#5B1423] text-white flex items-center justify-center shrink-0 border border-[#7A1C30] shadow-md">
            <ShieldCheck className="w-7 h-7 text-[#F2CAC2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[#F2CAC2] font-semibold">
                Platform Administrator Console
              </span>
              <span className="text-[10px] bg-white/10 text-white font-semibold px-2 py-0.5 rounded-full border border-white/20">
                Active Governance
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              ProductGenius Ops & Campaigns
            </h1>
            <p className="text-xs text-[#E8DDD8] mt-0.5">
              Launch Festival & Season offers, manage catalog in Rs, oversee merchants, and calibrate the 300-transaction Apriori engine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setCampaignToEdit(null);
              setIsCampaignModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-amber-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Gift className="w-4 h-4 text-amber-200" />
            <span>Launch Campaign</span>
          </button>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductFormOpen(true);
            }}
            className="px-3.5 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#7A1C30] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#F2CAC2]" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => seedSyntheticTransactions(5)}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Add 5 random simulated checkouts"
          >
            <PlusCircle className="w-4 h-4 text-[#F2CAC2]" />
            <span>Seed 5 Baskets</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in Rupees */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales (GMV)</span>
            <span className="font-mono text-xs font-bold text-[#5B1423]">Rs</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#5B1423] tabular-nums">
            {formatPrice(totalGMV)}
          </div>
          <div className="text-[11px] text-[#5C4449] mt-1">
            Across {orders.length} verified transactions
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Campaigns</span>
            <Gift className="w-4 h-4 text-[#5B1423]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2D1217] tabular-nums">
            {campaigns.filter(c => c.isActive).length} Live Offers
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Shown below navbar & Apriori showcase
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Products</span>
            <Package className="w-4 h-4 text-[#5B1423]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2D1217] tabular-nums">
            {products.length} Items (Rs)
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            4 Core Categories (Skincare, Makeup, Bodycare, Fragrance)
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm">
          <div className="flex items-center justify-between text-[#7A5B61] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mined Apriori Rules</span>
            <Sparkles className="w-4 h-4 text-[#5B1423]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#5B1423] tabular-nums">
            {associationRules.length} Rules
          </div>
          <div className="text-[11px] text-[#5C4449] mt-1">
            From {transactions.length} customer checkout records
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DDD8] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'products'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Manage Products ({products.length})</span>
        </button>

        {/* User Request 2: Campaign Feature in Admin Dashboard */}
        <button
          onClick={() => setActiveAdminTab('campaigns')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'campaigns'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-500" />
          <span>Festival & Season Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('sellers')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'sellers'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Manage Sellers & Users ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('apriori')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'apriori'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8B4B8]" />
          <span>Apriori Mining Engine</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('transactions')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeAdminTab === 'transactions'
              ? 'bg-[#5B1423] text-white shadow-sm'
              : 'bg-white text-[#5C4449] hover:bg-[#FCECE9] hover:text-[#5B1423] border border-[#E8DDD8]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Dataset Records ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: FESTIVAL & SEASON CAMPAIGNS */}
      {activeAdminTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                Festival & Season Offer Campaign Control
              </h3>
              <p className="text-xs text-[#5C4449]">
                Launch, toggle, and schedule seasonal discounts. Active campaigns are immediately displayed in the customer dashboard below the navbar and around the Apriori recommendation section.
              </p>
            </div>

            <button
              onClick={() => {
                setCampaignToEdit(null);
                setIsCampaignModalOpen(true);
              }}
              className="px-4 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#F2CAC2]" />
              <span>Launch New Campaign</span>
            </button>
          </div>

          {/* Campaign Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(camp => {
              return (
                <div
                  key={camp.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                    camp.isActive ? 'border-[#E8DDD8] ring-1 ring-[#5B1423]/10' : 'border-gray-200 opacity-70 bg-gray-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#F5EBE6]">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          camp.type === 'festival'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {camp.type === 'festival' ? 'Festival Offer' : 'Season Offer'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCampaignActive(camp.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            camp.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title={camp.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {camp.isActive ? <ToggleRight className="w-4 h-4 text-emerald-700" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{camp.isActive ? 'Live in App' : 'Inactive'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display text-lg font-bold text-[#2D1217] leading-tight">
                        {camp.title}
                      </h4>
                      <p className="text-xs text-[#5C4449] mt-1 line-clamp-2">
                        {camp.tagline}
                      </p>
                    </div>

                    {/* Promo Box */}
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD8] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7A5B61] tracking-wider block">
                          Coupon Code
                        </span>
                        <span className="font-mono text-sm font-extrabold text-[#5B1423]">
                          {camp.discountCode}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#7A5B61] tracking-wider block">
                          Discount
                        </span>
                        <span className="font-mono text-base font-bold text-emerald-700">
                          {camp.discountPercent}% OFF
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="text-[11px] text-[#7A5B61] space-y-1">
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <strong className="text-[#2D1217]">{camp.featuredCategory}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Valid Dates:</span>
                        <span className="font-mono">{camp.startDate} ~ {camp.endDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-[#F5EBE6] flex items-center justify-between">
                    <button
                      onClick={() => handleCopyCode(camp.discountCode)}
                      className="text-xs text-[#5B1423] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {copiedCode === camp.discountCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCampaignToEdit(camp);
                          setIsCampaignModalOpen(true);
                        }}
                        className="p-1.5 text-[#5B1423] hover:bg-[#FCECE9] rounded-lg transition-colors cursor-pointer"
                        title="Edit Campaign"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setCampaignToDelete(camp)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {campaigns.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E8DDD8] space-y-3">
              <Gift className="w-10 h-10 text-[#7A5B61] mx-auto opacity-60" />
              <h4 className="text-sm font-semibold text-[#2D1217]">No campaigns created</h4>
              <p className="text-xs text-[#7A5B61]">
                Launch festival or season campaigns to attract buyers with coupon discounts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE PRODUCTS */}
      {activeAdminTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                Catalog Products ({products.length})
              </h3>
              <p className="text-xs text-[#5C4449]">
                Prices configured in Rupees (Rs). Assigned to the 4 core categories: Skincare, Makeup, Bodycare, and Fragrance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#5C4449] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer font-medium"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#7A5B61] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, SKU..."
                  value={searchProduct}
                  onChange={e => setSearchProduct(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Product Visual & Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Price (Rs)</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {filteredProducts.map(p => {
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-11 h-11 rounded-lg border border-[#E8DDD8]"
                            />
                            <div className="max-w-[220px]">
                              <div className="font-semibold text-[#2D1217] truncate">{p.title}</div>
                              <div className="text-[10px] text-[#7A5B61] truncate">{p.description}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-[#5B1423]">{p.category}</span>
                        </td>

                        <td className="py-3 px-4 text-[#5C4449]">
                          {p.sellerName || 'Atelier Bordeaux & Co.'}
                        </td>

                        <td className="py-3 px-4 font-mono text-[#5C4449]">{p.sku}</td>

                        <td className="py-3 px-4 font-mono font-bold text-[#5B1423]">
                          {formatPrice(p.price)}
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className={p.stockCount <= 5 ? 'text-amber-700 font-bold' : 'text-[#2D1217]'}>
                            {p.stockCount} in stock
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setProductToEdit(p);
                                setIsProductFormOpen(true);
                              }}
                              className="p-1.5 text-[#5B1423] hover:bg-[#FCECE9] rounded-lg transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setProductToDelete(p)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Remove Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-12 text-center text-xs text-[#7A5B61]">
                No products found matching the search criteria.
              </div>
            )}
          </div>

          {/* Orders Fulfillment & Delivery Management */}
          <div className="bg-white rounded-2xl border border-[#E8DDD8] p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F5EBE6] pb-3">
              <div>
                <h4 className="font-display text-base font-semibold text-[#2D1217]">
                  Customer Orders & Delivery Status Management
                </h4>
                <p className="text-xs text-[#5C4449]">
                  Delivered orders automatically enrich the Apriori transaction dataset in Rupees.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#5B1423] bg-[#FCECE9] px-2.5 py-1 rounded-md font-semibold">
                {orders.filter(o => o.status === 'Delivered').length} Delivered / {orders.length} Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Basket Items</th>
                    <th className="py-2.5 px-3">Total (Rs)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {orders.map(order => {
                    const isDeliv = order.status === 'Delivered';
                    return (
                      <tr key={order.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#5B1423]">{order.id}</td>
                        <td className="py-2.5 px-3 text-[#2D1217]">{order.customerName}</td>
                        <td className="py-2.5 px-3 text-[#5C4449] max-w-xs truncate">
                          {order.items.map(i => `${i.quantity}x ${i.title.split(' ')[0]}`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#5B1423]">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isDeliv
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Shipped'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!isDeliv && (
                            <button
                              onClick={() => {
                                updateOrderStatus(order.id, 'Delivered');
                                showToast(`Order ${order.id} marked Delivered and added to Apriori Database!`);
                              }}
                              className="px-2.5 py-1 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-[11px] font-semibold rounded shadow-xs cursor-pointer"
                            >
                              Deliver & Ingest
                            </button>
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

      {/* TAB 3: SELLERS & USERS */}
      {activeAdminTab === 'sellers' && (
        <div className="space-y-4">
          <CategoryApprovalQueue />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                Merchant & User Governance
              </h3>
              <p className="text-xs text-[#5C4449]">
                Remove rogue sellers, manage merchant storefront permissions, or switch roles
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#7A5B61] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] w-52 sm:w-60"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#5C4449] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="seller">Sellers Only</option>
                <option value="customer">Customers Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">User / Merchant Identity</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Account Role</th>
                    <th className="py-3 px-4">Listed Products</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {filteredUsers.map(user => {
                    const userProducts = products.filter(p => p.sellerId === user.id);
                    const isSeller = user.role === 'seller';
                    const isAdmin = user.role === 'admin';

                    return (
                      <tr key={user.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#5B1423] text-white flex items-center justify-center font-bold text-xs">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-[#2D1217] flex items-center gap-1.5">
                                {user.name}
                                {user.id === currentUser.id && (
                                  <span className="text-[10px] bg-[#5B1423] text-white px-1.5 py-0.2 rounded font-medium">
                                    Current
                                  </span>
                                )}
                              </div>
                              {user.storeName && (
                                <div className="text-[11px] text-[#7A5B61] font-medium flex items-center gap-1">
                                  <Store className="w-3 h-3 text-[#5B1423]" />
                                  <span>{user.storeName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#5C4449] font-mono">{user.email}</td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-900'
                                : user.role === 'seller'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          {isSeller ? (
                            <span className="font-semibold text-[#5B1423]">
                              {userProducts.length} items listed
                            </span>
                          ) : (
                            <span className="text-[#7A5B61]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#5C4449]">{user.joinedDate}</td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => switchRole(user.role)}
                              className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#FCECE9] text-[#5B1423] text-xs font-semibold rounded-md border border-[#E8DDD8] transition-colors cursor-pointer"
                              title="Assume perspective"
                            >
                              Assume {user.role}
                            </button>

                            {isSeller && (
                              <button
                                onClick={() => {
                                  setSellerToDelete(user);
                                  setRemoveSellerProducts(true);
                                }}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Remove Seller"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Seller</span>
                              </button>
                            )}

                            {!isAdmin && !isSeller && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Remove User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* TAB 4: APRIORI MINING ENGINE */}
      {activeAdminTab === 'apriori' && (
        <div className="space-y-8">
          {/* Controls Console */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DDD8] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5EBE6] pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#5B1423] font-semibold">
                  Algorithm Hyperparameters
                </span>
                <h3 className="font-display text-2xl font-semibold text-[#2D1217]">
                  Apriori Association Engine Calibration
                </h3>
                <p className="text-xs text-[#5C4449] mt-1">
                  Mining market baskets across {transactions.length} customer checkout records in Skincare, Makeup, Bodycare, and Fragrance.
                </p>
              </div>

              <button
                onClick={handleRunMining}
                disabled={isMining}
                className="px-5 py-2.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isMining ? 'animate-spin' : ''}`} />
                <span>{isMining ? 'Mining 300 Transactions...' : 'Re-Mine Association Rules'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Minimum Support Slider */}
              <div className="space-y-3 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD8]">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#2D1217] uppercase tracking-wider">
                    Minimum Support Threshold (min_sup)
                  </span>
                  <span className="font-mono text-base font-bold text-[#5B1423]">
                    {(minSupport * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.30"
                  step="0.01"
                  value={minSupport}
                  onChange={e => setMinSupport(parseFloat(e.target.value))}
                  className="w-full accent-[#5B1423] cursor-pointer"
                />
                <p className="text-[11px] text-[#5C4449] leading-snug">
                  Itemsets must appear in at least <strong>{Math.ceil(minSupport * transactions.length)}</strong> of {transactions.length} total orders to be considered frequent.
                </p>
              </div>

              {/* Minimum Confidence Slider */}
              <div className="space-y-3 p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD8]">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#2D1217] uppercase tracking-wider">
                    Minimum Confidence Threshold (min_conf)
                  </span>
                  <span className="font-mono text-base font-bold text-[#5B1423]">
                    {(minConfidence * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.80"
                  step="0.05"
                  value={minConfidence}
                  onChange={e => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full accent-[#5B1423] cursor-pointer"
                />
                <p className="text-[11px] text-[#5C4449] leading-snug">
                  Rules A → B must hold true in at least <strong>{(minConfidence * 100).toFixed(0)}%</strong> of transactions containing itemset A.
                </p>
              </div>
            </div>
          </div>

          {/* Mined Association Rules Table */}
          <div className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DDD8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5B1423]" />
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[#2D1217]">
                  Mined Association Rules ({associationRules.length})
                </h4>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Antecedent (If Bought)</th>
                    <th className="py-2.5 px-4">Consequent (Recommended)</th>
                    <th className="py-2.5 px-4 font-mono">Support</th>
                    <th className="py-2.5 px-4 font-mono">Confidence</th>
                    <th className="py-2.5 px-4 font-mono">Lift</th>
                    <th className="py-2.5 px-4 text-right">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {associationRules.slice(0, 15).map(rule => {
                    const ante = rule.antecedent.map(id => repTitle(id)).join(' + ');
                    const cons = rule.consequent.map(id => repTitle(id)).join(' + ');

                    return (
                      <tr key={rule.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="py-2.5 px-4 font-medium text-[#2D1217] max-w-xs truncate">{ante}</td>
                        <td className="py-2.5 px-4 font-bold text-[#5B1423] max-w-xs truncate">{cons}</td>
                        <td className="py-2.5 px-4 font-mono">{(rule.support * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#5B1423]">
                          {(rule.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          <span className={rule.lift > 1 ? 'text-emerald-700 font-bold' : ''}>
                            {rule.lift}x
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setActiveMathModalRule(rule)}
                            className="text-[#7A1C30] hover:underline font-medium text-[11px] cursor-pointer"
                          >
                            Inspect Math
                          </button>
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

      {/* TAB 5: DATASET RECORDS */}
      {activeAdminTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                User Dataset Records ({rawDatasetRows.length} Rows)
              </h3>
              <p className="text-xs text-[#5C4449]">
                Raw user checkout transactions T0001 to T0300 mapped to Skincare, Makeup, Bodycare, and Fragrance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  resetToGoogleAdjustedDataset();
                  showToast('Reset dataset to initial 300 user transactions.');
                }}
                className="px-3 py-1.5 bg-white border border-[#E8DDD8] rounded-lg text-xs font-semibold text-[#5C4449] hover:bg-[#FCECE9] cursor-pointer"
              >
                Reset to 300 Rows
              </button>

              <button
                onClick={() => setIsRawDatasetModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#5B1423] text-white rounded-lg text-xs font-semibold hover:bg-[#7A1C30] cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View / Edit Raw Data</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DDD8] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E8DDD8] text-[#7A5B61] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">TX ID</th>
                    <th className="py-2.5 px-4">Purchased Products (Raw Tokens)</th>
                    <th className="py-2.5 px-4">Matched IDs</th>
                    <th className="py-2.5 px-4">Pattern Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBE6]">
                  {filteredTransactions.slice(0, 30).map(row => (
                    <tr key={row.transaction_id} className="hover:bg-[#FAF7F2]/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#5B1423]">{row.transaction_id}</td>
                      <td className="py-2.5 px-4 text-[#2D1217]">{row.products_purchased}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#7A5B61]">
                        {row.matchedProductIds.join(', ')}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="bg-[#FCECE9] text-[#5B1423] px-2 py-0.5 rounded text-[10px] font-semibold">
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RAW DATASET MODAL */}
      {isRawDatasetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-[#5B1423] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#F2CAC2]" />
                <h3 className="font-display text-lg font-semibold">300-Transaction Dataset Editor</h3>
              </div>
              <button
                onClick={() => setIsRawDatasetModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <p className="text-[#5C4449]">
                Format: <code>T0001 | Hydrating Cleanser, Daily Moisturizer, SPF50 Sunscreen</code>
              </p>

              <textarea
                value={datasetInputText}
                onChange={e => setDatasetInputText(e.target.value)}
                rows={16}
                className="w-full font-mono text-[11px] p-3 bg-white border border-[#E8DDD8] rounded-xl text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setDatasetInputText(RAW_DATASET_TEXT)}
                  className="px-3 py-1.5 bg-white text-[#5B1423] border border-[#E8DDD8] rounded-lg text-xs font-medium cursor-pointer"
                >
                  Reset to 300 Transactions
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const res = importDatasetText(datasetInputText);
                    setIsRawDatasetModalOpen(false);
                    showToast(`Successfully parsed and loaded ${res.count} transactions!`);
                  }}
                  className="px-4 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Apply & Re-mine Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PRODUCT MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-display text-lg font-semibold">Remove Product</h3>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E8DDD8]">
                <ImageWithFallback
                  src={productToDelete.imageUrl}
                  alt={productToDelete.title}
                  className="w-14 h-14 rounded-lg border border-[#E8DDD8]"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[#2D1217] truncate">
                    {productToDelete.title}
                  </div>
                  <div className="text-[#7A5B61] text-[11px]">
                    SKU: {productToDelete.sku} · {formatPrice(productToDelete.price)}
                  </div>
                </div>
              </div>

              <p className="text-[#5C4449]">
                Are you sure you want to permanently delete this product?
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#5C4449] border border-[#E8DDD8] rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProduct}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE SELLER MODAL */}
      {sellerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-display text-lg font-semibold">Remove Seller</h3>
              </div>
              <button
                onClick={() => setSellerToDelete(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#5C4449]">
                Are you sure you want to remove seller "{sellerToDelete.storeName || sellerToDelete.name}"?
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSellerToDelete(null)}
                  className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#5C4449] border border-[#E8DDD8] rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSeller}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CAMPAIGN MODAL */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden">
            <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-300" />
                <h3 className="font-display text-lg font-semibold">Delete Campaign</h3>
              </div>
              <button
                onClick={() => setCampaignToDelete(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-[#5C4449]">
                Are you sure you want to remove the campaign "{campaignToDelete.title}"? The promo code <strong>{campaignToDelete.discountCode}</strong> will no longer be active.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCampaignToDelete(null)}
                  className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#5C4449] border border-[#E8DDD8] rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteCampaign(campaignToDelete.id);
                    setCampaignToDelete(null);
                    showToast('Campaign successfully removed.');
                  }}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                >
                  Delete Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Product Form (Add / Edit) */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Campaign Manager Modal */}
      <CampaignManagerModal
        isOpen={isCampaignModalOpen}
        onClose={() => {
          setIsCampaignModalOpen(false);
          setCampaignToEdit(null);
        }}
        campaignToEdit={campaignToEdit}
        onSave={handleSaveCampaign}
      />

    </div>
  );
};
