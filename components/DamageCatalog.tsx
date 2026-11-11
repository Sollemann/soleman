/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Zap,
  Flame
} from 'lucide-react';
import { SERVICES_CATALOG } from '../data/solcreftData';
import { DamageSeverity, ServiceItem } from '../types';
import { soundFx } from '../services/soundEffects';

interface DamageCatalogProps {
  onSelectServiceForPickup: (service: ServiceItem, severity?: DamageSeverity) => void;
  onOpenInstallModal?: () => void;
}

export const DamageCatalog: React.FC<DamageCatalogProps> = ({
  onSelectServiceForPickup
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'Semua Layanan (12)' },
    { id: 'best', label: '⭐ Menu Favorit' },
    { id: 'jahit', label: 'Jahit Sol' },
    { id: 'sol', label: 'Ganti Tapak' },
    { id: 'warna', label: 'Unyellowing' },
    { id: 'kebersihan', label: 'Cuci & Clean' },
    { id: 'busa', label: 'Busa & Upper' },
  ];

  const filteredServices = SERVICES_CATALOG.filter((item) => {
    const matchesCategory = 
      selectedCategory === 'all' 
        ? true 
        : selectedCategory === 'best' 
          ? Boolean(item.isBestMenu) 
          : item.category === selectedCategory || 
            (selectedCategory === 'busa' && (item.category === 'busa' || item.category === 'kulit_upper'));

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.damageTitle.toLowerCase().includes(query) ||
      item.solution.toLowerCase().includes(query);
    
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (service: ServiceItem) => {
    soundFx.playClick();
    onSelectServiceForPickup(service, 'normal');
    const el = document.getElementById('antar-jemput');
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section id="layanan" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Katalog Kerusakan & Solusi Soleman Cirebon</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Pilihan Jenis Kerusakan & Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Terlengkap</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Klik langsung layanan yang Anda butuhkan tanpa perlu scroll panjang.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kerusakan / merk..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900/90 border border-cyan-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Quick Filter Categories - 1 Row, Compact */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Compact Services Matrix Grid - All visible at a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredServices.map((service) => {
          const isBest = Boolean(service.isBestMenu);
          return (
            <div
              key={service.id}
              onClick={() => handleSelect(service)}
              className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isBest
                  ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900/90 to-slate-950 border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_25px_rgba(0,240,255,0.35)]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              }`}
            >
              {/* Header: Best Tag or Category */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  {isBest && <Flame className="w-3 h-3 text-cyan-400 fill-cyan-400" />}
                  {isBest ? 'Paling Populer' : service.category}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> {service.durationEst}
                </span>
              </div>

              {/* Title & Short Description */}
              <div className="space-y-1 mb-3">
                <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                  {service.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {service.damageTitle} — {service.solution}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Biaya Servis:</span>
                  <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200">
                    {service.priceFormatted}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(service);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md shadow-cyan-500/30 transition-all group-hover:translate-x-0.5 cursor-pointer"
                >
                  <span>Pilih</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Tidak ada layanan yang sesuai pencarian "{searchQuery}".</p>
        </div>
      )}
    </section>
  );
};
