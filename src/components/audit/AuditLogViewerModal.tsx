import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ShieldCheck, X, Search, FileText, AlertTriangle, Printer, Trash2 } from 'lucide-react';

interface AuditLogViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogViewerModal: React.FC<AuditLogViewerModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs } = useRestaurant();
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredLogs = auditLogs
    .filter(log => filterAction === 'ALL' || log.action === filterAction)
    .filter(log => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.staffName.toLowerCase().includes(q) ||
        (log.orderId && log.orderId.toLowerCase().includes(q))
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto font-['Outfit']">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-750 rounded-3xl shadow-2xl p-5 sm:p-6 text-neutral-100 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Restaurant Security &amp; Fraud Prevention Audit Trail
              </h2>
              <p className="text-xs text-neutral-400">
                Immutable activity logs for order voids, bill re-prints, cash shifts, and manager overrides
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {['ALL', 'ORDER_VOID', 'BILL_REPRINT', 'REGISTER_CLOSE', 'DRAWER_OPEN', 'MENU_IMPORTED'].map(act => (
              <button
                key={act}
                type="button"
                onClick={() => setFilterAction(act)}
                className={`px-3 py-1 rounded-lg font-bold transition shrink-0 ${
                  filterAction === act
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {act.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-8 pr-3 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto border border-neutral-800 rounded-2xl bg-neutral-950">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-xs">
              No audit log entries match your filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-[11px] bg-neutral-900/50">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Staff / Role</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-900/40 transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'ORDER_VOID' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        log.action === 'BILL_REPRINT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        log.action === 'REGISTER_CLOSE' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-neutral-800 text-neutral-300'
                      }`}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-white">{log.staffName}</span>
                      <span className="text-[10px] text-neutral-400 block uppercase">
                        {log.staffRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300 leading-relaxed text-[11px]">
                      {log.details}
                      {log.reason && (
                        <span className="block text-[10px] text-amber-400 mt-0.5 font-semibold">
                          Reason: {log.reason}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                      {log.amount ? `₹${log.amount}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
          <span>Total Recorded Events: <strong>{auditLogs.length}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
