/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Search, 
  CheckCircle2, 
  Flame,
  Tag
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
    label: 'Semua Layanan',
    iconText: '📋',
    description: 'Daftar lengkap 20 layanan reparasi & perawatan sepatu Soleman Sukalila Cirebon',
    categoryFilter: () => true
  },
  {
    id: 'menu-jahit',
    label: 'Jahit Sol',
    iconText: '🪡',
    description: 'Jahit sol benang tanam rapi tidak terlihat, sulam silang X kokoh, dan zig-zag dinamis',
    categoryFilter: (s) => s.category === 'jahit'
  },
  {
    id: 'menu-tapak',
    label: 'Ganti Tapak',
    iconText: '👟',
    description: 'Ganti outsole baru: sepatu sekolah, pantofel kantor, safety, futsal, trail 200k, gunung Vibram & sandal',
    categoryFilter: (s) => s.category === 'sol'
  },
  {
    id: 'menu-treatment',
    label: 'Treatment & Cuci',
    iconText: '✨',
    description: 'Midsole de-oksidasi unyellowing UV, repaint recolor warna baru, dan deep clean antibakteri',
    categoryFilter: (s) => s.category === 'warna' || s.category === 'kebersihan'
  },
  {
    id: 'menu-rekonstruksi',
    label: 'Rekonstruksi & Busa',
    iconText: '🛠️',
    description: 'Ganti busa kain tumit robek anti lecet, dan tambal patching kain upper kanvas/kulit',
    categoryFilter: (s) => s.category === 'busa' || s.category === 'kulit_upper'
  },
  {
    id: 'best',
    label: '⭐ Paling Sering Dipesan',
    iconText: '⭐',
    description: 'Layanan reparasi terfavorit warga Cirebon dengan tingkat kepuasan tertinggi',
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'jahit': return 'Jahit Sol';
      case 'sol': return 'Ganti Tapak';
      case 'warna': return 'Treatment Warna';
      case 'kebersihan': return 'Pembersihan';
      case 'busa': return 'Rekonstruksi Busa';
      case 'kulit_upper': return 'Patching Upper';
      default: return 'Reparasi';
    }
  };

  return (
    <section id="layanan" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Sederhana & Bersih */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-700/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Katalog Kerusakan & Solusi Reparasi Sepatu Cirebon</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pilih Sesuai <span className="text-cyan-400">Kerusakan Sepatu Anda</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            {currentMenu.description} — Foto di bawah sesuai dengan jenis kerusakan fisik dan hasil pengerjaan rapi standar pabrik.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik masalah sepatu (misal: sol lepas, licin)..."
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Menu Categories Switcher Bar - Sederhana, Rapih, Mudah Dipahami */}
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
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/60 hover:border-cyan-500/40 hover:text-white hover:bg-slate-800/90'
              }`}
            >
              <span>{menu.iconText}</span>
              <span>{menu.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-md font-mono ${
                isActive ? 'bg-slate-950/80 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Services Grid - Menampilkan Foto Kerusakan Masing-Masing dengan Tampilan Bersih */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        {filteredServices.map((service) => {
          const isBest = Boolean(service.isBestMenu);
          return (
            <div
              key={service.id}
              onClick={() => handleSelect(service)}
              className="group bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 hover:border-cyan-400/60 rounded-2xl p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-950/30 hover:-translate-y-0.5"
            >
              <div>
                {/* Dedicated Damage Photo */}
                <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-slate-950/90 border border-slate-800">
                  <img
                    src={service.image}
                    alt={service.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-sm text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      {isBest && <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      {isBest ? 'Paling Populer' : getCategoryLabel(service.category)}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-950/85 backdrop-blur-sm text-slate-200 border border-slate-700 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {service.durationEst}
                    </span>
                  </div>

                  {/* Warranty Badge Bottom */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-950/90 backdrop-blur-sm text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> Garansi {service.warrantyDays} Hari
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/30 backdrop-blur-sm">
                      Foto Kerusakan
                    </span>
                  </div>
                </div>

                {/* Service Name & Problem Definition */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {service.name}
                  </h3>
                  <div className="text-xs text-amber-200 font-medium flex items-start gap-1 bg-amber-950/30 p-1.5 rounded-lg border border-amber-500/25">
                    <span className="text-amber-400 font-bold shrink-0">Gejala Rusak:</span>
                    <span className="line-clamp-2">{service.damageTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {service.solution}
                  </p>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Biaya Reparasi:</span>
                  <span className="text-sm font-bold text-cyan-300 font-mono">
                    {service.priceFormatted}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(service);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-cyan-500/20"
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
        <div className="text-center py-12 bg-slate-900/80 rounded-2xl border border-slate-800 mt-4">
          <p className="text-slate-400 text-sm">Tidak ada layanan yang sesuai pencarian "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedMenuId('all');
            }}
            className="mt-3 px-4 py-1.5 text-xs font-semibold text-cyan-400 hover:underline cursor-pointer"
          >
            Tampilkan Semua Layanan
          </button>
        </div>
      )}
    </section>
  );
};
