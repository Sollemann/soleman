/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Truck, ShieldCheck, X, Lock, KeyRound } from 'lucide-react';
import { SolemanLogo } from './SolemanLogo';

interface StaffPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourier: () => void;
  onSelectAdmin: () => void;
}

export const StaffPortalModal: React.FC<StaffPortalModalProps> = ({
  isOpen,
  onClose,
  onSelectCourier,
  onSelectAdmin
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">
            Akses Masuk Petugas Soleman
          </h3>
          <p className="text-xs text-slate-400">
            Pilih jenis akun operasional untuk melanjutkan ke dashboard internal.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Option 1: Kurir */}
          <button
            onClick={() => {
              onClose();
              onSelectCourier();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500/60 text-left transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Login Kurir Soleman
              </span>
              <span className="text-[11px] text-slate-400">
                Akses kurir penjemputan, sinkronisasi Sherlock WA & navigasi rute
              </span>
            </div>
          </button>

          {/* Option 2: Admin */}
          <button
            onClick={() => {
              onClose();
              onSelectAdmin();
            }}
            className="w-full p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-left transition-all flex items-center gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Login Administrator Workshop
              </span>
              <span className="text-[11px] text-slate-400">
                Akses manager & approval order workshop Sukalila Selatan
              </span>
            </div>
          </button>
        </div>

        <div className="pt-2 text-center text-[10px] text-slate-500">
          Area Terbatas • Soleman Workshop Cirebon
        </div>
      </div>
    </div>
  );
};
