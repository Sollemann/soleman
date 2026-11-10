/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Phone, MapPin, Clock, MessageSquare, ArrowUp } from 'lucide-react';
import { WORKSHOP_INFO } from '../data/solcreftData';
import { SolemanLogo } from './SolemanLogo';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
  onStaffAccess?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onStaffAccess }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <SolemanLogo size="md" onStaffAccess={onStaffAccess} />

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Solusi tuntas untuk reglue sol menganga, jahit sol keliling, resoling baru, unyellowing, deep clean, dan restorasi bahan kulit/kanvas dengan pengerjaan pres manual presisi di Cirebon.
            </p>

            <div className="pt-2 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{WORKSHOP_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{WORKSHOP_INFO.operatingHours}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WhatsApp: {WORKSHOP_INFO.phoneFormatted}</span>
              </div>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Menu Layanan
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={() => onNavigate('layanan')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Katalog Jenis Kerusakan Sepatu
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('antar-jemput')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Antar-Jemput & Berbagi Lokasi Web
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('dashboard')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Lacak Status Sepatu & Progres
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('kalkulator')} 
                  className="hover:text-amber-400 transition-colors text-left"
                >
                  Kalkulator Estimasi Biaya Servis
                </button>
              </li>
            </ul>
          </div>

          {/* Coverage Cirebon (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Area Antar-Jemput Kurir Soleman
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Melayani penjemputan cepat ke rumah & kantor di Kejaksan, Kesambi, Harjamukti, Lemahwungkuk, Pekalipan, Kedawung, Tuparev, Weru, Plered, Tengah Tani, Sumber, Gunungjati, dan sekitarnya se-Cirebon.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${WORKSHOP_INFO.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Admin WA: {WORKSHOP_INFO.phoneFormatted}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Soleman Cirebon. Perbaikan Sepatu Terlengkap di Cirebon. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <span>Kembali ke Atas</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
