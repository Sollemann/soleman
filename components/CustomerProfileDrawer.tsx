/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Package, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { CustomerUser, Order } from '../types';
import { STATUS_LABELS } from '../data/solcreftData';

interface CustomerProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerUser: CustomerUser;
  orders: Order[];
  onLogout: () => void;
  onTrackOrder: (orderId: string) => void;
  onOpenBooking: () => void;
}

export const CustomerProfileDrawer: React.FC<CustomerProfileDrawerProps> = ({
  isOpen,
  onClose,
  customerUser,
  orders,
  onLogout,
  onTrackOrder,
  onOpenBooking
}) => {
  if (!isOpen) return null;

  // Filter orders matching customer phone
  const cleanPhone = customerUser.phone.replace(/[^0-9]/g, '');
  const customerOrders = orders.filter(o => {
    const oPhone = o.customerPhone.replace(/[^0-9]/g, '');
    return o.customerId === customerUser.id || (cleanPhone.length >= 8 && oPhone.includes(cleanPhone));
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between overflow-y-auto p-6 sm:p-7 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 font-black text-lg flex items-center justify-center border border-amber-500/30">
                {customerUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>{customerUser.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400">{customerUser.phone}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Security & Account Tier */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-300 block">Akun Terverifikasi</span>
                <span className="text-[10px] text-slate-400">Proteksi Data SSL 256-Bit</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Pelanggan Soleman
            </span>
          </div>

          {/* Customer Orders */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Riwayat Pesanan Anda ({customerOrders.length})
              </h4>
              <button
                onClick={() => { onClose(); onOpenBooking(); }}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                + Pesan Baru
              </button>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <Package className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Belum ada pesanan terdaftar di akun ini.</p>
                <button
                  onClick={() => { onClose(); onOpenBooking(); }}
                  className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400"
                >
                  Pesan Antar-Jemput Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {customerOrders.map(order => {
                  const statusInfo = STATUS_LABELS[order.status] || {
                    label: order.status,
                    color: 'text-slate-300',
                    badgeBg: 'bg-slate-800 text-slate-200 border-slate-700',
                  };
                  return (
                    <div
                      key={order.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-amber-400">#{order.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusInfo.badgeBg}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {order.shoeBrand} • {order.pairsCount} Pasang{order.shoeSize ? ` (EU ${order.shoeSize})` : ''}
                      </div>
                      {order.status === 'dibatalkan' && order.cancellationReason && (
                        <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
                          Alasan Batal: {order.cancellationReason}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                        <a
                          href={`https://wa.me/6283152276387?text=${encodeURIComponent(`Halo Admin Soleman, saya ${order.customerName} ingin menanyakan status Order #${order.id} (${order.shoeBrand}).`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          Tanya via WA <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-slate-800 space-y-2">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
