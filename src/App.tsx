/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://neptkinlbxcrdwxoikyg.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4iOdbJUqzRZ-mVSALQwlAw_Oe5LLU1d';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface PemegangSertifikatRow {
  id: string | number;
  tanggal_terbit: string | null;
  tanggal_berakhir?: string | null;
  berlaku_sampai: string | null;
  jenis_data?: string | null;
  nama_pemegang: string | null;
  nik: string | null;
  program_lpk: string | null;
  no_sertifikat_bnsp: string | null;
  no_register_bnsp: string | null;
  status_sertifikat?: string | null;
  foto_url?: string | null;
  url_foto: string | null;
  url_e_kartu?: string | null;
  created_at?: string | null;
}

function normalizePublicRow(raw: Record<string, unknown>): PemegangSertifikatRow {
  const expiry = (raw.tanggal_berakhir as string | null | undefined) ?? (raw.berlaku_sampai as string | null | undefined) ?? null;
  const photo = (raw.foto_url as string | null | undefined) ?? (raw.url_foto as string | null | undefined) ?? null;
  return {
    id: raw.id as string | number,
    tanggal_terbit: (raw.tanggal_terbit as string | null | undefined) ?? null,
    tanggal_berakhir: expiry,
    berlaku_sampai: expiry,
    jenis_data: (raw.jenis_data as string | null | undefined) ?? null,
    nama_pemegang: (raw.nama_pemegang as string | null | undefined) ?? null,
    nik: (raw.nik as string | null | undefined) ?? null,
    program_lpk: (raw.program_lpk as string | null | undefined) ?? null,
    no_sertifikat_bnsp: (raw.no_sertifikat_bnsp as string | null | undefined) ?? null,
    no_register_bnsp: (raw.no_register_bnsp as string | null | undefined) ?? null,
    status_sertifikat: (raw.status_sertifikat as string | null | undefined) ?? 'VALID AKTIF',
    foto_url: photo,
    url_foto: photo,
    url_e_kartu: (raw.url_e_kartu as string | null | undefined) ?? null,
    created_at: (raw.created_at as string | null | undefined) ?? null,
  };
}

interface CompressedImageResult {
  dataUrl: string;
  fileName: string;
  contentType: string;
  compressedBytes: number;
}

function getDataUrlBinarySize(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const paddingMatch = base64.match(/=+$/);
  const padding = paddingMatch ? paddingMatch[0].length : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function formatReadableFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memproses file gambar. Pastikan file gambar valid.'));
    };
    img.src = objectUrl;
  });
}

async function compressImageWithCanvas(
  file: File,
  options: {
    maxLongSide: number;
    minLongSide: number;
    initialQuality: number;
    minQuality: number;
    targetMaxBytes: number;
  }
): Promise<CompressedImageResult> {
  const img = await loadImageFromFile(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (!srcWidth || !srcHeight) {
    throw new Error('Dimensi gambar tidak valid.');
  }

  const renderAt = (longSideLimit: number, quality: number): { dataUrl: string; bytes: number } => {
    const longest = Math.max(srcWidth, srcHeight);
    const scale = longest > longSideLimit ? longSideLimit / longest : 1;
    const targetW = Math.max(1, Math.round(srcWidth * scale));
    const targetH = Math.max(1, Math.round(srcHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas browser tidak tersedia untuk kompresi gambar.');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const safeQuality = Math.max(0.75, options.minQuality, Math.min(1, quality));
    const dataUrl = canvas.toDataURL('image/jpeg', safeQuality);
    return {
      dataUrl,
      bytes: getDataUrlBinarySize(dataUrl),
    };
  };

  let currentLongSide = options.maxLongSide;
  let currentQuality = options.initialQuality;
  let result = renderAt(currentLongSide, currentQuality);

  while (result.bytes > options.targetMaxBytes && currentQuality > Math.max(0.75, options.minQuality)) {
    currentQuality = Math.max(0.75, options.minQuality, Number((currentQuality - 0.04).toFixed(2)));
    result = renderAt(currentLongSide, currentQuality);
  }

  while (
    result.bytes > options.targetMaxBytes &&
    Math.min(Math.max(srcWidth, srcHeight), currentLongSide) > options.minLongSide
  ) {
    const nextSide = Math.max(options.minLongSide, Math.round(currentLongSide * 0.85));
    if (nextSide === currentLongSide) break;
    currentLongSide = nextSide;
    result = renderAt(currentLongSide, currentQuality);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'gambar';
  return {
    dataUrl: result.dataUrl,
    fileName: `${baseName}.jpg`,
    contentType: 'image/jpeg',
    compressedBytes: result.bytes,
  };
}

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function formatTanggalIndonesia(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const trimmed = dateStr.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}`;
    }
  }
  return trimmed;
}

function buildVerificationUrl(nik: string, jenisData?: string | null): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams();
  params.set('nik', nik.trim());
  if (jenisData) {
    params.set('jenis', jenisData);
  }
  return `${origin}/?${params.toString()}`;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadImageSafe(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      linesDrawn += 1;
      if (linesDrawn >= maxLines) return currentY + lineHeight;
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

interface EKartuPayload {
  nama_pemegang: string;
  nik: string;
  program_lpk: string;
  no_sertifikat_bnsp: string;
  no_register_bnsp: string;
  tanggal_terbit: string;
  berlaku_sampai: string;
  status_sertifikat: string;
  url_foto?: string | null;
  jenis_data?: string | null;
}

async function generateEKartuWithQR(
  payload: EKartuPayload
): Promise<{ dataUrl: string; blob: Blob; qrDataUrl: string }> {
  const verificationUrl = buildVerificationUrl(payload.nik || '-', payload.jenis_data);
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 240,
    margin: 1,
    color: {
      dark: '#111827',
      light: '#FFFFFF',
    },
  });

  const canvas = document.createElement('canvas');
  canvas.width = 860;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context tidak tersedia.');
  }

  const renderCard = async (includeRemotePhoto: boolean) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Card background gradient
    drawRoundedRectPath(ctx, 0, 0, 860, 540, 28);
    ctx.save();
    ctx.clip();

    const bgGrad = ctx.createLinearGradient(0, 0, 860, 540);
    bgGrad.addColorStop(0, '#1B2029');
    bgGrad.addColorStop(0.55, '#272C37');
    bgGrad.addColorStop(1, '#141820');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 860, 540);

    // Subtle diagonal watermark
    ctx.save();
    ctx.translate(430, 270);
    ctx.rotate(-0.24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
    ctx.font = '800 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let wy = -320; wy <= 320; wy += 78) {
      ctx.fillText('HAK COPYRIGHT APIK   •   HAK COPYRIGHT APIK   •   HAK COPYRIGHT APIK', 0, wy);
    }
    ctx.restore();

    // Top Maroon Header Strip
    const headerGrad = ctx.createLinearGradient(0, 0, 860, 0);
    headerGrad.addColorStop(0, '#710609');
    headerGrad.addColorStop(0.5, '#9A0E13');
    headerGrad.addColorStop(1, '#670508');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(0, 0, 860, 96);

    // Gold accent stripe under header
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(0, 96, 860, 5);

    // Header badge & title
    ctx.fillStyle = '#FACC15';
    ctx.font = '800 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('E-KARTU KOMPETENSI BNSP', 36, 46);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '700 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('ASOSIASI PENGEMBANGAN INDONESIA KOMPETEN (APIK)', 36, 74);

    // Right "RESMI" pill
    drawRoundedRectPath(ctx, 718, 30, 106, 36, 18);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.fillStyle = '#5E0507';
    ctx.font = '900 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RESMI', 771, 53);
    ctx.textAlign = 'left';

    // Photo frame (left)
    const photoX = 36;
    const photoY = 132;
    const photoW = 162;
    const photoH = 204;

    drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, 14);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#EAB308';
    ctx.stroke();

    const photoImg = includeRemotePhoto ? await loadImageSafe(payload.url_foto) : null;
    if (photoImg) {
      ctx.save();
      drawRoundedRectPath(ctx, photoX + 4, photoY + 4, photoW - 8, photoH - 8, 10);
      ctx.clip();
      const imgAspect = photoImg.width / photoImg.height;
      const boxAspect = (photoW - 8) / (photoH - 8);
      let drawW = photoW - 8;
      let drawH = photoH - 8;
      let offsetX = photoX + 4;
      let offsetY = photoY + 4;
      if (imgAspect > boxAspect) {
        drawW = drawH * imgAspect;
        offsetX -= (drawW - (photoW - 8)) / 2;
      } else {
        drawH = drawW / imgAspect;
        offsetY -= (drawH - (photoH - 8)) / 2;
      }
      ctx.drawImage(photoImg, offsetX, offsetY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.save();
      drawRoundedRectPath(ctx, photoX + 4, photoY + 4, photoW - 8, photoH - 8, 10);
      ctx.clip();
      ctx.fillStyle = '#DBEAFE';
      ctx.fillRect(photoX + 4, photoY + 4, photoW - 8, photoH - 8);
      ctx.fillStyle = '#1E3A8A';
      ctx.beginPath();
      ctx.arc(photoX + photoW / 2, photoY + 86, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1D4ED8';
      ctx.beginPath();
      ctx.arc(photoX + photoW / 2, photoY + 196, 62, Math.PI, 0);
      ctx.fill();
      ctx.restore();
    }

    // Status pill under photo
    const isAktif = (payload.status_sertifikat || 'VALID AKTIF').toUpperCase() === 'VALID AKTIF';
    drawRoundedRectPath(ctx, photoX, photoY + photoH + 16, photoW, 38, 10);
    ctx.fillStyle = isAktif ? 'rgba(34, 197, 94, 0.18)' : 'rgba(244, 63, 94, 0.2)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isAktif ? '#4ADE80' : '#FB7185';
    ctx.stroke();

    ctx.fillStyle = isAktif ? '#4ADE80' : '#FDA4AF';
    ctx.font = '800 14px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((payload.status_sertifikat || 'VALID AKTIF').toUpperCase(), photoX + photoW / 2, photoY + photoH + 40);
    ctx.textAlign = 'left';

    // Center Details
    const detailX = 226;
    const detailMaxW = 412;

    ctx.fillStyle = '#FACC15';
    ctx.font = '800 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('NAMA PEMEGANG', detailX, 146);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px system-ui, -apple-system, sans-serif';
    let nextY = wrapCanvasText(
      ctx,
      (payload.nama_pemegang || '-').toUpperCase(),
      detailX,
      176,
      detailMaxW,
      28,
      2
    );

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('NIK', detailX, nextY + 6);
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '700 16px monospace';
    ctx.fillText(payload.nik || '-', detailX, nextY + 26);

    ctx.fillStyle = '#FACC15';
    ctx.font = '800 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('PROGRAM LPK / SKEMA', detailX, nextY + 58);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    const afterProgramY = wrapCanvasText(
      ctx,
      (payload.program_lpk || '-').toUpperCase(),
      detailX,
      nextY + 84,
      detailMaxW,
      22,
      2
    );

    const gridY = Math.max(afterProgramY + 12, 344);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('NO. SERTIFIKAT BNSP', detailX, gridY);
    ctx.fillText('NO. REGISTER BNSP', detailX + 215, gridY);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 15px monospace';
    ctx.fillText(payload.no_sertifikat_bnsp || '-', detailX, gridY + 22);
    ctx.fillText(payload.no_register_bnsp || '-', detailX + 215, gridY + 22);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '700 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('TANGGAL TERBIT', detailX, gridY + 54);
    ctx.fillText('BERLAKU SAMPAI', detailX + 215, gridY + 54);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatTanggalIndonesia(payload.tanggal_terbit), detailX, gridY + 76);
    ctx.fillText(formatTanggalIndonesia(payload.berlaku_sampai), detailX + 215, gridY + 76);

    // Right QR Code Card Box
    const qrBoxX = 656;
    const qrBoxY = 178;
    const qrBoxW = 168;
    const qrBoxH = 212;

    drawRoundedRectPath(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#EAB308';
    ctx.stroke();

    const qrImg = await loadImageSafe(qrDataUrl);
    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX + 12, qrBoxY + 12, 144, 144);
    }

    ctx.fillStyle = '#7D0609';
    ctx.font = '900 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN QR VERIFIKASI', qrBoxX + qrBoxW / 2, qrBoxY + 177);
    ctx.fillStyle = '#4B5563';
    ctx.font = '700 10px monospace';
    ctx.fillText(payload.no_register_bnsp || 'LIVE DB', qrBoxX + qrBoxW / 2, qrBoxY + 196);
    ctx.textAlign = 'left';

    // Bottom Strip
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 488, 860, 52);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('Terverifikasi melalui Portal Resmi APIK Edu Indonesia • Data Terhubung Real-Time', 36, 519);

    ctx.restore();

    // Outer gold border
    drawRoundedRectPath(ctx, 1.5, 1.5, 857, 537, 27);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
    ctx.stroke();
  };

  await renderCard(true);

  let dataUrl: string;
  try {
    dataUrl = canvas.toDataURL('image/png');
  } catch {
    // Fallback if remote image server blocks CORS canvas export
    await renderCard(false);
    dataUrl = canvas.toDataURL('image/png');
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Gagal membuat file gambar E-Kartu PNG.'));
    }, 'image/png');
  });

  return { dataUrl, blob, qrDataUrl };
}

interface HalamanSetelahNov2022Props {
  onBack?: () => void;
  onHome?: () => void;
  onVerifikasi?: (judul: string, jenisData?: string) => void;
  onAdminLoginSuccess?: (accessToken: string) => void;
}

export function HalamanSetelahNov2022({
  onBack,
  onHome,
  onVerifikasi,
  onAdminLoginSuccess,
}: HalamanSetelahNov2022Props) {
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [showLoginAdmin, setShowLoginAdmin] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }, []);

  const handleSecretFooterTap = () => {
    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
    }
    tapCountRef.current += 1;
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowLoginAdmin(true);
      return;
    }
    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 1800);
  };

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
        { title: 'Teknologi Informasi', subtitle: 'Sertifikasi IT Komputer' },
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
                                const jenisDataKey = `${block.id}::${scheme.title}`;
                                if (scheme.title === 'Operator Scaffolding') {
                                  onVerifikasi(
                                    'Pemegang Sertifikat Operasi Scaffolding LSP PEM INDONESIA',
                                    jenisDataKey
                                  );
                                  return;
                                }
                                const lembagaLabel =
                                  block.id === 'pem-indonesia'
                                    ? 'LSP PEM INDONESIA'
                                    : block.id === 'geomigas'
                                      ? 'PUSAT PENDIDIKAN GEOMIGAS'
                                      : 'LSP K3';
                                onVerifikasi(
                                  `Pemegang Sertifikat ${scheme.title} ${lembagaLabel}`,
                                  jenisDataKey
                                );
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
                <div className="w-full overflow-hidden rounded-[16px] bg-white">
                  <img
                    src="/assets/aistudio/1794592463956_24597219.png"
                    alt="Standar Akreditasi dan Lisensi Lembaga - Kemnaker, ESDM, G-CERTi ISO 9001:2015, LA-LPK, BNSP, ISO 45001:2018"
                    className="w-full h-auto object-contain block select-none pointer-events-none"
                    loading="eager"
                    draggable={false}
                  />
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Footer (Secret Tap 5x Gate) */}
        <footer
          onClick={handleSecretFooterTap}
          className="px-6 pt-1 pb-7 text-center select-none cursor-default"
        >
          <p className="text-[11.5px] text-[#6B7280] leading-[1.5]">
            © <span id="currentYear">{new Date().getFullYear()}</span>{' '}
            <span className="font-bold text-[#7D0609]">
              Asosiasi Pengembangan Indonesia Kompeten (APIK)
            </span>
            . All Rights Reserved.
          </p>
        </footer>

        {showLoginAdmin && (
          <LoginAdmin
            onClose={() => setShowLoginAdmin(false)}
            onSuccess={(accessToken) => {
              setShowLoginAdmin(false);
              onAdminLoginSuccess?.(accessToken);
            }}
          />
        )}
      </div>
    </div>
  );
}

export function HalamanSebelumNov2022({ onBack, onHome }: HalamanSetelahNov2022Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }, []);

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
            © <span id="currentYear">{new Date().getFullYear()}</span>{' '}
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
  jenisData?: string;
  initialNik?: string;
  onBack: () => void;
}

export function HalamanVerifikasi({
  judul,
  jenisData,
  initialNik = '',
  onBack,
}: HalamanVerifikasiProps) {
  const [nik, setNik] = useState(initialNik);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasilData, setHasilData] = useState<PemegangSertifikatRow | null>(null);
  const [generatedEKartuUrl, setGeneratedEKartuUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

  const namaProgram = (() => {
    if (jenisData && jenisData.includes('::')) {
      return jenisData.split('::')[1].trim();
    }
    const cleaned = judul
      .replace(/^Pemegang Sertifikat\s+/i, '')
      .replace(/\s+(LSP PEM INDONESIA|PUSAT PENDIDIKAN GEOMIGAS|LSP K3)$/i, '')
      .trim();
    return cleaned || 'Program Sertifikasi';
  })();

  const performLookup = useCallback(
    async (rawNik: string) => {
      const inputNik = rawNik.trim();
      if (!inputNik) {
        setErrorMsg('Silakan ketik NIK terlebih dahulu sebelum menekan CARI.');
        setHasilData(null);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      setHasSearched(true);
      setHasilData(null);
      setGeneratedEKartuUrl('');
      setQrCodeUrl('');

      try {
        const primaryProgramValue =
          namaProgram.toLowerCase() === 'teknologi informasi'
            ? 'Teknologi Informasi'
            : namaProgram.toUpperCase();

        // Publik read-only via supabaseClient (Anon Key)
        const { data: exactRows, error } = await supabaseClient
          .from('data_pemegang')
          .select('*')
          .eq('nik', inputNik)
          .eq('program_lpk', primaryProgramValue)
          .order('id', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        let rows = ((exactRows as Record<string, unknown>[] | null) ?? []).map(normalizePublicRow);

        // Fallback case-insensitive untuk program_lpk
        if (rows.length === 0) {
          const { data: ilikeRows, error: ilikeErr } = await supabaseClient
            .from('data_pemegang')
            .select('*')
            .eq('nik', inputNik)
            .ilike('program_lpk', namaProgram)
            .order('id', { ascending: false });

          if (ilikeErr) {
            throw new Error(ilikeErr.message);
          }

          rows = ((ilikeRows as Record<string, unknown>[] | null) ?? []).map(normalizePublicRow);
        }

        // Fallback jika dibuka dari QR scan tanpa parameter jenis
        if (rows.length === 0 && initialNik && !jenisData) {
          const { data: nikRows, error: nikErr } = await supabaseClient
            .from('data_pemegang')
            .select('*')
            .eq('nik', inputNik)
            .order('id', { ascending: false });

          if (nikErr) {
            throw new Error(nikErr.message);
          }

          rows = ((nikRows as Record<string, unknown>[] | null) ?? []).map(normalizePublicRow);
        }

        if (rows.length === 0) {
          setHasilData(null);
          return;
        }

        const matchedRow =
          (jenisData ? rows.find((r) => r.jenis_data === jenisData) : undefined) || rows[0];

        setHasilData(matchedRow);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal terhubung ke database Supabase.';
        setErrorMsg(`Terjadi kesalahan saat mencari data: ${message}`);
      } finally {
        setLoading(false);
      }
    },
    [initialNik, jenisData, namaProgram]
  );

  useEffect(() => {
    if (initialNik.trim()) {
      setNik(initialNik);
      void performLookup(initialNik);
    }
  }, [initialNik, performLookup]);

  useEffect(() => {
    let active = true;
    if (!hasilData) {
      setGeneratedEKartuUrl('');
      setQrCodeUrl('');
      return;
    }

    const buildAssets = async () => {
      try {
        const verifyUrl = buildVerificationUrl(
          hasilData.nik || nik,
          hasilData.jenis_data || jenisData
        );
        const qr = await QRCode.toDataURL(verifyUrl, {
          width: 220,
          margin: 1,
          color: { dark: '#111827', light: '#FFFFFF' },
        });
        if (active) setQrCodeUrl(qr);

        if (!hasilData.url_e_kartu) {
          const generated = await generateEKartuWithQR({
            nama_pemegang: hasilData.nama_pemegang || '-',
            nik: hasilData.nik || nik,
            program_lpk: hasilData.program_lpk || '-',
            no_sertifikat_bnsp: hasilData.no_sertifikat_bnsp || '-',
            no_register_bnsp: hasilData.no_register_bnsp || '-',
            tanggal_terbit: hasilData.tanggal_terbit || '-',
            berlaku_sampai: hasilData.berlaku_sampai || '-',
            status_sertifikat: hasilData.status_sertifikat || 'VALID AKTIF',
            url_foto: hasilData.url_foto,
            jenis_data: hasilData.jenis_data || jenisData,
          });
          if (active) setGeneratedEKartuUrl(generated.dataUrl);
        }
      } catch {
        // Keep UI graceful even if canvas generation fails
      }
    };

    void buildAssets();
    return () => {
      active = false;
    };
  }, [hasilData, jenisData, nik]);

  const handleCari = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(nik);
  };

  const handleClear = () => {
    setNik('');
    setHasSearched(false);
    setErrorMsg(null);
    setHasilData(null);
    setGeneratedEKartuUrl('');
    setQrCodeUrl('');
  };

  const displayedEKartu = hasilData?.url_e_kartu || generatedEKartuUrl;
  const isStatusValid = (hasilData?.status_sertifikat || 'VALID AKTIF').toUpperCase() === 'VALID AKTIF';

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
              placeholder="Masukkan NIK pemegang sertifikat"
              className="w-full rounded-[10px] bg-white border-[1.5px] border-[#8B2326] px-3.5 py-2.5 text-[14px] text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7D0609]"
            />

            <div className="mt-3 flex flex-col items-start gap-2.5">
              <button
                type="submit"
                disabled={loading}
                className="w-[116px] rounded-[10px] bg-gradient-to-b from-[#DC2626] to-[#B91C1C] border-b-[3px] border-b-[#7F1D1D] py-2.5 px-5 text-white text-[12.5px] font-extrabold tracking-[0.05em] uppercase shadow-sm cursor-pointer active:translate-y-[1px] transition-all disabled:opacity-60"
              >
                {loading ? 'MENCARI...' : 'CARI'}
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

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 rounded-[14px] bg-[#FEF2F2] border-[1.5px] border-[#FCA5A5] border-l-[4px] border-l-[#DC2626] px-4 py-3.5 flex items-start gap-3 shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[20px] h-[20px] shrink-0 text-[#DC2626] mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="text-left">
                <div className="text-[11.5px] font-extrabold text-[#991B1B] uppercase tracking-[0.04em]">
                  PERINGATAN
                </div>
                <p className="mt-0.5 text-[12.5px] text-[#7F1D1D] font-medium leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}

          {hasSearched && !loading && !errorMsg && !hasilData && (
            <div
              role="alert"
              className="mt-5 rounded-[14px] bg-[#FEF2F2] border-[1.5px] border-[#FCA5A5] border-l-[4px] border-l-[#B91C1C] px-4 py-4 flex items-start gap-3 shadow-[0_4px_12px_rgba(185,28,28,0.08)]"
            >
              <div className="w-8 h-8 rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[18px] h-[18px] text-[#DC2626]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="text-[12px] font-extrabold text-[#991B1B] uppercase tracking-[0.04em]">
                  DATA TIDAK DITEMUKAN
                </div>
                <p className="mt-1 text-[13px] text-[#7F1D1D] font-semibold leading-relaxed">
                  Data tidak ditemukan di program {namaProgram}
                </p>
              </div>
            </div>
          )}

          {/* Live Supabase Data Result Section */}
          {hasilData && (
            <div className="mt-7 text-left">
              <h2 className="text-[12px] font-extrabold text-[#7D0609] tracking-[0.04em] uppercase pb-2.5 border-b border-dashed border-[#E5E7EB]">
                DATA PEMEGANG SERTIFIKAT
              </h2>

              <div className="mt-3 pt-1 pb-4 border-b border-dashed border-[#E5E7EB]">
                <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase mb-2.5">
                  FOTO PEMEGANG
                </div>
                <div className="w-[92px] h-[116px] rounded-[10px] border-[1.5px] border-[#EAB308] bg-white p-1 shadow-xs overflow-hidden">
                  {hasilData.url_foto ? (
                    <img
                      src={hasilData.url_foto}
                      alt={hasilData.nama_pemegang || 'Foto Pemegang'}
                      className="w-full h-full rounded-[6px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[6px] bg-gradient-to-b from-[#DBEAFE] to-[#BFDBFE] flex flex-col items-center justify-end overflow-hidden relative">
                      <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/80 mb-1.5" />
                      <div className="w-16 h-10 rounded-t-full bg-[#1D4ED8]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="divide-y divide-dashed divide-[#E5E7EB]">
                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    NAMA PEMEGANG
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937] uppercase">
                    {hasilData.nama_pemegang || '-'}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    PROGRAM LPK
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937] uppercase">
                    {hasilData.program_lpk || '-'}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    NO SERTIFIKAT BNSP
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {hasilData.no_sertifikat_bnsp || '-'}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    NO REGISTER BNSP
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {hasilData.no_register_bnsp || '-'}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    TANGGAL TERBIT
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {formatTanggalIndonesia(hasilData.tanggal_terbit)}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    BERLAKU SAMPAI
                  </div>
                  <div className="mt-2 text-[14.5px] text-[#1F2937]">
                    {formatTanggalIndonesia(hasilData.berlaku_sampai)}
                  </div>
                </div>

                <div className="py-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase">
                    STATUS SERTIFIKAT
                  </div>
                  <div
                    className={`mt-2 text-[13px] font-extrabold uppercase tracking-[0.02em] ${
                      isStatusValid ? 'text-[#15803D]' : 'text-[#7D0609]'
                    }`}
                  >
                    {hasilData.status_sertifikat || 'VALID AKTIF'}
                  </div>
                </div>

                <div className="pt-3.5">
                  <div className="text-[11.5px] font-extrabold text-[#7D0609] tracking-[0.03em] uppercase mb-2.5">
                    E-KARTU LSP BNSP
                  </div>

                  {displayedEKartu ? (
                    <div className="space-y-2.5">
                      <div className="rounded-[12px] overflow-hidden border-[1.5px] border-[#EAB308] bg-[#1F242D] shadow-sm">
                        <img
                          src={displayedEKartu}
                          alt={`E-Kartu ${hasilData.nama_pemegang || ''}`}
                          className="w-full h-auto block"
                        />
                      </div>
                      <a
                        href={displayedEKartu}
                        download={`E-Kartu-${(hasilData.nama_pemegang || hasilData.nik || 'BNSP').replace(/\s+/g, '_')}.png`}
                        className="w-full rounded-[10px] bg-gradient-to-b from-[#FCE068] to-[#E5AC1A] border border-[#D49810] py-2.5 px-4 text-center text-[#3D0005] text-[11.5px] font-extrabold tracking-[0.04em] uppercase flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-transform"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>DOWNLOAD E-KARTU PNG</span>
                      </a>
                    </div>
                  ) : (
                    <div className="w-full h-[180px] rounded-[12px] bg-[#2D3139] relative overflow-hidden flex flex-col justify-between p-4 shadow-inner">
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
                          {hasilData.nama_pemegang || '-'}
                        </div>
                        <div className="text-[10.5px] text-white/75 uppercase mt-0.5">
                          {hasilData.program_lpk || '-'}
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center justify-between text-[10px] text-white/70">
                        <span>{hasilData.no_register_bnsp || '-'}</span>
                        <span className="text-[#4ADE80] font-bold">
                          {hasilData.status_sertifikat || 'VALID AKTIF'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scannable QR Verification Box */}
                  {qrCodeUrl && (
                    <div className="mt-3 rounded-[12px] border border-[#F3E6CA] bg-[#FFFDF8] p-3 flex items-center gap-3">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code Verifikasi"
                        className="w-[74px] h-[74px] rounded-[8px] border border-[#EAB308] bg-white p-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[10.5px] font-extrabold text-[#7D0609] uppercase tracking-[0.04em]">
                          QR CODE VERIFIKASI OTENTIK
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#57534E] leading-snug">
                          Pindai QR code ini untuk verifikasi langsung data sertifikat NIK{' '}
                          <span className="font-mono font-bold text-[#1F2937]">
                            {hasilData.nik}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}
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

interface LoginAdminProps {
  onClose: () => void;
  onSuccess: (accessToken: string) => void;
}

export function LoginAdmin({ onClose, onSuccess }: LoginAdminProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const rawUsername = username.trim();
      const loginEmail =
        rawUsername.toLowerCase() === 'admin' ? 'admin@lpk.local' : rawUsername;

      if (!loginEmail || !password) {
        setError('Gagal: Username dan password wajib diisi.');
        return;
      }

      // Login wajib menggunakan supabaseClient (VITE_SUPABASE_ANON_KEY)
      let { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      // Jika user admin@lpk.local belum ada, buatkan otomatis lewat server (supabaseAdmin) lalu login ulang
      if ((authError || !authData.session) && loginEmail.toLowerCase() === 'admin@lpk.local') {
        const ensureRes = await fetch('/api/admin/ensure-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password }),
        });

        const ensureJson = (await ensureRes.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };

        if (!ensureRes.ok) {
          setError(ensureJson.error || `Gagal (HTTP ${ensureRes.status}): Username atau password tidak valid.`);
          return;
        }

        const retry = await supabaseClient.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        authData = retry.data;
        authError = retry.error;
      }

      if (authError || !authData.session?.access_token) {
        setError(
          `Gagal: ${authError?.message || 'Username atau password tidak valid.'}`
        );
        return;
      }

      onSuccess(authData.session.access_token);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Network error';
      setError(`Gagal: Tidak dapat terhubung ke layanan autentikasi Supabase (${detail}).`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-sans">
      <div className="w-full max-w-[360px] rounded-[20px] bg-[#0F141E] border border-slate-700/90 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-5 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="inline-block text-[10px] font-bold tracking-[0.12em] uppercase text-emerald-400">
              SUPER ADMIN ACCESS
            </span>
            <h2 className="text-[18px] font-extrabold text-white tracking-tight">
              ROOT GATE LOGIN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-300 mb-1.5"
            >
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full rounded-[12px] bg-[#161D2B] border border-slate-700 px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-[12px] bg-[#161D2B] border border-slate-700 px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <div className="rounded-[10px] bg-rose-950/70 border border-rose-700/70 px-3 py-2 text-[12px] text-rose-200">
              {error}
            </div>
          )}

          <div className="pt-1 flex gap-2.5">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="flex-1 rounded-[12px] bg-slate-800 border border-slate-700 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.04em] text-slate-300 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-[12px] bg-gradient-to-b from-emerald-500 to-emerald-600 border-b-[3px] border-b-emerald-800 py-2.5 text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-slate-950 cursor-pointer active:translate-y-[1px] transition-all disabled:opacity-60"
            >
              {submitting ? 'MASUK...' : 'LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AdminProgramItem {
  key: string;
  lembaga: string;
  title: string;
}

const ADMIN_PROGRAM_GROUPS: { lembaga: string; items: AdminProgramItem[] }[] = [
  {
    lembaga: 'PUSAT PENDIDIKAN GEOMIGAS',
    items: [
      { key: 'geomigas::Operator K3 Migas', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Operator K3 Migas' },
      { key: 'geomigas::Pengawas K3 Migas', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Pengawas K3 Migas' },
      { key: 'geomigas::Supervisor K3 Tambang', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Supervisor K3 Tambang' },
      { key: 'geomigas::Operator K3 Listrik', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Operator K3 Listrik' },
      { key: 'geomigas::Teknisi K3 Listrik', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Teknisi K3 Listrik' },
      { key: 'geomigas::Ahli K3 Listrik', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Ahli K3 Listrik' },
      { key: 'geomigas::Auditor SMK3 Tambang', lembaga: 'PUSAT PENDIDIKAN GEOMIGAS', title: 'Auditor SMK3 Tambang' },
    ],
  },
  {
    lembaga: 'PEM INDONESIA',
    items: [
      { key: 'pem-indonesia::Operator Scaffolding', lembaga: 'PEM INDONESIA', title: 'Operator Scaffolding' },
      { key: 'pem-indonesia::Pengawas Scaffolding', lembaga: 'PEM INDONESIA', title: 'Pengawas Scaffolding' },
      { key: 'pem-indonesia::Operator K3 Umum', lembaga: 'PEM INDONESIA', title: 'Operator K3 Umum' },
      { key: 'pem-indonesia::Petugas K3 Umum', lembaga: 'PEM INDONESIA', title: 'Petugas K3 Umum' },
      { key: 'pem-indonesia::Ahli K3 Umum', lembaga: 'PEM INDONESIA', title: 'Ahli K3 Umum' },
      { key: 'pem-indonesia::K3 Ruang Terbatas (Confined Space)', lembaga: 'PEM INDONESIA', title: 'K3 Ruang Terbatas (Confined Space)' },
      { key: 'pem-indonesia::Petugas Gas H2S', lembaga: 'PEM INDONESIA', title: 'Petugas Gas H2S' },
      { key: 'pem-indonesia::Authorized Gas Tester', lembaga: 'PEM INDONESIA', title: 'Authorized Gas Tester' },
      { key: 'pem-indonesia::Teknologi Informasi', lembaga: 'PEM INDONESIA', title: 'Teknologi Informasi' },
      { key: 'pem-indonesia::Operator Excavator', lembaga: 'PEM INDONESIA', title: 'Operator Excavator' },
      { key: 'pem-indonesia::Operator Backhoe', lembaga: 'PEM INDONESIA', title: 'Operator Backhoe' },
      { key: 'pem-indonesia::Operator Loader', lembaga: 'PEM INDONESIA', title: 'Operator Loader' },
      { key: 'pem-indonesia::Operator Dumptruck', lembaga: 'PEM INDONESIA', title: 'Operator Dumptruck' },
      { key: 'pem-indonesia::Operator Dozer', lembaga: 'PEM INDONESIA', title: 'Operator Dozer' },
      { key: 'pem-indonesia::Operator Motorgrader', lembaga: 'PEM INDONESIA', title: 'Operator Motorgrader' },
      { key: 'pem-indonesia::Operator Mobile Crane', lembaga: 'PEM INDONESIA', title: 'Operator Mobile Crane' },
      { key: 'pem-indonesia::Operator Forklift', lembaga: 'PEM INDONESIA', title: 'Operator Forklift' },
      { key: 'pem-indonesia::Operator Overhead Crane', lembaga: 'PEM INDONESIA', title: 'Operator Overhead Crane' },
      { key: 'pem-indonesia::Operator Pedestal Crane', lembaga: 'PEM INDONESIA', title: 'Operator Pedestal Crane' },
      { key: 'pem-indonesia::Juru Ikat Beban / Rigger', lembaga: 'PEM INDONESIA', title: 'Juru Ikat Beban / Rigger' },
      { key: 'pem-indonesia::Inspector Pesawat Angkat', lembaga: 'PEM INDONESIA', title: 'Inspector Pesawat Angkat' },
      { key: 'pem-indonesia::Petugas Fire Safety', lembaga: 'PEM INDONESIA', title: 'Petugas Fire Safety' },
      { key: 'pem-indonesia::Petugas First Aid', lembaga: 'PEM INDONESIA', title: 'Petugas First Aid' },
    ],
  },
  {
    lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)',
    items: [
      { key: 'lsp-k3::Petugas K3 Umum', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Petugas K3 Umum' },
      { key: 'lsp-k3::Ahli K3 Umum', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Ahli K3 Umum' },
      { key: 'lsp-k3::Teknisi K3 Ketinggian', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Teknisi K3 Ketinggian' },
      { key: 'lsp-k3::Ahli Muda Ruang Terbatas', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Ahli Muda Ruang Terbatas' },
      { key: 'lsp-k3::Ahli Madya Ruang Terbatas', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Ahli Madya Ruang Terbatas' },
      { key: 'lsp-k3::Auditor SMK3 Umum', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Auditor SMK3 Umum' },
      { key: 'lsp-k3::Operator K3 Alat Berat', lembaga: 'LEMBAGA SERTIFIKASI PROFESI K3 (LSP K3)', title: 'Operator K3 Alat Berat' },
    ],
  },
];

function resolveProgramKeyFromJenis(jenisData?: string | null): string | null {
  if (!jenisData) return null;
  const trimmed = jenisData.trim();
  for (const group of ADMIN_PROGRAM_GROUPS) {
    for (const item of group.items) {
      if (item.key === trimmed) return item.key;
    }
  }
  const lower = trimmed.toLowerCase();
  for (const group of ADMIN_PROGRAM_GROUPS) {
    for (const item of group.items) {
      if (item.title.toLowerCase() === lower || item.key.toLowerCase() === lower) {
        return item.key;
      }
    }
  }
  return null;
}

function normalizeProgramLpkValue(programTitle: string): string {
  const trimmed = programTitle.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase() === 'teknologi informasi') {
    return 'Teknologi Informasi';
  }
  return trimmed.toUpperCase();
}

interface HalamanAdminDashboardProps {
  accessToken?: string | null;
  onKembali: () => void;
  onLogout: () => void;
}

export function HalamanAdminDashboard({
  accessToken,
  onKembali,
  onLogout,
}: HalamanAdminDashboardProps) {
  const [records, setRecords] = useState<PemegangSertifikatRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'semua' | 'program'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [selectedProgram, setSelectedProgram] = useState<AdminProgramItem | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [formFoto, setFormFoto] = useState('');
  const [formFotoDataUrl, setFormFotoDataUrl] = useState<string | null>(null);
  const [formFotoMeta, setFormFotoMeta] = useState<{ name: string; type: string } | null>(null);
  const [formFotoSizeBytes, setFormFotoSizeBytes] = useState<number | null>(null);
  const [compressingFoto, setCompressingFoto] = useState(false);

  const [formNama, setFormNama] = useState('');
  const [formNik, setFormNik] = useState('');
  const [formProgramLpk, setFormProgramLpk] = useState('');
  const [formNoSertifikat, setFormNoSertifikat] = useState('');
  const [formNoRegister, setFormNoRegister] = useState('');
  const [formTanggalTerbit, setFormTanggalTerbit] = useState('2024-01-15');
  const [formTanggalBerakhir, setFormTanggalBerakhir] = useState('2027-01-15');
  const [formStatus, setFormStatus] = useState('VALID AKTIF');
  const [formEKartu, setFormEKartu] = useState('');
  const [formEKartuDataUrl, setFormEKartuDataUrl] = useState<string | null>(null);
  const [formEKartuMeta, setFormEKartuMeta] = useState<{ name: string; type: string } | null>(null);
  const [formEKartuSizeBytes, setFormEKartuSizeBytes] = useState<number | null>(null);
  const [compressingEKartu, setCompressingEKartu] = useState(false);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    let token = accessToken || '';
    if (!token) {
      const { data } = await supabaseClient.auth.getSession();
      token = data.session?.access_token || '';
    }
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [accessToken]);

  const parseErrorResponse = async (res: Response, fallbackContext: string): Promise<string> => {
    const rawText = await res.text().catch(() => '');
    let parsedError = '';
    if (rawText) {
      try {
        const json = JSON.parse(rawText) as { error?: string; message?: string };
        parsedError = json.error || json.message || '';
      } catch {
        parsedError = rawText.slice(0, 240).replace(/\s+/g, ' ').trim();
      }
    }
    const detail = parsedError || res.statusText || 'Tidak ada keterangan error dari server';
    return `Gagal [HTTP ${res.status}] (${fallbackContext}): ${detail}`;
  };

  const checkStorageStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/status', { headers });
      if (!res.ok) {
        const errMsg = await parseErrorResponse(res, 'cek status storage');
        setStorageWarning(errMsg);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as {
        bucketReady?: boolean;
        error?: string;
      };
      if (!json.bucketReady && json.error) {
        setStorageWarning(json.error);
      } else {
        setStorageWarning(null);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Network error';
      setStorageWarning(`Gagal: Tidak dapat memeriksa status server Supabase Admin (${detail}).`);
    }
  }, [getAuthHeaders]);

  const fetchAllRecords = useCallback(async () => {
    setLoadingData(true);
    setAdminError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/pemegang', {
        headers,
      });

      if (!res.ok) {
        const detailedError = await parseErrorResponse(res, 'GET /api/admin/pemegang');
        throw new Error(detailedError);
      }

      const json = (await res.json().catch(() => null)) as {
        data?: PemegangSertifikatRow[];
        error?: string;
      } | null;

      if (!json || !Array.isArray(json.data)) {
        throw new Error(
          json?.error ||
            'Gagal [Invalid JSON]: Server tidak mengembalikan array data_pemegang yang valid.'
        );
      }

      setRecords(json.data);
    } catch (err) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "Gagal membaca tabel 'data_pemegang' via server supabaseAdmin.";
      setAdminError(rawMsg.startsWith('Gagal') ? rawMsg : `Gagal: ${rawMsg}`);
    } finally {
      setLoadingData(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void checkStorageStatus();
    void fetchAllRecords();
  }, [checkStorageStatus, fetchAllRecords]);

  const dataByProgram: Record<string, PemegangSertifikatRow[]> = {};
  for (const row of records) {
    const resolvedKey =
      resolveProgramKeyFromJenis(row.jenis_data) ||
      resolveProgramKeyFromJenis(row.program_lpk) ||
      row.jenis_data ||
      'other';
    if (!dataByProgram[resolvedKey]) {
      dataByProgram[resolvedKey] = [];
    }
    dataByProgram[resolvedKey].push(row);
  }

  const resetFormState = (defaultProgram?: string) => {
    setEditingId(null);
    setFormFoto('');
    setFormFotoDataUrl(null);
    setFormFotoMeta(null);
    setFormFotoSizeBytes(null);
    setFormNama('');
    setFormNik('');
    setFormProgramLpk(defaultProgram || '');
    setFormNoSertifikat('');
    setFormNoRegister('');
    setFormTanggalTerbit('2024-01-15');
    setFormTanggalBerakhir('2027-01-15');
    setFormStatus('VALID AKTIF');
    setFormEKartu('');
    setFormEKartuDataUrl(null);
    setFormEKartuMeta(null);
    setFormEKartuSizeBytes(null);
    setModalError(null);
  };

  const openTambahModal = () => {
    const defaultProg = selectedProgram
      ? normalizeProgramLpkValue(selectedProgram.title)
      : filterProgram !== 'ALL'
        ? filterProgram
        : '';
    resetFormState(defaultProg);
    setFormOpen(true);
  };

  const openEditModal = (record: PemegangSertifikatRow) => {
    setEditingId(record.id);
    const currentPhoto = record.foto_url || record.url_foto || '';
    const currentExpiry = record.tanggal_berakhir || record.berlaku_sampai || '2027-01-15';
    setFormFoto(currentPhoto);
    setFormFotoDataUrl(null);
    setFormFotoMeta(null);
    setFormFotoSizeBytes(null);
    setFormNama(record.nama_pemegang || '');
    setFormNik(record.nik || '');
    setFormProgramLpk(
      record.program_lpk
        ? normalizeProgramLpkValue(record.program_lpk)
        : selectedProgram
          ? normalizeProgramLpkValue(selectedProgram.title)
          : ''
    );
    setFormNoSertifikat(record.no_sertifikat_bnsp || '');
    setFormNoRegister(record.no_register_bnsp || '');
    setFormTanggalTerbit(record.tanggal_terbit || '2024-01-15');
    setFormTanggalBerakhir(currentExpiry);
    setFormStatus(record.status_sertifikat || 'VALID AKTIF');
    setFormEKartu(record.url_e_kartu || '');
    setFormEKartuDataUrl(null);
    setFormEKartuMeta(null);
    setFormEKartuSizeBytes(null);
    setModalError(null);
    setFormOpen(true);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalError(null);
    if (!file.type.startsWith('image/')) {
      setModalError('Upload foto gagal: File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setModalError('Upload foto gagal: Ukuran file mentah maksimal 25 MB.');
      return;
    }
    setCompressingFoto(true);
    try {
      const compressed = await compressImageWithCanvas(file, {
        maxLongSide: 1200,
        minLongSide: 800,
        initialQuality: 0.82,
        minQuality: 0.75,
        targetMaxBytes: 800 * 1024,
      });
      setFormFoto(compressed.dataUrl);
      setFormFotoDataUrl(compressed.dataUrl);
      setFormFotoMeta({ name: compressed.fileName, type: compressed.contentType });
      setFormFotoSizeBytes(compressed.compressedBytes);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal memproses kompresi foto.');
    } finally {
      setCompressingFoto(false);
    }
  };

  const handleUploadEKartu = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModalError(null);
    if (!file.type.startsWith('image/')) {
      setModalError('Upload E-Kartu gagal: File harus berupa gambar.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setModalError('Upload E-Kartu gagal: Ukuran file mentah maksimal 25 MB.');
      return;
    }
    setCompressingEKartu(true);
    try {
      const compressed = await compressImageWithCanvas(file, {
        maxLongSide: 1600,
        minLongSide: 1000,
        initialQuality: 0.88,
        minQuality: 0.75,
        targetMaxBytes: 1200 * 1024,
      });
      setFormEKartu(compressed.dataUrl);
      setFormEKartuDataUrl(compressed.dataUrl);
      setFormEKartuMeta({ name: compressed.fileName, type: compressed.contentType });
      setFormEKartuSizeBytes(compressed.compressedBytes);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal memproses kompresi E-Kartu.');
    } finally {
      setCompressingEKartu(false);
    }
  };

  const handleGenerateAutoEKartu = async () => {
    setGeneratingCard(true);
    setModalError(null);
    try {
      const cleanedNama = formNama.trim().toUpperCase() || 'PEMEGANG SERTIFIKAT';
      const cleanedNik = formNik.trim() || '0000000000000000';
      const cleanedProgram =
        normalizeProgramLpkValue(formProgramLpk) ||
        (selectedProgram ? normalizeProgramLpkValue(selectedProgram.title) : 'PROGRAM SERTIFIKASI');
      const resolvedJenisData =
        resolveProgramKeyFromJenis(cleanedProgram) || selectedProgram?.key || null;

      const generated = await generateEKartuWithQR({
        nama_pemegang: cleanedNama,
        nik: cleanedNik,
        program_lpk: cleanedProgram,
        no_sertifikat_bnsp: formNoSertifikat.trim() || '-',
        no_register_bnsp: formNoRegister.trim() || '-',
        tanggal_terbit: formTanggalTerbit,
        berlaku_sampai: formTanggalBerakhir,
        status_sertifikat: formStatus,
        url_foto: formFoto,
        jenis_data: resolvedJenisData,
      });

      setFormEKartu(generated.dataUrl);
      setFormEKartuDataUrl(generated.dataUrl);
      setFormEKartuMeta({ name: `ekartu-${cleanedNik}.png`, type: 'image/png' });
      setFormEKartuSizeBytes(getDataUrlBinarySize(generated.dataUrl));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal generate E-Kartu otomatis.';
      setModalError(message);
    } finally {
      setGeneratingCard(false);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    setAdminError(null);
    setAdminNotice(null);

    try {
      const cleanedNama = formNama.trim().toUpperCase();
      const cleanedNik = formNik.trim();
      const cleanedProgram =
        normalizeProgramLpkValue(formProgramLpk) ||
        (selectedProgram ? normalizeProgramLpkValue(selectedProgram.title) : '');
      const cleanedNoSertifikat = formNoSertifikat.trim();
      const cleanedNoRegister = formNoRegister.trim();

      if (!cleanedNama || !cleanedNik || !cleanedProgram || !cleanedNoSertifikat || !cleanedNoRegister) {
        throw new Error('Semua kolom wajib diisi sebelum menyimpan data.');
      }

      // Validasi client-side duplikat NIK dalam 1 program_lpk yang sama (server juga memvalidasi ulang)
      const duplicateLocal = records.find(
        (r) =>
          String(r.id) !== String(editingId ?? '') &&
          (r.nik || '').trim() === cleanedNik &&
          (r.program_lpk || '').trim().toLowerCase() === cleanedProgram.toLowerCase()
      );
      if (duplicateLocal) {
        throw new Error(
          `NIK ${cleanedNik} sudah terdaftar pada program ${cleanedProgram}. NIK tidak boleh duplikat dalam 1 program_lpk yang sama.`
        );
      }

      const resolvedJenisData =
        cleanedProgram === 'Teknologi Informasi'
          ? 'pem-indonesia::Teknologi Informasi'
          : resolveProgramKeyFromJenis(cleanedProgram) || selectedProgram?.key || null;

      let eKartuPayloadDataUrl = formEKartuDataUrl;
      let eKartuPayloadMeta = formEKartuMeta;

      if (!eKartuPayloadDataUrl && !formEKartu.startsWith('http')) {
        try {
          const autoCard = await generateEKartuWithQR({
            nama_pemegang: cleanedNama,
            nik: cleanedNik,
            program_lpk: cleanedProgram,
            no_sertifikat_bnsp: cleanedNoSertifikat,
            no_register_bnsp: cleanedNoRegister,
            tanggal_terbit: formTanggalTerbit,
            berlaku_sampai: formTanggalBerakhir,
            status_sertifikat: formStatus,
            url_foto: formFoto,
            jenis_data: resolvedJenisData,
          });
          eKartuPayloadDataUrl = autoCard.dataUrl;
          eKartuPayloadMeta = { name: `ekartu-${cleanedNik}.png`, type: 'image/png' };
        } catch {
          // Lanjutkan simpan walau auto-generate E-Kartu gagal
        }
      }

      const totalBase64Bytes =
        (formFotoDataUrl ? formFotoDataUrl.length : 0) +
        (eKartuPayloadDataUrl ? eKartuPayloadDataUrl.length : 0);
      if (totalBase64Bytes > 3.5 * 1024 * 1024) {
        throw new Error('Foto terlalu besar, coba pilih foto yang lebih kecil');
      }

      const requestBody = {
        nama_pemegang: cleanedNama,
        nik: cleanedNik,
        program_lpk: cleanedProgram,
        no_sertifikat_bnsp: cleanedNoSertifikat,
        no_register_bnsp: cleanedNoRegister,
        tanggal_terbit: formTanggalTerbit,
        tanggal_berakhir: formTanggalBerakhir,
        berlaku_sampai: formTanggalBerakhir,
        status_sertifikat: formStatus,
        jenis_data: resolvedJenisData,
        foto_url: formFoto.startsWith('http') ? formFoto : null,
        url_e_kartu: formEKartu.startsWith('http') ? formEKartu : null,
        ...(formFotoDataUrl
          ? {
              fotoBase64: formFotoDataUrl,
              fotoFileName: formFotoMeta?.name || `foto-${cleanedNik}.png`,
              fotoContentType: formFotoMeta?.type || 'image/png',
            }
          : {}),
        ...(eKartuPayloadDataUrl
          ? {
              eKartuBase64: eKartuPayloadDataUrl,
              eKartuFileName: eKartuPayloadMeta?.name || `ekartu-${cleanedNik}.png`,
              eKartuContentType: eKartuPayloadMeta?.type || 'image/png',
            }
          : {}),
      };

      const isEdit = editingId !== null;
      const endpoint = isEdit ? `/api/admin/pemegang/${editingId}` : '/api/admin/pemegang';
      const method = isEdit ? 'PUT' : 'POST';

      const headers = await getAuthHeaders();
      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const detailedError = await parseErrorResponse(res, `${method} ${endpoint}`);
        throw new Error(detailedError);
      }

      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        data?: PemegangSertifikatRow;
        error?: string;
      };

      if (!json.data) {
        throw new Error(
          json.error || `Gagal [Invalid JSON]: Server tidak mengembalikan data tersimpan (${method} ${endpoint}).`
        );
      }

      const savedRow = json.data;
      if (isEdit) {
        setRecords((prev) => prev.map((r) => (r.id === editingId ? savedRow : r)));
        setAdminNotice(`Berhasil: Data ${cleanedNama} berhasil diperbarui.`);
      } else {
        setRecords((prev) => [savedRow, ...prev]);
        setAdminNotice(`Berhasil: Data ${cleanedNama} berhasil ditambahkan.`);
      }

      setStorageWarning(null);
      setFormOpen(false);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Gagal menyimpan data ke Supabase.';
      setModalError(
        rawMsg.startsWith('Gagal') || rawMsg.startsWith('Foto terlalu besar')
          ? rawMsg
          : `Gagal: ${rawMsg}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string | number) => {
    setDeletingId(id);
    setAdminError(null);
    setAdminNotice(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/pemegang/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const detailedError = await parseErrorResponse(res, `DELETE /api/admin/pemegang/${id}`);
        throw new Error(detailedError);
      }

      setRecords((prev) => prev.filter((row) => row.id !== id));
      setConfirmDeleteId(null);
      setAdminNotice('Berhasil: Data pemegang dan file foto berhasil dihapus.');
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Gagal menghapus data di Supabase.';
      setAdminError(rawMsg.startsWith('Gagal') ? rawMsg : `Gagal: ${rawMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const allProgramOptions = ADMIN_PROGRAM_GROUPS.flatMap((g) =>
    g.items.map((item) => ({
      key: item.key,
      lembaga: g.lembaga,
      title: item.title,
      value: normalizeProgramLpkValue(item.title),
    }))
  );

  const visibleRecords = (() => {
    let base = selectedProgram ? dataByProgram[selectedProgram.key] ?? [] : records;
    if (!selectedProgram && filterProgram !== 'ALL') {
      base = base.filter(
        (r) => (r.program_lpk || '').trim().toLowerCase() === filterProgram.toLowerCase()
      );
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (r) =>
          (r.nama_pemegang || '').toLowerCase().includes(q) ||
          (r.nik || '').toLowerCase().includes(q) ||
          (r.no_sertifikat_bnsp || '').toLowerCase().includes(q) ||
          (r.no_register_bnsp || '').toLowerCase().includes(q) ||
          (r.program_lpk || '').toLowerCase().includes(q)
      );
    }
    return base;
  })();

  const renderDataTable = (rows: PemegangSertifikatRow[]) => (
    <div className="rounded-[16px] border border-slate-800 bg-[#111827] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[740px]">
          <thead>
            <tr className="bg-[#182132] border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-[0.06em] text-slate-400">
              <th className="py-2.5 px-3">Foto</th>
              <th className="py-2.5 px-2.5">Nama / NIK</th>
              <th className="py-2.5 px-2.5">Program &amp; BNSP</th>
              <th className="py-2.5 px-2.5">Terbit &amp; Berakhir</th>
              <th className="py-2.5 px-2.5">Status</th>
              <th className="py-2.5 px-2.5">E-Kartu</th>
              <th className="py-2.5 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-[12px]">
            {loadingData ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-slate-400">
                  Memuat data dari Supabase...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                  Belum ada data di Supabase. Klik tombol + TAMBAH untuk menambahkan data.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const fotoSrc = row.foto_url || row.url_foto;
                const expiryVal = row.tanggal_berakhir || row.berlaku_sampai;
                return (
                  <tr key={row.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 align-middle">
                      {fotoSrc ? (
                        <img
                          src={fotoSrc}
                          alt={row.nama_pemegang || 'Foto'}
                          className="w-10 h-12 rounded-[8px] object-cover border border-amber-500/60"
                        />
                      ) : (
                        <div className="w-10 h-12 rounded-[8px] bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">
                          FOTO
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2.5 align-middle">
                      <div className="font-bold text-white leading-tight">
                        {row.nama_pemegang || '-'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {row.nik || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-2.5 align-middle">
                      <div className="text-[11px] font-bold text-slate-200 leading-tight">
                        {row.program_lpk || '-'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {row.no_sertifikat_bnsp || '-'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {row.no_register_bnsp || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-2.5 align-middle text-[10.5px] text-slate-300 font-mono">
                      <div>Terbit: {row.tanggal_terbit || '-'}</div>
                      <div className="text-slate-400">Exp: {expiryVal || '-'}</div>
                    </td>
                    <td className="py-3 px-2.5 align-middle">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-[0.04em] ${
                          (row.status_sertifikat || 'VALID AKTIF').toUpperCase() === 'VALID AKTIF'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {row.status_sertifikat || 'VALID AKTIF'}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 align-middle">
                      {row.url_e_kartu ? (
                        <img
                          src={row.url_e_kartu}
                          alt={`E-Kartu ${row.nama_pemegang || ''}`}
                          className="w-16 h-10 rounded-[6px] object-cover border border-amber-500/60"
                        />
                      ) : (
                        <div className="w-16 h-10 rounded-[6px] bg-slate-800 border border-slate-700 flex items-center justify-center text-[8.5px] font-bold text-slate-400">
                          E-KARTU
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 align-middle text-right">
                      {confirmDeleteId === row.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === row.id}
                            onClick={() => void handleDeleteRecord(row.id)}
                            className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-white cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === row.id ? '...' : 'YA, HAPUS'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg bg-slate-700 px-2 py-1.5 text-[10px] font-bold uppercase text-slate-200 cursor-pointer"
                          >
                            BATAL
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-amber-300 cursor-pointer active:scale-95 transition-transform"
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(row.id)}
                            className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-rose-300 cursor-pointer active:scale-95 transition-transform"
                          >
                            HAPUS
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#05070B] flex justify-center font-sans antialiased text-slate-100">
      {/* Mobile-only locked container (max-width: 430px) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#0B0F17] border-x border-slate-800/80 flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-x-hidden">
        {/* Top Dark Admin Header */}
        <header className="sticky top-0 z-30 bg-[#111827] border-b border-slate-800 px-3.5 py-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-400">
                SUPER ADMIN • LIVE API
              </span>
            </div>
            <h1 className="text-[18px] font-black tracking-[0.06em] uppercase text-white leading-tight">
              ROOT GATE
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onKembali}
              className="rounded-[10px] bg-slate-800 border border-slate-700 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.04em] text-slate-200 cursor-pointer active:scale-95 transition-transform"
            >
              KEMBALI
            </button>
            <button
              type="button"
              onClick={() => {
                void supabaseClient.auth.signOut().finally(() => {
                  onLogout();
                });
              }}
              className="rounded-[10px] bg-rose-600/90 border border-rose-500/60 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.04em] text-white cursor-pointer active:scale-95 transition-transform"
            >
              LOGOUT
            </button>
          </div>
        </header>

        <main className="flex-1 px-3.5 py-4 space-y-3.5">
          {storageWarning && (
            <div className="rounded-[12px] bg-amber-950/80 border border-amber-600/70 px-3.5 py-2.5 text-[12px] text-amber-200">
              <span className="font-extrabold uppercase tracking-[0.04em] block text-amber-300 text-[10.5px] mb-0.5">
                PERHATIAN KONFIGURASI STORAGE
              </span>
              {storageWarning}
            </div>
          )}

          {adminError && (
            <div
              role="alert"
              className="rounded-[12px] bg-rose-950/85 border border-rose-600/80 px-3.5 py-3 text-[12px] text-rose-100 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-rose-300">
                  ERROR OPERASI SUPABASE ADMIN
                </span>
                <button
                  type="button"
                  onClick={() => void fetchAllRecords()}
                  disabled={loadingData}
                  className="rounded-md bg-rose-600/80 hover:bg-rose-600 px-2.5 py-1 text-[10px] font-extrabold uppercase text-white cursor-pointer disabled:opacity-50"
                >
                  {loadingData ? 'MEMUAT...' : 'COBA LAGI'}
                </button>
              </div>
              <p className="whitespace-pre-wrap break-words leading-relaxed text-rose-200">
                {adminError}
              </p>
            </div>
          )}

          {adminNotice && (
            <div className="rounded-[12px] bg-emerald-950/80 border border-emerald-500/60 px-3.5 py-2.5 text-[12px] font-bold text-emerald-200 flex items-center justify-between gap-2">
              <span>{adminNotice}</span>
              <button
                type="button"
                onClick={() => setAdminNotice(null)}
                className="text-emerald-300 hover:text-white text-[12px] cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                ✕
              </button>
            </div>
          )}

          {!selectedProgram && (
            <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-[#111827] border border-slate-800 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('semua')}
                className={`rounded-[10px] py-2 text-[11.5px] font-extrabold uppercase tracking-[0.04em] transition-colors cursor-pointer ${
                  activeTab === 'semua'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DATA PEMEGANG ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('program')}
                className={`rounded-[10px] py-2 text-[11.5px] font-extrabold uppercase tracking-[0.04em] transition-colors cursor-pointer ${
                  activeTab === 'program'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PER SKEMA / LPK
              </button>
            </div>
          )}

          {!selectedProgram && activeTab === 'semua' ? (
            <div className="space-y-3.5">
              {/* Top Action & Filter Card */}
              <div className="rounded-[16px] bg-[#111827] border border-slate-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-400">
                      TABEL LIVE: data_pemegang
                    </div>
                    <h2 className="text-[15px] font-extrabold text-white leading-snug">
                      Kelola Semua Pemegang Sertifikat
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        void checkStorageStatus();
                        void fetchAllRecords();
                      }}
                      disabled={loadingData}
                      className="rounded-[10px] bg-slate-800 border border-slate-700 px-2.5 py-2 text-[10.5px] font-bold uppercase text-amber-400 cursor-pointer disabled:opacity-50"
                    >
                      {loadingData ? '...' : 'SYNC'}
                    </button>
                    <button
                      type="button"
                      onClick={openTambahModal}
                      className="rounded-[10px] bg-emerald-500 border-b-[3px] border-b-emerald-700 px-3.5 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.05em] text-slate-950 cursor-pointer active:translate-y-[1px] transition-all"
                    >
                      + TAMBAH
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIK, no sertifikat, atau register..."
                    className="w-full rounded-[10px] bg-[#161E2E] border border-slate-700 px-3 py-2 text-[12.5px] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={filterProgram}
                    onChange={(e) => setFilterProgram(e.target.value)}
                    className="w-full rounded-[10px] bg-[#161E2E] border border-slate-700 px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">Semua Program LPK ({records.length} data)</option>
                    {allProgramOptions.map((opt) => (
                      <option key={opt.key} value={opt.value}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {renderDataTable(visibleRecords)}
            </div>
          ) : !selectedProgram ? (
            <div className="space-y-5">
              <div className="rounded-[16px] bg-[#111827] border border-slate-800 p-4 flex items-center justify-between gap-3">
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  Pilih skema/program untuk kelola data pemegang per lembaga.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void checkStorageStatus();
                    void fetchAllRecords();
                  }}
                  disabled={loadingData}
                  className="shrink-0 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10.5px] font-bold uppercase text-amber-400 cursor-pointer disabled:opacity-50"
                >
                  {loadingData ? '...' : 'REFRESH'}
                </button>
              </div>

              {ADMIN_PROGRAM_GROUPS.map((group) => (
                <section key={group.lembaga} className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-amber-400">
                      {group.lembaga}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500">
                      {group.items.length} Skema
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const count = (dataByProgram[item.key] ?? []).length;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setAdminNotice(null);
                            setAdminError(null);
                            setSelectedProgram(item);
                          }}
                          className="w-full rounded-[14px] bg-[#131A26] hover:bg-[#192233] border border-slate-800 px-3.5 py-3 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-slate-100 leading-snug">
                              Kelola Data {item.title}
                            </div>
                            <div className="text-[10.5px] text-slate-400 mt-0.5">
                              {loadingData ? 'Memuat...' : `${count} data pemegang`}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-emerald-400">
                            KELOLA
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Program Table Header Controls */}
              <div className="rounded-[16px] bg-[#111827] border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteId(null);
                      setSelectedProgram(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-amber-400 cursor-pointer"
                  >
                    <span>←</span>
                    <span>Semua Jenis Sertifikat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void fetchAllRecords()}
                    disabled={loadingData}
                    className="text-[10.5px] font-bold uppercase text-slate-400 hover:text-white cursor-pointer"
                  >
                    {loadingData ? 'MEMUAT...' : 'SYNC'}
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">
                      {selectedProgram.lembaga}
                    </div>
                    <h2 className="text-[16px] font-extrabold text-white leading-snug mt-0.5">
                      Kelola Data {selectedProgram.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={openTambahModal}
                    className="shrink-0 rounded-[10px] bg-emerald-500 border-b-[3px] border-b-emerald-700 px-3.5 py-2 text-[11.5px] font-extrabold uppercase tracking-[0.05em] text-slate-950 cursor-pointer active:translate-y-[1px] transition-all"
                  >
                    + TAMBAH
                  </button>
                </div>
              </div>

              {renderDataTable(visibleRecords)}
            </div>
          )}
        </main>

        {/* Modal Form TAMBAH / EDIT */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
            <div className="w-full max-w-[390px] max-h-[90vh] overflow-y-auto rounded-[20px] bg-[#111827] border border-slate-700 p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-[#111827] z-10">
                <h3 className="text-[15px] font-extrabold uppercase tracking-[0.04em] text-white">
                  {editingId !== null ? 'Edit Data Pemegang' : 'Tambah Data Pemegang'}
                </h3>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  aria-label="Tutup form"
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="mt-4 space-y-3.5">
                {modalError && (
                  <div className="rounded-[10px] bg-rose-950/85 border border-rose-600/80 px-3 py-2.5 text-[11.5px] font-semibold text-rose-200">
                    {modalError}
                  </div>
                )}

                {/* 1. UPLOAD FOTO */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    UPLOAD FOTO (BUCKET: files)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleUploadFoto(e)}
                    className="w-full text-[11.5px] text-slate-300 file:mr-2.5 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-white hover:file:bg-slate-600 cursor-pointer"
                  />
                  <div className="mt-2 flex items-center gap-3">
                    {formFoto ? (
                      <img
                        src={formFoto}
                        alt="Preview Foto"
                        className="w-[74px] h-[92px] rounded-[10px] object-cover border-[1.5px] border-amber-400"
                      />
                    ) : (
                      <div className="w-[74px] h-[92px] rounded-[10px] bg-slate-800 border border-slate-700 flex items-center justify-center text-[9.5px] font-bold text-slate-400">
                        NO FOTO
                      </div>
                    )}
                    {editingId !== null && formFotoDataUrl && (
                      <span className="text-[10.5px] text-amber-300 leading-snug">
                        Foto lama di bucket akan otomatis dihapus dan diganti foto baru saat disimpan.
                      </span>
                    )}
                  </div>
                  {compressingFoto && (
                    <div className="mt-1.5 text-[11px] font-semibold text-amber-300">
                      Mengompres foto di browser...
                    </div>
                  )}
                  {!compressingFoto && formFotoSizeBytes !== null && (
                    <div className="mt-1.5 text-[11px] font-semibold text-emerald-300">
                      Ukuran setelah kompres: {formatReadableFileSize(formFotoSizeBytes)}
                    </div>
                  )}
                </div>

                {/* 2. NAMA PEMEGANG */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    NAMA PEMEGANG
                  </label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: BUDI SANTOSO"
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. NIK */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    NIK
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={formNik}
                    onChange={(e) => setFormNik(e.target.value)}
                    placeholder="Contoh: 731103300172"
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 4. PROGRAM / JURUSAN (PROGRAM LPK) */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    PROGRAM LPK / JURUSAN
                  </label>
                  <select
                    required
                    value={formProgramLpk}
                    onChange={(e) => setFormProgramLpk(e.target.value)}
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="" disabled>
                      Pilih Program / Jurusan
                    </option>
                    {formProgramLpk &&
                      !ADMIN_PROGRAM_GROUPS.some((group) =>
                        group.items.some(
                          (item) => normalizeProgramLpkValue(item.title) === formProgramLpk
                        )
                      ) && <option value={formProgramLpk}>{formProgramLpk}</option>}
                    {ADMIN_PROGRAM_GROUPS.map((group) => (
                      <optgroup key={group.lembaga} label={group.lembaga}>
                        {group.items.map((item) => (
                          <option
                            key={item.key}
                            value={normalizeProgramLpkValue(item.title)}
                          >
                            {item.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* 5. NO SERTIFIKAT BNSP */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    NO SERTIFIKAT BNSP
                  </label>
                  <input
                    type="text"
                    required
                    value={formNoSertifikat}
                    onChange={(e) => setFormNoSertifikat(e.target.value)}
                    placeholder="Contoh: 78429.8113.0006812"
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 6. NO REGISTER BNSP */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    NO REGISTER BNSP
                  </label>
                  <input
                    type="text"
                    required
                    value={formNoRegister}
                    onChange={(e) => setFormNoRegister(e.target.value)}
                    placeholder="Contoh: F.2023.0006871"
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 7. TANGGAL TERBIT */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    TANGGAL TERBIT
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggalTerbit}
                    onChange={(e) => setFormTanggalTerbit(e.target.value)}
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                  />
                </div>

                {/* 8. TANGGAL BERAKHIR */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    TANGGAL BERAKHIR (BERLAKU SAMPAI)
                  </label>
                  <input
                    type="date"
                    required
                    value={formTanggalBerakhir}
                    onChange={(e) => setFormTanggalBerakhir(e.target.value)}
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
                  />
                </div>

                {/* 9. STATUS SERTIFIKAT */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34] mb-1.5">
                    STATUS SERTIFIKAT
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-[10px] bg-[#1A2234] border border-slate-700 px-3 py-2.5 text-[13.5px] text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VALID AKTIF">VALID AKTIF</option>
                    <option value="TIDAK AKTIF">TIDAK AKTIF</option>
                  </select>
                </div>

                {/* 10. UPLOAD E-KARTU LSP BNSP */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-[0.05em] text-[#D92D34]">
                      UPLOAD E-KARTU LSP BNSP
                    </label>
                    <button
                      type="button"
                      disabled={generatingCard}
                      onClick={() => void handleGenerateAutoEKartu()}
                      className="rounded-md bg-amber-500/20 border border-amber-400/50 px-2 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.04em] text-amber-300 cursor-pointer hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      {generatingCard ? 'MEMBUAT...' : '⚡ AUTO GENERATE + QR'}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleUploadEKartu(e)}
                    className="w-full text-[11.5px] text-slate-300 file:mr-2.5 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-white hover:file:bg-slate-600 cursor-pointer"
                  />
                  <div className="mt-2">
                    {formEKartu ? (
                      <img
                        src={formEKartu}
                        alt="Preview E-Kartu"
                        className="w-full h-auto rounded-[12px] object-contain border-[1.5px] border-amber-400 bg-[#1B2029]"
                      />
                    ) : (
                      <div className="w-full h-[90px] rounded-[12px] bg-slate-800/80 border border-dashed border-slate-700 px-3 text-center flex items-center justify-center text-[10.5px] font-bold text-slate-400">
                        KOSONG = OTOMATIS DIGENERATE DENGAN QR SAAT SIMPAN
                      </div>
                    )}
                  </div>
                  {compressingEKartu && (
                    <div className="mt-1.5 text-[11px] font-semibold text-amber-300">
                      Mengompres E-Kartu di browser...
                    </div>
                  )}
                  {!compressingEKartu && formEKartuSizeBytes !== null && (
                    <div className="mt-1.5 text-[11px] font-semibold text-emerald-300">
                      Ukuran setelah kompres: {formatReadableFileSize(formEKartuSizeBytes)}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setFormOpen(false)}
                    className="flex-1 rounded-[10px] bg-slate-800 border border-slate-700 py-2.5 text-[12px] font-bold uppercase text-slate-300 cursor-pointer disabled:opacity-50"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    disabled={saving || compressingFoto || compressingEKartu}
                    className="flex-1 rounded-[10px] bg-emerald-500 border-b-[3px] border-b-emerald-700 py-2.5 text-[12px] font-extrabold uppercase text-slate-950 cursor-pointer disabled:opacity-60"
                  >
                    {saving ? 'MENYIMPAN...' : 'SIMPAN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { HalamanAdminDashboard as AdminDashboard };

export default function App() {
  const initialQuery = (() => {
    if (typeof window === 'undefined') {
      return { nik: '', jenis: '' };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      nik: params.get('nik') || '',
      jenis: params.get('jenis') || '',
    };
  })();

  const [page, setPage] = useState<'beranda' | 'sebelum' | 'sesudah' | 'verifikasi' | 'admin'>(
    initialQuery.nik ? 'verifikasi' : 'beranda'
  );
  const [judulVerifikasi, setJudulVerifikasi] = useState(() => {
    if (initialQuery.jenis) {
      const titlePart = initialQuery.jenis.split('::')[1] || initialQuery.jenis;
      return `Pemegang Sertifikat ${titlePart}`;
    }
    return 'Pemegang Sertifikat Operasi Scaffolding LSP PEM INDONESIA';
  });
  const [jenisDataVerifikasi, setJenisDataVerifikasi] = useState<string | undefined>(
    initialQuery.jenis || undefined
  );
  const [initialNikVerifikasi] = useState(initialQuery.nik);
  const [adminAccessToken, setAdminAccessToken] = useState<string | null>(null);

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
        onVerifikasi={(judul, jenisData) => {
          setJudulVerifikasi(judul);
          setJenisDataVerifikasi(jenisData);
          setPage('verifikasi');
        }}
        onAdminLoginSuccess={(token) => {
          setAdminAccessToken(token);
          setPage('admin');
        }}
      />
    );
  }

  if (page === 'verifikasi') {
    return (
      <HalamanVerifikasi
        judul={judulVerifikasi}
        jenisData={jenisDataVerifikasi}
        initialNik={initialNikVerifikasi}
        onBack={() => setPage('sesudah')}
      />
    );
  }

  if (page === 'admin') {
    return (
      <HalamanAdminDashboard
        accessToken={adminAccessToken}
        onKembali={() => setPage('sesudah')}
        onLogout={() => {
          setAdminAccessToken(null);
          setPage('sesudah');
        }}
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
