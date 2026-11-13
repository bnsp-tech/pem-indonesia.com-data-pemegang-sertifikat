/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface HalamanSetelahNov2022Props {
  onBack?: () => void;
  onHome?: () => void;
  onVerifikasi?: (judul: string) => void;
}

export function HalamanSetelahNov2022({ onBack, onHome, onVerifikasi }: HalamanSetelahNov2022Props) {
  const [openBlock, setOpenBlock] = useState<string | null>(null);

  const institutions = [
    {
      id: 'geomigas',
      name: 'PUSAT PENDIDIKAN GEOMIGAS',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] shrink-0" fill="none">
          {/* Top Cube */}
          <path d="M12 2L16.5 4.5L12 7L7.5 4.5L12 2Z" fill="#9E1318" />
          <path d="M7.2 5.1L11.6 7.5V12L7.2 9.6V5.1Z" fill="#9E1318" />
          <path d="M16.8 5.1L12.4 7.5V12L16.8 9.6V5.1Z" fill="#9E1318" />
          {/* Bottom Left Cube */}
          <path d="M6.8 11.2L11.2 13.6L6.8 16L2.4 13.6L6.8 11.2Z" fill="#9E1318" />
          <path d="M2.1 14.2L6.4 16.5V21L2.1 18.7V14.2Z" fill="#9E1318" />
          <path d="M11.5 14.2L7.2 16.5V21L11.5 18.7V14.2Z" fill="#9E1318" />
          {/* Bottom Right Cube */}
          <path d="M17.2 11.2L21.6 13.6L17.2 16L12.8 13.6L17.2 11.2Z" fill="#9E1318" />
          <path d="M12.5 14.2L16.8 16.5V21L12.5 18.7V14.2Z" fill="#9E1318" />
          <path d="M21.9 14.2L17.6 16.5V21L21.9 18.7V14.2Z" fill="#9E1318" />
        </svg>
      ),
      items: [
        { title: 'Operator K3 Migas', subtitle: 'Subsektor Minyak, Gas, dan Geologi' },
        { title: 'Pengawas K3 Migas', subtitle: 'Subsektor Minyak, Gas, dan Geologi' },
        { title: 'Supervisor K3 Tambang', subtitle: 'Subsektor Pertambangan Mineral & Batubara' },
        { title: 'Operator K3 Listrik', subtitle: 'Sistem Ketenagalistrikan Industri' },
        { title: 'Teknisi K3 Listrik', subtitle: 'Sistem Ketenagalistrikan Industri' },
        { title: 'Ahli K3 Listrik', subtitle: 'Sistem Ketenagalistrikan Industri' },
        { title: 'Auditor SMK3 Tambang', subtitle: 'Audit Manajemen Keselamatan Pertambangan' },
      ],
    },
    {
      id: 'pem-indonesia',
      name: 'PEM INDONESIA',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] shrink-0" fill="none">
          <path d="M12 3L21 7.8L12 12.6L3 7.8L12 3Z" fill="#9E1318" />
          <path
            d="M3.5 12L12 16.5L20.5 12"
            stroke="#9E1318"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 16.2L12 20.7L20.5 16.2"
            stroke="#9E1318"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      items: [
        { title: 'Operator Scaffolding', subtitle: 'Konstruksi & Industri Penunjang' },
        { title: 'Pengawas Scaffolding', subtitle: 'Konstruksi & Industri Penunjang' },
        { title: 'Operator K3 Umum', subtitle: 'Kesehatan Keselamatan Kerja K3' },
        { title: 'Petugas K3 Umum', subtitle: 'Kesehatan Keselamatan Kerja K3' },
        { title: 'Ahli K3 Umum', subtitle: 'Kesehatan Keselamatan Kerja K3' },
        { title: 'K3 Ruang Terbatas (Confined Space)', subtitle: 'Kualifikasi Khusus Paparan Risiko' },
        { title: 'Petugas Gas H2S', subtitle: 'Kualifikasi Deteksi Gas Berbahaya' },
        { title: 'Authorized Gas Tester', subtitle: 'Pengujian Gas Atmosfer Spesifik' },
        { title: 'Operator Excavator', subtitle: 'Vokasi Alat Berat Pesawat Angkat' },
        { title: 'Operator Backhoe', subtitle: 'Vokasi Alat Berat Pesawat Angkat' },
        { title: 'Operator Loader', subtitle: 'Vokasi Alat Berat Pesawat Angkat' },
        { title: 'Operator Dumptruck', subtitle: 'Transportasi Material Industri' },
        { title: 'Operator Dozer', subtitle: 'Vokasi Alat Berat Pesawat Angkat' },
        { title: 'Operator Motorgrader', subtitle: 'Vokasi Alat Berat Pesawat Angkat' },
        { title: 'Operator Mobile Crane', subtitle: 'Sertifikasi Angkat & Angkut (PAA)' },
        { title: 'Operator Forklift', subtitle: 'Sertifikasi Angkat & Angkut (PAA)' },
        { title: 'Operator Overhead Crane', subtitle: 'Sertifikasi Angkat & Angkut (PAA)' },
        { title: 'Operator Pedestal Crane', subtitle: 'Sertifikasi Angkat & Angkut (PAA)' },
        { title: 'Juru Ikat Beban / Rigger', subtitle: 'Sertifikasi Angkat & Angkut (PAA)' },
        { title: 'Inspector Pesawat Angkat', subtitle: 'Kualifikasi Penguji Kelaikan Alat' },
        { title: 'Petugas Fire Safety', subtitle: 'Penanggulangan Bahaya Kebakaran' },
        { title: 'Petugas First Aid', subtitle: 'Pertolongan Pertama Kecelakaan Kerja' },
      ],
    },
    {
      id: 'lsp-k3',
      name: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] shrink-0" fill="none">
          <path
            d="M12 2.5C13.1 2.5 14 3.1 14.6 3.7C15.4 3.5 16.4 3.8 17 4.6C17.8 4.8 18.6 5.5 18.7 6.5C19.5 7 19.9 8 19.6 8.9C20.1 9.7 20 10.8 19.3 11.5C19.4 12.4 18.9 13.3 18 13.7C17.7 14.6 16.9 15.2 16 15.2C15.3 15.9 14.3 16.1 13.4 15.7C12.5 16.1 11.5 16.1 10.6 15.7C9.7 16.1 8.7 15.9 8 15.2C7.1 15.2 6.3 14.6 6 13.7C5.1 13.3 4.6 12.4 4.7 11.5C4 10.8 3.9 9.7 4.4 8.9C4.1 8 4.5 7 5.3 6.5C5.4 5.5 6.2 4.8 7 4.6C7.6 3.8 8.6 3.5 9.4 3.7C10 3.1 10.9 2.5 12 2.5Z"
            fill="#9E1318"
          />
          <circle cx="12" cy="9.2" r="3.1" fill="#FFFDF9" />
          <path d="M8.5 15.2L7.2 21.5L10.7 19.6L12 21.5V15.5H8.5V15.2Z" fill="#9E1318" />
          <path d="M15.5 15.2L16.8 21.5L13.3 19.6L12 21.5V15.5H15.5V15.2Z" fill="#9E1318" />
        </svg>
      ),
      items: [
        { title: 'Petugas K3 Umum', subtitle: 'Sertifikasi Kompetensi BNSP' },
        { title: 'Ahli K3 Umum', subtitle: 'Sertifikasi Kompetensi BNSP' },
        { title: 'Teknisi K3 Ketinggian', subtitle: 'Sertifikasi Bekerja Pada Ketinggian' },
        { title: 'Ahli Muda Ruang Terbatas', subtitle: 'Sertifikasi Kompetensi BNSP' },
        { title: 'Ahli Madya Ruang Terbatas', subtitle: 'Sertifikasi Kompetensi BNSP' },
        { title: 'Auditor SMK3 Umum', subtitle: 'Sertifikasi Sistem Manajemen Nasional' },
        { title: 'Operator K3 Alat Berat', subtitle: 'Sertifikasi Operator K3 Ragam Alat' },
      ],
    },
  ];

  const adminContacts = [
    '0859-6153-3244',
    '0813-2322-4615',
    '0812-5421-1245',
  ];

  return (
    <div className="min-h-screen w-full bg-[#121215] flex justify-center font-sans antialiased">
      {/* Mobile-only locked container (max-width: 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#FAF7F2] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.65)] overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-gradient-to-b from-[#940D12] via-[#830A0E] to-[#710609] border-b-[3px] border-[#DFAC2A] px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-sm">
          {/* Left Back Button */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-[#9E1C20]/75 border border-[#C74F53]/45 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Center Brand Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Circular APIK Crest Logo with Green Dot */}
            <div className="relative w-[46px] h-[46px] shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="apikGoldRing" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFE57F" />
                    <stop offset="50%" stopColor="#D99B16" />
                    <stop offset="100%" stopColor="#9A6808" />
                  </linearGradient>
                  <radialGradient id="apikMaroonBg" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#9C1418" />
                    <stop offset="100%" stopColor="#4F0406" />
                  </radialGradient>
                </defs>
                <circle cx="32" cy="32" r="30.5" fill="url(#apikMaroonBg)" stroke="url(#apikGoldRing)" strokeWidth="2.5" />
                <circle cx="32" cy="32" r="22.5" fill="none" stroke="#E5B942" strokeWidth="1" strokeOpacity="0.85" />
                {/* Inner Sunburst & Emblem */}
                <g opacity="0.95">
                  <path d="M32 13L33.3 17H37.5L34.1 19.4L35.4 23.3L32 20.9L28.6 23.3L29.9 19.4L26.5 17H30.7L32 13Z" fill="#F8D25C" />
                  <path d="M21 38C21 29.5 26 24 32 24C38 24 43 29.5 43 38" fill="none" stroke="#F4C446" strokeWidth="1.6" />
                  <path d="M19 37C21 43 26.5 47 32 47C37.5 47 43 43 45 37" fill="none" stroke="#E8B838" strokeWidth="2" strokeDasharray="2.2 1.8" />
                  <rect x="23" y="29" width="18" height="9" rx="2" fill="#63080A" stroke="#F4C446" strokeWidth="0.9" />
                  <text x="32" y="35.5" textAnchor="middle" fill="#FCE28B" fontSize="6.5" fontWeight="800" fontFamily="sans-serif">
                    APIK
                  </text>
                </g>
                {/* Micro Ring Text */}
                <text fill="#F7D56B" fontSize="4.3" fontWeight="700" letterSpacing="0.45">
                  <textPath href="#ringPathTop" startOffset="50%" textAnchor="middle">
                    AFILIASI PENGEMBANGAN
                  </textPath>
                </text>
                <defs>
                  <path id="ringPathTop" d="M 8,32 A 24,24 0 1,1 56,32" />
                </defs>
              </svg>
              {/* Green Online Dot */}
              <span className="absolute bottom-0 right-0 w-[12px] h-[12px] rounded-full bg-[#22C55E] border-[2px] border-[#78080B]" />
            </div>

            {/* Header Text Block */}
            <div className="min-w-0 leading-tight">
              <div className="text-[11.5px] font-extrabold text-white tracking-[0.02em] leading-[1.22] uppercase">
                AFILIASI PENGEMBANGAN
                <br />
                INDONESIA KOMPETEN
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-[#F5C542] tracking-[0.06em] uppercase">
                  PORTAL RESMI
                </span>
                {/* Gold Verified Rosette Check */}
                <svg viewBox="0 0 20 20" className="w-[12px] h-[12px] shrink-0" fill="none">
                  <path
                    d="M10 1.5L12.1 3.1L14.7 2.8L15.6 5.3L18 6.4L17.5 9L18.9 11.2L17.1 13.1L17.2 15.7L14.7 16.4L13.3 18.6L10.8 17.8L8.4 18.8L6.7 16.8L4.1 16.5L3.9 13.9L1.9 12.2L3 9.8L2.2 7.2L4.4 5.8L5 3.2L7.6 3.2L10 1.5Z"
                    fill="#F5C542"
                  />
                  <path
                    d="M6.8 10.2L9 12.4L13.4 7.8"
                    stroke="#75070A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Home Button */}
          <button
            type="button"
            onClick={onHome}
            aria-label="Beranda"
            className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-gradient-to-b from-[#FCE068] via-[#F2B926] to-[#DC9D13] border border-[#FFE98E]/65 shadow-[0_2px_6px_rgba(0,0,0,0.28)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="#2D0909" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5" />
              <path d="M9.5 20.5v-6a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v6" />
            </svg>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-3.5 pt-4 pb-5">
          {/* Outer White/Gold-Bordered Card */}
          <div className="bg-white rounded-[24px] border-[1.5px] border-[#F2DA9C] shadow-[0_6px_22px_rgba(140,100,20,0.06)] px-4 pt-6 pb-5">
            {/* Top Pill Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#87080B] via-[#A20F14] to-[#87080B] px-4 py-1.5 border border-[#D4A024]/30 shadow-[0_4px_12px_rgba(135,8,11,0.28)]">
                <svg viewBox="0 0 20 20" className="w-[13px] h-[13px] shrink-0" fill="#F5C542">
                  <path d="M10 1.8L3.5 4.5V9.5C3.5 13.7 6.3 17.5 10 18.7C13.7 17.5 16.5 13.7 16.5 9.5V4.5L10 1.8Z" />
                </svg>
                <span className="text-[11px] font-bold text-[#F9E29C] tracking-[0.12em] uppercase leading-none">
                  APIK EDU INDONESIA
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="mt-4 text-center text-[24px] font-extrabold text-[#7D0609] tracking-[-0.015em] leading-tight">
              Cek Pemegang Sertifikat
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-center text-[13.5px] text-[#6B7280] leading-[1.55] px-0.5">
              Halaman resmi verifikasi data pemegang sertifikat LPK dan LSP di bawah binaan{' '}
              <strong className="font-bold text-[#7D0609]">
                Asosiasi Pengembangan Indonesia Kompeten (APIK)
              </strong>
              . Klik lembaga di bawah untuk membuka direktori skema.
            </p>

            {/* Subtle Dashed Divider */}
            <div className="my-5 border-t border-dashed border-[#EDE7DC]" />

            {/* 3 Expandable Institution Blocks */}
            <div className="space-y-3.5">
              {institutions.map((block) => {
                const isOpen = openBlock === block.id;
                return (
                  <div
                    key={block.id}
                    className={`rounded-[18px] overflow-hidden transition-all ${
                      isOpen
                        ? 'border-[1.5px] border-[#EAB308] bg-[#FFFEFA] shadow-[0_6px_18px_rgba(180,130,20,0.10)]'
                        : 'border border-[#F3E6CA] bg-gradient-to-b from-[#FFFFFF] to-[#FFFDF8] shadow-[0_4px_12px_rgba(150,110,40,0.06)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenBlock(isOpen ? null : block.id)}
                      aria-expanded={isOpen}
                      className={`w-full px-4 py-[15px] flex items-center justify-between gap-3 text-left cursor-pointer transition-colors ${
                        isOpen ? 'bg-[#FFF9E6] border-b border-[#F5E6B8]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {block.icon}
                        <span className="text-[13.5px] font-extrabold text-[#5E0A0C] uppercase tracking-[0.02em] leading-[1.35]">
                          {block.name}
                        </span>
                      </div>
                      <div
                        className={`w-[34px] h-[34px] rounded-full shrink-0 flex items-center justify-center transition-colors ${
                          isOpen
                            ? 'bg-gradient-to-b from-[#FACC15] to-[#EAB308] border border-[#D99B08]/40 shadow-[0_2px_6px_rgba(217,155,8,0.3)]'
                            : 'bg-[#FFFDF9] border border-[#EED9A8] shadow-[0_2px_6px_rgba(180,140,60,0.12)]'
                        }`}
                      >
                        {isOpen ? (
                          <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-[#450A0A]" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 15l-6-6-6 6" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] text-[#5E0A0C]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-3.5 space-y-3 bg-[#FFFEFB]">
                        {block.items.map((scheme) => (
                          <div
                            key={scheme.title}
                            className="rounded-[16px] bg-white border border-[#EFEAE0] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-4 text-left"
                          >
                            <h3 className="text-[15px] font-bold text-[#1F2937] leading-snug">
                              {scheme.title}
                            </h3>
                            <p className="mt-0.5 text-[12.5px] text-[#6B7280] leading-snug">
                              {scheme.subtitle}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-[12px] text-[#4B5563] font-medium">
                                Status:
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] border border-[#F5D76E] px-2.5 py-[3px]">
                                <svg viewBox="0 0 16 16" className="w-[12px] h-[12px] shrink-0" fill="none">
                                  <circle cx="8" cy="8" r="7" fill="#A16207" />
                                  <path
                                    d="M5 8.2L7 10.2L11.2 5.8"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span className="text-[10.5px] font-extrabold text-[#78350F] tracking-[0.04em] uppercase leading-none">
                                  AKTIF
                                </span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (!onVerifikasi) return;
                                if (scheme.title === 'Operator Scaffolding') {
                                  onVerifikasi('Pemegang Sertifikat Operasi Scaffolding LSP PEM INDONESIA');
                                  return;
                                }
                                const lembagaLabel =
                                  block.id === 'pem-indonesia'
                                    ? 'LSP PEM INDONESIA'
                                    : block.id === 'geomigas'
                                      ? 'PUSAT PENDIDIKAN GEOMIGAS'
                                      : 'LSP K3';
                                onVerifikasi(`Pemegang Sertifikat ${scheme.title} ${lembagaLabel}`);
                              }}
                              className="mt-3.5 w-full rounded-[12px] bg-gradient-to-b from-[#A30E12] to-[#7D0609] py-2.5 px-4 text-center text-white text-[12.5px] font-extrabold tracking-[0.06em] uppercase shadow-[0_3px_8px_rgba(125,6,9,0.22)] cursor-pointer active:scale-[0.98] transition-transform"
                            >
                              VERIFIKASI
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* INFORMASI LEMBAGA Section Card */}
            <section className="mt-6 rounded-[20px] overflow-hidden border-[1.5px] border-[#F2D593] bg-[#FFFDF8] shadow-[0_4px_16px_rgba(140,20,20,0.06)]">
              {/* Header Bar */}
              <div className="bg-gradient-to-r from-[#87090C] via-[#A21015] to-[#87090C] border-b-[2.5px] border-[#E0B136] px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Gold Megaphone Icon */}
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0 text-[#F5C542]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 11l14-5v12L3 13v-2z" />
                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                  </svg>
                  <h2 className="text-white text-[13.5px] font-extrabold tracking-[0.04em] uppercase leading-none">
                    INFORMASI LEMBAGA
                  </h2>
                </div>
                <span className="bg-gradient-to-b from-[#FCE068] to-[#EEB220] text-[#5E0709] text-[10px] font-extrabold tracking-[0.06em] px-2.5 py-[3px] rounded-full uppercase shadow-xs leading-none">
                  RESMI
                </span>
              </div>

              {/* Body */}
              <div className="p-3.5 space-y-3.5">
                {/* Admin Confirmation & Phone Buttons Card */}
                <div className="rounded-[16px] border border-[#F4E3B6] bg-white px-4 py-5 text-center">
                  <p className="text-[13px] text-[#4B5563] leading-[1.6]">
                    Apabila data pemegang sertifikat belum tampil, belum lengkap, atau nomor sertifikat belum terinput pada sistem, silakan melakukan konfirmasi resmi melalui Admin Sekretariat di bawah ini.
                  </p>

                  {/* Subheading */}
                  <div className="mt-4 mb-3 flex items-center justify-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] text-[#5E0A0C] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                    </svg>
                    <span className="text-[11px] font-extrabold text-[#5E0A0C] tracking-[0.04em] uppercase">
                      LAYANAN KONFIRMASI ADMIN IT:
                    </span>
                  </div>

                  {/* 3 WhatsApp Contact Pill Buttons */}
                  <div className="space-y-2.5">
                    {adminContacts.map((phone) => (
                      <button
                        key={phone}
                        type="button"
                        className="w-full rounded-[14px] bg-white border-[1.5px] border-[#960C10] border-b-[4px] border-b-[#960C10] py-2.5 px-4 flex items-center justify-center gap-2.5 cursor-pointer active:translate-y-[1px] active:border-b-[2.5px] transition-all"
                      >
                        {/* Pale Yellow Circle + Green WhatsApp Speech-Phone Icon */}
                        <span className="w-[26px] h-[26px] rounded-full bg-[#FEF6D8] flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none">
                            <path
                              d="M12 2.5C6.75 2.5 2.5 6.62 2.5 11.7C2.5 13.56 3.07 15.29 4.05 16.73L3 21L7.42 19.86C8.78 20.59 10.34 21 12 21C17.25 21 21.5 16.88 21.5 11.8C21.5 6.72 17.25 2.5 12 2.5Z"
                              stroke="#22C55E"
                              strokeWidth="1.9"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9.3 8.8C9.1 8.4 8.9 8.4 8.7 8.4H8.2C8 8.4 7.7 8.5 7.5 8.8C7.2 9.1 6.7 9.6 6.7 10.6C6.7 11.6 7.5 12.6 7.6 12.8C7.7 13 9.1 15.1 11.3 16C13.1 16.7 13.5 16.6 13.9 16.5C14.3 16.5 15.2 16 15.4 15.4C15.6 14.9 15.6 14.4 15.5 14.3C15.5 14.2 15.3 14.1 15 14C14.7 13.8 13.5 13.2 13.2 13.1C13 13 12.8 13 12.6 13.3C12.4 13.6 11.9 14.1 11.8 14.3C11.6 14.4 11.5 14.5 11.2 14.3C10.9 14.2 10.1 13.9 9.1 13C8.3 12.3 7.8 11.4 7.7 11.1C7.5 10.8 7.7 10.7 7.8 10.5C8 10.4 8.1 10.2 8.3 10C8.4 9.8 8.5 9.7 8.6 9.5C8.7 9.3 8.6 9.1 8.5 9L8.3 8.8H9.3Z"
                              fill="#22C55E"
                            />
                          </svg>
                        </span>
                        <span className="text-[15.5px] font-extrabold text-[#4A080A] tracking-[0.03em]">
                          {phone}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PENTING Warning Callout */}
                <div className="rounded-[14px] bg-[#FFF5F5] border-l-[4px] border-l-[#9E1318] px-3.5 py-3.5 flex items-center gap-3 shadow-[0_1px_4px_rgba(158,19,24,0.05)]">
                  <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] shrink-0" fill="none">
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                      fill="#F59E0B"
                    />
                    <path d="M12 9v4.5" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="12" cy="16.8" r="1.2" fill="#FFFFFF" />
                  </svg>
                  <p className="text-[12px] text-[#374151] leading-[1.45] text-left">
                    <strong className="font-extrabold text-[#111827]">PENTING:</strong> Lembaga kami tidak bertanggung jawab atas segala bentuk pemalsuan atau penipuan oleh oknum yang mengatasnamakan lembaga kami.
                  </p>
                </div>

                {/* STANDAR AKREDITASI & LISENSI LEMBAGA */}
                <div className="rounded-[16px] border border-[#F4E3B6] bg-white px-2.5 py-4 text-center">
                  <h3 className="text-[11px] font-extrabold text-[#5E0A0C] tracking-[0.05em] uppercase mb-3.5">
                    STANDAR AKREDITASI &amp; LISENSI LEMBAGA
                  </h3>

                  {/* 6 Accreditation & License Logos */}
                  <div className="flex items-center justify-between gap-1 px-0.5">
                    {/* 1. KEMNAKER */}
                    <div className="flex flex-col items-center justify-center w-[46px] shrink-0">
                      <svg viewBox="0 0 36 30" className="w-[32px] h-[26px]">
                        <g fill="none" stroke="#1E3A5F" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 3L27 12L18 21L9 12L18 3Z" />
                          <path d="M18 7.5L22.5 12L18 16.5L13.5 12L18 7.5Z" />
                          <path d="M11 6L25 20" strokeWidth="1.6" />
                          <path d="M25 6L11 20" strokeWidth="1.6" />
                        </g>
                      </svg>
                      <span className="text-[6.5px] font-extrabold text-[#1E3A5F] tracking-[0.04em] leading-none mt-0.5">
                        KEMNAKER
                      </span>
                    </div>

                    {/* 2. Crest Emblem */}
                    <div className="flex items-center justify-center w-[32px] shrink-0">
                      <svg viewBox="0 0 36 36" className="w-[30px] h-[30px]">
                        <circle cx="18" cy="18" r="16" fill="#1C2536" stroke="#D4A62A" strokeWidth="1.8" />
                        <circle cx="18" cy="18" r="12.5" fill="none" stroke="#E8C24E" strokeWidth="0.8" />
                        <path d="M10 18L18 10L26 18L18 26Z" fill="#D4A62A" opacity="0.85" />
                        <circle cx="18" cy="18" r="4.5" fill="#1C2536" stroke="#FFE082" strokeWidth="1" />
                        <path d="M12 24.5C15 27 21 27 24 24.5" stroke="#F5C542" strokeWidth="1.3" fill="none" />
                      </svg>
                    </div>

                    {/* 3. G-CERT ISO 9001:2015 */}
                    <div className="flex flex-col items-center justify-center border border-[#E5E7EB] rounded-[3px] px-1.5 py-1 bg-white shrink-0">
                      <div className="flex items-center gap-0.5 leading-none">
                        <span className="text-[8.5px] font-black text-[#111827] tracking-tight">G-CERT</span>
                        <span className="text-[8px] font-black text-[#B91C1C]">2</span>
                      </div>
                      <div className="w-full h-[1px] bg-[#DC2626] my-[1.5px]" />
                      <span className="text-[4.5px] font-extrabold text-[#DC2626] tracking-[0.03em] leading-none">
                        SYSTEM SERVICE
                      </span>
                      <span className="text-[4.8px] font-bold text-[#374151] leading-none mt-[1.5px]">
                        ISO 9001:2015
                      </span>
                    </div>

                    {/* 4. LA-LPK */}
                    <div className="flex items-center justify-center w-[34px] shrink-0">
                      <svg viewBox="0 0 38 38" className="w-[32px] h-[32px]">
                        <circle cx="19" cy="19" r="17" fill="#FFFFFF" stroke="#9CA3AF" strokeWidth="0.9" strokeDasharray="2 1" />
                        <circle cx="19" cy="19" r="13.5" fill="none" stroke="#D97706" strokeWidth="0.7" />
                        <path d="M19 9L28 24H10L19 9Z" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinejoin="round" />
                        <text x="19" y="21.5" textAnchor="middle" fill="#B45309" fontSize="5" fontWeight="800">
                          LA-LPK
                        </text>
                      </svg>
                    </div>

                    {/* 5. BNSP */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                      <div className="flex items-center gap-0.5 leading-none">
                        <svg viewBox="0 0 18 16" className="w-[14px] h-[12px]">
                          <path d="M2 8L7 13L16 3" stroke="#991B1B" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M1 4L6 9" stroke="#DC2626" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                        </svg>
                        <span className="text-[11px] font-black text-[#111827] tracking-tight">BNSP</span>
                      </div>
                      <span className="text-[3.8px] font-bold text-[#4B5563] tracking-[0.02em] leading-none mt-[2px]">
                        BADAN NASIONAL SERTIFIKASI PROFESI
                      </span>
                    </div>

                    {/* 6. CERTIFIED ISO 45001:2018 COMPANY */}
                    <div className="flex items-center justify-center w-[34px] shrink-0">
                      <svg viewBox="0 0 38 38" className="w-[32px] h-[32px]">
                        <circle cx="19" cy="19" r="17" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.6" />
                        <circle cx="19" cy="19" r="13.5" fill="#FFFFFF" stroke="#0369A1" strokeWidth="0.9" />
                        <rect x="4" y="13.5" width="30" height="11" rx="2" fill="#0369A1" />
                        <text x="19" y="10.5" textAnchor="middle" fill="#0369A1" fontSize="4.2" fontWeight="800">
                          CERTIFIED
                        </text>
                        <text x="19" y="19.5" textAnchor="middle" fill="#FFFFFF" fontSize="6.5" fontWeight="900">
                          ISO
                        </text>
                        <text x="19" y="23.5" textAnchor="middle" fill="#E0F2FE" fontSize="3.8" fontWeight="700">
                          45001:2018
                        </text>
                        <text x="19" y="30" textAnchor="middle" fill="#0369A1" fontSize="4" fontWeight="800">
                          COMPANY
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 pt-1 pb-7 text-center">
          <p className="text-[11.5px] text-[#6B7280] leading-[1.5]">
            © 2026{' '}
            <span className="font-bold text-[#7D0609]">
              Asosiasi Pengembangan Indonesia Kompeten (APIK)
            </span>
            . All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export function HalamanSebelumNov2022({ onBack, onHome }: HalamanSetelahNov2022Props) {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen w-full bg-[#121215] flex justify-center font-sans antialiased">
      {/* Mobile-only locked container (max-width: 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#FAF7F2] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.65)] overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-gradient-to-b from-[#940D12] via-[#830A0E] to-[#710609] border-b-[3px] border-[#DFAC2A] px-3.5 py-2.5 flex items-center justify-between gap-2.5 shadow-sm">
          {/* Left Back Button */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-[#9E1C20]/75 border border-[#C74F53]/45 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Center Brand Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-[46px] h-[46px] shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="apikGoldRingSeb" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFE57F" />
                    <stop offset="50%" stopColor="#D99B16" />
                    <stop offset="100%" stopColor="#9A6808" />
                  </linearGradient>
                  <radialGradient id="apikMaroonBgSeb" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#9C1418" />
                    <stop offset="100%" stopColor="#4F0406" />
                  </radialGradient>
                </defs>
                <circle cx="32" cy="32" r="30.5" fill="url(#apikMaroonBgSeb)" stroke="url(#apikGoldRingSeb)" strokeWidth="2.5" />
                <circle cx="32" cy="32" r="22.5" fill="none" stroke="#E5B942" strokeWidth="1" strokeOpacity="0.85" />
                <g opacity="0.95">
                  <path d="M32 13L33.3 17H37.5L34.1 19.4L35.4 23.3L32 20.9L28.6 23.3L29.9 19.4L26.5 17H30.7L32 13Z" fill="#F8D25C" />
                  <path d="M21 38C21 29.5 26 24 32 24C38 24 43 29.5 43 38" fill="none" stroke="#F4C446" strokeWidth="1.6" />
                  <path d="M19 37C21 43 26.5 47 32 47C37.5 47 43 43 45 37" fill="none" stroke="#E8B838" strokeWidth="2" strokeDasharray="2.2 1.8" />
                  <rect x="23" y="29" width="18" height="9" rx="2" fill="#63080A" stroke="#F4C446" strokeWidth="0.9" />
                  <text x="32" y="35.5" textAnchor="middle" fill="#FCE28B" fontSize="6.5" fontWeight="800" fontFamily="sans-serif">
                    APIK
                  </text>
                </g>
                <text fill="#F7D56B" fontSize="4.3" fontWeight="700" letterSpacing="0.45">
                  <textPath href="#ringPathTopSeb" startOffset="50%" textAnchor="middle">
                    AFILIASI PENGEMBANGAN
                  </textPath>
                </text>
                <defs>
                  <path id="ringPathTopSeb" d="M 8,32 A 24,24 0 1,1 56,32" />
                </defs>
              </svg>
              <span className="absolute bottom-0 right-0 w-[12px] h-[12px] rounded-full bg-[#22C55E] border-[2px] border-[#78080B]" />
            </div>

            <div className="min-w-0 leading-tight">
              <div className="text-[11.5px] font-extrabold text-white tracking-[0.02em] leading-[1.22] uppercase">
                AFILIASI PENGEMBANGAN
                <br />
                INDONESIA KOMPETEN
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="text-[10px] font-extrabold text-[#F5C542] tracking-[0.06em] uppercase">
                  PORTAL RESMI
                </span>
                <svg viewBox="0 0 20 20" className="w-[12px] h-[12px] shrink-0" fill="none">
                  <path
                    d="M10 1.5L12.1 3.1L14.7 2.8L15.6 5.3L18 6.4L17.5 9L18.9 11.2L17.1 13.1L17.2 15.7L14.7 16.4L13.3 18.6L10.8 17.8L8.4 18.8L6.7 16.8L4.1 16.5L3.9 13.9L1.9 12.2L3 9.8L2.2 7.2L4.4 5.8L5 3.2L7.6 3.2L10 1.5Z"
                    fill="#F5C542"
                  />
                  <path
                    d="M6.8 10.2L9 12.4L13.4 7.8"
                    stroke="#75070A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Home Button */}
          <button
            type="button"
            onClick={onHome}
            aria-label="Beranda"
            className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-gradient-to-b from-[#FCE068] via-[#F2B926] to-[#DC9D13] border border-[#FFE98E]/65 shadow-[0_2px_6px_rgba(0,0,0,0.28)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" fill="none" stroke="#2D0909" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5L12 3l9 7.5" />
              <path d="M5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V9.5" />
              <path d="M9.5 20.5v-6a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v6" />
            </svg>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-3.5 pt-4 pb-5 flex flex-col justify-center">
          <div className="bg-white rounded-[24px] border-[1.5px] border-[#F2DA9C] shadow-[0_6px_22px_rgba(140,100,20,0.06)] px-4 pt-6 pb-6">
            {/* Top Pill Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#87080B] via-[#A20F14] to-[#87080B] px-4 py-1.5 border border-[#D4A024]/30 shadow-[0_4px_12px_rgba(135,8,11,0.28)]">
                <svg viewBox="0 0 20 20" className="w-[13px] h-[13px] shrink-0" fill="#F5C542">
                  <path d="M10 1.8L3.5 4.5V9.5C3.5 13.7 6.3 17.5 10 18.7C13.7 17.5 16.5 13.7 16.5 9.5V4.5L10 1.8Z" />
                </svg>
                <span className="text-[11px] font-bold text-[#F9E29C] tracking-[0.12em] uppercase leading-none">
                  APIK EDU INDONESIA
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="mt-4 text-center text-[24px] font-extrabold text-[#7D0609] tracking-[-0.015em] leading-tight">
              Pencarian Arsip
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-center text-[13.5px] text-[#6B7280] leading-[1.55] px-1">
              Data pemegang sertifikat kompetensi sebelum{' '}
              <strong className="font-bold text-[#7D0609]">01 November 2022</strong>.
              Masukkan nama atau nomor sertifikat pada kolom di bawah ini.
            </p>

            {/* Subtle Dashed Divider */}
            <div className="my-5 border-t border-dashed border-[#EDE7DC]" />

            {/* Search Bar + Cari Button (Gimmick Only) */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="rounded-[18px] bg-gradient-to-b from-[#FFFFFF] to-[#FFFDF8] border border-[#F3E6CA] shadow-[0_4px_12px_rgba(150,110,40,0.06)] p-4 space-y-3"
            >
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#9E1318] pointer-events-none">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama atau nomor sertifikat..."
                  className="w-full rounded-[14px] bg-white border-[1.5px] border-[#EED9A8] pl-10 pr-3.5 py-3 text-[13.5px] text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#9E1318]"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-[14px] bg-gradient-to-r from-[#87080B] via-[#A20F14] to-[#87080B] border-b-[4px] border-b-[#5E0507] py-3 px-4 text-white text-[14px] font-extrabold tracking-[0.04em] uppercase cursor-pointer active:translate-y-[1px] active:border-b-[2.5px] transition-all shadow-[0_4px_12px_rgba(135,8,11,0.22)]"
              >
                Cari
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 pt-1 pb-7 text-center">
          <p className="text-[11.5px] text-[#6B7280] leading-[1.5]">
            © 2026{' '}
            <span className="font-bold text-[#7D0609]">
              Asosiasi Pengembangan Indonesia Kompeten (APIK)
            </span>
            . All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

interface HalamanVerifikasiProps {
  judul: string;
  onBack: () => void;
}

export function HalamanVerifikasi({ judul, onBack }: HalamanVerifikasiProps) {
  const [nik, setNik] = useState('');
  const [tampilkanHasil, setTampilkanHasil] = useState(false);

  const extractProgramName = (text: string) => {
    return text
      .replace(/^Pemegang Sertifikat\s+/i, '')
      .replace(/\s+(LSP PEM INDONESIA|PUSAT PENDIDIKAN GEOMIGAS|LSP K3)$/i, '')
      .toUpperCase();
  };

  const getDummyData = (judulText: string) => {
    const lower = judulText.toLowerCase();
    if (lower.includes('scaffolding')) {
      return {
        nama: 'BUDI SANTOSO',
        program: lower.includes('pengawas') ? 'PENGAWAS SCAFFOLDING' : 'OPERATOR SCAFFOLDING',
        noSertifikat: '78429.8113.0006812',
        noRegister: 'F.2023.0006871',
        tanggalTerbit: '25 September 2023',
        berlakuSampai: '25 September 2026',
        status: 'VALID AKTIF',
      };
    }
    if (lower.includes('k3')) {
      return {
        nama: 'ANI WIJAYA',
        program: extractProgramName(judulText),
        noSertifikat: '78429.8113.0007429',
        noRegister: 'F.2024.0008135',
        tanggalTerbit: '14 Maret 2024',
        berlakuSampai: '14 Maret 2027',
        status: 'VALID AKTIF',
      };
    }
    return {
      nama: 'AHMAD FAUZI',
      program: extractProgramName(judulText),
      noSertifikat: '78429.8113.0009104',
      noRegister: 'F.2024.0009420',
      tanggalTerbit: '10 Juni 2024',
      berlakuSampai: '10 Juni 2027',
      status: 'VALID AKTIF',
    };
  };

  const dummyData = getDummyData(judul);

  const formatJudulLines = (text: string) => {
    const match = text.match(/^(Pemegang Sertifikat)\s+(.+?)\s+(LSP PEM INDONESIA|PUSAT PENDIDIKAN GEOMIGAS|LSP K3)$/i);
    if (match) {
      return (
        <>
          {match[1]}
          <br />
          {match[2]}
          <br />
          {match[3]}
        </>
      );
    }
    return text;
  };

  const handleCari = (e: React.FormEvent) => {
    e.preventDefault();
    setTampilkanHasil(true);
  };

  const handleClear = () => {
    setNik('');
    setTampilkanHasil(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#121215] flex justify-center font-sans antialiased">
      {/* Mobile-only locked container (max-width: 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#FAF7F2] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.65)] overflow-x-hidden px-4 pt-6 pb-8">
        {/* Header Title & Subtitle */}
        <header className="text-center px-2">
          <h1 className="text-[22px] font-extrabold text-[#7D0609] leading-[1.3] tracking-[-0.015em]">
            {formatJudulLines(judul)}
          </h1>
          <p className="mt-2.5 text-[13px] text-[#57534E] leading-[1.55]">
            Integrasi sistem sertifikasi kompetensi industri modern berstandar nasional demi percepatan infrastruktur Indonesia.
          </p>
        </header>

        {/* Main Yellow-Bordered Card with Overlapping LIVE DATABASE SYSTEM Badge */}
        <section className="relative mt-7 rounded-[18px] border-[1.5px] border-[#EAB308] bg-white px-4 pt-8 pb-6 shadow-[0_4px_18px_rgba(180,130,20,0.06)]">
          {/* Top-left Overlapping Maroon Pill Badge */}
          <div className="absolute -top-3.5 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#8B0B0E] px-3.5 py-1 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FACC15]" />
            <span className="text-white text-[10px] font-extrabold tracking-[0.06em] uppercase leading-none">
              LIVE DATABASE SYSTEM
            </span>
          </div>

          {/* Pinkish-Cream NIK Search Form Box */}
          <form
            onSubmit={handleCari}
            className="rounded-[14px] bg-[#FDF2F2] border border-[#FCE7E7] p-4"
          >
            <label
              htmlFor="input-nik"
              className="block text-[12px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase mb-2"
            >
              KETIK NIK
            </label>
            <input
              id="input-nik"
              type="text"
              inputMode="numeric"
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              className="w-full rounded-[10px] bg-white border-[1.5px] border-[#8B2326] px-3.5 py-2.5 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#7D0609]"
            />

            <div className="mt-3 flex flex-col items-start gap-2.5">
              <button
                type="submit"
                className="w-[116px] rounded-[10px] bg-gradient-to-b from-[#DC2626] to-[#B91C1C] border-b-[3px] border-b-[#7F1D1D] py-2.5 px-5 text-white text-[12.5px] font-extrabold tracking-[0.05em] uppercase shadow-sm cursor-pointer active:translate-y-[1px] transition-all"
              >
                CARI
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-[116px] rounded-[10px] bg-white border-[1.5px] border-[#991B1B] py-2 px-5 text-[#7F1D1D] text-[12.5px] font-extrabold tracking-[0.05em] uppercase cursor-pointer active:scale-[0.98] transition-transform"
              >
                CLEAR
              </button>
            </div>
          </form>

          {/* Dummy Data Result Section */}
          {tampilkanHasil && (
            <div className="mt-7 text-left">
              <h2 className="text-[12px] font-extrabold text-[#7D0609] tracking-[0.04em] uppercase pb-2.5 border-b border-dashed border-[#E5E7EB]">
                DATA PEMEGANG SERTIFIKAT
              </h2>

              <div className="mt-3 pt-1 pb-4 border-b border-dashed border-[#E5E7EB]">
                <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase mb-2.5">
                  FOTO PEMEGANG
                </div>
                <div className="w-[92px] h-[116px] rounded-[10px] border-[1.5px] border-[#EAB308] bg-white p-1 shadow-xs overflow-hidden">
                  <div className="w-full h-full rounded-[6px] bg-gradient-to-b from-[#DBEAFE] to-[#BFDBFE] flex flex-col items-center justify-end overflow-hidden relative">
                    {/* Minimalist Portrait Placeholder */}
                    <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/80 mb-1.5" />
                    <div className="w-16 h-10 rounded-t-full bg-[#1D4ED8]" />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-dashed divide-[#E5E7EB]">
                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    NAMA PEMEGANG
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937] uppercase">
                    {dummyData.nama}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    PROGRAM LPK
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937] uppercase">
                    {dummyData.program}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    NO SERTIFIKAT BNSP
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {dummyData.noSertifikat}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    NO REGISTER BNSP
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {dummyData.noRegister}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    TANGGAL TERBIT
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {dummyData.tanggalTerbit}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    BERLAKU SAMPAI
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {dummyData.berlakuSampai}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    STATUS SERTIFIKAT
                  </div>
                  <div className="mt-2 text-[13px] font-extrabold text-[#7D0609] uppercase tracking-[0.02em]">
                    {dummyData.status}
                  </div>
                </div>

                <div className="pt-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase mb-2.5">
                    E-KARTU LSP BNSP
                  </div>
                  <div className="w-full h-[180px] rounded-[12px] bg-[#2D3139] relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-around opacity-[0.06] -rotate-12 scale-125 pointer-events-none select-none">
                      <div className="text-white text-[13px] font-extrabold tracking-[0.2em] whitespace-nowrap">
                        HAK COPYRIGHT APIK  HAK COPYRIGHT APIK
                      </div>
                      <div className="text-white text-[13px] font-extrabold tracking-[0.2em] whitespace-nowrap">
                        HAK COPYRIGHT APIK  HAK COPYRIGHT APIK
                      </div>
                      <div className="text-white text-[13px] font-extrabold tracking-[0.2em] whitespace-nowrap">
                        HAK COPYRIGHT APIK  HAK COPYRIGHT APIK
                      </div>
                      <div className="text-white text-[13px] font-extrabold tracking-[0.2em] whitespace-nowrap">
                        HAK COPYRIGHT APIK  HAK COPYRIGHT APIK
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#FACC15] tracking-[0.08em] uppercase">
                        E-KARTU KOMPETENSI BNSP
                      </span>
                      <span className="text-[9px] font-bold text-white/70 uppercase">
                        RESMI
                      </span>
                    </div>
                    <div className="relative z-10">
                      <div className="text-[13px] font-extrabold text-white uppercase">
                        {dummyData.nama}
                      </div>
                      <div className="text-[10.5px] text-white/75 uppercase mt-0.5">
                        {dummyData.program}
                      </div>
                    </div>
                    <div className="relative z-10 flex items-center justify-between text-[10px] text-white/70">
                      <span>{dummyData.noRegister}</span>
                      <span className="text-[#4ADE80] font-bold">{dummyData.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Return Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[#990D11] to-[#6E0508] border-b-[3px] border-b-[#4A0305] px-7 py-3.5 text-white text-[12.5px] font-extrabold tracking-[0.05em] uppercase shadow-[0_6px_16px_rgba(125,6,9,0.28)] cursor-pointer active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" fill="none">
              <path d="M12 3L21 7.8L12 12.6L3 7.8L12 3Z" fill="#FFFFFF" />
              <path
                d="M3.5 12L12 16.5L20.5 12"
                stroke="#FFFFFF"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.5 16.2L12 20.7L20.5 16.2"
                stroke="#FFFFFF"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>PEMEGANG PROGRAM LAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<'beranda' | 'sebelum' | 'sesudah' | 'verifikasi'>('beranda');
  const [judulVerifikasi, setJudulVerifikasi] = useState(
    'Pemegang Sertifikat Operasi Scaffolding LSP PEM INDONESIA'
  );

  if (page === 'sebelum') {
    return (
      <HalamanSebelumNov2022
        onBack={() => setPage('beranda')}
        onHome={() => setPage('beranda')}
      />
    );
  }

  if (page === 'sesudah') {
    return (
      <HalamanSetelahNov2022
        onBack={() => setPage('beranda')}
        onHome={() => setPage('beranda')}
        onVerifikasi={(judul) => {
          setJudulVerifikasi(judul);
          setPage('verifikasi');
        }}
      />
    );
  }

  if (page === 'verifikasi') {
    return (
      <HalamanVerifikasi
        judul={judulVerifikasi}
        onBack={() => setPage('sesudah')}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#121215] flex justify-center selection:bg-rose-200">
      {/* Mobile-only locked container (max-width: 430px) */}
      <main className="w-full max-w-[430px] bg-white min-h-screen flex flex-col pt-7 pb-10 shadow-[0_0_50px_rgba(0,0,0,0.65)]">
        {/* 1. Header Title */}
        <header className="px-4 text-center">
          <h1
            className="text-[17px] font-bold italic tracking-normal inline-block border-b-[2px] leading-tight select-none"
            style={{
              color: '#3D0005',
              borderColor: '#3D0005',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
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
            onClick={() => setPage('sebelum')}
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

          {/* Option: Sesudah 01 November 2022 */}
          <button
            type="button"
            onClick={() => setPage('sesudah')}
            className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-transform active:scale-95"
            aria-label="Sesudah 01 November 2022"
          >
            <div className="w-[58px] h-[58px] flex items-center justify-center shrink-0">
              <img
                src="/assets/badge_star.png"
                alt="Badge Sesudah 01 November 2022"
                className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                loading="eager"
                draggable={false}
              />
            </div>
            <span
              className="mt-3 text-[11.5px] font-bold text-black leading-tight tracking-tight whitespace-nowrap select-none"
              style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
            >
              Sesudah 01 November 2022
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
