import React, { useState } from 'react';
import { Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Seller asks for a new global category. Admin approval makes it usable
// by every seller (synced with Neon). Pending until decided.
export const CategoryRequestBox: React.FC = () => {
  const { requestCategory, categoryRequests, currentUser, categories } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mine = categoryRequests.filter(r => r.requestedBy === currentUser.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await requestCategory(name, description);
      if (res.ok) {
        setMsg('Request sent to admin.');
        setName('');
        setDescription('');
      } else {
        setMsg(res.error || 'Could not send request.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-5 bg-white rounded-2xl border border-[#E8DDD8] shadow-sm space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-[#2D1217]">Request New Category</h3>
        <p className="text-xs text-[#5C4449] mt-0.5">
          Usable now: {categories.map(c => c.name).join(', ')}. Approved requests become
          global — every seller can list under them.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Herbal Tea"
          className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
        />
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{busy ? 'Sending...' : 'Request'}</span>
        </button>
      </form>

      {msg && <div className="text-xs text-[#5B1423] font-medium">{msg}</div>}

      {mine.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#F5EBE6]">
          {mine.map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#2D1217]">
                {r.name}
                {r.status === 'rejected' && r.adminNote && (
                  <span className="block text-[11px] font-normal text-[#7A5B61]">Admin: {r.adminNote}</span>
                )}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  r.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : r.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {r.status === 'approved' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : r.status === 'rejected' ? (
                  <XCircle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
