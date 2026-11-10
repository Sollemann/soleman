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
  CheckCircle, 
  ArrowRight, 
  Search, 
  MessageSquare,
  Layers,
  Palette,
  Droplets,
  Scissors,
  Award,
  AlertCircle,
  Check
} from 'lucide-react';
import { SERVICES_CATALOG, DAMAGE_SEVERITIES, getServiceTierDetail } from '../data/solcreftData';
import { DamageCategory, DamageSeverity, ServiceItem } from '../types';
import { buildConsultationWhatsAppUrl } from '../services/whatsappHelper';
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
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);
  const [globalSeverity, setGlobalSeverity] = useState<DamageSeverity>('normal');
  const [cardSeverities, setCardSeverities] = useState<Record<string, DamageSeverity>>({});

  const getCardSeverity = (serviceId: string): DamageSeverity => {
    return cardSeverities[serviceId] || globalSeverity;
  };

  const handleSetCardSeverity = (serviceId: string, sev: DamageSeverity) => {
    soundFx.playClick();
    setCardSeverities(prev => ({
      ...prev,
      [serviceId]: sev
    }));
  };

  const handleSetGlobalSeverity = (sev: DamageSeverity) => {
    soundFx.playClick();
    setGlobalSeverity(sev);
    setCardSeverities({});
  };

  const categories = [
    { id: 'all', label: 'Semua Layanan' },
    { id: 'best', label: '👑 Menu Terbaik Soleman' },
    { id: 'sol', label: 'Ganti Tapak & Sol Lepas' },
    { id: 'jahit', label: 'Jahit Sol (Hidden, Silang, Zig-Zag)' },
    { id: 'warna', label: 'Warna & Unyellowing' },
    { id: 'kebersihan', label: 'Cuci & Deep Clean' },
    { id: 'busa', label: 'Busa Tumit & Insole' },
    { id: 'kulit_upper', label: 'Upper Robek & Kulit' },
  ];

  const filteredServices = SERVICES_CATALOG.filter((item) => {
    const matchesCategory = 
      selectedCategory === 'all' 
        ? true 
        : selectedCategory === 'best' 
          ? Boolean(item.isBestMenu) 
          : item.category === selectedCategory;

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      item.name.toLowerCase().includes(query) ||
      item.damageTitle.toLowerCase().includes(query) ||
      item.solution.toLowerCase().includes(query) ||
      item.symptoms.some(s => s.toLowerCase().includes(query)) ||
      item.suitableShoes.some(shoe => shoe.toLowerCase().includes(query));
    
    return matchesCategory && matchesSearch;
  });

  const severityKeys: DamageSeverity[] = ['kecil', 'normal', 'hard'];

  return (
    <section id="layanan" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Wrench className="w-3.5 h-3.5" />
          <span>Katalog Lengkap Reparasi & Tingkat Kerusakan</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
          Sesuaikan Tingkat Kerusakan & Harga <br />
          <span className="text-amber-400">Masing-Masing Sepatu Secara Rapi</span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Setiap jenis servis memiliki rincian <strong className="text-white">Tingkat Ringan, Sedang, dan Berat</strong> yang disesuaikan langsung dengan kondisi kerusakan sepatu Anda beserta harga pastinya.
        </p>
      </div>

      {/* Global Damage Severity Overview Switcher */}
      <div className="mt-8 max-w-4xl mx-auto p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
              Simulasi Tingkat Kerusakan Seluruh Katalog:
            </span>
            <p className="text-[11px] text-slate-400">
              Pilih tingkat kerusakan di bawah atau langsung klik baris tingkat kerusakan pada masing-masing kartu layanan.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 self-start sm:self-auto">
            Harga Transparan & Bergaransi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DAMAGE_SEVERITIES.map((sev) => {
            const isSelected = globalSeverity === sev.id && Object.keys(cardSeverities).length === 0;
            return (
              <button
                key={sev.id}
                type="button"
                onClick={() => handleSetGlobalSeverity(sev.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? sev.activeBorderClass
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${sev.dotColor}`} />
                    <span className="text-xs font-extrabold text-white">{sev.shortLabel}</span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${sev.colorClass}`}>
                    {sev.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {sev.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 space-y-4">
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kerusakan: sol mangap, jahit, unyellowing, tumit robek..."
            className="w-full bg-slate-900 border border-slate-800 rounded-full pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => {
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory(cat.id as DamageCategory);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Service Highlights: Jahit Sol & Ganti Tapak Spesifik */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-4xl mx-auto">
            <span className="text-[11px] text-amber-400 font-bold mr-1">Rekomendasi Cepat:</span>
            {[
              { label: '🧵 Jahit Benang Gak Kelihatan', query: 'benang gak kelihatan', cat: 'jahit' },
              { label: '🏔️ Ganti Tapak Trail (Rp 200rb + Foto WA)', query: 'trail', cat: 'sol' },
              { label: '⛰️ Ganti Tapak Gunung (Lugged)', query: 'gunung', cat: 'sol' },
              { label: '⚔️ Jahit Sol Silang (X)', query: 'silang', cat: 'jahit' },
              { label: '⚡ Jahit Sol Zig-Zag', query: 'zig-zag', cat: 'jahit' },
              { label: '👟 Ganti Tapak Sekolah', query: 'sekolah', cat: 'sol' },
              { label: '👞 Ganti Tapak Kantor/Pantofel', query: 'kantor', cat: 'sol' },
              { label: '🦺 Ganti Tapak Proyek/Safety', query: 'proyek', cat: 'sol' },
              { label: '⚽ Ganti Tapak Futsal', query: 'futsal', cat: 'sol' },
              { label: '🏃 Ganti Tapak Olahraga', query: 'olahraga', cat: 'sol' },
              { label: '⚽ Ganti Tapak Bola', query: 'bola', cat: 'sol' },
              { label: '🩴 Ganti Tapak Sendal Biasa', query: 'sendal biasa', cat: 'sol' },
              { label: '👡 Ganti Tapak Sendal Kulit', query: 'sendal kulit', cat: 'sol' },
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSelectedCategory('all');
                  setSearchQuery(item.query);
                }}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  searchQuery.toLowerCase().includes(item.query.toLowerCase())
                    ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 hover:bg-red-500/30 font-bold cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredServices.map((service) => {
          const isExpanded = expandedDetailId === service.id;
          const activeSeverity = getCardSeverity(service.id);
          const activeTier = getServiceTierDetail(service, activeSeverity);

          return (
            <div
              key={service.id}
              className="group relative rounded-3xl bg-slate-900/95 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-amber-500/5"
            >
              {/* Image banner with overlay */}
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                
                {/* Badges on top of image */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/85 backdrop-blur-md text-amber-300 border border-amber-500/30">
                    Garansi {service.warrantyDays} Hari
                  </span>
                  <div className="flex items-center gap-1">
                    {service.isBestMenu && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md uppercase tracking-wider">
                        👑 Menu Terbaik
                      </span>
                    )}
                    {service.requiresPhotoConfirmation && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-slate-950 shadow uppercase tracking-wider">
                        📸 Konfirmasi Foto WA
                      </span>
                    )}
                    {!service.isBestMenu && service.popular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-md uppercase tracking-wider">
                        Terpopuler
                      </span>
                    )}
                  </div>
                </div>

                {/* Dynamic Price tag on bottom right of image */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                  <div className="bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Selesai: <strong className="text-white">{activeTier.durationEst}</strong></span>
                  </div>

                  <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 text-right shadow-lg">
                    <span className="text-[9px] text-amber-300 uppercase font-bold tracking-wider block">
                      Tingkat {activeTier.badge}
                    </span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {activeTier.priceFormatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {service.name}
                    </h3>
                    <p className="text-xs font-semibold text-amber-400/90 flex items-start gap-1.5 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <span>{service.damageTitle}</span>
                    </p>
                  </div>

                  {/* Structured 3-Tier Damage & Price Breakdown Table */}
                  <div className="rounded-2xl bg-slate-950 border border-slate-800/90 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5">
                      <span>Pilih Tingkat Kerusakan:</span>
                      <span className="text-amber-400">Harga Sesuai Kondisi</span>
                    </div>

                    <div className="space-y-1.5">
                      {severityKeys.map((sevKey) => {
                        const tier = getServiceTierDetail(service, sevKey);
                        const isSelected = activeSeverity === sevKey;
                        const dotColor = sevKey === 'kecil' ? 'bg-emerald-400' : sevKey === 'hard' ? 'bg-rose-400' : 'bg-amber-400';
                        const badgeStyle = sevKey === 'kecil'
                          ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                          : sevKey === 'hard'
                          ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                          : 'text-amber-300 bg-amber-500/15 border-amber-500/30';

                        return (
                          <button
                            key={sevKey}
                            type="button"
                            onClick={() => handleSetCardSeverity(service.id, sevKey)}
                            className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border shrink-0 ${badgeStyle}`}>
                                  {tier.badge}
                                </span>
                                <span className="text-xs font-bold text-white truncate">
                                  {tier.label.replace(/^(Ringan|Sedang|Berat)\s*\/\s*/i, '')}
                                </span>
                              </div>
                              <span className={`text-xs font-black font-mono shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                                {tier.priceFormatted}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug mt-1 pl-3.5">
                              {tier.damageDesc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expandable Solution & Symptoms Detail */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedDetailId(isExpanded ? null : service.id)}
                      className="text-xs text-slate-400 hover:text-amber-300 font-semibold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                    >
                      {isExpanded ? 'Tutup Detail Metode & Gejala' : 'Lihat Metode Pengerjaan & Gejala'}
                    </button>
                    {isExpanded && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                        <div>
                          <strong className="text-amber-400 block mb-1">Ciri-Ciri Gejala:</strong>
                          <ul className="space-y-1">
                            {service.symptoms.map((symptom, idx) => (
                              <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span>{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800">
                          <strong className="text-emerald-400 block mb-0.5">Metode Presisi Soleman:</strong>
                          <p className="text-[11px] text-slate-300">{service.solution}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      onSelectServiceForPickup(service, activeSeverity);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <span>Pesan Tingkat {activeTier.badge} ({activeTier.priceFormatted})</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <a
                    href={buildConsultationWhatsAppUrl(`${service.name} - Tingkat ${activeTier.label} (${activeTier.priceFormatted})`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Konsultasi WA ({activeTier.label})</span>
                  </a>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 mt-6">
          <p className="text-slate-400 text-sm">Tidak ditemukan kerusakan sesuai kata kunci "{searchQuery}".</p>
          <p className="text-xs text-slate-500 mt-1">Punya kerusakan unik atau langka? Silakan konsultasikan langsung ke CS kami.</p>
          <a
            href={buildConsultationWhatsAppUrl(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Tanya Kerusakan Ini via WhatsApp</span>
          </a>
        </div>
      )}

    </section>
  );
};
