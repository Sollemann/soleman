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

interface MenuDefinition {
  id: string;
  label: string;
  iconText: string;
  description: string;
  categoryFilter?: (service: ServiceItem) => boolean;
}

const SERVICE_MENUS: MenuDefinition[] = [
  {
    id: 'all',
    label: 'Semua Menu',
    iconText: '📋',
    description: 'Daftar lengkap seluruh layanan reparasi sepatu & sandal workshop Soleman Cirebon',
    categoryFilter: () => true
  },
  {
    id: 'menu-jahit',
    label: 'Menu Jahit Sol',
    iconText: '🪡',
    description: 'Spesialisasi jahit sol keliling: benang tanam tidak kelihatan, silang X, dan zig-zag dinamis',
    categoryFilter: (s) => s.category === 'jahit'
  },
  {
    id: 'menu-tapak',
    label: 'Menu Ganti Tapak',
    iconText: '👟',
    description: 'Resoling tapak baru: sekolah, kantor, safety, futsal gum, trail 200k, gunung Vibram & reglue',
    categoryFilter: (s) => s.category === 'sol'
  },
  {
    id: 'menu-treatment',
    label: 'Menu Treatment & Cuci',
    iconText: '✨',
    description: 'Perawatan estetik: unyellowing de-oksidasi UV, repaint recolor, dan deep clean antibakteri',
    categoryFilter: (s) => s.category === 'warna' || s.category === 'kebersihan'
  },
  {
    id: 'menu-rekonstruksi',
    label: 'Menu Rekonstruksi & Busa',
    iconText: '🛠️',
    description: 'Perbaikan anatomi sepatu: penggantian busa tumit robek & penambalan lubang kain kanvas/kulit',
    categoryFilter: (s) => s.category === 'busa' || s.category === 'kulit_upper'
  },
  {
    id: 'best',
    label: '⭐ Paling Populer',
    iconText: '⭐',
    description: 'Layanan yang paling sering dipesan oleh pelanggan setia warga Cirebon',
    categoryFilter: (s) => Boolean(s.isBestMenu)
  }
];

export const DamageCatalog: React.FC<DamageCatalogProps> = ({
  onSelectServiceForPickup
}) => {
  const [selectedMenuId, setSelectedMenuId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentMenu = SERVICE_MENUS.find(m => m.id === selectedMenuId) || SERVICE_MENUS[0];

  const filteredServices = SERVICES_CATALOG.filter((item) => {
    const matchesCategory = currentMenu.categoryFilter ? currentMenu.categoryFilter(item) : true;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

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
    <section id="layanan" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Compact Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Katalog Menu Reparasi Sepatu Soleman Cirebon</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Pilihan Menu Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 neon-glow-cyan">Terstruktur & Rapi</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {currentMenu.description}
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kerusakan / jenis sol..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950/90 border border-cyan-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Menu Categories Switcher Bar - Neatly Separated */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {SERVICE_MENUS.map((menu) => {
          const isActive = selectedMenuId === menu.id;
          const count = SERVICES_CATALOG.filter(s => menu.categoryFilter ? menu.categoryFilter(s) : true).length;
          return (
            <button
              key={menu.id}
              onClick={() => {
                soundFx.playClick();
                setSelectedMenuId(menu.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-[0_0_18px_rgba(0,240,255,0.4)] scale-102 font-black'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-cyan-500/40 hover:text-white'
              }`}
            >
              <span>{menu.iconText}</span>
              <span>{menu.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-slate-950 text-cyan-300 font-mono' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Services Grid - Crystal Ice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mt-2">
        {filteredServices.map((service) => {
          const isBest = Boolean(service.isBestMenu);
          return (
            <div
              key={service.id}
              onClick={() => handleSelect(service)}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isBest
                  ? 'bg-gradient-to-b from-cyan-950/40 via-slate-900/90 to-slate-950 border-cyan-400/50 hover:border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_25px_rgba(0,240,255,0.35)]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]'
              }`}
            >
              {/* Header: Best Tag or Category */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                  {isBest && <Flame className="w-3 h-3 text-cyan-400 fill-cyan-400" />}
                  {isBest ? 'Menu Terpopuler' : service.category === 'jahit' ? 'Jahit Sol' : service.category === 'sol' ? 'Ganti Tapak' : service.category === 'warna' ? 'Treatment' : 'Rekonstruksi'}
                </span>
                <span className="text-[10px] text-cyan-200/70 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-cyan-400" /> {service.durationEst}
                </span>
              </div>

              {/* Title & Short Description */}
              <div className="space-y-1.5 mb-3">
                <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                  {service.name}
                </h3>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {service.damageTitle} — {service.solution}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/90">
                <div>
                  <span className="text-[10px] text-slate-400 block">Mulai dari:</span>
                  <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-200 font-mono">
                    {service.priceFormatted}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(service);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md shadow-cyan-400/30 transition-all group-hover:translate-x-0.5 cursor-pointer"
                >
                  <span>Pilih</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
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
