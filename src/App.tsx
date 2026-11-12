/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function App() {
  const handleSelectOption = (type: 'sebelum' | 'setelah') => {
    // Interactive feedback while maintaining exact visual presentation
    console.log(`Pilihan dipilih: ${type} 01 November 2022`);
  };

  return (
    <div className="min-h-screen bg-white flex justify-center selection:bg-rose-200">
      {/* Mobile-optimized viewport container matching 1080x1884 proportions */}
      <main className="w-full max-w-[420px] bg-white min-h-screen flex flex-col pt-7 pb-10">
        
        {/* 1. Header Title */}
        <header className="px-4 text-center">
          <h1 
            className="text-[17px] font-bold italic tracking-normal inline-block border-b-[2px] leading-tight select-none"
            style={{ 
              color: '#3D0005', 
              borderColor: '#3D0005',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
            }}
          >
            Cek Data Pemegang Sertifikat Kompetensi
          </h1>
        </header>

        {/* 2. Starburst Badge Action Buttons */}
        <section 
          className="mt-8 px-4 grid grid-cols-2 gap-2"
          aria-label="Pilihan Periode Sertifikat"
        >
          {/* Option: Sebelum 01 November 2022 */}
          <button
            type="button"
            onClick={() => handleSelectOption('sebelum')}
            className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-transform active:scale-95"
            aria-label="Sebelum 01 November 2022"
          >
            <div className="w-[58px] h-[58px] flex items-center justify-center shrink-0">
              <img 
                src="/assets/badge_star.png" 
                alt="Badge Sebelum 01 November 2022" 
                className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                loading="eager"
                draggable={false}
              />
            </div>
            <span 
              className="mt-3 text-[11.5px] font-bold text-black leading-tight tracking-tight whitespace-nowrap select-none"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            >
              Sebelum 01 November 2022
            </span>
          </button>

          {/* Option: Setelah 01 November 2022 */}
          <button
            type="button"
            onClick={() => handleSelectOption('setelah')}
            className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-transform active:scale-95"
            aria-label="Setelah 01 November 2022"
          >
            <div className="w-[58px] h-[58px] flex items-center justify-center shrink-0">
              <img 
                src="/assets/badge_star.png" 
                alt="Badge Setelah 01 November 2022" 
                className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                loading="eager"
                draggable={false}
              />
            </div>
            <span 
              className="mt-3 text-[11.5px] font-bold text-black leading-tight tracking-tight whitespace-nowrap select-none"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            >
              Setelah 01 November 2022
            </span>
          </button>
        </section>

        {/* 3. Information Callout Card */}
        <section className="mt-7 px-3">
          <div 
            className="flex overflow-hidden"
            style={{ backgroundColor: '#FFE3E2' }}
          >
            {/* Red vertical accent bar on left */}
            <div 
              className="w-[5.5px] shrink-0" 
              style={{ backgroundColor: '#C70909' }} 
              aria-hidden="true"
            />
            {/* Card Content */}
            <div className="py-[18px] px-4 flex-1">
              <h2 
                className="text-[17px] font-bold text-black leading-snug mb-3 tracking-tight"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              >
                Ini adalah Informasi
              </h2>
              <p 
                className="text-[13.5px] text-black leading-[1.38] tracking-tight"
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
              >
                Silahkan Cek Tanggal Terbit Pada Sertifikat Kompetensi Anda Sebelum Mengecek Data Pemegang Sertifikat.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Banner Indonesia Kompeten Graphic */}
        <section className="mt-5 px-3">
          <div className="w-full overflow-hidden">
            <img 
              src="/assets/banner_indonesia_kompeten.png" 
              alt="Banner Indonesia Kompeten - Mengkompetenkan Manusia Pembangunan - APIK EDU" 
              className="w-full h-auto object-contain block select-none pointer-events-none"
              loading="eager"
              draggable={false}
            />
          </div>
        </section>

      </main>
    </div>
  );
}
