import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Admin decides seller category requests. Approve = atomic Neon transaction
// (category created + request flipped together); the new category instantly
// becomes usable by every seller.
export const CategoryApprovalQueue: React.FC = () => {
  const { categoryRequests, approveCategoryRequest, rejectCategoryRequest, allUsers } = useApp();
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const pending = categoryRequests.filter(r => r.status === 'pending');
  const decided = categoryRequests.filter(r => r.status !== 'pending');
  const nameOf = (id: string) =>
    allUsers.find(u => u.id === id)?.storeName ||
    allUsers.find(u => u.id === id)?.name ||
    id;

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    try {
      if (approve) await approveCategoryRequest(id);
      else await rejectCategoryRequest(id, note[id] || '');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8DDD8] p-5 shadow-sm space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-[#2D1217]">
          Category Requests ({pending.length} pending)
        </h3>
        <p className="text-xs text-[#5C4449] mt-0.5">
          One seller asks, admin decides, every seller uses. Stored in Neon (`Category` + `CategoryRequest`).
        </p>
      </div>

      {pending.length === 0 && (
        <div className="text-xs text-[#7A5B61] p-4 text-center bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DDD8]">
          No pending requests.
        </div>
      )}

      {pending.map(r => (
        <div key={r.id} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD8] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-[#2D1217]">{r.name}</span>
              <span className="block text-[11px] text-[#7A5B61]">
                by {r.requesterName || nameOf(r.requestedBy)}
                {r.description ? ` — ${r.description}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => decide(r.id, true)}
                disabled={busy === r.id}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => decide(r.id, false)}
                disabled={busy === r.id}
                className="px-3 py-1.5 bg-white border border-[#E8DDD8] text-rose-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-60"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
          <input
            type="text"
            value={note[r.id] || ''}
            onChange={e => setNote(prev => ({ ...prev, [r.id]: e.target.value }))}
            placeholder="Admin note (shown on reject, optional on approve)"
            className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
          />
        </div>
      ))}

      {decided.length > 0 && (
        <div className="pt-2 border-t border-[#F5EBE6] space-y-1">
          {decided.slice(0, 5).map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="text-[#5C4449]">
                {r.name} <span className="text-[#7A5B61]">· {r.requesterName || nameOf(r.requestedBy)}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
