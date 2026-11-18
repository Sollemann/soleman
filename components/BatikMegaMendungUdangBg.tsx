import React, { useId } from 'react';

interface BatikMegaMendungUdangBgProps {
  subtle?: boolean;
}

/**
 * Latar belakang bergerak ikonik khas Cirebon yang optimal untuk HP & Desktop:
 * - Mobile (<640px): Artwork portrait 9:16 khusus agar Mega Mendung & Udang terlihat utuh penuh layar HP
 * - Desktop (>=640px): Artwork widescreen 16:9 dengan gerak parallax halus
 * - Lapisan awan Mega Mendung & Udang Cirebon mengalir mulus (260px tile agar pas di layar HP)
 */
export const BatikMegaMendungUdangBg: React.FC<BatikMegaMendungUdangBgProps> = ({
  subtle = false,
}) => {
  const rawId = useId().replace(/:/g, '');
  const cloudPatternId = `mega-cloud-flow-${rawId}`;
  const udangPatternId = `udang-flow-${rawId}`;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-dvh pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Layer 1A: Artwork Mobile Portrait 9:16 (Terlihat Jelas Penuh di Layar HP) */}
      <img
        src="./assets/cirebon-batik-mobile-bg.jpg"
        alt=""
        decoding="async"
        className={`block sm:hidden w-full h-full object-cover object-center batik-artwork-drift-mobile ${
          subtle ? 'opacity-35' : 'opacity-85'
        }`}
      />

      {/* Layer 1B: Artwork Desktop Widescreen 16:9 */}
      <img
        src="./assets/cirebon-batik-bg.jpg"
        alt=""
        decoding="async"
        className={`hidden sm:block w-full h-full object-cover object-center batik-artwork-drift ${
          subtle ? 'opacity-30' : 'opacity-75'
        }`}
      />

      {/* Layer 2: Awan Batik Mega Mendung Mengalir Mulus ke Kiri (260px Tile agar Jelas di HP) */}
      <div
        className={`absolute inset-y-0 left-0 w-[calc(100%+260px)] batik-clouds-flow ${
          subtle ? 'opacity-[0.14]' : 'opacity-[0.34] sm:opacity-[0.28]'
        }`}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={cloudPatternId}
              width="260"
              height="260"
              patternUnits="userSpaceOnUse"
            >
              {/* Gelombang Mega Mendung Atas */}
              <path
                d="M 0 60 C 20 60, 28 42, 44 42 C 58 42, 62 58, 76 58 C 94 58, 98 28, 130 28 C 162 28, 166 58, 184 58 C 198 58, 202 42, 216 42 C 232 42, 240 60, 260 60"
                fill="none"
                stroke="#38bdf8"
                strokeOpacity="0.72"
                strokeWidth="1.6"
              />
              <path
                d="M 42 70 C 58 70, 65 54, 83 54 C 100 54, 106 40, 130 40 C 154 40, 160 54, 177 54 C 195 54, 202 70, 218 70"
                fill="none"
                stroke="#fbbf24"
                strokeOpacity="0.62"
                strokeWidth="1.25"
              />
              {/* Gelombang Mega Mendung Bawah */}
              <path
                d="M 0 192 C 24 192, 34 168, 58 168 C 80 168, 86 192, 110 192 C 126 192, 134 176, 150 176 C 166 176, 174 192, 190 192 C 212 192, 224 168, 260 192"
                fill="none"
                stroke="#7dd3fc"
                strokeOpacity="0.6"
                strokeWidth="1.45"
              />
              <path
                d="M 130 55 C 124 55, 122 48, 128 45 C 134 43, 138 50, 132 53"
                fill="none"
                stroke="#fbbf24"
                strokeOpacity="0.68"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${cloudPatternId})`} />
        </svg>
      </div>

      {/* Layer 3: Motif Udang Cirebon & Cecek Emas Berenang/Mengalir ke Kanan (260px Tile) */}
      <div
        className={`absolute inset-y-0 left-0 w-[calc(100%+260px)] batik-udang-flow ${
          subtle ? 'opacity-[0.12]' : 'opacity-[0.34] sm:opacity-[0.26]'
        }`}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id={udangPatternId}
              width="260"
              height="260"
              patternUnits="userSpaceOnUse"
            >
              <g transform="translate(128, 124) scale(0.86) rotate(-18)">
                {/* Sungut Udang */}
                <path
                  d="M 16 -12 C 36 -36, 62 -42, 86 -28"
                  fill="none"
                  stroke="#fbbf24"
                  strokeOpacity="0.78"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                />
                <path
                  d="M 14 -8 C 38 -24, 66 -20, 88 -4"
                  fill="none"
                  stroke="#38bdf8"
                  strokeOpacity="0.72"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                {/* Kepala & Ruas Tubuh Udang */}
                <path
                  d="M 22 -10 C 10 -18, -8 -16, -15 -4 C -17 1, -12 8, -4 9 C 8 10, 16 2, 22 -10 Z"
                  fill="#0284c7"
                  fillOpacity="0.34"
                  stroke="#fbbf24"
                  strokeOpacity="0.82"
                  strokeWidth="1.4"
                />
                <circle cx="12" cy="-8" r="2.1" fill="#fbbf24" fillOpacity="0.95" />
                <path
                  d="M -13 -2 C -24 0, -32 8, -33 18 L -19 22 C -16 14, -10 10, -3 9 Z"
                  fill="#1d4ed8"
                  fillOpacity="0.34"
                  stroke="#7dd3fc"
                  strokeOpacity="0.78"
                  strokeWidth="1.25"
                />
                <path
                  d="M -32 16 C -35 26, -32 36, -25 44 L -14 37 C -18 30, -19 24, -19 20 Z"
                  fill="#0284c7"
                  fillOpacity="0.32"
                  stroke="#7dd3fc"
                  strokeOpacity="0.75"
                  strokeWidth="1.25"
                />
                <path
                  d="M -25 42 C -19 50, -11 55, -2 58 L 3 47 C -4 44, -10 40, -14 36 Z"
                  fill="#0284c7"
                  fillOpacity="0.32"
                  stroke="#fbbf24"
                  strokeOpacity="0.72"
                  strokeWidth="1.25"
                />
                {/* Ekor Kipas Udang */}
                <path
                  d="M -1 57 C 7 65, 18 68, 26 64 C 20 57, 12 52, 3 48 Z"
                  fill="#38bdf8"
                  fillOpacity="0.36"
                  stroke="#fbbf24"
                  strokeOpacity="0.8"
                  strokeWidth="1.25"
                />
                <path
                  d="M -3 58 C -1 69, 6 76, 14 77 C 14 69, 10 62, 3 54 Z"
                  fill="#1e40af"
                  fillOpacity="0.4"
                  stroke="#7dd3fc"
                  strokeOpacity="0.74"
                  strokeWidth="1.2"
                />
              </g>

              {/* Cecek Canting Emas */}
              <g fill="#fbbf24" fillOpacity="0.52">
                <circle cx="38" cy="92" r="1.3" />
                <circle cx="222" cy="92" r="1.3" />
                <circle cx="66" cy="224" r="1.2" />
                <circle cx="194" cy="224" r="1.2" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${udangPatternId})`} />
        </svg>
      </div>

      {/* Layer 4: Scrim Ringan (Teks Tetap Tajam Tanpa Menutupi Motif di HP) */}
      <div
        className={`absolute inset-0 ${
          subtle
            ? 'bg-gradient-to-b from-[#060f22]/78 via-[#07122a]/75 to-[#050b19]/88'
            : 'bg-gradient-to-b from-[#061024]/25 via-[#07132c]/42 to-[#050b1a]/72'
        }`}
      />
      <div
        className="absolute inset-0"
        style={{
          background: subtle
            ? 'radial-gradient(ellipse 80% 65% at 50% 40%, rgba(5,12,29,0.45) 0%, rgba(4,9,22,0.78) 100%)'
            : 'radial-gradient(ellipse 75% 60% at 50% 35%, rgba(6,16,38,0.12) 0%, rgba(4,10,24,0.52) 100%)',
        }}
      />

      {/* Ambient Cyan & Soga Gold Glow Accents */}
      <div className="absolute -top-36 left-1/2 w-[720px] sm:w-[920px] h-[420px] sm:h-[480px] bg-gradient-to-b from-sky-400/20 via-blue-600/12 to-transparent blur-3xl rounded-full batik-glow-float-a" />
      <div className="absolute top-1/3 -right-32 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/14 blur-3xl rounded-full batik-glow-float-b" />
      <div className="absolute bottom-1/4 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/14 blur-3xl rounded-full batik-glow-float-b" />
    </div>
  );
};
