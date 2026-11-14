import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config();
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
}

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const BUCKET_NAME = 'files';
const SERVICE_KEY_ERROR_MSG = 'Gagal. Cek Service Role Key di .env';

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

interface TableSchemaSupport {
  hasTanggalBerakhir: boolean;
  hasBerlakuSampai: boolean;
  hasFotoUrl: boolean;
  hasUrlFoto: boolean;
  hasUrlEKartu: boolean;
  hasStatusSertifikat: boolean;
  hasJenisData: boolean;
  hasCreatedAt: boolean;
  detectedAt: number;
}

interface RawPemegangRow {
  id: string | number;
  nama_pemegang?: string | null;
  nik?: string | null;
  program_lpk?: string | null;
  no_sertifikat_bnsp?: string | null;
  no_register_bnsp?: string | null;
  tanggal_terbit?: string | null;
  tanggal_berakhir?: string | null;
  berlaku_sampai?: string | null;
  foto_url?: string | null;
  url_foto?: string | null;
  url_e_kartu?: string | null;
  status_sertifikat?: string | null;
  jenis_data?: string | null;
  created_at?: string | null;
}

interface NormalizedPemegangRow {
  id: string | number;
  nama_pemegang: string | null;
  nik: string | null;
  program_lpk: string | null;
  no_sertifikat_bnsp: string | null;
  no_register_bnsp: string | null;
  tanggal_terbit: string | null;
  tanggal_berakhir: string | null;
  berlaku_sampai: string | null;
  foto_url: string | null;
  url_foto: string | null;
  url_e_kartu: string | null;
  status_sertifikat: string | null;
  jenis_data: string | null;
  created_at: string | null;
}

let cachedSchema: TableSchemaSupport | null = null;

function getSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://neptkinlbxcrdwxoikyg.supabase.co'
  ).trim();
}

function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim();
}

function getAnonKey(): string {
  return (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'sb_publishable_4iOdbJUqzRZ-mVSALQwlAw_Oe5LLU1d'
  ).trim();
}

function getSupabaseAnonClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(
      500,
      `${SERVICE_KEY_ERROR_MSG} — Variabel environment ${
        !supabaseUrl ? 'SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY'
      } kosong atau belum disetel di server.`
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isServiceKeyOrPermissionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybeErr = err as { message?: string; status?: number; statusCode?: number; code?: string };
  const status = maybeErr.status ?? maybeErr.statusCode;
  if (status === 401 || status === 403) return true;
  const msg = (maybeErr.message || '').toLowerCase();
  return (
    msg.includes('jwt') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('permission') ||
    msg.includes('row-level security') ||
    msg.includes('violates row-level') ||
    msg.includes('rls') ||
    msg.includes('not allowed') ||
    msg.includes('invalid signature') ||
    msg.includes('compact jws') ||
    msg.includes('service_role') ||
    msg.includes('apikey')
  );
}

interface SupabaseLikeError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
  statusCode?: number;
}

function formatSupabaseDetailedError(context: string, err: unknown): string {
  if (!err || typeof err !== 'object') {
    return `${context}: ${String(err || 'Unknown error')}`;
  }
  const e = err as SupabaseLikeError;
  const parts: string[] = [];
  if (e.code) parts.push(`code: ${e.code}`);
  if (e.status ?? e.statusCode) parts.push(`status: ${e.status ?? e.statusCode}`);
  const meta = parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  const msg = e.message || 'Unknown Supabase error';
  const extra = [e.details ? `Detail: ${e.details}` : '', e.hint ? `Hint: ${e.hint}` : '']
    .filter(Boolean)
    .join(' | ');
  const prefix = isServiceKeyOrPermissionError(err) ? `${SERVICE_KEY_ERROR_MSG} — ` : '';
  return `${prefix}${context}${meta}: ${msg}${extra ? ` (${extra})` : ''}`;
}

export async function getData(supabaseAdmin: SupabaseClient): Promise<NormalizedPemegangRow[]> {
  const PAGE_SIZE = 1000;
  const allRows: RawPemegangRow[] = [];
  let useOrderById = true;
  let from = 0;

  while (true) {
    let query = supabaseAdmin.from('data_pemegang').select('*').range(from, from + PAGE_SIZE - 1);
    if (useOrderById) {
      query = query.order('id', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      // Fallback jika kolom id tidak tersedia atau gagal di-order
      if (useOrderById && from === 0 && (error.code === '42703' || (error.message || '').toLowerCase().includes('order'))) {
        useOrderById = false;
        continue;
      }

      const status = isServiceKeyOrPermissionError(error) ? 403 : 500;
      throw new HttpError(
        status,
        formatSupabaseDetailedError("Gagal membaca tabel 'data_pemegang' via supabaseAdmin", error)
      );
    }

    const batch = (data as RawPemegangRow[] | null) ?? [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return allRows.map(normalizeRow);
}

function normalizeRow(row: RawPemegangRow): NormalizedPemegangRow {
  const expiry = row.tanggal_berakhir ?? row.berlaku_sampai ?? null;
  const photo = row.foto_url ?? row.url_foto ?? null;
  return {
    id: row.id,
    nama_pemegang: row.nama_pemegang ?? null,
    nik: row.nik ?? null,
    program_lpk: row.program_lpk ?? null,
    no_sertifikat_bnsp: row.no_sertifikat_bnsp ?? null,
    no_register_bnsp: row.no_register_bnsp ?? null,
    tanggal_terbit: row.tanggal_terbit ?? null,
    tanggal_berakhir: expiry,
    berlaku_sampai: expiry,
    foto_url: photo,
    url_foto: photo,
    url_e_kartu: row.url_e_kartu ?? null,
    status_sertifikat: row.status_sertifikat ?? 'VALID AKTIF',
    jenis_data: row.jenis_data ?? null,
    created_at: row.created_at ?? null,
  };
}

async function detectTableSchema(supabaseAdmin: SupabaseClient, forceRefresh = false): Promise<TableSchemaSupport> {
  if (!forceRefresh && cachedSchema && Date.now() - cachedSchema.detectedAt < 5 * 60 * 1000) {
    return cachedSchema;
  }

  const probeCol = async (col: string): Promise<boolean> => {
    const { error } = await supabaseAdmin.from('data_pemegang').select(col).limit(1);
    if (!error) return true;
    if (isServiceKeyOrPermissionError(error)) {
      throw new HttpError(
        403,
        formatSupabaseDetailedError(`Gagal mengecek kolom '${col}' di tabel 'data_pemegang'`, error)
      );
    }
    return false;
  };

  const [
    hasTanggalBerakhir,
    hasBerlakuSampai,
    hasFotoUrl,
    hasUrlFoto,
    hasUrlEKartu,
    hasStatusSertifikat,
    hasJenisData,
    hasCreatedAt,
  ] = await Promise.all([
    probeCol('tanggal_berakhir'),
    probeCol('berlaku_sampai'),
    probeCol('foto_url'),
    probeCol('url_foto'),
    probeCol('url_e_kartu'),
    probeCol('status_sertifikat'),
    probeCol('jenis_data'),
    probeCol('created_at'),
  ]);

  cachedSchema = {
    hasTanggalBerakhir,
    hasBerlakuSampai,
    hasFotoUrl,
    hasUrlFoto,
    hasUrlEKartu,
    hasStatusSertifikat,
    hasJenisData,
    hasCreatedAt,
    detectedAt: Date.now(),
  };

  return cachedSchema;
}

async function ensureFilesBucket(supabaseAdmin: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

  if (listError) {
    const status = isServiceKeyOrPermissionError(listError) ? 403 : 500;
    throw new HttpError(status, formatSupabaseDetailedError(`Gagal memeriksa bucket '${BUCKET_NAME}'`, listError));
  }

  const existing = (buckets ?? []).find(
    (b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME
  );

  if (!existing) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
    });

    if (createError) {
      const msg = (createError.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        return;
      }
      const status = isServiceKeyOrPermissionError(createError) ? 403 : 500;
      throw new HttpError(status, formatSupabaseDetailedError(`Gagal membuat bucket '${BUCKET_NAME}'`, createError));
    }
  } else if (existing.public === false) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET_NAME, {
      public: true,
    });
    if (updateError && isServiceKeyOrPermissionError(updateError)) {
      throw new HttpError(403, formatSupabaseDetailedError(`Gagal mengubah bucket '${BUCKET_NAME}' menjadi public`, updateError));
    }
  }
}

function parseBase64Upload(
  dataUrlOrBase64: string,
  fileName?: string,
  contentTypeHint?: string
): { buffer: Buffer; contentType: string; ext: string } {
  let contentType = (contentTypeHint || 'image/png').trim();
  let base64Payload = dataUrlOrBase64.trim();

  const dataUrlMatch = base64Payload.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    contentType = dataUrlMatch[1];
    base64Payload = dataUrlMatch[2];
  }

  const buffer = Buffer.from(base64Payload, 'base64');
  if (!buffer.length) {
    throw new HttpError(400, 'File gambar kosong atau tidak valid.');
  }
  if (buffer.length > 8 * 1024 * 1024) {
    throw new HttpError(400, 'Ukuran file terlalu besar. Maksimal 8 MB.');
  }

  let ext = 'png';
  if (fileName && fileName.includes('.')) {
    const rawExt = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (rawExt) ext = rawExt;
  } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
    ext = 'jpg';
  } else if (contentType.includes('webp')) {
    ext = 'webp';
  }

  return { buffer, contentType, ext };
}

async function uploadToFilesBucket(
  supabaseAdmin: SupabaseClient,
  folder: 'foto' | 'ekartu',
  identifier: string,
  dataUrlOrBase64: string,
  fileName?: string,
  contentTypeHint?: string
): Promise<{ publicUrl: string; storagePath: string }> {
  await ensureFilesBucket(supabaseAdmin);

  const { buffer, contentType, ext } = parseBase64Upload(
    dataUrlOrBase64,
    fileName,
    contentTypeHint
  );

  const safeId = identifier.replace(/[^a-zA-Z0-9_-]/g, '') || 'pemegang';
  const storagePath = `${folder}/${safeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      upsert: true,
      contentType,
    });

  if (uploadError) {
    const status = isServiceKeyOrPermissionError(uploadError) ? 403 : 500;
    throw new HttpError(status, formatSupabaseDetailedError(`Upload ke bucket '${BUCKET_NAME}' gagal`, uploadError));
  }

  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  if (!data?.publicUrl) {
    throw new HttpError(500, `Gagal mendapatkan public URL dari bucket '${BUCKET_NAME}'.`);
  }

  return { publicUrl: data.publicUrl, storagePath };
}

function extractStoragePathFromPublicUrl(url?: string | null): string | null {
  if (!url || !url.startsWith('http')) return null;
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + marker.length).split('?')[0];
  if (!rawPath) return null;
  try {
    return decodeURIComponent(rawPath);
  } catch {
    return rawPath;
  }
}

async function removeStorageFilesByUrls(
  supabaseAdmin: SupabaseClient,
  urls: Array<string | null | undefined>
): Promise<void> {
  const paths = urls
    .map((u) => extractStoragePathFromPublicUrl(u))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove(paths);
  if (error) {
    const status = isServiceKeyOrPermissionError(error) ? 403 : 500;
    throw new HttpError(status, formatSupabaseDetailedError(`Gagal menghapus file di bucket '${BUCKET_NAME}'`, error));
  }
}

async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({
      error: 'Gagal: Token sesi admin tidak ditemukan pada header Authorization. Silakan login kembali.',
    });
    return;
  }

  try {
    const authClient = getServiceRoleKey() ? getSupabaseAdminClient() : getSupabaseAnonClient();
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data?.user) {
      if (error && isServiceKeyOrPermissionError(error) && getServiceRoleKey()) {
        res.status(403).json({
          error: formatSupabaseDetailedError('Verifikasi sesi admin di server gagal', error),
        });
        return;
      }
      res.status(401).json({
        error: `Gagal: Sesi admin tidak valid atau telah berakhir (${error?.message || 'user tidak ditemukan'}). Silakan login kembali.`,
      });
      return;
    }

    const email = (data.user.email || '').toLowerCase();
    if (email !== 'admin@lpk.local') {
      res.status(403).json({
        error: `Gagal: Akun (${email || 'tanpa email'}) tidak memiliki akses Super Admin.`,
      });
      return;
    }

    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal memverifikasi sesi admin.';
    res.status(500).json({ error: `Gagal: ${message}` });
  }
}

function buildDbWritePayload(
  schema: TableSchemaSupport,
  fields: {
    nama_pemegang: string;
    nik: string;
    program_lpk: string;
    no_sertifikat_bnsp: string;
    no_register_bnsp: string;
    tanggal_terbit: string;
    tanggal_berakhir: string;
    status_sertifikat: string;
    jenis_data: string | null;
    foto_url: string | null;
    url_e_kartu: string | null;
  }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    nama_pemegang: fields.nama_pemegang,
    nik: fields.nik,
    program_lpk: fields.program_lpk,
    no_sertifikat_bnsp: fields.no_sertifikat_bnsp,
    no_register_bnsp: fields.no_register_bnsp,
    tanggal_terbit: fields.tanggal_terbit,
  };

  if (schema.hasTanggalBerakhir) {
    payload.tanggal_berakhir = fields.tanggal_berakhir;
  }
  if (schema.hasBerlakuSampai) {
    payload.berlaku_sampai = fields.tanggal_berakhir;
  }
  if (!schema.hasTanggalBerakhir && !schema.hasBerlakuSampai) {
    payload.tanggal_berakhir = fields.tanggal_berakhir;
  }

  if (schema.hasFotoUrl) {
    payload.foto_url = fields.foto_url;
  }
  if (schema.hasUrlFoto) {
    payload.url_foto = fields.foto_url;
  }
  if (!schema.hasFotoUrl && !schema.hasUrlFoto) {
    payload.foto_url = fields.foto_url;
  }

  if (schema.hasStatusSertifikat) {
    payload.status_sertifikat = fields.status_sertifikat;
  }
  if (schema.hasJenisData && fields.jenis_data) {
    payload.jenis_data = fields.jenis_data;
  }
  if (schema.hasUrlEKartu) {
    payload.url_e_kartu = fields.url_e_kartu;
  }

  return payload;
}

async function checkDuplicateNikInProgram(
  supabaseAdmin: SupabaseClient,
  nik: string,
  programLpk: string,
  excludeId?: string | number
): Promise<void> {
  let query = supabaseAdmin
    .from('data_pemegang')
    .select('id, nik, program_lpk')
    .eq('nik', nik)
    .ilike('program_lpk', programLpk);

  if (excludeId !== undefined && excludeId !== null && String(excludeId).trim() !== '') {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    const status = isServiceKeyOrPermissionError(error) ? 403 : 500;
    throw new HttpError(status, formatSupabaseDetailedError('Gagal memvalidasi NIK di tabel data_pemegang', error));
  }

  if (data && data.length > 0) {
    throw new HttpError(
      409,
      `NIK ${nik} sudah terdaftar pada program ${programLpk}. NIK tidak boleh duplikat dalam 1 program_lpk yang sama.`
    );
  }
}

interface AdminWriteBody {
  nama_pemegang?: string;
  nik?: string;
  program_lpk?: string;
  no_sertifikat_bnsp?: string;
  no_register_bnsp?: string;
  tanggal_terbit?: string;
  tanggal_berakhir?: string;
  berlaku_sampai?: string;
  status_sertifikat?: string;
  jenis_data?: string | null;
  foto_url?: string | null;
  url_foto?: string | null;
  url_e_kartu?: string | null;
  fotoBase64?: string | null;
  fotoFileName?: string;
  fotoContentType?: string;
  eKartuBase64?: string | null;
  eKartuFileName?: string;
  eKartuContentType?: string;
}

function validateRequiredFields(body: AdminWriteBody) {
  const nama_pemegang = (body.nama_pemegang || '').trim().toUpperCase();
  const nik = (body.nik || '').trim();
  const program_lpk = (body.program_lpk || '').trim();
  const no_sertifikat_bnsp = (body.no_sertifikat_bnsp || '').trim();
  const no_register_bnsp = (body.no_register_bnsp || '').trim();
  const tanggal_terbit = (body.tanggal_terbit || '').trim();
  const tanggal_berakhir = (body.tanggal_berakhir || body.berlaku_sampai || '').trim();
  const status_sertifikat = (body.status_sertifikat || 'VALID AKTIF').trim() || 'VALID AKTIF';
  const jenis_data = body.jenis_data ? String(body.jenis_data).trim() : null;

  if (!nama_pemegang) throw new HttpError(400, 'Nama pemegang wajib diisi.');
  if (!nik) throw new HttpError(400, 'NIK wajib diisi.');
  if (!program_lpk) throw new HttpError(400, 'Program LPK wajib dipilih.');
  if (!no_sertifikat_bnsp) throw new HttpError(400, 'No Sertifikat BNSP wajib diisi.');
  if (!no_register_bnsp) throw new HttpError(400, 'No Register BNSP wajib diisi.');
  if (!tanggal_terbit) throw new HttpError(400, 'Tanggal terbit wajib diisi.');
  if (!tanggal_berakhir) throw new HttpError(400, 'Tanggal berakhir wajib diisi.');

  return {
    nama_pemegang,
    nik,
    program_lpk,
    no_sertifikat_bnsp,
    no_register_bnsp,
    tanggal_terbit,
    tanggal_berakhir,
    status_sertifikat,
    jenis_data,
  };
}

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.post('/api/admin/ensure-user', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as { email?: string; password?: string };
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const expectedPass = process.env.ADMIN_PASSWORD || 'Microsoft';

      if (email !== 'admin@lpk.local' || password !== expectedPass) {
        res.status(401).json({ error: 'Gagal: Username atau password tidak valid.' });
        return;
      }

      const supabaseAdmin = getSupabaseAdminClient();
      const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });

      if (listErr) {
        const status = isServiceKeyOrPermissionError(listErr) ? 403 : 500;
        throw new HttpError(status, formatSupabaseDetailedError('Gagal memeriksa user admin di Supabase Auth', listErr));
      }

      const existingUser = (listData?.users ?? []).find(
        (u) => (u.email || '').toLowerCase() === 'admin@lpk.local'
      );

      if (!existingUser) {
        const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: 'admin@lpk.local',
          password: expectedPass,
          email_confirm: true,
          user_metadata: { role: 'super_admin' },
        });

        if (createErr) {
          const status = isServiceKeyOrPermissionError(createErr) ? 403 : 500;
          throw new HttpError(status, formatSupabaseDetailedError('Gagal membuat user admin@lpk.local', createErr));
        }

        res.status(201).json({ ok: true, created: true });
        return;
      }

      if (!existingUser.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        });
      }

      res.json({ ok: true, existed: true });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal menyiapkan akun admin.';
      res.status(status).json({ error: message });
    }
  });

  app.get('/api/admin/status', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      await ensureFilesBucket(supabaseAdmin);
      res.json({
        serviceRoleConfigured: true,
        bucketReady: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : SERVICE_KEY_ERROR_MSG;
      res.json({
        serviceRoleConfigured: Boolean(getServiceRoleKey()),
        bucketReady: false,
        error: message,
      });
    }
  });

  app.get('/api/admin/pemegang', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const rows = await getData(supabaseAdmin);
      res.json({ data: rows });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message =
        err instanceof Error
          ? err.message
          : "Gagal membaca tabel 'data_pemegang' via supabaseAdmin.";
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/admin/pemegang', requireAdminAuth, async (req: Request, res: Response) => {
    const uploadedPaths: string[] = [];
    let supabaseAdmin: SupabaseClient | null = null;

    try {
      supabaseAdmin = getSupabaseAdminClient();
      const body = (req.body || {}) as AdminWriteBody;
      const validated = validateRequiredFields(body);

      await checkDuplicateNikInProgram(supabaseAdmin, validated.nik, validated.program_lpk);
      const schema = await detectTableSchema(supabaseAdmin);

      let finalFotoUrl: string | null =
        body.foto_url && body.foto_url.startsWith('http')
          ? body.foto_url
          : body.url_foto && body.url_foto.startsWith('http')
            ? body.url_foto
            : null;

      if (body.fotoBase64) {
        const uploadedFoto = await uploadToFilesBucket(
          supabaseAdmin,
          'foto',
          validated.nik,
          body.fotoBase64,
          body.fotoFileName,
          body.fotoContentType
        );
        finalFotoUrl = uploadedFoto.publicUrl;
        uploadedPaths.push(uploadedFoto.storagePath);
      }

      let finalEKartuUrl: string | null =
        body.url_e_kartu && body.url_e_kartu.startsWith('http') ? body.url_e_kartu : null;

      if (body.eKartuBase64 && schema.hasUrlEKartu) {
        const uploadedEKartu = await uploadToFilesBucket(
          supabaseAdmin,
          'ekartu',
          validated.nik,
          body.eKartuBase64,
          body.eKartuFileName,
          body.eKartuContentType
        );
        finalEKartuUrl = uploadedEKartu.publicUrl;
        uploadedPaths.push(uploadedEKartu.storagePath);
      }

      const payload = buildDbWritePayload(schema, {
        ...validated,
        foto_url: finalFotoUrl,
        url_e_kartu: finalEKartuUrl,
      });

      const { data: insertedRow, error: insertError } = await supabaseAdmin
        .from('data_pemegang')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        if (uploadedPaths.length > 0) {
          await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
        }
        if (insertError.code === '23505') {
          throw new HttpError(
            409,
            `NIK ${validated.nik} sudah terdaftar pada program ${validated.program_lpk}.`
          );
        }
        const status = isServiceKeyOrPermissionError(insertError) ? 403 : 500;
        throw new HttpError(status, formatSupabaseDetailedError("Gagal menyimpan data ke tabel 'data_pemegang'", insertError));
      }

      res.status(201).json({
        message: 'Berhasil',
        data: normalizeRow(insertedRow as RawPemegangRow),
      });
    } catch (err) {
      if (supabaseAdmin && uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
      }
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal menyimpan data ke Supabase.';
      res.status(status).json({ error: message });
    }
  });

  app.put('/api/admin/pemegang/:id', requireAdminAuth, async (req: Request, res: Response) => {
    const uploadedPaths: string[] = [];
    let supabaseAdmin: SupabaseClient | null = null;

    try {
      supabaseAdmin = getSupabaseAdminClient();
      const recordId = String(req.params.id || '').trim();
      if (!recordId) throw new HttpError(400, 'ID data tidak valid.');

      const body = (req.body || {}) as AdminWriteBody;
      const validated = validateRequiredFields(body);

      const { data: existingRaw, error: fetchError } = await supabaseAdmin
        .from('data_pemegang')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError || !existingRaw) {
        if (fetchError && isServiceKeyOrPermissionError(fetchError)) {
          throw new HttpError(403, formatSupabaseDetailedError("Gagal mengambil data di 'data_pemegang'", fetchError));
        }
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw new HttpError(500, formatSupabaseDetailedError("Gagal mengambil data di 'data_pemegang'", fetchError));
        }
        throw new HttpError(404, `Data pemegang ID ${recordId} tidak ditemukan.`);
      }

      const existing = normalizeRow(existingRaw as RawPemegangRow);

      await checkDuplicateNikInProgram(
        supabaseAdmin,
        validated.nik,
        validated.program_lpk,
        recordId
      );

      const schema = await detectTableSchema(supabaseAdmin);

      let finalFotoUrl: string | null =
        body.foto_url !== undefined
          ? body.foto_url
          : body.url_foto !== undefined
            ? body.url_foto
            : existing.foto_url;

      if (body.fotoBase64) {
        await ensureFilesBucket(supabaseAdmin);
        const oldFotoUrl = existing.foto_url || existing.url_foto;
        if (oldFotoUrl) {
          await removeStorageFilesByUrls(supabaseAdmin, [oldFotoUrl]);
        }
        const uploadedFoto = await uploadToFilesBucket(
          supabaseAdmin,
          'foto',
          validated.nik,
          body.fotoBase64,
          body.fotoFileName,
          body.fotoContentType
        );
        finalFotoUrl = uploadedFoto.publicUrl;
        uploadedPaths.push(uploadedFoto.storagePath);
      }

      let finalEKartuUrl: string | null =
        body.url_e_kartu !== undefined ? body.url_e_kartu : existing.url_e_kartu;

      if (body.eKartuBase64 && schema.hasUrlEKartu) {
        await ensureFilesBucket(supabaseAdmin);
        if (existing.url_e_kartu) {
          await removeStorageFilesByUrls(supabaseAdmin, [existing.url_e_kartu]);
        }
        const uploadedEKartu = await uploadToFilesBucket(
          supabaseAdmin,
          'ekartu',
          validated.nik,
          body.eKartuBase64,
          body.eKartuFileName,
          body.eKartuContentType
        );
        finalEKartuUrl = uploadedEKartu.publicUrl;
        uploadedPaths.push(uploadedEKartu.storagePath);
      }

      const payload = buildDbWritePayload(schema, {
        ...validated,
        foto_url: finalFotoUrl && finalFotoUrl.startsWith('http') ? finalFotoUrl : null,
        url_e_kartu: finalEKartuUrl && finalEKartuUrl.startsWith('http') ? finalEKartuUrl : null,
      });

      const { data: updatedRow, error: updateError } = await supabaseAdmin
        .from('data_pemegang')
        .update(payload)
        .eq('id', recordId)
        .select()
        .single();

      if (updateError) {
        if (uploadedPaths.length > 0) {
          await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
        }
        if (updateError.code === '23505') {
          throw new HttpError(
            409,
            `NIK ${validated.nik} sudah terdaftar pada program ${validated.program_lpk}.`
          );
        }
        const status = isServiceKeyOrPermissionError(updateError) ? 403 : 500;
        throw new HttpError(status, formatSupabaseDetailedError("Gagal mengubah data di 'data_pemegang'", updateError));
      }

      res.json({
        message: 'Berhasil',
        data: normalizeRow(updatedRow as RawPemegangRow),
      });
    } catch (err) {
      if (supabaseAdmin && uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET_NAME).remove(uploadedPaths).catch(() => {});
      }
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal mengubah data di Supabase.';
      res.status(status).json({ error: message });
    }
  });

  app.delete('/api/admin/pemegang/:id', requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const recordId = String(req.params.id || '').trim();
      if (!recordId) throw new HttpError(400, 'ID data tidak valid.');

      const { data: existingRaw, error: fetchError } = await supabaseAdmin
        .from('data_pemegang')
        .select('*')
        .eq('id', recordId)
        .single();

      if (fetchError || !existingRaw) {
        if (fetchError && isServiceKeyOrPermissionError(fetchError)) {
          throw new HttpError(403, formatSupabaseDetailedError("Gagal membaca data sebelum hapus di 'data_pemegang'", fetchError));
        }
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw new HttpError(500, formatSupabaseDetailedError("Gagal membaca data sebelum hapus di 'data_pemegang'", fetchError));
        }
        throw new HttpError(404, `Data pemegang ID ${recordId} tidak ditemukan.`);
      }

      const existing = normalizeRow(existingRaw as RawPemegangRow);

      await removeStorageFilesByUrls(supabaseAdmin, [
        existing.foto_url,
        existing.url_foto,
        existing.url_e_kartu,
      ]);

      const { error: deleteError } = await supabaseAdmin
        .from('data_pemegang')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        const status = isServiceKeyOrPermissionError(deleteError) ? 403 : 500;
        throw new HttpError(status, formatSupabaseDetailedError("Gagal menghapus data di 'data_pemegang'", deleteError));
      }

      res.json({ message: 'Berhasil' });
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      const message = err instanceof Error ? err.message : 'Gagal menghapus data di Supabase.';
      res.status(status).json({ error: message });
    }
  });

  if (process.env.VERCEL !== '1') {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distDir));
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api/')) {
          next();
          return;
        }
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  app.listen(PORT, HOST, () => {
    console.log(`Server berjalan di http://${HOST}:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  void startServer();
}
