/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Truck, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { SolemanLogo } from './SolemanLogo';
import { AdminUser, CourierUser } from '../types';

interface StaffAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAdminLogin: () => void;
  onSelectCourierLogin: () => void;
  adminUser: AdminUser | null;
  courierUser: CourierUser | null;
  onAdminLogout: () => void;
  onCourierLogout: () => void;
  onOpenDashboard: () => void;
}

export const StaffAccessModal: React.FC<StaffAccessModalProps> = ({
  isOpen,
  onClose,
  onSelectAdminLogin,
  onSelectCourierLogin,
  adminUser,
  courierUser,
  onAdminLogout,
  onCourierLogout,
  onOpenDashboard
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex justify-center mb-1">
            <SolemanLogo size="sm" showSubtitle={false} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Internal Tim Soleman</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Pilih Akses Masuk Petugas
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Halaman ini khusus untuk tim operasional workshop dan kurir Soleman Cirebon.
          </p>
        </div>

        {/* If already logged in as Kurir or Admin */}
        {(adminUser || courierUser) && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
              Sesi Sedang Aktif:
            </span>
            
            {courierUser && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-400" />
                  <div>
                    <strong className="text-white block">Kurir Soleman</strong>
                    <span className="text-[10px] text-sky-400">{courierUser.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => { onCourierLogout(); onClose(); }}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold"
                >
                  Logout
                </button>
              </div>
            )}

            {adminUser && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <div>
                    <strong className="text-white block">Admin Workshop</strong>
                    <span className="text-[10px] text-amber-400">{adminUser.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => { onAdminLogout(); onClose(); }}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-bold"
                >
                  Logout
                </button>
              </div>
            )}

            <button
              onClick={() => {
                onOpenDashboard();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <span>Buka Dashboard Operasional</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Options to login */}
        <div className="space-y-3">
          
          {/* 1. Kurir Soleman */}
          <div 
            onClick={() => {
              onClose();
              onSelectCourierLogin();
            }}
            className="group p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-950/80 cursor-pointer transition-all flex items-start gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  Login Kurir Soleman
                </h4>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Antar-jemput sepatu wilayah Cirebon, navigasi maps pelanggan, dan konfirmasi COD/QRIS.
              </p>
              <span className="inline-block mt-2 text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Akses Kurir Resmi
              </span>
            </div>
          </div>

          {/* 2. Admin Workshop Soleman */}
          <div 
            onClick={() => {
              onClose();
              onSelectAdminLogin();
            }}
            className="group p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-950/80 cursor-pointer transition-all flex items-start gap-3.5 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Login Admin Workshop
                </h4>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Terima pesanan baru, tugaskan kurir, monitoring garansi dan kontrol servis teknisi.
              </p>
              <span className="inline-block mt-2 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Akses Administrator
              </span>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          <p>Portal ini tidak ditampilkan di dashboard pelanggan untuk menjaga kenyamanan privasi.</p>
        </div>
      </div>
    </div>
  );
};
