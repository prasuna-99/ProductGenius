import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Sparkles,
  Layers,
  Store,
  ShieldCheck,
  ChevronDown,
  LogOut,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getToken } from '../utils/api';
import { Role } from '../types';

export const Header: React.FC = () => {
  const {
    currentRole,
    currentUser,
    switchRole,
    switchAccount,
    allUsers,
    cartCount,
    setIsCartOpen,
    setIsAuthModalOpen,
    wishlist,
    activeCustomerTab,
    setActiveCustomerTab,
    logout,
    backendOnline,
    syncNow,
    lastSync,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Sibling accounts (manual switch, sticky) + role entry.
  // Signed out? A role entry opens the login form instead of just changing
  // the view — sync needs a JWT, and a view-switch alone never creates one.
  const enterRole = (role: Role) => {
    if (getToken()) {
      switchRole(role);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  // Other accounts with the same role (e.g. Rosy + Atelier both sellers).
  // Switching here is manual and sticky — it stays until changed again.
  // Deduped by id: repeated sign-ins must never render the same key twice.
  const siblingAccounts = allUsers.filter(
    (u, i, arr) =>
      u.role === currentUser.role &&
      u.id !== currentUser.id &&
      arr.findIndex(x => x.id === u.id) === i
  );

  const roleLabels: Record<Role, { title: string; badge: string; icon: typeof Store }> = {
    customer: { title: 'Customer', badge: 'Shopper', icon: ShoppingBag },
    seller: { title: 'Seller', badge: 'Merchant', icon: Store },
    admin: { title: 'Admin', badge: 'System Ops', icon: ShieldCheck },
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DDD8]">
      {/* Top micro-bar for quick role indicator & banner */}
      <div className="bg-[#5B1423] text-[#FAF7F2] px-4 py-1 text-xs flex justify-between items-center tracking-wide font-sans">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E8B4B8] animate-pulse"></span>
          <span>Apriori Association Engine active · Mining basket correlations in real-time</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncNow()}
            title={
              backendOnline
                ? 'Online: shop reads/writes Neon Postgres + Cloudinary. Click to re-sync.'
                : 'Local mode: signed out or backend unreachable — data stays in this browser. Sign in to sync.'
            }
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                backendOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[#F2CAC2]">{backendOnline ? 'Synced' : 'Local'}</span>
          </button>
          <span className="text-[#D8B7BE]">|</span>
          <span className="text-[#F2CAC2]">Current Mode:</span>
          <span className="font-semibold text-white uppercase tracking-wider">{currentRole}</span>
          <span className="text-[#D8B7BE]">|</span>
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="text-[#FAF7F2] hover:text-[#F2CAC2] underline text-xs transition-colors cursor-pointer"
          >
            Switch Role
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentRole === 'customer') {
                  setActiveCustomerTab('storefront');
                }
              }}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#5B1423] group-hover:text-[#7A1C30] transition-colors">
                ProductGenius
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Contextual to Active Role) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5C4449]">
            {currentRole === 'customer' && (
              <>
                <button
                  onClick={() => setActiveCustomerTab('storefront')}
                  className={`transition-colors hover:text-[#5B1423] cursor-pointer ${
                    activeCustomerTab === 'storefront' ? 'text-[#5B1423] font-semibold border-b-2 border-[#5B1423] pb-1' : ''
                  }`}
                >
                  Curated Catalog
                </button>
                <button
                  onClick={() => setActiveCustomerTab('recommendations')}
                  className={`flex items-center gap-1.5 transition-colors hover:text-[#5B1423] cursor-pointer ${
                    activeCustomerTab === 'recommendations' ? 'text-[#5B1423] font-semibold border-b-2 border-[#5B1423] pb-1' : ''
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5B1423]" />
                  <span>Genius Recommendations</span>
                </button>
                <button
                  onClick={() => setActiveCustomerTab('orders')}
                  className={`transition-colors hover:text-[#5B1423] cursor-pointer ${
                    activeCustomerTab === 'orders' ? 'text-[#5B1423] font-semibold border-b-2 border-[#5B1423] pb-1' : ''
                  }`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setActiveCustomerTab('wishlist')}
                  className={`transition-colors hover:text-[#5B1423] cursor-pointer ${
                    activeCustomerTab === 'wishlist' ? 'text-[#5B1423] font-semibold border-b-2 border-[#5B1423] pb-1' : ''
                  }`}
                >
                  Wishlist ({wishlist.length})
                </button>
              </>
            )}

            {currentRole === 'seller' && (
              <div className="flex items-center gap-2 text-xs text-[#7A1C30] bg-[#FCECE9] px-3 py-1.5 rounded-md border border-[#F2CAC2]">
                <Store className="w-4 h-4 text-[#5B1423]" />
                <span className="font-semibold">{currentUser.storeName || 'Atelier Bordeaux'}</span>
                <span>·</span>
                <span>Seller Control Center</span>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="flex items-center gap-2 text-xs text-[#5B1423] bg-[#F8DDD7] px-3 py-1.5 rounded-md border border-[#E8B4B8]">
                <ShieldCheck className="w-4 h-4 text-[#5B1423]" />
                <span className="font-semibold">Platform Administrator Console</span>
                <span>·</span>
                <span>Apriori Mining Engine</span>
              </div>
            )}
          </nav>

          {/* Zone 3: Primary Actions (Role Switcher + Cart + Profile) */}
          <div className="flex items-center gap-3">
            
            {/* Instant Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsRoleDropdownOpen(!isRoleDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#5B1423] bg-[#F8DDD7] hover:bg-[#F2CAC2] border border-[#E8B4B8] rounded-md transition-colors cursor-pointer"
                title="Switch Dashboard Role"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="capitalize">{currentRole} View</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {isRoleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#E8DDD8] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setIsRoleDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-[#F5EBE6] text-[11px] text-[#7A5B61] uppercase tracking-wider font-semibold">
                    Select Active Role
                  </div>

                  <button
                    onClick={() => enterRole('customer')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                      currentRole === 'customer' ? 'bg-[#FCECE9] text-[#5B1423] font-semibold' : 'text-[#2D1217]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#5B1423]" />
                      <div>
                        <div className="font-medium">Customer Dashboard</div>
                        <div className="text-[10px] text-[#7A5B61]">Shop & Apriori Recommendations</div>
                      </div>
                    </div>
                    {currentRole === 'customer' && <span className="text-[10px] text-[#5B1423]">Active</span>}
                  </button>

                  <button
                    onClick={() => enterRole('seller')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                      currentRole === 'seller' ? 'bg-[#FCECE9] text-[#5B1423] font-semibold' : 'text-[#2D1217]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#5B1423]" />
                      <div>
                        <div className="font-medium">Seller Dashboard</div>
                        <div className="text-[10px] text-[#7A5B61]">Inventory, Orders & Cross-Sell</div>
                      </div>
                    </div>
                    {currentRole === 'seller' && <span className="text-[10px] text-[#5B1423]">Active</span>}
                  </button>

                  <button
                    onClick={() => enterRole('admin')}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer ${
                      currentRole === 'admin' ? 'bg-[#FCECE9] text-[#5B1423] font-semibold' : 'text-[#2D1217]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#5B1423]" />
                      <div>
                        <div className="font-medium">Admin Dashboard</div>
                        <div className="text-[10px] text-[#7A5B61]">Apriori Mining Studio & Users</div>
                      </div>
                    </div>
                    {currentRole === 'admin' && <span className="text-[10px] text-[#5B1423]">Active</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Shopping Bag (Always accessible) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-[#5B1423] hover:text-[#7A1C30] hover:bg-[#F8DDD7]/60 rounded-full transition-colors cursor-pointer"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#5B1423] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsRoleDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 text-[#5B1423] hover:bg-[#F8DDD7]/60 rounded-full transition-colors cursor-pointer"
                aria-label="User Account"
              >
                <div className="w-7 h-7 rounded-full bg-[#5B1423] text-[#FAF7F2] flex items-center justify-center text-xs font-semibold">
                  {currentUser.name.charAt(0)}
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-[#E8DDD8] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#F5EBE6]">
                    <div className="font-medium text-xs text-[#2D1217]">{currentUser.name}</div>
                    <div className="text-[11px] text-[#7A5B61] truncate">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block text-[10px] text-[#5B1423] bg-[#FCECE9] px-2 py-0.5 rounded font-medium capitalize">
                        {currentUser.role}
                      </span>
                      <span
                        title={
                          backendOnline
                            ? 'JWT active — reads/writes hit Neon + Cloudinary'
                            : 'Local account — no JWT, everything stays in this browser'
                        }
                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                          backendOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {backendOnline ? '● Synced' : '● Local'}
                      </span>
                    </div>
                    {lastSync && (
                      <div className="mt-1 text-[10px] text-[#7A5B61] font-mono">
                        Last sync {lastSync.at}
                        {lastSync.pushed &&
                          ' · pushed ' +
                            Object.entries(lastSync.pushed)
                              .filter(([, n]) => (n as number) > 0)
                              .map(([k, n]) => `${n} ${k}`)
                              .join(', ')}
                        {lastSync.error && ` · ${lastSync.error}`}
                        {!lastSync.pushed && !lastSync.error && lastSync.tombstonesApplied
                          ? ` · removed ${lastSync.tombstonesApplied} deleted`
                          : null}
                        {!lastSync.pushed && !lastSync.error && !lastSync.tombstonesApplied && ' · up to date'}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-xs text-[#2D1217] hover:bg-[#FAF7F2] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[#7A5B61]" />
                    <span>Change Account / Sign In</span>
                  </button>

                  {siblingAccounts.length > 0 && (
                    <div className="border-t border-[#F5EBE6] mt-1 pt-1">
                      <div className="px-3 py-1 text-[10px] text-[#7A5B61] uppercase tracking-wider font-semibold">
                        Switch {currentUser.role} account (stays until changed)
                      </div>
                      {siblingAccounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => switchAccount(acc.id)}
                          className="w-full text-left px-3 py-2 text-xs text-[#2D1217] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        >
                          <div className="font-medium">{acc.storeName || acc.name}</div>
                          <div className="text-[10px] text-[#7A5B61] truncate">{acc.email}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-[#F5EBE6]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset to Demo Customer</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
